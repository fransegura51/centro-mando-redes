// Edge Function: publicar
// Publica los vídeos aprobados cuya hora ya llegó, en YouTube (Shorts),
// Instagram (Reels) y Facebook (Reels). TikTok es manual por diseño.
//
// La llama el cron (pg_cron + pg_net) cada 5 minutos con la cabecera
// x-cron-secret, o un usuario con sesión.
//
// Reglas de seguridad:
//   - Solo publica guiones en estado `aprobado_publicar` (aprobación humana).
//   - Marca el vídeo como contenido de IA donde la plataforma lo permite
//     (YouTube: containsSyntheticMedia) y lo declara en el texto en Meta.
//
// Secretos (Edge Functions → Secrets):
//   YouTube:   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET (ya existen)
//   Instagram: META_IG_USER_ID, META_ACCESS_TOKEN
//   Facebook:  META_PAGE_ID, META_PAGE_TOKEN
// Si falta alguno, esa publicación queda en `error` con un mensaje claro.
// Ajuste al desplegar: "Verify JWT" DESACTIVADO.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "videos-editados";
const GRAPH = "https://graph.facebook.com/v21.0";
const AVISO_IA = "Vídeo creado con inteligencia artificial.";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Guion = { codigo: string; titulo: string; texto_publicacion: string | null; hashtags: string | null; estado: string };
type Publicacion = {
  id: string; guion_id: string; plataforma: string; ruta_video: string | null;
  guiones: Guion;
};

function textoPublicacion(g: Guion, conAvisoIA: boolean): string {
  const partes = [g.texto_publicacion?.trim(), g.hashtags?.trim()].filter(Boolean) as string[];
  if (conAvisoIA) partes.push(AVISO_IA);
  return partes.join("\n\n");
}

// ---------- YouTube ----------

async function accessTokenYoutube(admin: SupabaseClient): Promise<string> {
  const { data: cuenta } = await admin.from("cuentas").select("id").eq("red", "youtube").maybeSingle();
  if (!cuenta) throw new Error("YouTube no está conectado. Pulsa Conectar en Ajustes.");
  const { data: tokens } = await admin.from("tokens").select("refresh_token").eq("cuenta_id", cuenta.id).maybeSingle();
  if (!tokens?.refresh_token) throw new Error("No hay refresh_token de YouTube. Vuelve a pulsar Conectar.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const cuerpo = await r.json();
  if (!r.ok) throw new Error("No se pudo renovar el token de Google: " + (cuerpo.error_description || cuerpo.error));
  await admin.from("tokens").update({
    access_token: cuerpo.access_token,
    expira: new Date(Date.now() + cuerpo.expires_in * 1000).toISOString(),
    actualizado: new Date().toISOString(),
  }).eq("cuenta_id", cuenta.id);
  return cuerpo.access_token;
}

async function publicarYoutube(admin: SupabaseClient, g: Guion, video: Uint8Array): Promise<{ id: string; url: string }> {
  const access = await accessTokenYoutube(admin);
  const titulo = (g.titulo + " #Shorts").slice(0, 100);
  const meta = {
    snippet: { title: titulo, description: textoPublicacion(g, false), categoryId: "23" },
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
  };
  const ini = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(video.byteLength),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(meta),
    },
  );
  if (!ini.ok) {
    const e = await ini.json().catch(() => ({}));
    throw new Error("YouTube (inicio): " + (e.error?.message ?? ini.statusText) +
      ". Si habla de permisos, vuelve a pulsar Conectar en Ajustes para dar permiso de subida.");
  }
  const destino = ini.headers.get("location");
  if (!destino) throw new Error("YouTube no devolvió la URL de subida.");
  const subida = await fetch(destino, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(video.byteLength) },
    body: video,
  });
  const res = await subida.json().catch(() => ({}));
  if (!subida.ok || !res.id) throw new Error("YouTube (subida): " + (res.error?.message ?? subida.statusText));
  return { id: res.id, url: `https://www.youtube.com/shorts/${res.id}` };
}

// ---------- Meta (Instagram y Facebook) ----------

async function graph(url: string, init: RequestInit): Promise<any> {
  const r = await fetch(url, init);
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok || cuerpo.error) throw new Error("Meta: " + (cuerpo.error?.message ?? r.statusText));
  return cuerpo;
}

function formulario(campos: Record<string, string>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos),
  };
}

async function publicarInstagram(g: Guion, urlVideo: string): Promise<{ id: string; url: string }> {
  const ig = Deno.env.get("META_IG_USER_ID");
  const token = Deno.env.get("META_ACCESS_TOKEN");
  if (!ig || !token) throw new Error("Falta configurar Instagram (secretos META_IG_USER_ID y META_ACCESS_TOKEN).");
  const cont = await graph(`${GRAPH}/${ig}/media`, formulario({
    media_type: "REELS", video_url: urlVideo, caption: textoPublicacion(g, true),
    share_to_feed: "true", access_token: token,
  }));
  for (let i = 0; i < 24; i++) { // hasta 2 minutos
    await dormir(5000);
    const est = await graph(`${GRAPH}/${cont.id}?fields=status_code&access_token=${token}`, { method: "GET" });
    if (est.status_code === "FINISHED") break;
    if (est.status_code === "ERROR" || est.status_code === "EXPIRED") {
      throw new Error("Instagram no pudo procesar el vídeo (" + est.status_code + ").");
    }
    if (i === 23) throw new Error("Instagram tardó demasiado en procesar el vídeo; se reintenta en la siguiente pasada.");
  }
  const pub = await graph(`${GRAPH}/${ig}/media_publish`, formulario({ creation_id: cont.id, access_token: token }));
  let url = "https://www.instagram.com/";
  try {
    const m = await graph(`${GRAPH}/${pub.id}?fields=permalink&access_token=${token}`, { method: "GET" });
    if (m.permalink) url = m.permalink;
  } catch { /* el enlace es opcional */ }
  return { id: pub.id, url };
}

