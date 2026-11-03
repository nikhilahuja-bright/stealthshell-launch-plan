/* Starter skeleton for the StealthShell board.
 * The real plan lives in the members-only Supabase database (and, for "Reset to original data",
 * in the owner-only public.board_seed table) — it is deliberately NOT shipped in this public file.
 * This skeleton is only used in local-only mode (js/config.js without a Supabase URL/key), where the
 * board starts empty.
 * Shape: { meta, wsOrder, tasks[], flows[] } — see js/storage.js. */
window.SS_SEED = {
  meta: {
    title: "StealthShell launch plan",
    subtitle: "",
    target: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  },
  wsOrder: [],
  tasks: [],
  flows: []
};
