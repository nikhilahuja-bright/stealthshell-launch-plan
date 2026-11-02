/* Seed data for the StealthShell launch plan board.
 * Used on first load (and by "Reset to original data") when no saved board exists.
 * Shape: { meta, wsOrder, tasks[], flows[] } — see js/storage.js. */
window.SS_SEED = {
  "meta": {
    "title": "StealthShell launch plan",
    "subtitle": "Brightside Technologies · core product, BrightForge agents, e-mail, mobile apps, production, security and pilots on one plan.",
    "target": "2026-11-30"
  },
  "wsOrder": [
    "Core product",
    "BrightForge agents",
    "E-mail & leads",
    "Mobile apps",
    "Production",
    "Security",
    "Pilots & business"
  ],
  "tasks": [
    {
      "id": "t1",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-19",
      "end": "2026-10-19",
      "owner": "Cursor",
      "title": "Core job flow live (lead → job → quote → approval → signature → PDF)",
      "notes": "Tested live with a new customer; ERP quote AN-2026-00004 reused.",
      "description": "The complete core job flow, from lead to job, quote, customer approval, signature and PDF, running live. It is the backbone of the product and has been tested live with a new customer."
    },
    {
      "id": "t2",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-19",
      "end": "2026-10-19",
      "owner": "Cursor",
      "title": "ERP quote fix: unit dropdown, clear ERP error messages",
      "notes": "Commit 45bd743.",
      "description": "Fixes the ERP quote step with a unit dropdown and clear messages when the ERP returns an error, so users can see and correct quote problems themselves."
    },
    {
      "id": "t3",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-19",
      "end": "2026-10-19",
      "owner": "Cursor",
      "title": "Done jobs leave open lists, daily demo jobs, Accepted screen",
      "notes": "Commit 8117063.",
      "description": "Completed jobs now drop off the open lists, demo jobs are generated daily and an Accepted screen confirms approval. Keeps working lists clean and the demo environment fresh."
    },
    {
      "id": "t4",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-23",
      "end": "2026-10-23",
      "owner": "Claude Code",
      "title": "demo-refresh waits for ERP after deploy",
      "notes": "Live log: 'ERP reachable after 30 s', stock and invoices seeded.",
      "description": "The demo-refresh job now waits until the ERP is reachable after a deploy before seeding data, so stock and invoices are reliably present in the demo."
    },
    {
      "id": "t5",
      "status": "risk",
      "milestone": false,
      "priority": "High",
      "ws": "Core product",
      "start": "2026-10-27",
      "end": "2026-10-28",
      "owner": "Cursor",
      "title": "Fix: working time shows 0:00 h after a deploy",
      "notes": "Not yet sent to Claude Code. Working Time Act risk — must be fixed before pilots.",
      "description": "Recorded working time shows 0:00 h after a deploy. Correct time records are a Working Time Act risk, so this has to be fixed before pilots start."
    },
    {
      "id": "t6",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-27",
      "end": "2026-10-28",
      "owner": "Cursor",
      "title": "Fix: 'Now' card shows unstarted demo job; 'Überfällig' as badge",
      "notes": "",
      "description": "The 'Now' card should not show a demo job that has not started, and overdue ('Überfällig') jobs should be marked with a badge, so the start screen reflects what actually needs doing."
    },
    {
      "id": "t7",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Core product",
      "start": "2026-10-27",
      "end": "2026-10-28",
      "owner": "Cursor",
      "title": "Small fixes: Jobs heading, date format per language, demo job variety",
      "notes": "",
      "description": "A batch of polish items: the Jobs heading, date formats that follow the selected language, and more variety in demo jobs."
    },
    {
      "id": "t8",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-21",
      "end": "2026-10-21",
      "owner": "Nikhil",
      "title": "Grok API key + grok-4.7 on the server",
      "notes": "Tested OK on 21 Oct. Weekly quota used up by Cursor on 22 Oct; API returns 402 (credits $0). Agents now show the error clearly.",
      "description": "The Grok API key and the grok-4.7 model are configured on the server, giving the agents their AI provider. The weekly quota is currently used up, and agents now show that error clearly."
    },
    {
      "id": "t9",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-21",
      "end": "2026-10-21",
      "owner": "Cursor",
      "title": "Agent runtime + 35-agent catalog + Dunning reference agent",
      "notes": "Commit 5af12b9, CI green incl. live smoke.",
      "description": "The agent runtime, the catalog of 35 agents and Dunning as the reference agent. This is the foundation every BrightForge agent runs on."
    },
    {
      "id": "t10",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-21",
      "end": "2026-10-22",
      "owner": "Cursor",
      "title": "Runtime panel, Run now, Grok badge, grouped catalog, correct counts",
      "notes": "Commit 93482f3, CI green after rerun. Runtime panel, Run now, Grok badge, 35-agent grid, counts fixed.",
      "description": "The runtime panel with Run now, a Grok badge, a catalog grouped by area and correct counts, giving operators visibility and manual control over the agents."
    },
    {
      "id": "t11",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-22",
      "end": "2026-10-22",
      "owner": "Cursor",
      "title": "Website descriptions → portfolio.md spec + Auto mode",
      "notes": "Live and green (3 live smokes in a row). Website texts on all 35 cards, Auto mode switches, Dunning built to the website sentence, Run now async, signature flake fixed.",
      "description": "Each agent's website description becomes its spec in portfolio.md, and each agent gets an Auto mode switch. Agents are built to do exactly what the website promises."
    },
    {
      "id": "t12",
      "status": "progress",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-22",
      "end": "2026-11-04",
      "owner": "Nikhil",
      "title": "Merge agent branches one by one (CI green each)",
      "notes": "Merged so far: dunning-pdf, dunning-pdf-layout, agents-finance-1, runtime-generic, finance-fixes, agents-finance-2, finance-polish, agents-backoffice-1. Only Nikhil merges.",
      "description": "Merging the agent feature branches one at a time, each only with green CI, so the main line stays stable while the agents land."
    },
    {
      "id": "t13",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-22",
      "end": "2026-10-22",
      "owner": "Claude Code",
      "title": "Dunning: PDF after approve, DIN 5008 letter, error codes, Neu entwerfen",
      "notes": "Live: RE-2026-00003 letter with letterhead, € fixed, one due date. Failed AI runs now show 'KI-Kontingent erschöpft (402)'.",
      "description": "The Dunning agent produces its PDF after approval as a DIN 5008 business letter, with clear error codes and a 'Neu entwerfen' (redraft) option."
    },
    {
      "id": "t14",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-22",
      "end": "2026-10-23",
      "owner": "Claude Code",
      "title": "Generic agent runtime: any agent runs, schedules from definition.yaml, approval hooks",
      "notes": "Migration 0037. Finance settings block, demo seed, tasks created once per key directly in Approvals.",
      "description": "A generic runtime so any agent can run, with schedules read from definition.yaml and approval hooks. Removes the need for per-agent plumbing."
    },
    {
      "id": "t15",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-22",
      "end": "2026-10-22",
      "owner": "Nikhil",
      "title": "Switch coding from Cursor (Grok) to Claude Code",
      "notes": "Cursor used ~1B Grok tokens (≈313K per request, CI polling). Rules now: new chat per task, short outputs, no CI polling.",
      "description": "Coding work moved from Cursor (Grok) to Claude Code after very high token use, with new working rules to keep AI spend under control."
    },
    {
      "id": "t16",
      "status": "progress",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-23",
      "end": "2026-10-28",
      "owner": "Claude Code",
      "title": "Back office agents (7)",
      "notes": "Part 1 live-tested 26 Oct: Disposition (plan → Dispatch), Appointment (3 slots, booked 12:20 correct), ETA (+51 min delay found). Part 2 next: Purchasing, Inventory, Research, System Bridge.",
      "description": "Building and live-testing the 7 back office agents. Part 1 (Disposition, Appointment, ETA) is tested; Part 2 covers Purchasing, Inventory, Research and System Bridge."
    },
    {
      "id": "t17",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-23",
      "end": "2026-10-26",
      "owner": "Claude Code",
      "title": "Finance & admin agents (7)",
      "notes": "All 7 built and Beta/Live. Live-tested OK: Dunning (DIN 5008 PDF), Billing (RE-2026-00044), Deadline Guardian, Wage, Tax (draft + ELSTER rounding). Contract and Bureaucracy wait for a working AI provider.",
      "description": "All 7 finance & admin agents are built and in Beta or Live, most of them live-tested. Contract and Bureaucracy still need a working AI provider before they can be tested."
    },
    {
      "id": "t18",
      "status": "risk",
      "milestone": false,
      "priority": "High",
      "ws": "BrightForge agents",
      "start": "2026-10-26",
      "end": "2026-10-28",
      "owner": "Nikhil",
      "title": "Decide AI provider: xAI credits or Gemini on Vertex (GCP credits, EU)",
      "notes": "Blocks live tests of Contract, Bureaucracy and new Dunning letters. Weekly xAI reset 26 Oct ~18:00 IST — test after that.",
      "description": "Choose the AI provider going forward: xAI credits, or Gemini on Vertex using GCP credits in the EU. This decision blocks live tests of Contract, Bureaucracy and new Dunning letters."
    },
    {
      "id": "t19",
      "status": "progress",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-26",
      "end": "2026-10-27",
      "owner": "Claude Code",
      "title": "Fix: Disposition text 1 h off after DST change + wording",
      "notes": "Plan text 13:25, booking correctly 14:25. Also job count, 'Auftrag/Aufträge', 15-min slots, 'Guten Tag' salutation.",
      "description": "The Disposition plan text is one hour off since the daylight-saving change while bookings are correct. The fix also cleans up wording, job counts and slot sizes."
    },
    {
      "id": "t20",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-28",
      "end": "2026-10-30",
      "owner": "Claude Code",
      "title": "Sales agents (7)",
      "notes": "Lead, Offer, Marketing, Funding, Customer Service, Training, Cross-Use Case Scout. Built one area at a time (token budget).",
      "description": "Build the 7 sales agents, from Lead to Cross-Use Case Scout, one area at a time to stay within the token budget."
    },
    {
      "id": "t21",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-10-30",
      "end": "2026-11-02",
      "owner": "Claude Code",
      "title": "Field service agents (7)",
      "notes": "Assembly, Measurement, Documentary, Diagnostic, Performance, Quality, On-site research.",
      "description": "Build the 7 field service agents that support work on site, from Assembly and Measurement to Quality and On-site research."
    },
    {
      "id": "t22",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-11-02",
      "end": "2026-11-04",
      "owner": "Claude Code",
      "title": "Security agents (7)",
      "notes": "CyberGuard, Backup, Anomaly, SOC, SIEM, Compliance, Threat Briefing.",
      "description": "Build the 7 security agents, including CyberGuard, Backup, SOC, SIEM and Compliance."
    },
    {
      "id": "t23",
      "status": "progress",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-11-04",
      "end": "2026-11-05",
      "owner": "Cursor",
      "title": "Move the 4 old agents onto the runtime (one Dunning)",
      "notes": "",
      "description": "Migrate the 4 older agents, one of them Dunning, onto the shared runtime so every agent runs the same way."
    },
    {
      "id": "t24",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-11-05",
      "end": "2026-11-07",
      "owner": "Cursor",
      "title": "Forge for real: describe → recipe → approval → live",
      "notes": "Forge builds recipes from existing tools only, never code.",
      "description": "Make Forge real: a user describes a need, Forge builds a recipe, it passes approval and then runs live. Recipes are composed only from existing tools."
    },
    {
      "id": "t25",
      "status": "todo",
      "milestone": true,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-11-05",
      "end": "2026-11-05",
      "owner": "Cursor",
      "title": "All 35 agents live on staging",
      "notes": "Moved from 28 Oct: areas are built one by one instead of 5 in parallel (Cursor's Grok quota ran out). 10 of 35 live-tested on 26 Oct.",
      "description": "Milestone: every one of the 35 agents is live on staging, completing the BrightForge catalog before pilots rely on it."
    },
    {
      "id": "t26",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "BrightForge agents",
      "start": "2026-11-16",
      "end": "2026-11-20",
      "owner": "Cursor",
      "title": "Grok app 'Agents bot' to ask and control agents",
      "notes": "Uses the existing ops MCP server.",
      "description": "A Grok app called 'Agents bot' for asking about and controlling agents in conversation, built on the existing ops MCP server."
    },
    {
      "id": "t27",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "E-mail & leads",
      "start": "2026-10-27",
      "end": "2026-10-28",
      "owner": "Nikhil",
      "title": "Create demo Gmail + app password",
      "notes": "Still open. 2-Step Verification on, then myaccount.google.com/apppasswords.",
      "description": "Set up a demo Gmail account with an app password so the e-mail features can be connected and demonstrated."
    },
    {
      "id": "t28",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "E-mail & leads",
      "start": "2026-10-29",
      "end": "2026-10-31",
      "owner": "Cursor",
      "title": "E-mail module: per-user IMAP/SMTP mailboxes",
      "notes": "Private per user, password encrypted, Test connection button.",
      "description": "An e-mail module where each user connects their own private IMAP/SMTP mailbox, with an encrypted password and a Test connection button."
    },
    {
      "id": "t29",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "E-mail & leads",
      "start": "2026-11-02",
      "end": "2026-11-06",
      "owner": "Nikhil + Cursor",
      "title": "Microsoft 365 mailboxes via OAuth (Entra app)",
      "notes": "Needed for German customers on Outlook; support@ as shared mailbox.",
      "description": "Connect Microsoft 365 mailboxes through OAuth with an Entra app, which German customers on Outlook need."
    },
    {
      "id": "t30",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "E-mail & leads",
      "start": "2026-11-02",
      "end": "2026-11-10",
      "owner": "Cursor",
      "title": "Lead intake: website form + e-mail → CRM leads",
      "notes": "",
      "description": "Turn website form submissions and incoming e-mails directly into CRM leads, feeding the start of the core job flow."
    },
    {
      "id": "t31",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Mobile apps",
      "start": "2026-10-29",
      "end": "2026-11-07",
      "owner": "Cursor",
      "title": "Android app (Capacitor) → Play Store internal test",
      "notes": "",
      "description": "Package the app for Android with Capacitor and publish it to a Play Store internal test."
    },
    {
      "id": "t32",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Mobile apps",
      "start": "2026-10-29",
      "end": "2026-11-05",
      "owner": "Cursor + Nikhil",
      "title": "iOS app via macOS build agent → submit to App Store",
      "notes": "Apple review can take 1–2 weeks: submit by 5 Nov. BrightSide Apple Developer account.",
      "description": "Build the iOS app with a macOS build agent and submit it to the App Store. Submitting early leaves room for Apple's review time."
    },
    {
      "id": "t33",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Mobile apps",
      "start": "2026-11-06",
      "end": "2026-11-15",
      "owner": "Nikhil",
      "title": "Store approvals + public release",
      "notes": "",
      "description": "Get both app store approvals and release the mobile apps publicly."
    },
    {
      "id": "t34",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Production",
      "start": "2026-10-26",
      "end": "2026-10-26",
      "owner": "Claude Code",
      "title": "VM disk full → auto prune, log rotation, disk check",
      "notes": "Deploy failed 26 Oct (96 GB full, 63 GB old images). Pruned by hand to 29 %. Fix in bot/ops-and-redraft (also Neu entwerfen + Tax ELSTER rounding).",
      "description": "A full VM disk caused a failed deploy. Automatic pruning, log rotation and a disk check stop it from happening again."
    },
    {
      "id": "t35",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Production",
      "start": "2026-11-02",
      "end": "2026-11-06",
      "owner": "Nikhil + Cursor",
      "title": "Own company domain for the apps (no sslip.io)",
      "notes": "Update the Microsoft redirect URI when it changes.",
      "description": "Serve the apps from the company's own domain instead of sslip.io."
    },
    {
      "id": "t36",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Production",
      "start": "2026-11-06",
      "end": "2026-11-14",
      "owner": "Cursor",
      "title": "Production setup: separate prod, backups, monitoring",
      "notes": "",
      "description": "Set up a separate production environment with backups and monitoring, ready for real customers."
    },
    {
      "id": "t37",
      "status": "todo",
      "milestone": true,
      "priority": "Medium",
      "ws": "Production",
      "start": "2026-11-15",
      "end": "2026-11-15",
      "owner": "Team",
      "title": "Go-live: mobile apps + production",
      "notes": "",
      "description": "Milestone: the mobile apps and the production environment go live."
    },
    {
      "id": "t38",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Production",
      "start": "2026-12-01",
      "end": "2026-12-31",
      "owner": "Nikhil",
      "title": "GCP target architecture: Dev/UAT/Prod, Cloud SQL, Memorystore",
      "notes": "After credits are confirmed.",
      "description": "The target Google Cloud architecture with separate Dev, UAT and Prod environments on Cloud SQL and Memorystore, to start once credits are confirmed."
    },
    {
      "id": "t39",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Security",
      "start": "2026-10-21",
      "end": "2026-10-23",
      "owner": "Nikhil",
      "title": "Rotate keys that appeared in chat (Cursor key, GitHub token, ops passwords)",
      "notes": "Must be done before pilots.",
      "description": "Replace every credential that appeared in chat (the Cursor key, GitHub token and ops passwords) so exposed secrets can no longer be used. Required before pilots."
    },
    {
      "id": "t40",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Security",
      "start": "2026-11-03",
      "end": "2026-11-04",
      "owner": "Nikhil",
      "title": "DMARC/SPF for thebrights.ai and thebrights.in",
      "notes": "",
      "description": "Set up DMARC and SPF for thebrights.ai and thebrights.in so mail sent from these domains is authenticated."
    },
    {
      "id": "t41",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Security",
      "start": "2026-11-16",
      "end": "2026-11-27",
      "owner": "Nikhil",
      "title": "Customer data with AI: xAI DPA / zero retention or Gemini EU",
      "notes": "xAI keeps API traffic 30 days — not OK for real German customer data without an agreement.",
      "description": "Put a proper basis in place for processing customer data with AI: an xAI DPA with zero retention, or Gemini in the EU. Required before real German customer data goes through the agents."
    },
    {
      "id": "t42",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Security",
      "start": "2026-11-23",
      "end": "2026-11-27",
      "owner": "Cursor",
      "title": "Security review: tenant isolation, audit log, access rights",
      "notes": "CyberGuard score is 68 today.",
      "description": "Review tenant isolation, the audit log and access rights before real customers rely on the platform."
    },
    {
      "id": "t43",
      "status": "done",
      "milestone": false,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-10-19",
      "end": "2026-10-20",
      "owner": "Nikhil",
      "title": "Product overview deck, GCP credits deck, cost sheet",
      "notes": "",
      "description": "The product overview deck, the GCP credits deck and the cost sheet used for pilots and funding conversations."
    },
    {
      "id": "t44",
      "status": "progress",
      "milestone": false,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-10-22",
      "end": "2026-11-10",
      "owner": "Nikhil",
      "title": "Google Cloud credits application + meeting",
      "notes": "Ask: $100,000 over 24 months.",
      "description": "Apply for Google Cloud credits and hold the meeting with Google. The credits also unlock the planned GCP architecture."
    },
    {
      "id": "t45",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-10-27",
      "end": "2026-10-31",
      "owner": "Sir + Nikhil",
      "title": "Pick the first 5–6 pilot customers",
      "notes": "",
      "description": "Select the first 5–6 pilot customers who will use the platform."
    },
    {
      "id": "t46",
      "status": "todo",
      "milestone": true,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-10-31",
      "end": "2026-10-31",
      "owner": "Team",
      "title": "Ready for pilots",
      "notes": "Core flow, agents and e-mail work on staging.",
      "description": "Milestone: the platform is ready for pilot customers."
    },
    {
      "id": "t47",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-11-12",
      "end": "2026-11-18",
      "owner": "Nikhil",
      "title": "Renew Cursor plan (ends 19 Nov)",
      "notes": "",
      "description": "Renew the Cursor plan before it ends on 19 Nov so the tool stays available."
    },
    {
      "id": "t48",
      "status": "todo",
      "milestone": false,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-11-16",
      "end": "2026-11-27",
      "owner": "Team",
      "title": "Onboard pilots: data import, training, support",
      "notes": "",
      "description": "Bring the pilot customers on board: import their data, train their teams and support them."
    },
    {
      "id": "t49",
      "status": "todo",
      "milestone": true,
      "priority": "Medium",
      "ws": "Pilots & business",
      "start": "2026-11-30",
      "end": "2026-11-30",
      "owner": "Team",
      "title": "Everything complete: pilots live, BrightForge on",
      "notes": "",
      "description": "Milestone: the end goal of this plan, with pilots live and BrightForge switched on."
    }
  ],
  "flows": [
    {
      "id": "f1",
      "title": "Road to 30 November",
      "sub": "The milestones every task on this page feeds into.",
      "steps": [
        {
          "id": "s1",
          "kind": "node",
          "node": {
            "id": "n1",
            "t": "Agent runtime + Grok live",
            "s": "Done",
            "v": "done",
            "d": "21 Oct"
          },
          "lanes": []
        },
        {
          "id": "s2",
          "kind": "node",
          "node": {
            "id": "n2",
            "t": "Ready for pilots",
            "s": "Core flow, agents and e-mail on staging",
            "v": "neutral",
            "d": "31 Oct"
          },
          "lanes": []
        },
        {
          "id": "s3",
          "kind": "node",
          "node": {
            "id": "n3",
            "t": "All 35 agents on staging",
            "s": "Moved from 28 Oct",
            "v": "neutral",
            "d": "5 Nov"
          },
          "lanes": []
        },
        {
          "id": "s4",
          "kind": "node",
          "node": {
            "id": "n4",
            "t": "Go-live",
            "s": "Mobile apps + production",
            "v": "neutral",
            "d": "15 Nov"
          },
          "lanes": []
        },
        {
          "id": "s5",
          "kind": "node",
          "node": {
            "id": "n5",
            "t": "Everything complete",
            "s": "Pilots live, BrightForge on",
            "v": "hl",
            "d": "30 Nov"
          },
          "lanes": []
        }
      ]
    },
    {
      "id": "f2",
      "title": "One job, from enquiry to invoice",
      "sub": "The core product flow. Each step is tested live after every deployment.",
      "steps": [
        {
          "id": "s6",
          "kind": "node",
          "node": {
            "id": "n6",
            "t": "Enquiry",
            "s": "Website, e-mail, phone",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s7",
          "kind": "node",
          "node": {
            "id": "n7",
            "t": "Job planned",
            "s": "Office · Dispatch",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s8",
          "kind": "node",
          "node": {
            "id": "n8",
            "t": "On site",
            "s": "Field app · photos",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s9",
          "kind": "node",
          "node": {
            "id": "n9",
            "t": "Quote",
            "s": "Field app · VAT, §35a",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s10",
          "kind": "node",
          "node": {
            "id": "n10",
            "t": "Approval",
            "s": "Office · Work Graph",
            "v": "hl",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s11",
          "kind": "node",
          "node": {
            "id": "n11",
            "t": "Signature",
            "s": "Customer on phone",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s12",
          "kind": "node",
          "node": {
            "id": "n12",
            "t": "PDF",
            "s": "Automatic",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s13",
          "kind": "node",
          "node": {
            "id": "n13",
            "t": "Invoice",
            "s": "ERP · XRechnung",
            "v": "done",
            "d": ""
          },
          "lanes": []
        }
      ]
    },
    {
      "id": "f3",
      "title": "How a BrightForge agent works",
      "sub": "Every agent does the job its website description promises, inside the platform.",
      "steps": [
        {
          "id": "s14",
          "kind": "node",
          "node": {
            "id": "n14",
            "t": "Trigger",
            "s": "Event, schedule or Run now",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s15",
          "kind": "node",
          "node": {
            "id": "n15",
            "t": "Grok 4.7 thinks",
            "s": "Reads the job, plans steps",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s16",
          "kind": "node",
          "node": {
            "id": "n16",
            "t": "Tools",
            "s": "Only our own API, tenant data",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s17",
          "kind": "node",
          "node": {
            "id": "n17",
            "t": "Auto mode?",
            "s": "Owner decides per agent",
            "v": "hl",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s18",
          "kind": "branch",
          "node": null,
          "lanes": [
            {
              "id": "l1",
              "tag": "OFF",
              "nodes": [
                {
                  "id": "n18",
                  "t": "Work Graph approval",
                  "s": "",
                  "v": "neutral",
                  "d": ""
                },
                {
                  "id": "n19",
                  "t": "Person approves",
                  "s": "Action runs",
                  "v": "neutral",
                  "d": ""
                }
              ]
            },
            {
              "id": "l2",
              "tag": "ON",
              "nodes": [
                {
                  "id": "n20",
                  "t": "Acts directly",
                  "s": "",
                  "v": "neutral",
                  "d": ""
                }
              ]
            }
          ]
        },
        {
          "id": "s19",
          "kind": "node",
          "node": {
            "id": "n21",
            "t": "Logged",
            "s": "Audit, budget, kill switch",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        }
      ]
    },
    {
      "id": "f4",
      "title": "How a change reaches customers",
      "sub": "Nothing goes live untested; a failed live test rolls back on its own.",
      "steps": [
        {
          "id": "s20",
          "kind": "node",
          "node": {
            "id": "n22",
            "t": "Request",
            "s": "Cursor or Grok Dev bot",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s21",
          "kind": "node",
          "node": {
            "id": "n23",
            "t": "Local gate",
            "s": "Tests on laptop",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s22",
          "kind": "node",
          "node": {
            "id": "n24",
            "t": "CI",
            "s": "Full tests + images",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s23",
          "kind": "node",
          "node": {
            "id": "n25",
            "t": "Deploy",
            "s": "Google Cloud, Frankfurt",
            "v": "neutral",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s24",
          "kind": "node",
          "node": {
            "id": "n26",
            "t": "Live smoke",
            "s": "Robot runs a full job",
            "v": "hl",
            "d": ""
          },
          "lanes": []
        },
        {
          "id": "s25",
          "kind": "branch",
          "node": null,
          "lanes": [
            {
              "id": "l3",
              "tag": "PASS",
              "nodes": [
                {
                  "id": "n27",
                  "t": "New version stays live",
                  "s": "",
                  "v": "done",
                  "d": ""
                }
              ]
            },
            {
              "id": "l4",
              "tag": "FAIL",
              "nodes": [
                {
                  "id": "n28",
                  "t": "Automatic rollback",
                  "s": "+ logs",
                  "v": "bad",
                  "d": ""
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
