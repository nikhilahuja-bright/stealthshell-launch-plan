/* Storage module — the only place that touches persistence.
 * API (all async):
 *   SSStorage.load()          -> { board, persisted, backend }
 *   SSStorage.saveBoard(b)    -> persist the whole board { meta, wsOrder, tasks, flows }
 *   SSStorage.saveTask(task)  -> insert/update one task
 *   SSStorage.deleteTask(id)  -> remove one task
 *   SSStorage.saveMeta(meta), SSStorage.saveFlows(flows), SSStorage.saveWorkstreams(order)
 *   SSStorage.reset()         -> restore the seed (js/data.js)
 *   SSStorage.seed()          -> fresh deep copy of the seed board
 * Backend: Supabase (supabase-js) when SS_CONFIG.SUPABASE_URL + SUPABASE_ANON_KEY are set,
 * otherwise localStorage. Permissions are enforced server-side by Postgres RLS.
 * Hierarchy: task.parentId (tasks.parent_id, ON DELETE CASCADE) nests a task under another task;
 * parentId null = top-level item directly under its workstream (the "Area" level). Sibling order is the
 * array order (tasks.sort_order). task.progress (0-100 or null) is the leaf's own progress; parents roll up in js/app.js. */
(function () {
  "use strict";
  var STORE_KEY = "stealthshell-launch-plan.v2";
  var cfg = window.SS_CONFIG || {};

  function seed() {
    var b = JSON.parse(JSON.stringify(window.SS_SEED));
    b.tasks = (b.tasks || []).map(function (t) {
      return Object.assign({}, t, { parentId: t.parentId || null, progress: typeof t.progress === "number" ? t.progress : null });
    });
    return b;
  }

  function isTask(x) {
    return !!x && typeof x === "object" && typeof x.id === "string" && typeof x.title === "string" &&
      typeof x.start === "string" && typeof x.end === "string" && typeof x.status === "string" && typeof x.ws === "string";
  }
  function normalise(v) {
    if (!v || !Array.isArray(v.tasks) || !v.tasks.every(isTask) || !Array.isArray(v.wsOrder) ||
        !Array.isArray(v.flows) || !v.meta || typeof v.meta.title !== "string") return null;
    return {
      meta: v.meta, wsOrder: v.wsOrder, flows: v.flows,
      tasks: v.tasks.map(function (t) {
        return Object.assign({}, t, { description: t.description || "", notes: t.notes || "", priority: t.priority || "Medium", milestone: !!t.milestone,
          parentId: typeof t.parentId === "string" && t.parentId ? t.parentId : null, progress: typeof t.progress === "number" ? t.progress : null });
      }),
    };
  }

  var local = {
    name: "local",
    ok: false,
    cache: null,
    load: function () {
      try {
        var ls = window.localStorage;
        var raw = ls.getItem(STORE_KEY);
        if (raw) {
          var b = normalise(JSON.parse(raw));
          if (b) { this.ok = true; this.cache = b; return Promise.resolve({ board: b, persisted: true, backend: "local" }); }
        }
        ls.setItem("__ss_probe", "1");
        ls.removeItem("__ss_probe");
        this.ok = true;
      } catch (err) { this.ok = false; }
      this.cache = seed();
      return Promise.resolve({ board: this.cache, persisted: this.ok, backend: "local" });
    },
    saveBoard: function (b) {
      this.cache = { meta: b.meta, wsOrder: b.wsOrder, tasks: b.tasks, flows: b.flows };
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(this.cache)); } catch (err) { /* storage unavailable */ }
      return Promise.resolve();
    },
    patch: function (fn) { var b = this.cache || seed(); fn(b); return this.saveBoard(b); },
  };


  // ---------------- Supabase backend ----------------
  var hasSupa = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient);
  var sb = hasSupa ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;

  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* old browser */ } }
  function chk(res) { if (res && res.error) throw res.error; return res ? res.data : null; }

  function rowToTask(r) {
    return { id: r.id, title: r.title, ws: r.workstream, owner: r.owner, start: r.start_date, end: r.end_date,
      status: r.status, milestone: !!r.milestone, priority: r.priority || "Medium", description: r.description || "", notes: r.notes || "",
      parentId: r.parent_id || null, progress: typeof r.progress === "number" ? r.progress : null };
  }
  function taskToRow(t, i) {
    return { id: t.id, title: t.title, workstream: t.ws, owner: t.owner || "Unassigned", start_date: t.start,
      end_date: t.milestone ? t.start : t.end, status: t.status, milestone: !!t.milestone, priority: t.priority || "Medium",
      description: t.description || "", notes: t.notes || "", sort_order: i,
      parent_id: t.parentId || null, progress: typeof t.progress === "number" ? Math.max(0, Math.min(100, Math.round(t.progress))) : null };
  }
  function flowToRow(f, i) { return { id: f.id, title: f.title || "", sub: f.sub || "", steps: f.steps || [], sort_order: i }; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  var remote = {
    name: "supabase",
    snap: null,        // last board known to match the database
    queue: Promise.resolve(),
    pending: 0,
    timer: null,
    latest: null,
    listeners: [],
    fetchBoard: function () {
      return Promise.all([
        sb.from("board_settings").select("title,subtitle,target_date").eq("id", 1).maybeSingle(),
        sb.from("workstreams").select("name,sort_order").order("sort_order"),
        sb.from("tasks").select("*").order("sort_order"),
        sb.from("flows").select("*").order("sort_order"),
      ]).then(function (r) {
        var s = chk(r[0]) || {}, ws = chk(r[1]) || [], ts = chk(r[2]) || [], fs = chk(r[3]) || [];
        var sd = seed();
        return {
          meta: { title: s.title || sd.meta.title, subtitle: s.subtitle || "", target: s.target_date || sd.meta.target },
          wsOrder: ws.map(function (w) { return w.name; }),
          tasks: ts.map(rowToTask),
          flows: fs.map(function (f) { return { id: f.id, title: f.title, sub: f.sub, steps: f.steps || [] }; }),
        };
      });
    },
    load: function () {
      var self = this;
      return this.fetchBoard().then(function (b) {
        self.snap = clone(b);
        self.subscribe();
        return { board: b, persisted: true, backend: "supabase" };
      }).catch(function (err) {
        console.error("Supabase load failed, falling back to this browser", err);
        emit("ss-sync", { ok: false, message: "Couldn't reach the shared database — showing a local copy." });
        backend = local;
        return local.load();
      });
    },
    // Debounced: diff the new board against the last synced snapshot and send only the changes.
    saveBoard: function (b) {
      var self = this;
      this.latest = clone({ meta: b.meta, wsOrder: b.wsOrder, tasks: b.tasks, flows: b.flows });
      if (this.timer) clearTimeout(this.timer);
      this.pending++;
      return new Promise(function (resolve) {
        self.timer = setTimeout(function () {
          self.timer = null;
          var next = self.latest;
          self.queue = self.queue.then(function () { return self.sync(next); }).then(function () {
            emit("ss-sync", { ok: true });
          }, function (err) {
            console.error("Supabase save failed", err);
            emit("ss-sync", { ok: false, message: "Save failed: " + (err && err.message ? err.message : "unknown error") + " — reloading the shared board." });
            return self.reload(true);
          }).then(function () { self.pending = 0; resolve(); });
        }, 350);
      });
    },
    sync: function (next) {
      var prev = this.snap || { meta: {}, wsOrder: [], tasks: [], flows: [] };
      var self = this;
      var ops = [];
      // 1. settings
      if (!same(prev.meta, next.meta)) {
        ops.push(function () { return sb.from("board_settings").upsert({ id: 1, title: next.meta.title, subtitle: next.meta.subtitle || "", target_date: next.meta.target }).then(chk); });
      }
      // 2. workstreams: every workstream used by a task must exist
      var wsAll = next.wsOrder.slice();
      next.tasks.forEach(function (t) { if (wsAll.indexOf(t.ws) < 0) wsAll.push(t.ws); });
      var prevWs = prev.wsOrder.slice();
      if (!same(prevWs, wsAll)) {
        ops.push(function () { return sb.from("workstreams").upsert(wsAll.map(function (n, i) { return { name: n, sort_order: i }; })).then(chk); });
      }
      // 3. tasks upsert (changed or re-ordered)
      var prevT = {}; prev.tasks.forEach(function (t, i) { prevT[t.id] = { t: t, i: i }; });
      var up = [];
      next.tasks.forEach(function (t, i) { var p = prevT[t.id]; if (!p || p.i !== i || !same(p.t, t)) up.push(taskToRow(t, i)); });
      if (up.length) ops.push(function () { return sb.from("tasks").upsert(up).then(chk); });
      // 4. tasks delete
      var nextIds = {}; next.tasks.forEach(function (t) { nextIds[t.id] = 1; });
      var del = prev.tasks.filter(function (t) { return !nextIds[t.id]; }).map(function (t) { return t.id; });
      if (del.length) ops.push(function () { return sb.from("tasks").delete().in("id", del).then(chk); });
      // 5. workstreams delete (after tasks moved away)
      var wsGone = prevWs.filter(function (n) { return wsAll.indexOf(n) < 0; });
      if (wsGone.length) ops.push(function () { return sb.from("workstreams").delete().in("name", wsGone).then(chk); });
      // 6. flows
      var prevF = {}; prev.flows.forEach(function (f, i) { prevF[f.id] = { f: f, i: i }; });
      var fup = [];
      next.flows.forEach(function (f, i) { var p = prevF[f.id]; if (!p || p.i !== i || !same(p.f, f)) fup.push(flowToRow(f, i)); });
      if (fup.length) ops.push(function () { return sb.from("flows").upsert(fup).then(chk); });
      var fIds = {}; next.flows.forEach(function (f) { fIds[f.id] = 1; });
      var fdel = prev.flows.filter(function (f) { return !fIds[f.id]; }).map(function (f) { return f.id; });
      if (fdel.length) ops.push(function () { return sb.from("flows").delete().in("id", fdel).then(chk); });

      return ops.reduce(function (p, op) { return p.then(op); }, Promise.resolve()).then(function () { self.snap = clone(next); });
    },
    patch: function (fn) { var b = clone(this.latest || this.snap || seed()); fn(b); return this.saveBoard(b); },
    reload: function (force) {
      var self = this;
      if (!force && (this.timer || this.pending)) return Promise.resolve();
      return this.fetchBoard().then(function (b) {
        if (!force && (self.timer || self.pending)) return;
        if (self.snap && same(self.snap, b)) return;
        self.snap = clone(b);
        self.listeners.forEach(function (cb) { try { cb(clone(b)); } catch (e) { console.error(e); } });
      }).catch(function (err) { console.error("Supabase reload failed", err); });
    },
    subscribe: function () {
      var self = this, t = null;
      if (this.channel) return;
      var kick = function () { if (t) clearTimeout(t); t = setTimeout(function () { self.reload(false); }, 500); };
      this.channel = sb.channel("board-changes");
      ["board_settings", "workstreams", "tasks", "flows"].forEach(function (tb) {
        self.channel.on("postgres_changes", { event: "*", schema: "public", table: tb }, kick);
      });
      this.channel.subscribe();
    },
  };

  var backend = hasSupa ? remote : local;

  // ---------------- auth + members (Supabase only) ----------------
  var auth = {
    user: null,
    role: null,
    listeners: [],
    notify: function () { var s = { user: auth.user, role: auth.role, enabled: hasSupa }; auth.listeners.forEach(function (cb) { cb(s); }); },
    refresh: function (session) {
      auth.user = session && session.user ? { id: session.user.id, email: (session.user.email || "").toLowerCase() } : null;
      if (!auth.user) { auth.role = null; auth.notify(); return Promise.resolve(); }
      return sb.from("members").select("role").eq("email", auth.user.email).maybeSingle().then(function (r) {
        auth.role = r && r.data ? r.data.role : null; auth.notify();
      }, function () { auth.role = null; auth.notify(); });
    },
  };
  if (sb) {
    sb.auth.onAuthStateChange(function (_ev, session) { setTimeout(function () { auth.refresh(session); }, 0); });
  }

  window.SSStorage = {
    seed: seed,
    backendName: function () { return backend.name; },
    load: function () { return backend.load(); },
    saveBoard: function (b) { return backend.saveBoard(b); },
    saveTask: function (task) {
      return backend.patch(function (b) {
        var i = b.tasks.findIndex(function (t) { return t.id === task.id; });
        if (i >= 0) b.tasks[i] = task; else b.tasks.push(task);
      });
    },
    deleteTask: function (id) { return backend.patch(function (b) { b.tasks = b.tasks.filter(function (t) { return t.id !== id; }); }); },
    saveMeta: function (meta) { return backend.patch(function (b) { b.meta = meta; }); },
    saveFlows: function (flows) { return backend.patch(function (b) { b.flows = flows; }); },
    saveWorkstreams: function (order) { return backend.patch(function (b) { b.wsOrder = order; }); },
    reset: function () { return backend.saveBoard(seed()); },

    // auth
    authEnabled: function () { return hasSupa; },
    authState: function () { return { user: auth.user, role: auth.role, enabled: hasSupa }; },
    onAuth: function (cb) { auth.listeners.push(cb); cb({ user: auth.user, role: auth.role, enabled: hasSupa }); return function () { auth.listeners = auth.listeners.filter(function (x) { return x !== cb; }); }; },
    initAuth: function () { if (!sb) return Promise.resolve(); return sb.auth.getSession().then(function (r) { return auth.refresh(r.data && r.data.session); }); },
    signIn: function (email) {
      if (!sb) return Promise.reject(new Error("Sign-in needs the shared database."));
      var redirect = window.location.origin + window.location.pathname;
      return sb.auth.signInWithOtp({ email: String(email).trim().toLowerCase(), options: { emailRedirectTo: redirect, shouldCreateUser: true } }).then(chk);
    },
    signOut: function () { return sb ? sb.auth.signOut().then(function () { return auth.refresh(null); }) : Promise.resolve(); },
    onRemote: function (cb) { remote.listeners.push(cb); },
    // members (owner only, enforced by RLS)
    listMembers: function () { return sb.from("members").select("id,email,role,invited_by,created_at").order("created_at").then(chk); },
    inviteMember: function (email, role) { return sb.from("members").insert({ email: String(email).trim().toLowerCase(), role: role }).select().then(chk); },
    setMemberRole: function (id, role) { return sb.from("members").update({ role: role }).eq("id", id).select().then(function (r) { var d = chk(r); if (!d || !d.length) throw new Error("Not allowed"); return d; }); },
    removeMember: function (id) { return sb.from("members").delete().eq("id", id).select().then(function (r) { var d = chk(r); if (!d || !d.length) throw new Error("Not allowed"); return d; }); },
  };
})();
