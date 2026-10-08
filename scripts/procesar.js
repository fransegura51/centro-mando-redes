// Fase 2 del estudio de contenido: edita los vídeos de Flow con ffmpeg.
// Uso: doble clic en procesar-videos.bat (o: node scripts/procesar.js).
// 0 tokens de Claude: es un script determinista.
//
// 1. Busca G-###.mp4 en videos/entrada.
// 2. ffmpeg: 1080x1920 (9:16), volumen normalizado, MP4 compatible con redes.
// 3. Guarda el editado en videos/editados y mueve el original a videos/originales.
// 4. Si existe .env con SUPABASE_SERVICE_ROLE_KEY, sube el vídeo al bucket
//    "videos-editados" y pone el guion en "pendiente_revision".
//    Sin .env, solo edita (y avisa). La clave nunca se imprime.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ENTRADA = path.join(RAIZ, 'videos', 'entrada');
const EDITADOS = path.join(RAIZ, 'videos', 'editados');
const ORIGINALES = path.join(RAIZ, 'videos', 'originales');
const BUCKET = 'videos-editados';

function leerEnv() {
  const f = path.join(RAIZ, '.env');
  const env = {};
  if (!fs.existsSync(f)) return env;
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function urlSupabase(env) {
  if (env.SUPABASE_URL) return env.SUPABASE_URL.replace(/\/$/, '');
  const cfg = fs.readFileSync(path.join(RAIZ, 'config.js'), 'utf8');
  const m = cfg.match(/SUPABASE_URL:\s*'([^']+)'/);
  return m ? m[1].replace(/\/$/, '') : null;
}

function hayFfmpeg() {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

function editar(entrada, salida) {
  const filtroV = 'scale=1080:1920:force_original_aspect_ratio=decrease,'
    + 'pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1';
  const r = spawnSync('ffmpeg', [
    '-y', '-i', entrada,
    '-vf', filtroV,
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
    salida,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) {
    console.log('  ffmpeg falló:\n' + String(r.stderr).split('\n').slice(-6).join('\n'));
    return false;
  }
  return true;
}

// Por defecto el vídeo NO se sube a Supabase (el tráfico de salida del plan gratuito se agotó):
// se queda en videos\editados y solo se marca el guion como pendiente de revisión.
// Para subirlo igualmente: poner SUBIR_VIDEOS=1 en .env.
async function subir(env, base, codigo, ruta) {
  const clave = env.SUPABASE_SERVICE_ROLE_KEY;
  const cab = { apikey: clave, Authorization: 'Bearer ' + clave };
  if (env.SUBIR_VIDEOS === '1') {
    const cuerpo = fs.readFileSync(ruta);
    const r1 = await fetch(`${base}/storage/v1/object/${BUCKET}/${codigo}.mp4`, {
      method: 'POST',
      headers: { ...cab, 'Content-Type': 'video/mp4', 'x-upsert': 'true' },
      body: cuerpo,
    });
    if (!r1.ok) throw new Error('subida: ' + r1.status + ' ' + (await r1.text()).slice(0, 200));
  }
  const r2 = await fetch(`${base}/rest/v1/guiones?codigo=eq.${codigo}`, {
    method: 'PATCH',
    headers: { ...cab, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ estado: 'pendiente_revision' }),
  });
  if (!r2.ok) throw new Error('estado: ' + r2.status + ' ' + (await r2.text()).slice(0, 200));
  const filas = await r2.json();
  if (!filas.length) throw new Error('no existe el guion ' + codigo + ' en la base de datos');
}

(async () => {
  for (const d of [ENTRADA, EDITADOS, ORIGINALES]) fs.mkdirSync(d, { recursive: true });

  if (!hayFfmpeg()) {
    console.log('No encuentro ffmpeg. Haz doble clic en instalar-ffmpeg.bat, cierra esta ventana y vuelve a intentarlo.');
    process.exit(1);
  }

  const archivos = fs.readdirSync(ENTRADA).filter((f) => /^G-\d{3}\.mp4$/i.test(f));
  if (!archivos.length) {
    console.log('No hay vídeos nuevos. Deja G-###.mp4 en videos\\entrada.');
    return;
  }

  const env = leerEnv();
  const puedeSubir = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  const base = puedeSubir ? urlSupabase(env) : null;
  if (!puedeSubir) console.log('Aviso: no hay .env con la clave de Supabase; se edita pero NO se sube.\n');

  for (const f of archivos) {
    const codigo = f.slice(0, 5).toUpperCase();
    const salida = path.join(EDITADOS, codigo + '.mp4');
    console.log(`${codigo}: editando…`);
    if (!editar(path.join(ENTRADA, f), salida)) continue;
    console.log(`${codigo}: editado en videos\\editados\\${codigo}.mp4`);
    if (puedeSubir) {
      try {
        await subir(env, base, codigo, salida);
        console.log(env.SUBIR_VIDEOS === '1'
          ? `${codigo}: subido y pendiente de revisión en el panel.`
          : `${codigo}: se queda en tu ordenador (videos\\editados) y queda pendiente de revisión en el panel.`);
      } catch (e) {
        console.log(`${codigo}: NO se pudo subir (${e.message}). El original se queda en entrada.`);
        continue;
      }
    }
    fs.renameSync(path.join(ENTRADA, f), path.join(ORIGINALES, f));
  }
  console.log('\nTerminado.');
})();
