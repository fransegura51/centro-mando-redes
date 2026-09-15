---
name: centro-mando-redes
description: Skill del proyecto "Centro de Mando Redes", panel unificado de estadísticas de las cuentas de YouTube, Instagram, Facebook y TikTok de Jennifer y Paco. Úsala SIEMPRE que el usuario mencione "centro de mando", "panel de redes", "estadísticas de redes sociales", "visitas de YouTube/Instagram/Facebook/TikTok", "seguidores", "vídeos que mejor funcionan", "conectar la API de YouTube/Meta/TikTok" o quiera ver, comparar o guardar datos de sus redes sociales, aunque no diga la palabra "dashboard". Define la arquitectura, la base de datos Supabase, cómo se conecta cada red, el orden de fases y las reglas de trabajo con pocos tokens.
---

# Centro de Mando Redes

Panel privado (uso propio, 2 usuarios) que muestra en un solo sitio las estadísticas de 4 cuentas: YouTube, Instagram, Facebook y TikTok. Guarda histórico para ver evolución.

## Reglas de trabajo (leer siempre)

- **Ahorro de tokens**: lee solo el archivo que vas a tocar. No explores el repo entero. No releas archivos ya leídos en la sesión. Antes de editar, `grep` la función concreta y lee solo ese rango de líneas.
- **Idioma**: toda la interfaz y los comentarios en español.
- **Diseño**: sencillo, funcional, visualmente claro. Sin adornos. Móvil primero (se consulta desde el teléfono).
- **Nunca inventes datos**: si una API no está conectada, la tarjeta muestra "Sin conectar", no ceros ni datos de ejemplo.
- **Nunca pongas claves en el código**: van en variables de entorno o en secretos de Supabase.
- Un cambio por sesión de trabajo. Termina, prueba, y para.

## Infraestructura (ya creada, no volver a crear)

- Supabase, organización **"redes sociales"** (plan Free) — NO usar la organización "Aalerfer seguimiento".
- Proyecto: **centro-mando-redes**
  - ref: `hahszmdfblcvljzanvoq`
  - URL: `https://hahszmdfblcvljzanvoq.supabase.co`
  - Región: eu-west-1 (Irlanda)
- Las claves (anon key, service role) se sacan del dashboard de Supabase → Project Settings → API Keys. Pedirlas al usuario la primera vez y guardarlas en `.env`; nunca en git.

## Pila técnica

- **Frontend**: una sola página `index.html` con HTML + CSS + JS vanilla (misma filosofía que las otras apps del usuario). Sin frameworks ni build. Gráficas con Chart.js desde CDN. Lee de Supabase con `supabase-js` (CDN) y la anon key.
- **Backend**: Supabase Edge Functions (Deno/TypeScript), una por red: `sync-youtube`, `sync-meta`, `sync-tiktok`. Cada una pide datos a la API, los guarda en la tabla `metricas_diarias` y `videos`.
- **Programación**: `pg_cron` + `pg_net` en Supabase llaman a las Edge Functions una vez al día (06:00 hora España). Esa llamada diaria mantiene el proyecto activo y evita la pausa del plan Free.
- **Acceso**: Supabase Auth con email + contraseña, solo 2 usuarios (Jennifer y Paco). RLS activado en todas las tablas: solo usuarios autenticados leen; solo la service role escribe.
- **Despliegue**: `index.html` estático (Vercel/Netlify/GitHub Pages, el que ya use el usuario).

## Base de datos

Crear con migraciones (`supabase/migrations/`). Tablas:

