// Edge Function: oauth-callback
// Recibe el "code" que Google devuelve tras el consentimiento OAuth, lo cambia
// por access_token + refresh_token usando el Client Secret (secreto de Supabase)
// y guarda los tokens en la tabla `tokens`. Solo la puede llamar un usuario
// con sesión iniciada en el panel.
//
// Secretos necesarios en Supabase (Edge Functions → Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// Ajuste al desplegar: "Verify JWT" DESACTIVADO (la función comprueba el
// usuario por sí misma, así funciona con las claves nuevas de Supabase).

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return json({ error: "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en los secretos de Supabase" }, 500);
  }

  // 1. Solo usuarios del panel con sesión iniciada.
  const cabeceraAuth = req.headers.get("Authorization") ?? "";
  const jwt = cabeceraAuth.replace(/^Bearer\s+/i, "");
  const clienteAnon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: errUsuario } = await clienteAnon.auth.getUser(jwt);
  if (errUsuario || !user) return json({ error: "No autorizado" }, 401);

  // 2. Datos que envía conectar.html.
  const { code, redirect_uri } = await req.json().catch(() => ({}));
  if (!code || !redirect_uri) return json({ error: "Faltan code o redirect_uri" }, 400);

  // 3. Cambiar el código por tokens.
  const respToken = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await respToken.json();
  if (!respToken.ok) {
    return json({ error: "Google rechazó el código: " + (tokens.error_description || tokens.error) }, 400);
  }
  if (!tokens.refresh_token) {
    return json({
      error: "Google no devolvió refresh_token. Retira el acceso de la app en " +
        "myaccount.google.com/permissions y vuelve a pulsar Conectar.",
    }, 400);
  }

  // 4. Identificar el canal de la cuenta que ha dado permiso.
  const respCanal = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  const datosCanal = await respCanal.json();
  const canal = datosCanal.items?.[0];
  if (!respCanal.ok || !canal) {
    return json({ error: "No se encontró un canal de YouTube en esa cuenta de Google" }, 400);
  }

  // 5. Guardar cuenta y tokens (service role: salta RLS).
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: cuenta, error: errCuenta } = await admin
    .from("cuentas")
    .upsert(
      { red: "youtube", nombre_cuenta: canal.snippet.title, id_externo: canal.id, activa: true, error_sync: null },
      { onConflict: "red" },
    )
    .select("id")
    .single();
  if (errCuenta) return json({ error: "No se pudo guardar la cuenta: " + errCuenta.message }, 500);

  const { error: errTokens } = await admin.from("tokens").upsert({
    cuenta_id: cuenta.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expira: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    actualizado: new Date().toISOString(),
  });
  if (errTokens) return json({ error: "No se pudieron guardar los tokens: " + errTokens.message }, 500);

  return json({ ok: true, canal: canal.snippet.title });
});
