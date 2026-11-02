# StealthShell launch plan

A static, dark-mode project board for the StealthShell launch: summary cards, a "Needs attention" panel, a draggable Gantt **Timeline**, a filterable **Checklist** with inline edits, and **Flows** diagrams. Add, edit and delete tasks, workstreams and flows; Export JSON.

Plain static files — no build step. Open `index.html` or serve the folder.

```
index.html        page shell (React 18 UMD from unpkg, supabase-js from jsDelivr)
css/styles.css    dark theme + layout
js/config.js      public runtime config (SUPABASE_URL / SUPABASE_ANON_KEY)
js/data.js        seed board (49 tasks, 7 workstreams, 4 flows)
js/storage.js     storage module: load / saveBoard / saveTask / deleteTask / ...
js/app.js         the board UI
```

## Storage
All persistence goes through `js/storage.js`.

- **Shared (default):** `js/config.js` points at the Supabase project `stealthshell-board`. Anyone with the link can view; members with the *editor* or *owner* role sign in with an email magic link and edit. Owners manage members in the **Settings** tab. Every rule is enforced by Postgres row-level security, not by the UI. Changes from other people appear live (Realtime).
- **Local only:** empty both values in `js/config.js` and the board saves in this browser's `localStorage`.

The publishable/anon key in `config.js` is public by design. Never put a `service_role` / secret key in this repo.
