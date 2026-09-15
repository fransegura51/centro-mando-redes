// Configuración pública del panel.
// La anon key es pública por diseño: los datos los protege RLS en Supabase.
// Las claves secretas (service role, tokens OAuth) NUNCA van aquí.
window.CMR_CONFIG = {
  SUPABASE_URL: 'https://hahszmdfblcvljzanvoq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_hcqXBOAWBy7YI0Em0hdlXQ_Y4I-5Lit',
  // Client ID de OAuth de Google Cloud Console (público; el secret va en Supabase).
  GOOGLE_CLIENT_ID: '',
};
