# StealthShell launch plan

A static, dark-mode project board for the StealthShell launch: summary cards, a "Needs attention" panel, a draggable Gantt **Timeline**, a filterable **Checklist** with inline edits, and **Flows** diagrams. Add, edit and delete tasks, workstreams and flows; Export JSON.

Plain static files — no build step. Open `index.html` or serve the folder.

```
index.html        page shell (React 18 UMD from unpkg, supabase-js from jsDelivr)
css/styles.css    dark theme + layout
js/config.js      public runtime config (SUPABASE_URL / SUPABASE_ANON_KEY)
js/data.js        empty starter skeleton (local-only mode); the plan itself is not in this repo
supabase/migrations/  database schema, RLS policies and access-request setup (SQL)
js/storage.js     storage module: load / saveBoard / saveTask / deleteTask / ...
js/app.js         the board UI
```

## Hierarchy
Items nest to any depth: **Area** (the workstreams) › **Workstream** › **Task** › **Sub-task** (and deeper).

- **Checklist → Tree** shows the outline with ▸/▾ toggles, a level label per row and *Expand all* / *Collapse all* (collapse state is remembered per browser). *By week* keeps the original weekly list.
- **+ Add** (top) adds an area; on a row, **+** adds a sub-item inline (Enter saves, Esc cancels), **✎** edits in place, **⋯** offers *Add same level*, *Add sub-item*, *Move up / down*, *Move under…* and *Delete* (the confirmation states how many sub-items go with it).
- Clicking a row opens its details (title, description, owner, status, start, end, progress %, notes); edits save immediately.
- **Roll-up:** a parent's progress is the average of its children; its status is *done* when all children are done, *at risk* if any is at risk, *in progress* if any has started, otherwise *not started*. On the Timeline a parent spans its earliest child start to latest child end; dragging a parent bar moves its whole branch. Headline numbers count leaf items only.
- Database: `tasks.parent_id` (nullable, references `tasks.id`, `on delete cascade`) and `tasks.progress` (0–100, nullable). Existing rows are untouched (top-level, no explicit progress) and the existing RLS policies cover the new columns.

## Storage
All persistence goes through `js/storage.js`.

- **Shared (default):** `js/config.js` points at the Supabase project `stealthshell-board`. The board is **members-only**: see *Sign-in and access* below. Members with the *editor* or *owner* role can edit; *viewers* can only read. Owners manage members in the **Settings** tab. Every rule is enforced by Postgres row-level security, not by the UI. Changes from other people appear live (Realtime).
- **Local only:** empty both values in `js/config.js` and the board saves in this browser's `localStorage`.

The publishable/anon key in `config.js` is public by design. Never put a `service_role` / secret key in this repo.

## Sign-in and access
- Opening the page signed out shows only a sign-in screen (email → **Send sign-in link**, a one-time magic link). Nothing from the plan is fetched or shipped before sign-in; the database refuses anonymous reads.
- A signed-in person who isn't a member sees **Access pending** with **Request access** (and Sign out). The request lands in the owner's **Settings → Pending requests**, where it can be approved as *Viewer* or *Editor*, or declined. The pending screen opens the plan by itself once approved (Realtime, plus a check every 20 s and a *Check again* button).
- Owners can still invite people directly by email in Settings; inviting someone also marks their pending request approved.
- Database rules (`supabase/migrations/`): `board_settings`, `workstreams`, `tasks` and `flows` are readable only by members (`private.is_member()`) and writable by editors/owners; `access_requests` lets a user create/read only their own request while owners read and decide all; `board_seed` (the original plan used by *Reset to original data*) is owner-only. The anon role has no table privileges.