```sql
-- Cuentas conectadas (una fila por red)
cuentas (
  id uuid pk, red text check (red in ('youtube','instagram','facebook','tiktok')),
  nombre_cuenta text, id_externo text, activa bool default true,
  ultima_sync timestamptz, error_sync text
)

-- Tokens OAuth, solo legibles por service role (RLS: nadie desde el cliente)
tokens (
  cuenta_id uuid fk cuentas, access_token text, refresh_token text,
  expira timestamptz, actualizado timestamptz
)

-- Foto diaria de la cuenta
metricas_diarias (
  cuenta_id uuid fk, fecha date, seguidores int, visitas int,
  visualizaciones int, likes int, comentarios int, compartidos int,
  alcance int, extra jsonb, pk (cuenta_id, fecha)
)

-- Contenido publicado (vídeo, reel, post)
videos (
  id uuid pk, cuenta_id uuid fk, id_externo text, titulo text,
  url text, miniatura text, publicado timestamptz, tipo text,
  visualizaciones int, likes int, comentarios int, compartidos int,
  retencion_pct numeric, extra jsonb, actualizado timestamptz,
  unique (cuenta_id, id_externo)
)
```

`extra` guarda campos propios de cada red sin cambiar el esquema (por ejemplo, ingresos de YouTube, guardados de Instagram).

## Conexión por red (orden de implementación)

### Fase 1 — YouTube (empezar aquí, funciona el primer día)
- Google Cloud Console: crear proyecto, activar **YouTube Data API v3** y **YouTube Analytics API**, credenciales OAuth 2.0 (app de escritorio o web).
- Scopes: `youtube.readonly`, `yt-analytics.readonly`.
- Flujo: página `conectar.html` que hace el OAuth una vez y guarda refresh_token en `tokens` vía Edge Function `oauth-callback`.
- `sync-youtube`: canal (suscriptores, vistas totales), últimos 50 vídeos (vistas, likes, comentarios, retención media), métricas del día anterior desde Analytics.

### Fase 2 — Instagram + Facebook (Meta Graph API, van juntas)
- Requisito previo: Instagram como cuenta **Profesional** (Creador o Business) vinculada a la página de Facebook.
- developers.facebook.com: crear app tipo Business, añadir producto "Instagram" y "Facebook Login". Uso propio: no hace falta revisión de Meta; el usuario será administrador/tester de la app.
- Permisos: `pages_read_engagement`, `pages_show_list`, `read_insights`, `instagram_basic`, `instagram_manage_insights`.
- Token de página de larga duración (60 días); `sync-meta` lo renueva antes de caducar.
- Datos: seguidores, alcance, impresiones, visitas al perfil, y por publicación/reel: reproducciones, likes, comentarios, compartidos, guardados.

### Fase 3 — TikTok (la más restrictiva, dejar para el final)
- developers.tiktok.com: registrar app, pedir **Display API** con scopes `user.info.basic`, `user.info.stats`, `video.list`. La aprobación puede tardar semanas.
- Datos disponibles: seguidores, likes totales, lista de vídeos con vistas/likes/comentarios/compartidos.
- **Plan B obligatorio mientras no haya aprobación**: botón "Importar CSV de TikTok Studio" en el panel que lee el archivo exportado y lo vuelca en `metricas_diarias` y `videos`.

## Pantallas del panel (`index.html`)

1. **Resumen**: 4 tarjetas (una por red) con seguidores, variación en 7 días, visualizaciones en 7 días. Fecha de última sincronización y aviso si hay error.
2. **Por red**: gráfica de evolución de seguidores y visualizaciones (7 / 30 / 90 días) y tabla de sus últimos contenidos.
3. **Ranking**: top 10 vídeos de todas las redes por visualizaciones en el periodo elegido, con miniatura y enlace.
4. **Ajustes**: estado de cada conexión, botón "Conectar", botón "Sincronizar ahora", importar CSV de TikTok.

## Orden de trabajo en Claude Code

1. Migraciones de las 4 tablas + RLS + usuarios en Auth.
2. `index.html` con login y pantalla Resumen leyendo de Supabase (aunque esté vacía).
3. Fase 1 YouTube completa (OAuth + sync + cron).
4. Pantallas Por red y Ranking con datos reales de YouTube.
5. Fase 2 Meta.
6. Fase 3 TikTok (CSV primero, API cuando la aprueben).

No saltar de fase hasta que la anterior muestre datos reales en el panel.
