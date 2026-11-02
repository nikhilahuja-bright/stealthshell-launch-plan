const { useState, useEffect, useMemo, useRef, Fragment } = React;
const STORE_KEY = "stealthshell-launch-plan.v2";
const RANGE_START = "2026-10-19";
const WEEKS = 11;
const SPAN = WEEKS * 7;
const ACCENT = "var(--ac)";
const SM = {
  done: { label: "Done", color: "var(--ok)", tint: "var(--okS)" },
  progress: { label: "In progress", color: "var(--wa)", tint: "var(--waS)" },
  risk: { label: "At risk", color: "var(--dg)", tint: "var(--dgS)" },
  todo: { label: "Not started", color: "var(--t3)", tint: "var(--sec)" }
};
const STATUS_ORDER = ["done", "progress", "risk", "todo"];
const PRIORITIES = ["Low", "Medium", "High"];
const PRIO_COLOR = { Low: "var(--t3)", Medium: "var(--t2)", High: "var(--ac)" };
const NODE_V = [
  { v: "neutral", label: "Neutral" },
  { v: "hl", label: "Highlighted" },
  { v: "done", label: "Done" },
  { v: "bad", label: "Warning" }
];
let uidN = 0;
const uid = (p) => {
  uidN += 1;
  return `${p}${Date.now().toString(36)}${uidN.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
};
const n = (t, s, v = "neutral", d = "") => ({ id: uid("n"), t, s, v, d });
const ns = (node) => ({ id: uid("s"), kind: "node", node, lanes: [] });
const br = (lanes) => ({ id: uid("s"), kind: "branch", node: null, lanes: lanes.map((l) => ({ id: uid("l"), tag: l[0], nodes: l[1] })) });
const seedBoard = () => SSStorage.seed();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const dn = (iso) => {
  const p = iso.split("-").map(Number);
  return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5);
};
const fromDn = (x) => new Date(x * 864e5);
const isoOf = (x) => fromDn(x).toISOString().slice(0, 10);
const fmt = (iso) => {
  const d = fromDn(dn(iso));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
const fmtLong = (iso) => {
  const d = fromDn(dn(iso));
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const fmtYear = (iso) => {
  const d = fromDn(dn(iso));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const isoWeek = (x) => {
  const d = fromDn(x);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y0 = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - y0) / 864e5 + 1) / 7);
};
const monday = (x) => x - (fromDn(x).getUTCDay() + 6) % 7;
const localToday = () => {
  const d = /* @__PURE__ */ new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const plural = (x, w) => `${x} ${w}${x === 1 ? "" : "s"}`;
function App({ init }) {
  const persist = init.persisted;
  const backend = init.backend;
  const [meta, setMeta] = useState(init.board.meta);
  const [wsOrder, setWsOrder] = useState(init.board.wsOrder);
  const [tasks, setTasks] = useState(init.board.tasks);
  const [flows, setFlows] = useState(init.board.flows);
  const today = useMemo(() => localToday(), []);
  const T = dn(today);
  const [tab, setTab] = useState("timeline");
  const [drawerId, setDrawerId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftErr, setDraftErr] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [anchor, setAnchor] = useState(120);
  const [tip, setTip] = useState(null);
  const [flash, setFlash] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fOwner, setFOwner] = useState("all");
  const [fWs, setFWs] = useState("all");
  const [q, setQ] = useState("");
  const [hdr, setHdr] = useState(null);
  const [wsEdit, setWsEdit] = useState(null);
  const [wsNew, setWsNew] = useState(null);
  const [labelEdit, setLabelEdit] = useState(null);
  const [rowEdit, setRowEdit] = useState(null);
  const [flowEdit, setFlowEdit] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const dragRef = useRef(null);
  const panelRef = useRef(null);
  const jsonRef = useRef(null);
  const [auth, setAuth] = useState(SSStorage.authState());
  const [syncErr, setSyncErr] = useState("");
  const [signOpen, setSignOpen] = useState(false);
  const shared = backend === "supabase";
  const role = shared ? auth.role : "owner";
  const ro = shared && !(role === "owner" || role === "editor");
  const isOwner = shared && role === "owner";
  const roRef = useRef(ro);
  roRef.current = ro;
  useEffect(() => SSStorage.onAuth((a) => setAuth(a)), []);
  useEffect(() => {
    SSStorage.onRemote((b) => {
      setMeta(b.meta);
      setWsOrder(b.wsOrder);
      setTasks(b.tasks);
      setFlows(b.flows);
    });
    const onSync = (e) => {
      const d = e.detail || {};
      setSyncErr(d.ok ? "" : d.message || "Save failed");
    };
    window.addEventListener("ss-sync", onSync);
    return () => window.removeEventListener("ss-sync", onSync);
  }, []);
  useEffect(() => {
    if (ro) {
      setFlowEdit(null);
      setRowEdit(null);
      setHdr(null);
      setLabelEdit(null);
      setWsEdit(null);
      setWsNew(null);
      setDraft(null);
    }
    if (!isOwner && tab === "settings") setTab("timeline");
  }, [ro, isOwner]);
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    if (!persist || ro) return;
    SSStorage.saveBoard({ meta, wsOrder, tasks, flows });
  }, [meta, wsOrder, tasks, flows, persist, ro]);
  useEffect(() => {
    if (!flash) return;
    const h = window.setTimeout(() => setFlash(""), 2600);
    return () => window.clearTimeout(h);
  }, [flash]);
  const anyOpen = !!(drawerId || draft || confirm || exportOpen || signOpen);
  useEffect(() => {
    if (!anyOpen) return;
    const el = panelRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch (err) {
      }
    }
  }, [anyOpen, drawerId, draft === null, confirm === null, exportOpen]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (signOpen) setSignOpen(false);
      else if (draft) setDraft(null);
      else if (exportOpen) setExportOpen(false);
      else if (drawerId) setDrawerId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, draft, exportOpen, drawerId, signOpen]);
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (roRef.current) return;
      const dx = e.clientX - d.x0;
      if (Math.abs(dx) > 3) d.moved = true;
      const k = Math.round(dx / d.pxPerDay);
      let s = d.s0;
      let en = d.e0;
      if (d.mode === "move") {
        s = d.s0 + k;
        en = d.e0 + k;
      } else if (d.mode === "left") s = Math.min(d.s0 + k, d.e0);
      else en = Math.max(d.e0 + k, d.s0);
      setPreview({ id: d.id, start: s, end: en, x: e.clientX, y: e.clientY });
    };
    const up = (e) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDragging(false);
      setPreview(null);
      if (!d) return;
      if (!d.moved || roRef.current) {
        setAnchor(e.pageY || d.pageY);
        setDraft(null);
        setDrawerId(d.id);
        return;
      }
      const k = Math.round((e.clientX - d.x0) / d.pxPerDay);
      let s = d.s0;
      let en = d.e0;
      if (d.mode === "move") {
        s = d.s0 + k;
        en = d.e0 + k;
      } else if (d.mode === "left") s = Math.min(d.s0 + k, d.e0);
      else en = Math.max(d.e0 + k, d.s0);
      if (s !== d.s0 || en !== d.e0) {
        setTasks((ts) => ts.map((t) => t.id === d.id ? { ...t, start: isoOf(s), end: t.milestone ? isoOf(s) : isoOf(en) } : t));
        setFlash(`Moved to ${fmt(isoOf(s))}${s !== en ? ` – ${fmt(isoOf(en))}` : ""}`);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);
  const startDrag = (e, t, mode) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const track = e.currentTarget.closest(".g-track");
    const width = track ? track.getBoundingClientRect().width : 0;
    dragRef.current = { id: t.id, mode: t.milestone ? "move" : mode, x0: e.clientX, pxPerDay: width > 0 ? width / SPAN : 12, s0: dn(t.start), e0: dn(t.end), moved: false, pageY: e.pageY };
    setTip(null);
    setDragging(true);
  };
  const workstreams = useMemo(() => {
    const out = wsOrder.slice();
    tasks.forEach((t) => {
      if (!out.includes(t.ws)) out.push(t.ws);
    });
    return out;
  }, [tasks, wsOrder]);
  const owners = useMemo(() => Array.from(new Set(tasks.map((t) => t.owner))).sort(), [tasks]);
  const stats = useMemo(() => {
    const work = tasks.filter((t) => !t.milestone);
    const counts = { done: 0, progress: 0, risk: 0, todo: 0 };
    work.forEach((t) => {
      counts[t.status] += 1;
    });
    const total = work.length;
    const pct = total ? Math.round(counts.done / total * 100) : 0;
    const ms = tasks.filter((t) => t.milestone).sort((a, b) => dn(a.start) - dn(b.start));
    const next = ms.find((m) => m.status !== "done" && dn(m.start) >= T) || null;
    const msDone = ms.filter((m) => m.status === "done").length;
    const attention = tasks.filter((t) => t.status !== "done" && (t.status === "risk" || dn(t.end) < T)).sort((a, b) => dn(a.end) - dn(b.end));
    const overdue = tasks.filter((t) => t.status !== "done" && dn(t.end) < T).length;
    const riskAll = tasks.filter((t) => t.status === "risk").length;
    return { counts, total, pct, ms, next, msDone, attention, overdue, riskAll };
  }, [tasks, T]);
  const daysToTarget = dn(meta.target) - T;
  const drawerTask = drawerId ? tasks.find((t) => t.id === drawerId) || null : null;
  const updateTask = (id, patch) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t));
  };
  const openDrawer = (id, e) => {
    setAnchor(e.pageY);
    setTip(null);
    setDraft(null);
    setDrawerId(id);
  };
  const openAdd = (e, ws) => {
    setAnchor(e.pageY);
    setDrawerId(null);
    setDraftErr("");
    setDraft({ id: null, title: "", ws: ws || workstreams[0] || "__new__", newWs: "", owner: "", start: today, end: today, status: "todo", milestone: false, priority: "Medium", description: "", notes: "" });
  };
  const openEdit = (t) => {
    setDrawerId(null);
    setDraftErr("");
    setDraft({ id: t.id, title: t.title, ws: t.ws, newWs: "", owner: t.owner, start: t.start, end: t.end, status: t.status, milestone: t.milestone, priority: t.priority, description: t.description, notes: t.notes });
  };
  const patchDraft = (p) => {
    setDraft((d) => d ? { ...d, ...p } : d);
  };
  const saveDraft = () => {
    if (!draft) return;
    const title = draft.title.trim();
    const ws = draft.ws === "__new__" ? draft.newWs.trim() : draft.ws;
    if (!title) return setDraftErr("Give the task a title.");
    if (!ws) return setDraftErr("Pick a workstream or name a new one.");
    if (!ISO_RE.test(draft.start)) return setDraftErr("Set a start date.");
    const end = draft.milestone ? draft.start : draft.end;
    if (!ISO_RE.test(end)) return setDraftErr("Set an end date.");
    if (dn(end) < dn(draft.start)) return setDraftErr("The end date can't be before the start date.");
    const task = {
      id: draft.id || uid("t"),
      title,
      ws,
      owner: draft.owner.trim() || "Unassigned",
      start: draft.start,
      end,
      status: draft.status,
      milestone: draft.milestone,
      priority: draft.priority,
      description: draft.description.trim(),
      notes: draft.notes.trim()
    };
    if (!wsOrder.includes(ws)) setWsOrder((o) => [...o, ws]);
    if (draft.id) {
      setTasks((ts) => ts.map((t) => t.id === task.id ? task : t));
      setFlash(`Saved “${title}”`);
    } else {
      setTasks((ts) => [...ts, task]);
      setFlash(`Added “${title}”`);
    }
    setDrawerId(task.id);
    setDraft(null);
  };
  const askDelete = (t) => {
    setConfirm({
      title: `Delete “${t.title}”?`,
      body: "This removes it from the timeline, checklist and summary. Reset to original data brings the seeded plan back.",
      label: "Delete task",
      run: () => {
        setTasks((ts) => ts.filter((x) => x.id !== t.id));
        setDrawerId(null);
        setFlash(`Deleted “${t.title}”`);
      }
    });
  };
  const askReset = (e) => {
    setAnchor(e.pageY);
    setDrawerId(null);
    setDraft(null);
    setConfirm({
      title: "Reset to the original plan?",
      body: "Every task, workstream, flow and header edit made on this page will be replaced by the original plan.",
      label: "Reset data",
      run: () => {
        const b = seedBoard();
        setMeta(b.meta);
        setWsOrder(b.wsOrder);
        setTasks(b.tasks);
        setFlows(b.flows);
        setFlowEdit(null);
        setRowEdit(null);
        setHdr(null);
        setFlash("Plan reset to the original data");
      }
    });
  };
  const commitWsRename = () => {
    if (!wsEdit) return;
    const name = wsEdit.value.trim();
    const from = wsEdit.from;
    setWsEdit(null);
    if (!name || name === from) return;
    if (workstreams.includes(name)) {
      setFlash(`“${name}” already exists`);
      return;
    }
    setWsOrder((o) => o.includes(from) ? o.map((w) => w === from ? name : w) : [...o, name]);
    setTasks((ts) => ts.map((t) => t.ws === from ? { ...t, ws: name } : t));
    setFlash(`Renamed to “${name}”`);
  };
  const moveWs = (ws, dir) => {
    const o = workstreams.slice();
    const i = o.indexOf(ws);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= o.length) return;
    const tmp = o[i];
    o[i] = o[j];
    o[j] = tmp;
    setWsOrder(o);
  };
  const askDeleteWs = (ws, e) => {
    const count = tasks.filter((t) => t.ws === ws).length;
    setAnchor(e.pageY);
    setConfirm({
      title: `Delete workstream “${ws}”?`,
      body: count ? `Its ${plural(count, "task")} will be deleted too.` : "It has no tasks.",
      label: "Delete workstream",
      run: () => {
        setWsOrder((o) => o.filter((w) => w !== ws));
        setTasks((ts) => ts.filter((t) => t.ws !== ws));
        setFlash(`Deleted workstream “${ws}”`);
      }
    });
  };
  const commitWsNew = () => {
    const name = (wsNew || "").trim();
    setWsNew(null);
    if (!name) return;
    if (workstreams.includes(name)) {
      setFlash(`“${name}” already exists`);
      return;
    }
    setWsOrder([...workstreams, name]);
    setFlash(`Added workstream “${name}”`);
  };
  const commitLabel = () => {
    if (!labelEdit) return;
    const v = labelEdit.value.trim();
    if (v) updateTask(labelEdit.id, { title: v });
    setLabelEdit(null);
  };
  const saveRow = () => {
    if (!rowEdit) return;
    const title = rowEdit.title.trim();
    if (!title || !ISO_RE.test(rowEdit.start)) return;
    const t = tasks.find((x) => x.id === rowEdit.id);
    if (!t) return setRowEdit(null);
    let end = t.milestone ? rowEdit.start : rowEdit.end;
    if (!ISO_RE.test(end) || dn(end) < dn(rowEdit.start)) end = rowEdit.start;
    updateTask(rowEdit.id, { title, notes: rowEdit.notes.trim(), owner: rowEdit.owner.trim() || "Unassigned", start: rowEdit.start, end });
    setRowEdit(null);
    setFlash(`Saved “${title}”`);
  };
  const updFlow = (fid, fn) => {
    setFlows((fs) => fs.map((f) => f.id === fid ? fn(f) : f));
  };
  const mapNodes = (f, nid, fn) => ({
    ...f,
    steps: f.steps.map((s) => s.kind === "node" && s.node ? s.node.id === nid ? { ...s, node: fn(s.node) } : s : { ...s, lanes: s.lanes.map((l) => ({ ...l, nodes: l.nodes.map((x) => x.id === nid ? fn(x) : x) })) })
  });
  const patchNode = (fid, nid, p) => updFlow(fid, (f) => mapNodes(f, nid, (x) => ({ ...x, ...p })));
  const removeStep = (fid, sid) => updFlow(fid, (f) => ({ ...f, steps: f.steps.filter((s) => s.id !== sid) }));
  const insertStep = (fid, idx) => updFlow(fid, (f) => {
    const steps = f.steps.slice();
    steps.splice(idx, 0, ns(n("New step", "Describe it")));
    return { ...f, steps };
  });
  const moveStep = (fid, idx, dir) => updFlow(fid, (f) => {
    const steps = f.steps.slice();
    const j = idx + dir;
    if (j < 0 || j >= steps.length) return f;
    const tmp = steps[idx];
    steps[idx] = steps[j];
    steps[j] = tmp;
    return { ...f, steps };
  });
  const addBranch = (fid) => updFlow(fid, (f) => ({ ...f, steps: [...f.steps, br([["YES", [n("Option A", "")]], ["NO", [n("Option B", "")]]])] }));
  const updLane = (fid, lid, fn) => updFlow(fid, (f) => ({ ...f, steps: f.steps.map((s) => s.kind === "branch" ? { ...s, lanes: s.lanes.map((l) => l.id === lid ? fn(l) : l) } : s) }));
  const removeLaneNode = (fid, sid, lid, nid) => updFlow(fid, (f) => ({
    ...f,
    steps: f.steps.map((s) => s.id === sid ? { ...s, lanes: s.lanes.map((l) => l.id === lid ? { ...l, nodes: l.nodes.filter((x) => x.id !== nid) } : l).filter((l) => l.nodes.length > 0) } : s).filter((s) => s.kind === "node" || s.lanes.length > 0)
  }));
  const addFlow = () => {
    const f = { id: uid("f"), title: "New flow", sub: "What this flow shows.", steps: [ns(n("Start", "First step")), ns(n("Finish", "Outcome", "done"))] };
    setFlows((fs) => [...fs, f]);
    setFlowEdit(f.id);
  };
  const askDeleteFlow = (f, e) => {
    setAnchor(e.pageY);
    setConfirm({
      title: `Delete flow “${f.title}”?`,
      body: "The diagram and all its steps are removed.",
      label: "Delete flow",
      run: () => {
        setFlows((fs) => fs.filter((x) => x.id !== f.id));
        setFlowEdit(null);
      }
    });
  };
  const board = { project: meta.title, exported: today, meta, workstreams, tasks, flows };
  const json = JSON.stringify(board, null, 2);
  const doCopy = () => {
    const fallback = () => {
      const el = jsonRef.current;
      if (!el) return;
      el.select();
      try {
        const ok = document.execCommand("copy");
        setExportMsg(ok ? "Copied to clipboard." : "Text selected — press Ctrl/Cmd+C to copy.");
      } catch (err) {
        setExportMsg("Text selected — press Ctrl/Cmd+C to copy.");
      }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(() => setExportMsg("Copied to clipboard."), fallback);
      } else fallback();
    } catch (err) {
      fallback();
    }
  };
  const doDownload = () => {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stealthshell-launch-plan-${today}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setExportMsg("Download started. If nothing downloads, use Copy instead.");
    } catch (err) {
      setExportMsg("Downloads are blocked here — use Copy instead.");
    }
  };
  const pill = (s) => /* @__PURE__ */ React.createElement("span", { className: "pill", style: { color: SM[s].color, background: SM[s].tint } }, /* @__PURE__ */ React.createElement("i", { style: { background: SM[s].color } }), SM[s].label);
  const msPill = () => /* @__PURE__ */ React.createElement("span", { className: "pill", style: { color: ACCENT, background: "var(--acS)" } }, /* @__PURE__ */ React.createElement("i", { style: { background: ACCENT, borderRadius: 1, transform: "rotate(45deg)" } }), "Milestone");
  const prioPill = (p) => /* @__PURE__ */ React.createElement("span", { className: "pill", style: { color: PRIO_COLOR[p], borderColor: "var(--bd)" } }, p, " priority");
  const dueText = (t) => t.milestone ? fmt(t.start) : `${fmt(t.start)} – ${fmt(t.end)}`;
  const weekCols = Array.from({ length: WEEKS }, (_, i) => dn(RANGE_START) + i * 7);
  const R0 = dn(RANGE_START);
  const posOf = (x) => x >= R0 && x < R0 + SPAN ? (x - R0 + 0.5) / SPAN * 100 : null;
  const todayPos = posOf(T);
  const targetPos = posOf(dn(meta.target));
  const tipHandlers = (t) => ({
    onMouseEnter: (e) => {
      if (!dragging) setTip({ t, x: e.clientX, y: e.clientY });
    },
    onMouseMove: (e) => {
      if (!dragging) setTip({ t, x: e.clientX, y: e.clientY });
    },
    onMouseLeave: () => setTip(null)
  });
  const renderTrackMark = (t) => {
    const pv = preview && preview.id === t.id ? preview : null;
    const s0 = pv ? pv.start : dn(t.start);
    const e0 = pv ? pv.end : dn(t.end);
    const s = s0 - R0;
    const e = e0 - R0 + 1;
    if (e <= 0 || s >= SPAN) return null;
    if (t.milestone) {
      const c = (s + 0.5) / SPAN * 100;
      const col = t.status === "done" ? SM.done.color : ACCENT;
      return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dia", style: { left: `calc(${c}% - 6.5px)`, background: col }, ...tipHandlers(t), onPointerDown: (ev) => startDrag(ev, t, "move") }), /* @__PURE__ */ React.createElement("div", { className: "mono", style: { position: "absolute", left: `calc(${c}% + 13px)`, top: 8, fontSize: 11, color: col, whiteSpace: "nowrap", pointerEvents: "none" } }, fmt(isoOf(s0))));
    }
    const cs = Math.max(0, s);
    const ce = Math.min(SPAN, e);
    const m = SM[t.status];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `bar ${pv ? "drag" : ""}`,
        style: { left: `${cs / SPAN * 100}%`, width: `max(14px, calc(${(ce - cs) / SPAN * 100}% - 3px))`, color: m.color, background: m.tint, borderColor: m.color },
        ...tipHandlers(t),
        onPointerDown: (ev) => startDrag(ev, t, "move")
      },
      /* @__PURE__ */ React.createElement("div", { className: "hdl l", onPointerDown: (ev) => startDrag(ev, t, "left") }),
      t.title,
      /* @__PURE__ */ React.createElement("div", { className: "hdl r", onPointerDown: (ev) => startDrag(ev, t, "right") })
    );
  };
  const lines = () => /* @__PURE__ */ React.createElement(Fragment, null, targetPos !== null && /* @__PURE__ */ React.createElement("div", { className: "tgt", style: { left: `${targetPos}%` } }), todayPos !== null && /* @__PURE__ */ React.createElement("div", { className: "today", style: { left: `calc(${todayPos}% - 1px)` } }));
  const renderTimeline = () => /* @__PURE__ */ React.createElement("div", { className: "card", style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: "gscroll" }, /* @__PURE__ */ React.createElement("div", { className: "gantt" }, /* @__PURE__ */ React.createElement("div", { className: "g-row g-head" }, /* @__PURE__ */ React.createElement("div", { className: "g-lab lbl", style: { cursor: "default", paddingTop: 22 } }, "Workstream / task"), /* @__PURE__ */ React.createElement("div", { className: "g-track" }, weekCols.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: w, style: { position: "absolute", left: `${i / WEEKS * 100}%`, width: `${100 / WEEKS}%`, padding: "10px 9px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, color: "var(--t1)", whiteSpace: "nowrap" } }, fmt(isoOf(w))), /* @__PURE__ */ React.createElement("div", { className: "mono", style: { fontSize: 10.5, color: "var(--t3)" } }, "W", isoWeek(w)))), lines(), todayPos !== null && /* @__PURE__ */ React.createElement("div", { className: "mono", style: { position: "absolute", left: `calc(${todayPos}% - 24px)`, bottom: 4, background: "var(--acF)", color: "var(--onC)", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", padding: "1px 6px", borderRadius: 4, zIndex: 2 } }, "TODAY"), targetPos !== null && /* @__PURE__ */ React.createElement("div", { className: "mono", style: { position: "absolute", left: `calc(${targetPos}% + 4px)`, bottom: 4, color: ACCENT, fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", zIndex: 2 } }, "TARGET"))), workstreams.map((ws, wi) => {
    const rows = tasks.filter((t) => t.ws === ws).slice().sort((a, b) => dn(a.start) - dn(b.start) || dn(a.end) - dn(b.end));
    const done = rows.filter((t) => t.status === "done").length;
    const editing = wsEdit && wsEdit.from === ws;
    return /* @__PURE__ */ React.createElement(Fragment, { key: ws }, /* @__PURE__ */ React.createElement("div", { className: "g-row g-ws" }, /* @__PURE__ */ React.createElement("div", { className: "g-lab" }, editing && wsEdit ? /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "in sm",
        autoFocus: true,
        value: wsEdit.value,
        "aria-label": "Workstream name",
        onChange: (e) => setWsEdit({ from: ws, value: e.target.value }),
        onBlur: commitWsRename,
        onKeyDown: (e) => {
          if (e.key === "Enter") commitWsRename();
          if (e.key === "Escape") setWsEdit(null);
        }
      }
    ) : /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "wsname", title: ws }, ws), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--t3)", fontSize: 11, flex: "0 0 auto" } }, done, "/", rows.length), /* @__PURE__ */ React.createElement("span", { className: "wsact", "data-e": "" }, /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Rename workstream", "aria-label": `Rename ${ws}`, onClick: () => setWsEdit({ from: ws, value: ws }) }, "✎"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move up", "aria-label": `Move ${ws} up`, disabled: wi === 0, onClick: () => moveWs(ws, -1) }, "↑"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move down", "aria-label": `Move ${ws} down`, disabled: wi === workstreams.length - 1, onClick: () => moveWs(ws, 1) }, "↓"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Delete workstream", "aria-label": `Delete ${ws}`, onClick: (e) => askDeleteWs(ws, e) }, "✕")))), /* @__PURE__ */ React.createElement("div", { className: "g-track" }, lines())), rows.map((t) => /* @__PURE__ */ React.createElement("div", { className: "g-row", key: t.id }, labelEdit && labelEdit.id === t.id ? /* @__PURE__ */ React.createElement("div", { className: "g-lab", style: { padding: "4px 10px 4px 14px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "in sm",
        autoFocus: true,
        value: labelEdit.value,
        "aria-label": "Task title",
        onChange: (e) => setLabelEdit({ id: t.id, value: e.target.value }),
        onBlur: commitLabel,
        onKeyDown: (e) => {
          if (e.key === "Enter") commitLabel();
          if (e.key === "Escape") setLabelEdit(null);
        }
      }
    )) : /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "g-lab",
        title: `${t.title} — click for details, double-click to rename`,
        onClick: (e) => openDrawer(t.id, e),
        onDoubleClick: () => {
          if (ro) return;
          setDrawerId(null);
          setLabelEdit({ id: t.id, value: t.title });
        }
      },
      t.milestone && /* @__PURE__ */ React.createElement("span", { style: { color: ACCENT, marginRight: 7, fontSize: 11 } }, "◆"),
      t.title
    ), /* @__PURE__ */ React.createElement("div", { className: "g-track" }, lines(), renderTrackMark(t)))), /* @__PURE__ */ React.createElement("div", { className: "g-row addrow", "data-e": "" }, /* @__PURE__ */ React.createElement("div", { className: "g-lab", role: "button", onClick: (e) => openAdd(e, ws) }, "+ Add task"), /* @__PURE__ */ React.createElement("div", { className: "g-track" }, lines())));
  }), /* @__PURE__ */ React.createElement("div", { className: "g-row", style: { borderBottom: 0 }, "data-e": "" }, /* @__PURE__ */ React.createElement("div", { className: "g-lab", style: { cursor: "default", padding: "8px 12px 8px 14px" } }, wsNew !== null ? /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "in sm",
      autoFocus: true,
      value: wsNew,
      placeholder: "Workstream name",
      "aria-label": "New workstream name",
      onChange: (e) => setWsNew(e.target.value),
      onBlur: commitWsNew,
      onKeyDown: (e) => {
        if (e.key === "Enter") commitWsNew();
        if (e.key === "Escape") setWsNew(null);
      }
    }
  ) : /* @__PURE__ */ React.createElement("button", { className: "btn sm", onClick: () => setWsNew("") }, "+ Add workstream")), /* @__PURE__ */ React.createElement("div", { className: "g-track" })))), /* @__PURE__ */ React.createElement("div", { className: "sub", style: { padding: "11px 18px", borderTop: "1px solid var(--bd)" } }, "19 Oct (W43) to 28 Dec (W53). Drag a bar to move it, drag its edges to change dates, click to open, double-click a name to rename."));
  const filtered = tasks.filter((t) => {
    if (fStatus === "milestone" && !t.milestone) return false;
    if (fStatus !== "all" && fStatus !== "milestone" && t.status !== fStatus) return false;
    if (fOwner !== "all" && t.owner !== fOwner) return false;
    if (fWs !== "all" && t.ws !== fWs) return false;
    const s = q.trim().toLowerCase();
    if (s && !`${t.title} ${t.description} ${t.notes} ${t.owner} ${t.ws}`.toLowerCase().includes(s)) return false;
    return true;
  });
  const groups = (() => {
    const map = /* @__PURE__ */ new Map();
    filtered.slice().sort((a, b) => dn(a.start) - dn(b.start) || dn(a.end) - dn(b.end)).forEach((t) => {
      const k = monday(dn(t.start));
      const arr = map.get(k) || [];
      arr.push(t);
      map.set(k, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  })();
  const filtersOn = fStatus !== "all" || fOwner !== "all" || fWs !== "all" || q.trim() !== "";
  const clearFilters = () => {
    setFStatus("all");
    setFOwner("all");
    setFWs("all");
    setQ("");
  };
  const renderRowEdit = (t, r) => /* @__PURE__ */ React.createElement("div", { className: "cl-row", key: t.id, style: { background: "var(--hov)" } }, /* @__PURE__ */ React.createElement("div", { className: "cl-edit", onKeyDown: (e) => {
    if (e.key === "Escape") setRowEdit(null);
  } }, /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Title"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "in sm",
      autoFocus: true,
      value: r.title,
      onChange: (e) => setRowEdit({ ...r, title: e.target.value }),
      onKeyDown: (e) => {
        if (e.key === "Enter") saveRow();
      }
    }
  )), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Owner"), /* @__PURE__ */ React.createElement("input", { className: "in sm", list: "ss-owners", value: r.owner, onChange: (e) => setRowEdit({ ...r, owner: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t.milestone ? "Date" : "Start"), /* @__PURE__ */ React.createElement("input", { className: "in sm", type: "date", value: r.start, onChange: (e) => setRowEdit({ ...r, start: e.target.value }) })), !t.milestone && /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "End"), /* @__PURE__ */ React.createElement("input", { className: "in sm", type: "date", value: r.end, onChange: (e) => setRowEdit({ ...r, end: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "in sm", rows: 2, value: r.notes, onChange: (e) => setRowEdit({ ...r, notes: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "row full", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn sm", onClick: () => setRowEdit(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn sm primary", onClick: saveRow }, "Save"))));
  const renderChecklist = () => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "flt" }, /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Search"), /* @__PURE__ */ React.createElement("input", { className: "in", value: q, placeholder: "Title, description, notes…", onChange: (e) => setQ(e.target.value) })), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Status"), /* @__PURE__ */ React.createElement("select", { className: "in", value: fStatus, onChange: (e) => setFStatus(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All statuses"), STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, SM[s].label)), /* @__PURE__ */ React.createElement("option", { value: "milestone" }, "Milestones"))), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Owner"), /* @__PURE__ */ React.createElement("select", { className: "in", value: fOwner, onChange: (e) => setFOwner(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All owners"), owners.map((o) => /* @__PURE__ */ React.createElement("option", { key: o, value: o }, o)))), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Workstream"), /* @__PURE__ */ React.createElement("select", { className: "in", value: fWs, onChange: (e) => setFWs(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All workstreams"), workstreams.map((w) => /* @__PURE__ */ React.createElement("option", { key: w, value: w }, w))))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 12, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "sub" }, "Showing ", filtered.length, " of ", plural(tasks.length, "item"), " · ✎ edits a row in place"), filtersOn && /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: clearFilters }, "Clear filters"))), groups.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "card", style: { overflow: "hidden" } }, groups.map(([wk, items]) => /* @__PURE__ */ React.createElement(Fragment, { key: wk }, /* @__PURE__ */ React.createElement("div", { className: "cl-week" }, /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: ACCENT, fontSize: 11.5, letterSpacing: ".1em", fontWeight: 600 } }, "W", isoWeek(wk)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--t1)", fontSize: 13.5 } }, fmt(isoOf(wk)), " – ", fmt(isoOf(wk + 6))), /* @__PURE__ */ React.createElement("span", { className: "sub" }, items.filter((t) => t.status === "done").length, " of ", items.length, " done")), items.map((t) => {
    if (rowEdit && rowEdit.id === t.id) return renderRowEdit(t, rowEdit);
    const overdue = t.status !== "done" && dn(t.end) < T;
    return /* @__PURE__ */ React.createElement("div", { className: "cl-row", key: t.id }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        className: "chk",
        disabled: ro,
        "aria-label": `Mark ${t.title} done`,
        style: { accentColor: "var(--ok)" },
        checked: t.status === "done",
        onChange: (e) => updateTask(t.id, { status: e.target.checked ? "done" : "progress" })
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "cl-main", onClick: (e) => openDrawer(t.id, e) }, /* @__PURE__ */ React.createElement("div", { className: "tt", style: t.status === "done" ? { color: "var(--t3)", textDecoration: "line-through" } : void 0 }, t.milestone && /* @__PURE__ */ React.createElement("span", { style: { color: ACCENT, marginRight: 7, fontSize: 11 } }, "◆"), t.title), /* @__PURE__ */ React.createElement("div", { className: "meta" }, t.ws, " · ", t.owner, " · ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, dueText(t)), overdue && /* @__PURE__ */ React.createElement("span", { style: { color: SM.risk.color } }, " · overdue"), t.priority === "High" && /* @__PURE__ */ React.createElement("span", { style: { color: PRIO_COLOR.High } }, " · High priority")), t.notes && /* @__PURE__ */ React.createElement("div", { className: "meta", style: { color: "var(--t2)" } }, t.notes)), /* @__PURE__ */ React.createElement("button", { className: "ico", "data-e": "", title: "Edit inline", "aria-label": `Edit ${t.title}`, onClick: () => setRowEdit({ id: t.id, title: t.title, notes: t.notes, owner: t.owner, start: t.start, end: t.end }) }, "✎"), /* @__PURE__ */ React.createElement(
      "select",
      {
        className: "in sel-sm",
        disabled: ro,
        value: t.status,
        "aria-label": "Status",
        style: { color: SM[t.status].color },
        onChange: (e) => updateTask(t.id, { status: e.target.value })
      },
      STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, SM[s].label))
    ));
  })))) : /* @__PURE__ */ React.createElement("div", { className: "card sub", style: { padding: 18 } }, "Nothing matches these filters. ", /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: clearFilters }, "Clear filters")));
  const viewNode = (x) => /* @__PURE__ */ React.createElement("div", { className: `node ${x.v === "neutral" ? "" : x.v}`, key: x.id }, x.d && /* @__PURE__ */ React.createElement("em", null, x.d), /* @__PURE__ */ React.createElement("b", null, x.t), x.s && /* @__PURE__ */ React.createElement("span", null, x.s));
  const editNode = (fid, x, controls) => /* @__PURE__ */ React.createElement("div", { className: `node ed ${x.v === "neutral" ? "" : x.v}`, key: x.id }, /* @__PURE__ */ React.createElement("input", { className: "in sm", value: x.d, placeholder: "Label (optional, e.g. date)", "aria-label": "Step label", onChange: (e) => patchNode(fid, x.id, { d: e.target.value }) }), /* @__PURE__ */ React.createElement("input", { className: "in sm", value: x.t, placeholder: "Title", "aria-label": "Step title", style: { fontWeight: 600 }, onChange: (e) => patchNode(fid, x.id, { t: e.target.value }) }), /* @__PURE__ */ React.createElement("input", { className: "in sm", value: x.s, placeholder: "Subtext", "aria-label": "Step subtext", onChange: (e) => patchNode(fid, x.id, { s: e.target.value }) }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 4, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("select", { className: "in sm sel-sm", value: x.v, "aria-label": "Box colour", onChange: (e) => patchNode(fid, x.id, { v: e.target.value }) }, NODE_V.map((o) => /* @__PURE__ */ React.createElement("option", { key: o.v, value: o.v }, o.label))), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 0 } }, controls)));
  const renderFlow = (f, fi) => {
    const ed = flowEdit === f.id;
    const letter = String.fromCharCode(65 + fi % 26);
    return /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: "18px 20px 20px" }, key: f.id }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: ACCENT } }, "Flow ", letter), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 6 } }, ed && /* @__PURE__ */ React.createElement("button", { className: "btn sm danger", onClick: (e) => askDeleteFlow(f, e) }, "Delete flow"), /* @__PURE__ */ React.createElement("button", { "data-e": "", className: `btn sm ${ed ? "primary" : ""}`, onClick: () => setFlowEdit(ed ? null : f.id) }, ed ? "Done editing" : "✎ Edit flow"))), ed ? /* @__PURE__ */ React.createElement("div", { className: "fgrid", style: { margin: "10px 0 16px" } }, /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Flow title"), /* @__PURE__ */ React.createElement("input", { className: "in", value: f.title, onChange: (e) => updFlow(f.id, (x) => ({ ...x, title: e.target.value })) })), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Subtitle"), /* @__PURE__ */ React.createElement("input", { className: "in", value: f.sub, onChange: (e) => updFlow(f.id, (x) => ({ ...x, sub: e.target.value })) }))) : /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("h3", null, f.title), f.sub && /* @__PURE__ */ React.createElement("p", { className: "sub", style: { marginBottom: 16 } }, f.sub)), /* @__PURE__ */ React.createElement("div", { className: "chain" }, f.steps.map((s, si) => /* @__PURE__ */ React.createElement(Fragment, { key: s.id }, si > 0 && /* @__PURE__ */ React.createElement("div", { className: "arr" }, "→"), s.kind === "node" && s.node ? ed ? editNode(f.id, s.node, /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move left", "aria-label": "Move step left", disabled: si === 0, onClick: () => moveStep(f.id, si, -1) }, "←"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move right", "aria-label": "Move step right", disabled: si === f.steps.length - 1, onClick: () => moveStep(f.id, si, 1) }, "→"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Add step after", "aria-label": "Add step after", onClick: () => insertStep(f.id, si + 1) }, "＋"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Remove step", "aria-label": "Remove step", onClick: () => removeStep(f.id, s.id) }, "✕"))) : viewNode(s.node) : /* @__PURE__ */ React.createElement("div", { className: "branch" }, s.lanes.map((l) => /* @__PURE__ */ React.createElement("div", { className: "lane", key: l.id }, ed ? /* @__PURE__ */ React.createElement("input", { className: "in sm mono", value: l.tag, "aria-label": "Branch label", style: { width: 70, alignSelf: "center" }, onChange: (e) => updLane(f.id, l.id, (x) => ({ ...x, tag: e.target.value })) }) : l.tag && /* @__PURE__ */ React.createElement("span", { className: "tag" }, l.tag), l.nodes.map((x, xi) => /* @__PURE__ */ React.createElement(Fragment, { key: x.id }, xi > 0 && /* @__PURE__ */ React.createElement("div", { className: "arr" }, "→"), ed ? editNode(f.id, x, /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Remove step", "aria-label": "Remove step", onClick: () => removeLaneNode(f.id, s.id, l.id, x.id) }, "✕")) : viewNode(x))), ed && /* @__PURE__ */ React.createElement("button", { className: "addstep", onClick: () => updLane(f.id, l.id, (x) => ({ ...x, nodes: [...x.nodes, n("New step", "")] })) }, "+ Step"))), ed && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn sm", onClick: () => updFlow(f.id, (x) => ({ ...x, steps: x.steps.map((st) => st.id === s.id ? { ...st, lanes: [...st.lanes, { id: uid("l"), tag: "ELSE", nodes: [n("New step", "")] }] } : st) })) }, "+ Branch lane"), /* @__PURE__ */ React.createElement("button", { className: "btn sm ghost", onClick: () => removeStep(f.id, s.id) }, "Remove branch"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move branch left", "aria-label": "Move branch left", disabled: si === 0, onClick: () => moveStep(f.id, si, -1) }, "←"), /* @__PURE__ */ React.createElement("button", { className: "ico", title: "Move branch right", "aria-label": "Move branch right", disabled: si === f.steps.length - 1, onClick: () => moveStep(f.id, si, 1) }, "→"))))), ed && /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "addstep", onClick: () => insertStep(f.id, f.steps.length) }, "+ Add step"), /* @__PURE__ */ React.createElement("button", { className: "addstep", onClick: () => addBranch(f.id) }, "+ Add branch"))));
  };
  const renderFlows = () => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, flows.map((f, i) => renderFlow(f, i)), /* @__PURE__ */ React.createElement("div", { "data-e": "" }, /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: addFlow }, "+ Add flow")));
  const panelTop = Math.max(12, anchor - 160);
  const renderDrawer = (t) => {
    const dur = dn(t.end) - dn(t.start) + 1;
    const open = t.status !== "done";
    const left = dn(t.end) - T;
    const wkA = isoWeek(dn(t.start));
    const wkB = isoWeek(dn(t.end));
    const prop = (k, v) => /* @__PURE__ */ React.createElement("div", { key: k }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, k), /* @__PURE__ */ React.createElement("div", { className: "v" }, v));
    return /* @__PURE__ */ React.createElement("div", { className: "panel drawer", ref: panelRef, style: { top: panelTop }, role: "dialog", "aria-label": "Task details" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: t.milestone ? ACCENT : "var(--t3)" } }, t.milestone ? "Milestone details" : "Task details"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", "aria-label": "Close", onClick: () => setDrawerId(null) }, "✕")), /* @__PURE__ */ React.createElement("h2", null, t.title), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6, marginBottom: 16 } }, pill(t.status), t.milestone && msPill(), prioPill(t.priority), open && left < 0 && /* @__PURE__ */ React.createElement("span", { className: "pill", style: { color: SM.risk.color, background: SM.risk.tint } }, "Overdue by ", plural(-left, "day"))), /* @__PURE__ */ React.createElement("div", { className: "props" }, prop(
      "Status",
      /* @__PURE__ */ React.createElement("select", { className: "in sel-sm", disabled: ro, value: t.status, "aria-label": "Status", style: { color: SM[t.status].color, marginTop: 2 }, onChange: (e) => updateTask(t.id, { status: e.target.value }) }, STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, SM[s].label)))
    ), prop("Workstream", t.ws), prop("Owner", t.owner), prop("Priority", /* @__PURE__ */ React.createElement("span", { style: { color: PRIO_COLOR[t.priority] } }, t.priority)), t.milestone ? prop("Date", fmtLong(t.start)) : prop("Start", fmtLong(t.start)), t.milestone ? prop("Week", `W${wkA}`) : prop("End", fmtLong(t.end)), !t.milestone && prop("Duration", plural(dur, "day")), !t.milestone && prop("Weeks", wkA === wkB ? `W${wkA}` : `W${wkA} – W${wkB}`), open && prop(left >= 0 ? "Due in" : "Overdue", left === 0 ? "Due today" : plural(Math.abs(left), "day")), open && prop("Type", t.milestone ? "Milestone" : "Task")), t.description && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "lbl", style: { marginBottom: 6 } }, "Description"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--t1)", fontSize: 14, lineHeight: 1.6 } }, t.description)), t.notes && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "lbl", style: { marginBottom: 6 } }, "Notes"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--t2)", fontSize: 13.5, lineHeight: 1.6, background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 10, padding: "10px 12px", whiteSpace: "pre-wrap" } }, t.notes)), /* @__PURE__ */ React.createElement("div", { className: "row", "data-e": "", style: { marginTop: 22, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: () => openEdit(t) }, "Edit"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => updateTask(t.id, { status: t.status === "done" ? "progress" : "done" }) }, t.status === "done" ? "Reopen" : "Mark done")), /* @__PURE__ */ React.createElement("button", { className: "btn danger", onClick: () => askDelete(t) }, "Delete")));
  };
  const ownerField = (d) => /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Owner"), /* @__PURE__ */ React.createElement("input", { className: "in", list: "ss-owners", value: d.owner, placeholder: "Who drives it?", onChange: (e) => patchDraft({ owner: e.target.value }) }));
  const renderEditor = (d) => /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "panel modal",
      ref: panelRef,
      style: { top: panelTop },
      role: "dialog",
      "aria-label": d.id ? "Edit task" : "Add task",
      onKeyDown: (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveDraft();
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: ACCENT } }, d.id ? "Edit task" : "New task"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", "aria-label": "Close", onClick: () => setDraft(null) }, "✕")),
    /* @__PURE__ */ React.createElement("h2", { style: { marginBottom: 16 } }, d.id ? "Edit task" : "Add a task to the plan"),
    /* @__PURE__ */ React.createElement("div", { className: "fgrid" }, /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Title"), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "in",
        autoFocus: true,
        value: d.title,
        placeholder: "What needs to happen?",
        "aria-label": "Title",
        onChange: (e) => patchDraft({ title: e.target.value }),
        onKeyDown: (e) => {
          if (e.key === "Enter") saveDraft();
        }
      }
    )), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Workstream"), /* @__PURE__ */ React.createElement("select", { className: "in", value: d.ws, "aria-label": "Workstream", onChange: (e) => patchDraft({ ws: e.target.value }) }, workstreams.map((w) => /* @__PURE__ */ React.createElement("option", { key: w, value: w }, w)), /* @__PURE__ */ React.createElement("option", { value: "__new__" }, "+ New workstream…"))), d.ws === "__new__" && /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "New workstream name"), /* @__PURE__ */ React.createElement("input", { className: "in", value: d.newWs, placeholder: "e.g. Partnerships", "aria-label": "New workstream name", onChange: (e) => patchDraft({ newWs: e.target.value }) })), ownerField(d), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Status"), /* @__PURE__ */ React.createElement("select", { className: "in", value: d.status, "aria-label": "Status", style: { color: SM[d.status].color }, onChange: (e) => patchDraft({ status: e.target.value }) }, STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, SM[s].label)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Priority"), /* @__PURE__ */ React.createElement("div", { className: "prio" }, PRIORITIES.map((p) => /* @__PURE__ */ React.createElement("button", { key: p, className: d.priority === p ? "on" : "", style: d.priority === p ? { color: PRIO_COLOR[p] } : void 0, onClick: () => patchDraft({ priority: p }) }, p)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Type"), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `switch ${d.milestone ? "on" : ""}`,
        role: "switch",
        "aria-checked": d.milestone,
        tabIndex: 0,
        onClick: () => patchDraft({ milestone: !d.milestone }),
        onKeyDown: (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            patchDraft({ milestone: !d.milestone });
          }
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "k" }),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, color: d.milestone ? ACCENT : "var(--t2)" } }, d.milestone ? "Milestone (single date)" : "Task with a date range")
    )), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, d.milestone ? "Date" : "Start date"), /* @__PURE__ */ React.createElement("input", { className: "in", type: "date", "aria-label": "Start date", value: d.start, onChange: (e) => patchDraft({ start: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "End date"), /* @__PURE__ */ React.createElement("input", { className: "in", type: "date", "aria-label": "End date", disabled: d.milestone, value: d.milestone ? d.start : d.end, onChange: (e) => patchDraft({ end: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Description"), /* @__PURE__ */ React.createElement("textarea", { className: "in", rows: 3, "aria-label": "Description", value: d.description, placeholder: "What is this and why does it matter?", onChange: (e) => patchDraft({ description: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "in", rows: 3, "aria-label": "Notes", value: d.notes, placeholder: "Commits, blockers, links, decisions…", onChange: (e) => patchDraft({ notes: e.target.value }) }))),
    draftErr && /* @__PURE__ */ React.createElement("div", { style: { color: SM.risk.color, fontSize: 13, marginTop: 14 } }, draftErr),
    /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 20, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("span", { className: "sub", style: { marginRight: "auto" } }, "Ctrl/Cmd + Enter to save"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => setDraft(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: saveDraft }, d.id ? "Save changes" : "Add task"))
  );
  const saveHeader = () => {
    if (!hdr) return;
    setMeta({ title: hdr.title.trim() || meta.title, subtitle: hdr.subtitle.trim(), target: ISO_RE.test(hdr.target) ? hdr.target : meta.target });
    setHdr(null);
    setFlash("Header updated");
  };
  const segs = STATUS_ORDER.filter((s) => stats.counts[s] > 0);
  const renderAuthBar = () => /* @__PURE__ */ React.createElement("div", { className: "authbar" }, /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--t3)", fontSize: 11.5 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ok)" } }, "●"), " Shared board"), /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 8, marginLeft: "auto" } }, auth.user ? /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "sub" }, "Signed in as ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--t1)", fontWeight: 600 } }, auth.user.email)), /* @__PURE__ */ React.createElement("span", { className: "pill rolepill", "data-role": role || "none" }, role ? role[0].toUpperCase() + role.slice(1) : "No access"), /* @__PURE__ */ React.createElement("button", { className: "btn sm ghost", onClick: () => SSStorage.signOut() }, "Sign out")) : /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "sub" }, "Viewing read-only"), /* @__PURE__ */ React.createElement("button", { className: "btn sm primary", onClick: () => {
    setDrawerId(null);
    setExportOpen(false);
    setSignOpen(true);
  } }, "Sign in"))));
  const nextDays = stats.next ? dn(stats.next.start) - T : 0;
  return /* @__PURE__ */ React.createElement("div", { className: `ss ${ro ? "ro" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, shared && renderAuthBar(), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", alignItems: "flex-start", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 460px", minWidth: 0 } }, hdr ? /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "fgrid" }, /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Title"), /* @__PURE__ */ React.createElement("input", { className: "in", autoFocus: true, "aria-label": "Board title", value: hdr.title, onChange: (e) => setHdr({ ...hdr, title: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Subtitle"), /* @__PURE__ */ React.createElement("textarea", { className: "in", rows: 2, "aria-label": "Board subtitle", value: hdr.subtitle, onChange: (e) => setHdr({ ...hdr, subtitle: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Target date"), /* @__PURE__ */ React.createElement("input", { className: "in", type: "date", "aria-label": "Target date", value: hdr.target, onChange: (e) => setHdr({ ...hdr, target: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 14, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn sm", onClick: () => setHdr(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn sm primary", onClick: saveHeader }, "Save header"))) : /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mono", style: { color: ACCENT, fontSize: 11.5, letterSpacing: ".16em", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: 2, background: ACCENT, transform: "rotate(45deg)", display: "inline-block" } }), "TARGET · EVERYTHING COMPLETE BY ", fmtYear(meta.target).toUpperCase(), /* @__PURE__ */ React.createElement("button", { className: "ico", "data-e": "", title: "Edit title, subtitle and target date", "aria-label": "Edit header", onClick: () => setHdr({ ...meta }) }, "✎ edit")), /* @__PURE__ */ React.createElement("h1", null, meta.title), meta.subtitle && /* @__PURE__ */ React.createElement("p", { style: { color: "var(--t2)", fontSize: 14.5, maxWidth: 760 } }, meta.subtitle), /* @__PURE__ */ React.createElement("p", { className: "mono", style: { color: "var(--t3)", fontSize: 11.5, marginTop: 6 } }, plural(stats.total, "task"), " · ", plural(stats.ms.length, "milestone"), " · ", plural(workstreams.length, "workstream"), " · as of ", fmtLong(today)))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", flex: "0 1 auto" } }, /* @__PURE__ */ React.createElement("button", { className: "btn primary", "data-e": "", style: { padding: "9px 16px", fontSize: 13.5 }, onClick: (e) => openAdd(e) }, "+ Add task"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: (e) => {
    setAnchor(e.pageY);
    setDrawerId(null);
    setExportMsg("");
    setExportOpen(true);
  } }, "Export JSON"), (!shared || isOwner) && /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: askReset }, "Reset to original data"))), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: "8px 18px", marginTop: 16 } }, STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("span", { className: "lg", key: s }, /* @__PURE__ */ React.createElement("i", { style: { background: SM[s].tint, borderColor: SM[s].color } }), SM[s].label)), /* @__PURE__ */ React.createElement("span", { className: "lg" }, /* @__PURE__ */ React.createElement("i", { style: { background: ACCENT, borderColor: ACCENT, transform: "rotate(45deg) scale(.8)", borderRadius: 2 } }), "Milestone"), /* @__PURE__ */ React.createElement("span", { className: "lg" }, /* @__PURE__ */ React.createElement("i", { style: { width: 2, height: 14, background: ACCENT, borderColor: ACCENT, borderRadius: 0 } }), "Today"), flash && /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontSize: 11.5, color: SM.done.color, marginLeft: "auto" }, role: "status" }, "✓ ", flash)), /* @__PURE__ */ React.createElement("div", { className: "sum", style: { marginTop: 22 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, "Complete"), /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6 }, "data-testid": "pct" }, stats.pct, "%"), /* @__PURE__ */ React.createElement("div", { className: "seg", style: { marginTop: 10 } }, segs.map((s) => /* @__PURE__ */ React.createElement("div", { key: s, title: `${SM[s].label}: ${stats.counts[s]}`, style: { flex: stats.counts[s], background: SM[s].color, opacity: s === "todo" ? 0.45 : 1 } }))), /* @__PURE__ */ React.createElement("div", { className: "sub", style: { marginTop: 9, display: "flex", flexWrap: "wrap", gap: "2px 10px" } }, STATUS_ORDER.map((s) => /* @__PURE__ */ React.createElement("span", { key: s }, /* @__PURE__ */ React.createElement("span", { style: { color: SM[s].color } }, "●"), " ", stats.counts[s], " ", SM[s].label.toLowerCase())))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, "Days to ", fmt(meta.target)), /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6, color: daysToTarget < 0 ? SM.risk.color : "var(--t1)" }, "data-testid": "days" }, daysToTarget >= 0 ? daysToTarget : `${-daysToTarget} past`), /* @__PURE__ */ React.createElement("div", { className: "sub", style: { marginTop: 8 } }, "Target ", fmtLong(meta.target), " · ", plural(Math.max(0, Math.ceil(daysToTarget / 7)), "week"), " left")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { cursor: stats.next ? "pointer" : "default" }, onClick: (e) => {
    if (stats.next) openDrawer(stats.next.id, e);
  } }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, "Next milestone"), stats.next ? /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6, color: ACCENT } }, fmt(stats.next.start)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: "var(--t1)", marginTop: 6, fontWeight: 500 } }, stats.next.title), /* @__PURE__ */ React.createElement("div", { className: "sub" }, nextDays === 0 ? "Today" : `In ${plural(nextDays, "day")}`, " · ", stats.next.owner)) : /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6, color: SM.done.color } }, "All reached")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, "Done / total"), /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6 }, "data-testid": "donetotal" }, stats.counts.done, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--t3)", fontWeight: 500 } }, " / ", stats.total)), /* @__PURE__ */ React.createElement("div", { className: "sub", style: { marginTop: 8 } }, "Tasks only · ", stats.msDone, " of ", plural(stats.ms.length, "milestone"), " reached")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "lbl" }, "At risk"), /* @__PURE__ */ React.createElement("div", { className: "big", style: { marginTop: 6, color: stats.riskAll > 0 ? SM.risk.color : SM.done.color } }, stats.riskAll), /* @__PURE__ */ React.createElement("div", { className: "sub", style: { marginTop: 8 } }, stats.overdue > 0 ? `${stats.overdue} more open past due date` : "Nothing open past its due date"))), stats.attention.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card att", style: { marginTop: 14, padding: "15px 20px 10px" } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: SM.risk.color, fontWeight: 600 } }, "Needs attention now"), /* @__PURE__ */ React.createElement("span", { className: "sub" }, plural(stats.attention.length, "item"))), stats.attention.map((t) => {
    const od = dn(t.end) < T;
    return /* @__PURE__ */ React.createElement("div", { className: "att-item", key: t.id, onClick: (e) => openDrawer(t.id, e) }, /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: SM.risk.color, flex: "0 0 auto" } }), /* @__PURE__ */ React.createElement("span", { className: "tt", style: { flex: "1 1 280px", minWidth: 0 } }, t.title), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontSize: 12, color: "var(--t2)" } }, "due ", fmt(t.end), " · ", t.owner), t.status === "risk" && pill("risk"), od && /* @__PURE__ */ React.createElement("span", { className: "pill", style: { color: SM.risk.color, borderColor: SM.risk.color } }, "Overdue ", plural(T - dn(t.end), "day")));
  })), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 24, marginBottom: 12, justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { className: "tabs", role: "tablist" }, (isOwner ? ["timeline", "checklist", "flows", "settings"] : ["timeline", "checklist", "flows"]).map((k) => /* @__PURE__ */ React.createElement("button", { key: k, role: "tab", "aria-selected": tab === k, className: `tab ${tab === k ? "on" : ""}`, onClick: () => setTab(k) }, k === "timeline" ? "Timeline" : k === "checklist" ? "Checklist" : k === "flows" ? "Flows" : "Settings"))), /* @__PURE__ */ React.createElement("span", { className: "sub", style: syncErr ? { color: SM.risk.color } : void 0 }, syncErr ? syncErr : !persist ? "Changes last for this session. Use Export JSON to keep a copy." : ro ? auth.user ? "View only — your account doesn't have edit access. Ask the owner for an invite." : "View only — sign in as an editor to make changes." : shared ? "Every change saves automatically to the shared database." : "Every change saves automatically in this browser.")), tab === "timeline" && renderTimeline(), tab === "checklist" && renderChecklist(), tab === "flows" && renderFlows(), tab === "settings" && isOwner && /* @__PURE__ */ React.createElement(SettingsPanel, { me: auth.user ? auth.user.email : "" })), /* @__PURE__ */ React.createElement("datalist", { id: "ss-owners" }, owners.map((o) => /* @__PURE__ */ React.createElement("option", { key: o, value: o }))), preview && (() => {
    const pt = tasks.find((x) => x.id === preview.id);
    return /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: Math.max(8, Math.min(preview.x + 14, window.innerWidth - 312)), top: preview.y + 16, width: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "mono", style: { fontSize: 12, color: "var(--t1)" } }, pt && pt.milestone ? fmt(isoOf(preview.start)) : `${fmt(isoOf(preview.start))} – ${fmt(isoOf(preview.end))} · ${plural(preview.end - preview.start + 1, "day")}`));
  })(), tip && !preview && /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: Math.max(8, Math.min(tip.x + 14, window.innerWidth - 312)), top: tip.y + 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--t1)", lineHeight: 1.35 } }, tip.t.title), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 6, marginTop: 7 } }, pill(tip.t.status), tip.t.milestone && msPill()), /* @__PURE__ */ React.createElement("div", { className: "mono", style: { fontSize: 11.5, color: "var(--t2)", marginTop: 7 } }, dueText(tip.t), " · ", tip.t.owner)), anyOpen && /* @__PURE__ */ React.createElement("div", { className: "ov", onClick: () => {
    if (confirm) setConfirm(null);
    else if (draft) setDraft(null);
    else {
      setExportOpen(false);
      setDrawerId(null);
      setSignOpen(false);
    }
  } }), drawerTask && !draft && !confirm && renderDrawer(drawerTask), draft && !confirm && renderEditor(draft), exportOpen && !confirm && /* @__PURE__ */ React.createElement("div", { className: "panel modal", ref: panelRef, style: { top: panelTop }, role: "dialog", "aria-label": "Export JSON" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: ACCENT } }, "Export"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", "aria-label": "Close", onClick: () => setExportOpen(false) }, "✕")), /* @__PURE__ */ React.createElement("h2", null, "Export board as JSON"), /* @__PURE__ */ React.createElement("p", { className: "sub", style: { marginBottom: 12 } }, "Header, ", plural(workstreams.length, "workstream"), ", ", plural(tasks.length, "item"), " with descriptions and notes, and ", plural(flows.length, "flow"), "."), /* @__PURE__ */ React.createElement("textarea", { ref: jsonRef, className: "in mono", readOnly: true, value: json, style: { height: 260, fontSize: 12 } }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 14, justifyContent: "flex-end" } }, exportMsg && /* @__PURE__ */ React.createElement("span", { className: "sub", style: { marginRight: "auto", color: SM.done.color } }, exportMsg), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: doCopy }, "Copy"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: doDownload }, "Download .json"))), signOpen && !confirm && /* @__PURE__ */ React.createElement(SignInPanel, { onClose: () => setSignOpen(false) }), confirm && /* @__PURE__ */ React.createElement("div", { className: "panel modal", ref: panelRef, style: { top: panelTop, width: "min(460px, calc(100% - 16px))" }, role: "alertdialog", "aria-label": confirm.title }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18 } }, confirm.title), /* @__PURE__ */ React.createElement("p", { className: "sub", style: { fontSize: 13.5, lineHeight: 1.55 } }, confirm.body), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 18, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => setConfirm(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn danger", onClick: () => {
    const c = confirm;
    setConfirm(null);
    c.run();
  } }, confirm.label))));
}
function SignInPanel({ onClose }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  const send = () => {
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setState("err");
      setMsg("Enter a valid email address.");
      return;
    }
    setState("busy");
    setMsg("");
    SSStorage.signIn(v).then(
      () => {
        setState("sent");
        setMsg(`Magic link sent to ${v}. Open it on this device to sign in.`);
      },
      (err) => {
        setState("err");
        setMsg(err && err.message ? err.message : "Couldn't send the link. Try again in a few minutes.");
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: "panel modal", style: { top: Math.max(80, window.scrollY + 80), width: "min(440px, calc(100% - 16px))" }, role: "dialog", "aria-label": "Sign in" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: "var(--ac)" } }, "Sign in"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", "aria-label": "Close", onClick: onClose }, "✕")), /* @__PURE__ */ React.createElement("h2", null, "Sign in with a magic link"), /* @__PURE__ */ React.createElement("p", { className: "sub", style: { marginBottom: 12 } }, "Anyone can view the board. Editors invited by the owner can sign in to make changes."), /* @__PURE__ */ React.createElement("label", { className: "field full" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Email"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "in",
      type: "email",
      autoFocus: true,
      value: email,
      placeholder: "you@company.com",
      "aria-label": "Email",
      onChange: (e) => setEmail(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") send();
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "row", style: { marginTop: 14, justifyContent: "flex-end" } }, msg && /* @__PURE__ */ React.createElement("span", { className: "sub", style: { marginRight: "auto", color: state === "err" ? "var(--dg)" : "var(--ok)" } }, msg), /* @__PURE__ */ React.createElement("button", { className: "btn primary", disabled: state === "busy", onClick: send }, state === "busy" ? "Sending…" : state === "sent" ? "Send again" : "Send magic link")));
}
function SettingsPanel({ me }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const load = () => {
    SSStorage.listMembers().then((r) => setRows(r || []), (e) => setErr(e.message || "Couldn't load members"));
  };
  useEffect(load, []);
  const run = (p, done) => {
    setErr("");
    setOk("");
    p.then(() => {
      setOk(done);
      load();
    }, (e) => setErr(e && e.message ? /duplicate|unique/i.test(e.message) ? "That email is already a member." : e.message : "Something went wrong"));
  };
  const invite = () => {
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setErr("Enter a valid email address.");
      return;
    }
    run(SSStorage.inviteMember(v, newRole).then(() => setEmail("")), `Added ${v} as ${newRole}. They can now sign in with a magic link.`);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: "18px 20px 20px" } }, /* @__PURE__ */ React.createElement("span", { className: "lbl", style: { color: "var(--ac)" } }, "Settings · Members"), /* @__PURE__ */ React.createElement("h2", { style: { marginTop: 6 } }, "Who can edit this board"), /* @__PURE__ */ React.createElement("p", { className: "sub", style: { marginBottom: 14 } }, "Anyone with the link can view. Editors can change tasks, workstreams, flows and the header. Owners can also manage members. People sign in with a magic link sent to the email you add here."), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "in",
      type: "email",
      style: { flex: "1 1 240px", width: "auto" },
      placeholder: "teammate@company.com",
      "aria-label": "Invite email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") invite();
      }
    }
  ), /* @__PURE__ */ React.createElement("select", { className: "in", style: { width: "auto" }, "aria-label": "Role", value: newRole, onChange: (e) => setNewRole(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "editor" }, "Editor"), /* @__PURE__ */ React.createElement("option", { value: "viewer" }, "Viewer"), /* @__PURE__ */ React.createElement("option", { value: "owner" }, "Owner")), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: invite }, "Invite")), err && /* @__PURE__ */ React.createElement("p", { className: "sub", style: { color: "var(--dg)", marginBottom: 10 } }, err), ok && /* @__PURE__ */ React.createElement("p", { className: "sub", style: { color: "var(--ok)", marginBottom: 10 } }, ok), rows === null ? /* @__PURE__ */ React.createElement("p", { className: "sub" }, "Loading members…") : /* @__PURE__ */ React.createElement("div", { className: "members" }, rows.map((m) => /* @__PURE__ */ React.createElement("div", { className: "mrow", key: m.id }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 220px", minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "tt" }, m.email, m.email === me && /* @__PURE__ */ React.createElement("span", { className: "sub" }, " · you")), /* @__PURE__ */ React.createElement("div", { className: "meta" }, m.invited_by ? `Added by ${m.invited_by}` : "", m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" })}` : "")), /* @__PURE__ */ React.createElement("select", { className: "in sel-sm", "aria-label": `Role for ${m.email}`, value: m.role, onChange: (e) => run(SSStorage.setMemberRole(m.id, e.target.value), `${m.email} is now ${e.target.value}.`) }, /* @__PURE__ */ React.createElement("option", { value: "owner" }, "Owner"), /* @__PURE__ */ React.createElement("option", { value: "editor" }, "Editor"), /* @__PURE__ */ React.createElement("option", { value: "viewer" }, "Viewer")), /* @__PURE__ */ React.createElement("button", { className: "btn sm danger", onClick: () => {
    if (window.confirm(`Remove ${m.email} from the board?`)) run(SSStorage.removeMember(m.id), `Removed ${m.email}.`);
  } }, "Remove")))));
}
function Root() {
  const [init, setInit] = useState(null);
  useEffect(() => {
    Promise.all([SSStorage.load(), SSStorage.initAuth().catch(() => void 0)]).then((r) => setInit(r[0]));
  }, []);
  if (!init) {
    return /* @__PURE__ */ React.createElement("div", { className: "ss" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("p", { className: "mono", style: { color: "var(--t3)", fontSize: 12 } }, "Loading plan…")));
  }
  return /* @__PURE__ */ React.createElement(App, { init });
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
