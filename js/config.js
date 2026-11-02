/* Public client configuration.
 * SUPABASE_URL + SUPABASE_ANON_KEY point the board at the shared Supabase database.
 * The publishable/anon key is designed to be public: every write is checked by Postgres
 * row-level security (only members with the editor/owner role can change data).
 * NEVER put the service_role / secret key here.
 * Leave both empty to run the board on this browser's localStorage only. */
window.SS_CONFIG = {
  SUPABASE_URL: "https://ajynxepfbzkhoqnncdyy.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_gAKFrxet5izrN6977MbMTw_yDTLla8V",
};
