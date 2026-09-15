// Edge Function: sync-youtube
// Renueva el access_token con el refresh_token, pide a YouTube los datos del
// canal, los últimos 50 vídeos y las métricas diarias de la última semana, y
// los guarda en `videos` y `metricas_diarias`.
//
// La pueden llamar:
//   - el cron diario (pg_cron + pg_net) con la cabecera x-cron-secret
//   - el botón "Sincronizar ahora" del panel, con la sesión del usuario
//
// Secretos necesarios en Supabase (Edge Functions → Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET
// Ajuste al desplegar: "Verify JWT" DESACTIVADO.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Fecha YYYY-MM-DD en hora de España, con desplazamiento de días.
function fechaEspaña(desplazamientoDias = 0): string {
  const d = new Date(Date.now() + desplazamientoDias * 86400000);
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

// "PT1H2M3S" -> segundos
function duracionSegundos(iso: string | undefined): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso ?? "");
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
}

const entero = (v: unknown): number | null => (v === undefined || v === null || v === "") ? null : Number(v);

async function googleGet(url: string, accessToken: string): Promise<any> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${cuerpo.error?.message ?? r.statusText} (${url.split("?")[0]})`);
  return cuerpo;
}

async function refrescarAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const cuerpo = await r.json();
  if (!r.ok) {
    throw new Error("No se pudo renovar el token de Google: " + (cuerpo.error_description || cuerpo.error) +
      ". Si persiste, vuelve a pulsar Conectar en Ajustes.");
  }
  return cuerpo;
}

// Convierte la respuesta de YouTube Analytics (columnHeaders + rows) en objetos.
function filasAnalytics(resp: any): Record<string, any>[] {
  const nombres: string[] = (resp.columnHeaders ?? []).map((c: any) => c.name);
  return (resp.rows ?? []).map((fila: any[]) => Object.fromEntries(fila.map((v, i) => [nombres[i], v])));
}

async function sincronizar(admin: SupabaseClient, cuentaId: string, accessToken: string) {
  const hoy = fechaEspaña(0);

  // --- Canal ---
  const canal = (await googleGet(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
    accessToken,
  )).items?.[0];
  if (!canal) throw new Error("La cuenta de Google ya no tiene canal de YouTube");
  const listaSubidas = canal.contentDetails?.relatedPlaylists?.uploads;

  await admin.from("cuentas")
    .update({ nombre_cuenta: canal.snippet.title, id_externo: canal.id })
    .eq("id", cuentaId);

  // Seguidores de hoy (foto del día).
  await admin.from("metricas_diarias").upsert(
    { cuenta_id: cuentaId, fecha: hoy, seguidores: entero(canal.statistics?.subscriberCount) },
    { onConflict: "cuenta_id,fecha" },
  );

  // --- Últimos 50 vídeos ---
  let videosGuardados = 0;
  if (listaSubidas) {
    const items = (await googleGet(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${listaSubidas}`,
      accessToken,
    )).items ?? [];
    const ids: string[] = items.map((i: any) => i.contentDetails.videoId);

    if (ids.length) {
      const detalles = (await googleGet(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`,
        accessToken,
      )).items ?? [];

      // Retención y compartidos por vídeo desde Analytics. Si falla, seguimos sin ellos.
      const porVideo: Record<string, any> = {};
      try {
        const analytics = await googleGet(
          "https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE" +
            `&startDate=2005-01-01&endDate=${hoy}&dimensions=video&maxResults=50&sort=-views` +
            "&metrics=views,likes,comments,shares,averageViewPercentage,estimatedMinutesWatched" +
            `&filters=video==${ids.join(",")}`,
          accessToken,
        );
        for (const f of filasAnalytics(analytics)) porVideo[f.video] = f;
      } catch (e) {
        console.warn("Analytics por vídeo no disponible:", (e as Error).message);
      }

      const filas = detalles.map((v: any) => {
        const a = porVideo[v.id] ?? {};
        const segundos = duracionSegundos(v.contentDetails?.duration);
        return {
          cuenta_id: cuentaId,
          id_externo: v.id,
          titulo: v.snippet?.title ?? null,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          miniatura: v.snippet?.thumbnails?.medium?.url ?? v.snippet?.thumbnails?.default?.url ?? null,
          publicado: v.snippet?.publishedAt ?? null,
          tipo: segundos > 0 && segundos <= 180 ? "short" : "video",
          visualizaciones: entero(v.statistics?.viewCount),
          likes: entero(v.statistics?.likeCount),
          comentarios: entero(v.statistics?.commentCount),
          compartidos: entero(a.shares),
          retencion_pct: entero(a.averageViewPercentage),
          extra: { duracion_s: segundos, minutos_vistos: entero(a.estimatedMinutesWatched) },
          actualizado: new Date().toISOString(),
        };
      });
      const { error } = await admin.from("videos").upsert(filas, { onConflict: "cuenta_id,id_externo" });
      if (error) throw new Error("No se pudieron guardar los vídeos: " + error.message);
      videosGuardados = filas.length;
    }
  }

  // --- Métricas diarias de los últimos 10 días (Analytics tarda 2-3 días en cerrar un día) ---
  const diario = await googleGet(
    "https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE" +
      `&startDate=${fechaEspaña(-10)}&endDate=${hoy}&dimensions=day` +
      "&metrics=views,likes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched",
    accessToken,
  );
  const filasDia = filasAnalytics(diario).map((f) => ({
    cuenta_id: cuentaId,
    fecha: f.day,
    visualizaciones: entero(f.views),
    likes: entero(f.likes),
    comentarios: entero(f.comments),
    compartidos: entero(f.shares),
    extra: {
      minutos_vistos: entero(f.estimatedMinutesWatched),
      suscriptores_ganados: entero(f.subscribersGained),
      suscriptores_perdidos: entero(f.subscribersLost),
    },
  }));
  if (filasDia.length) {
    const { error } = await admin.from("metricas_diarias").upsert(filasDia, { onConflict: "cuenta_id,fecha" });
    if (error) throw new Error("No se pudieron guardar las métricas diarias: " + error.message);
  }

  return { canal: canal.snippet.title, videos: videosGuardados, dias: filasDia.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!Deno.env.get("GOOGLE_CLIENT_ID") || !Deno.env.get("GOOGLE_CLIENT_SECRET")) {
    return json({ error: "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en los secretos de Supabase" }, 500);
  }

  // Autorización: o viene del cron con el secreto, o de un usuario con sesión.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const esCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!esCron) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await createClient(SUPABASE_URL, ANON_KEY).auth.getUser(jwt);
    if (!user) return json({ error: "No autorizado" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: cuenta } = await admin.from("cuentas").select("id, activa").eq("red", "youtube").maybeSingle();
  if (!cuenta) return json({ error: "YouTube no está conectado. Pulsa Conectar en Ajustes." }, 400);
  const { data: tokens } = await admin.from("tokens").select("refresh_token").eq("cuenta_id", cuenta.id).maybeSingle();
  if (!tokens?.refresh_token) return json({ error: "No hay refresh_token guardado. Vuelve a pulsar Conectar." }, 400);

  try {
    const nuevo = await refrescarAccessToken(tokens.refresh_token);
    await admin.from("tokens").update({
      access_token: nuevo.access_token,
      expira: new Date(Date.now() + nuevo.expires_in * 1000).toISOString(),
      actualizado: new Date().toISOString(),
    }).eq("cuenta_id", cuenta.id);

    const resultado = await sincronizar(admin, cuenta.id, nuevo.access_token);

    await admin.from("cuentas")
      .update({ ultima_sync: new Date().toISOString(), error_sync: null })
      .eq("id", cuenta.id);
    return json({ ok: true, ...resultado });
  } catch (e) {
    const mensaje = String((e as Error).message ?? e).slice(0, 500);
    console.error("sync-youtube:", mensaje);
    await admin.from("cuentas").update({ error_sync: mensaje }).eq("id", cuenta.id);
    return json({ error: mensaje }, 500);
  }
});