async function publicarFacebook(g: Guion, urlVideo: string): Promise<{ id: string; url: string }> {
  const pagina = Deno.env.get("META_PAGE_ID");
  const token = Deno.env.get("META_PAGE_TOKEN");
  if (!pagina || !token) throw new Error("Falta configurar Facebook (secretos META_PAGE_ID y META_PAGE_TOKEN).");
  const ini = await graph(`${GRAPH}/${pagina}/video_reels`, formulario({ upload_phase: "start", access_token: token }));
  const sube = await fetch(ini.upload_url, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, file_url: urlVideo },
  });
  const resSube = await sube.json().catch(() => ({}));
  if (!sube.ok || resSube.success === false) throw new Error("Facebook (subida): " + JSON.stringify(resSube).slice(0, 200));
  await graph(`${GRAPH}/${pagina}/video_reels`, formulario({
    upload_phase: "finish", video_id: ini.video_id, video_state: "PUBLISHED",
    description: textoPublicacion(g, true), access_token: token,
  }));
  return { id: ini.video_id, url: `https://www.facebook.com/reel/${ini.video_id}` };
}

// ---------- Bucle principal ----------

async function procesar(admin: SupabaseClient, p: Publicacion): Promise<string> {
  const ruta = p.ruta_video || `${p.guiones.codigo}.mp4`;
  let res: { id: string; url: string };
  if (p.plataforma === "youtube") {
    const { data: blob, error } = await admin.storage.from(BUCKET).download(ruta);
    if (error || !blob) throw new Error("No se pudo leer el vídeo del almacenamiento: " + (error?.message ?? ruta));
    res = await publicarYoutube(admin, p.guiones, new Uint8Array(await blob.arrayBuffer()));
  } else {
    const { data: firmada, error } = await admin.storage.from(BUCKET).createSignedUrl(ruta, 3600);
    if (error || !firmada) throw new Error("No se pudo firmar la URL del vídeo: " + (error?.message ?? ruta));
    res = p.plataforma === "instagram"
      ? await publicarInstagram(p.guiones, firmada.signedUrl)
      : await publicarFacebook(p.guiones, firmada.signedUrl);
  }
  await admin.from("publicaciones").update({
    estado: "publicado", id_externo: res.id, url_publicada: res.url,
    publicado_en: new Date().toISOString(), error_texto: null,
  }).eq("id", p.id);
  return res.url;
}

// Si ya no queda nada pendiente de un guion, pasa a `publicado`.
async function cerrarGuionSiTerminado(admin: SupabaseClient, guionId: string) {
  const { data } = await admin.from("publicaciones").select("estado").eq("guion_id", guionId);
  const abiertas = (data ?? []).filter((x) => ["pendiente", "publicando", "manual", "error"].includes(x.estado));
  if (!abiertas.length) await admin.from("guiones").update({ estado: "publicado" }).eq("id", guionId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Usa POST" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const cronSecret = Deno.env.get("CRON_SECRET");
  const esCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!esCron) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await createClient(SUPABASE_URL, ANON_KEY).auth.getUser(jwt);
    if (!user) return json({ error: "No autorizado" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: pendientes, error } = await admin
    .from("publicaciones")
    .select("id, guion_id, plataforma, ruta_video, guiones(codigo, titulo, texto_publicacion, hashtags, estado)")
    .eq("estado", "pendiente")
    .in("plataforma", ["youtube", "instagram", "facebook"])
    .lte("programado_para", new Date().toISOString())
    .order("programado_para")
    .limit(5);
  if (error) return json({ error: error.message }, 500);

  const resultados: unknown[] = [];
  for (const p of (pendientes ?? []) as unknown as Publicacion[]) {
    // Seguridad: nada se publica sin la aprobación del usuario.
    if (p.guiones.estado !== "aprobado_publicar") continue;
    // Reserva atómica: si otra ejecución la cogió antes, no devuelve fila.
    const { data: reservada } = await admin.from("publicaciones")
      .update({ estado: "publicando" }).eq("id", p.id).eq("estado", "pendiente").select("id");
    if (!reservada?.length) continue;
    try {
      const url = await procesar(admin, p);
      resultados.push({ id: p.id, plataforma: p.plataforma, ok: true, url });
    } catch (e) {
      const mensaje = String((e as Error).message ?? e).slice(0, 500);
      console.error("publicar:", p.plataforma, mensaje);
      await admin.from("publicaciones").update({ estado: "error", error_texto: mensaje }).eq("id", p.id);
      resultados.push({ id: p.id, plataforma: p.plataforma, ok: false, error: mensaje });
    }
    await cerrarGuionSiTerminado(admin, p.guion_id);
  }
  return json({ ok: true, procesadas: resultados.length, resultados });
});
