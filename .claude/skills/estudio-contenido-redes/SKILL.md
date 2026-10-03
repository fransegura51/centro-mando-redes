---
name: estudio-contenido-redes
description: Skill para añadir al proyecto existente "centro-mando-redes" una pestaña "Producción" que gestiona el ciclo completo de un Reel diario con los avatares de IA de Paco y Jennifer (cuentas Pepa Family). Úsalo siempre que el usuario mencione "guiones", "prompts para Flow", "vídeo del día", "aprobar vídeo", "programar publicación", "publicar en YouTube/Instagram/Facebook/TikTok", "editar vídeo", "cola de publicación" o "estudio de contenido". Define el flujo (guion → aprobación → Flow manual → edición local → aprobación → publicación programada), las tablas, las reglas de coste cero y las reglas de ahorro de tokens que Claude Code debe respetar.
---

# Estudio de contenido — pestaña "Producción" de centro-mando-redes

**NO crear una app nueva.** Se añade como una pestaña más del proyecto
existente `centro-mando-redes`: mismo Supabase (proyecto `centro-mando-redes`,
organización Free "redes sociales", región eu-west-1), mismo repositorio de
GitHub Pages, mismo login (Jennifer y Paco). Reutilizar lo que ya existe
(Auth, RLS, OAuth de Google/YouTube, Edge Functions) en vez de duplicarlo.

## Reglas de oro (obligatorias)

1. **Todo gratis.** Solo planes Free de Supabase y GitHub, APIs gratuitas de
   YouTube/Meta/TikTok, ffmpeg y herramientas locales. Único pago existente:
   Google AI Pro (Flow) y el plan Max de Claude, ya contratados. Si algo
   requiere pagar, PARAR y avisar antes de seguir.
2. **Ahorro agresivo de tokens.** Leer solo los ficheros estrictamente
   necesarios para la tarea; no explorar el repo. Todo lo repetitivo (edición,
   subida, publicación) lo hacen **scripts deterministas**, nunca Claude.
   Claude solo interviene para escribir guiones (por lotes semanales) y para
   construir/arreglar código.
3. **Una persona aprueba siempre** antes de generar y antes de publicar. Nada
   se publica sin estado `aprobado_publicar`.
4. **Contenido de IA declarado**: marcar siempre el vídeo como generado/alterado
   con IA donde la plataforma lo permita (YouTube `containsSyntheticMedia`,
   etiqueta "Info de IA" en Meta, interruptor de contenido de IA en TikTok).
5. **Secretos nunca en el repo ni en config.js**: solo en Edge Functions →
   Secrets de Supabase. Pedir los datos al usuario cuando haga falta; no
   guardar contraseñas de ninguna cuenta.
6. Probar con 1 vídeo real antes de dar una fase por terminada.

## Flujo completo

```
Claude escribe guiones (lote semanal, 7)
  → panel: estado "borrador" → usuario aprueba/rechaza/edita   [aprobado_guion]
  → panel muestra el PROMPT listo para copiar (con botón Copiar)
  → usuario lo pega en Flow, genera el vídeo y lo descarga a
    Documents\proyectos claude\centro-mando-redes\videos\entrada\G-###.mp4
  → script local "procesar" edita con ffmpeg y sube a Supabase Storage
                                                                [pendiente_revision]
  → panel: reproductor + botón Aprobar + selector "Publicar ya" o fecha/hora
                                                                [aprobado_publicar]
  → cron en la nube publica a su hora                           [publicado]
  → TikTok: paquete manual (ver más abajo)
```

El nombre del fichero descargado debe empezar por el código del guion
(`G-014.mp4`) para que el script lo asocie solo.

## Modelo de datos (Supabase, todo con RLS: solo Jennifer y Paco)

- `guiones`: id, codigo (G-001…), titulo, guion (texto), prompt_flow,
  personajes (lista), fotogramas_notas, hashtags, texto_publicacion,
  estado (`borrador` | `aprobado_guion` | `video_subido` |
  `pendiente_revision` | `aprobado_publicar` | `publicado` | `rechazado`),
  creado_en.
- `publicaciones`: id, guion_id, ruta_video (Storage), programado_para
  (timestamptz, zona Europe/Madrid), plataforma (`youtube` | `instagram` |
  `facebook` | `tiktok`), estado (`pendiente` | `publicado` | `error` |
  `manual`), id_externo, url_publicada, error_texto, publicado_en.
- Reutilizar las tablas de estadísticas ya existentes para enlazar cada
  publicación con sus métricas (si no hay relación obvia, no inventarla:
  preguntar).

## Fases (hacer UNA por sesión y esperar confirmación)

**Fase 1 — Guiones y aprobación.** Tablas + pestaña "Producción" con lista de
guiones, aprobar/rechazar/editar y botón Copiar prompt. Claude escribe el
primer lote de 7 guiones directamente en la tabla (SQL o script).

> **Estado (2026-10-03):** fase 1 hecha y en uso. Fase 2 hecha: `scripts/procesar.js`
> (+ `instalar-ffmpeg.bat`, `procesar-videos.bat`), ffmpeg instalado y probado; subida
> a Storage lista pero necesita `.env` con la clave de servicio (la pone el usuario).
> Fases 3-6 construidas, SIN probar con un vídeo real: panel (revisión, programación,
> paquete TikTok) publicado, migración `20261003000003_publicacion.sql` aplicada,
> función `publicar` DESPLEGADA (verify_jwt off) y cron `publicar-cada-5-min` activo
> (2026-10-03), YouTube reconectado con scope `youtube.upload`. Faltan: `.env` con la
> clave de servicio para que `procesar.js` suba el vídeo, secretos de Meta
> (Instagram/Facebook) y la primera prueba real en YouTube. Fase 7 (Flow) en curso:
> ver `flow-automatico`.

**Fase 2 — Edición local (script, 0 tokens al usarlo).** Script `procesar`
(Node o Python, el que ya haya en la máquina; doble clic o un comando):
1. Detecta ficheros nuevos en `videos\entrada`.
2. ffmpeg: recorte/escala a 1080x1920 (9:16), normalizar volumen, cortar
   silencios iniciales/finales, opcional intro/outro corta con el logo.
3. Subtítulos: **opcional**. Solo si el PC los aguanta con Whisper local
   gratuito; si no, omitirlos y confiar en los subtítulos automáticos de
   cada plataforma.
4. Sube el resultado a Supabase Storage (bucket privado), actualiza el
   guion a `pendiente_revision`.
5. **Plan Free = 1 GB de Storage**: borrar el vídeo de Storage a los 7 días
   de publicarse (conservar el original en el PC). Avisar si el uso pasa del
   70 %.

**Fase 3 — Revisión y programación en el panel.** Reproductor del vídeo
editado, botones Aprobar / Rechazar (con motivo) y selector "Publicar ya" o
fecha y hora concretas. Crear una fila en `publicaciones` por plataforma.

**Fase 4 — Publicación en YouTube (Shorts).** Reutilizar el OAuth de Google ya
creado; **hay que ampliar el permiso (scope) de subida** y volver a conectar
el canal. Edge Function `publicar` + `pg_cron` cada 5 minutos que coge las
publicaciones `pendiente` cuya hora ya llegó. Comprobar los límites de
tiempo/memoria de las Edge Functions con vídeos reales; si una subida no
cabe, usar como plan B un workflow de GitHub Actions con cron (gratis) que
ejecute el mismo script de publicación. Marcar `containsSyntheticMedia`.
Comprobar en la documentación vigente la cuota diaria de la API de YouTube.

**Fase 5 — Publicación en Instagram y Facebook (Reels).** Graph API de Meta.
Requisitos a confirmar con el usuario ANTES de programar: Instagram debe ser
cuenta **profesional** (aún no confirmado) y enlazada a la página de
Facebook; crear app de desarrollador en Meta (modo desarrollo basta para las
cuentas propias, sin revisión de app); token de larga duración guardado en
Secrets y aviso en el panel cuando vaya a caducar. Instagram descarga el
vídeo desde una URL: usar URL firmada temporal de Storage.

**Fase 6 — TikTok (parte manual por diseño).** La API de publicación de
TikTok exige aprobación de la app, y sin ella las publicaciones quedan
restringidas. Por tanto, **no automatizar al principio**: en el panel, a la
hora programada, mostrar un "paquete TikTok" (botón Descargar vídeo + texto +
hashtags con botón Copiar) y una notificación/aviso para que el usuario lo
suba desde la app y pulse "Marcar como publicado". Revisar más adelante si
la API ofrece subir como borrador sin aprobación; solo entonces automatizar.

**Fase 7 (aparte, cuando todo lo anterior funcione) — Automatizar Flow.**
Claude en Chrome / Cowork usando la sesión ya abierta de Flow y la carpeta
"personajes máster". Es frágil y gasta mucho uso de Claude: no empezar sin
que el usuario lo pida expresamente.

## Cómo escribir los guiones (lo que hace Claude cada semana)

- Lote de 7 (uno al día). Escenas cotidianas y breves, pensadas para **Reels
  verticales de 8 a 15 segundos** (límite práctico de un clip de Flow).
- Personajes fijos: avatares de IA de Paco y Jennifer; a veces Paco con David
  o Álvaro. Mantener aspecto y ropa coherentes con las imágenes de la carpeta
  "personajes máster".
- Objetivo: que la gente **comente y siga**, no solo que vea. Cada guion
  termina con una pregunta o gancho que invite a comentar.
- Cada guion entrega: título, guion con diálogo, **prompt para Flow** (escena,
  encuadre vertical 9:16, acción, diálogo, ambiente, estilo; sin nombres de
  marcas ni personas reales fuera de los personajes), qué personajes y qué
  fotogramas de referencia usar, texto de publicación y hashtags.
- Idioma del contenido: el de las cuentas (preguntar si no consta).
- No repetir ideas de los últimos 30 guiones (consultar solo títulos).
- **Diálogo en el prompt para Flow:** el prompt incluye, línea por línea, lo que
  dice cada personaje con el formato `PACO: "..."`, `JENNIFER: "..."`, indicando
  la voz de cada uno (PACO: voz masculina adulta, cálida y algo grave; JENNIFER:
  voz femenina adulta, clara y tranquila; DAVID y ÁLVARO: voz masculina joven;
  ajustar si el usuario lo corrige). Así Flow dice lo aprobado y no inventa frases.
- **Una sola boca a la vez (fallo visto en G-001):** en el prompt, cada línea
  indica quién habla y que el otro personaje permanece con la boca cerrada,
  escuchando, hasta su turno ("mientras PACO habla, JENNIFER tiene la boca cerrada
  y lo mira"). Nunca diálogos simultáneos ni solapados. Un clip, pocas líneas.
- **3D reforzado (2026-10-03, el vídeo de G-008 salió sin ser 3D):** el prompt EMPIEZA
  con "ESTILO OBLIGATORIO: película de animación 3D de dibujos animados (estilo Pixar),
  personajes 3D estilizados con aspecto de muñeco animado… NO es acción real, NO es
  fotorrealista…" y TERMINA con un "Recordatorio final de estilo" que repite lo mismo
  (incluidos escenarios y objetos). Si el escenario de referencia es una foto real, el
  3D se pierde: preferir escenarios generados en 3D como referencia.
- **Siempre 3D:** todo prompt lleva esta línea fija de estilo, tal cual:
  "Animación 3D de dibujos animados, personajes con aspecto de dibujo animado en
  3D, no fotorrealista, aunque las referencias de lugares sean fotos reales".
  Nunca "estilo realista".
- **Peticiones desde el panel:** el botón "Generar guiones" guarda una fila en
  `peticiones_guiones` (cantidad 1-14, estado `pendiente`). Cuando el usuario diga
  "genera los guiones pendientes": leer las peticiones pendientes (solo id y
  cantidad), escribir esa cantidad de guiones con estas reglas (códigos G-### a
  continuación del último), insertarlos en `guiones` en estado `borrador` y marcar
  la petición como `atendida`. Coste cero: sin APIs de IA de pago; lo hace Claude
  en la sesión. Si no hay acceso de escritura a Supabase, entregar un SQL con los
  INSERT para que el usuario lo pegue en el SQL Editor.
- **Coste:** nunca gasto de dinero real; solo créditos/puntos del plan. Ver
  `flow-automatico` para las reglas de Flow.

## Diseño de la pestaña

Sencilla, clara y pensada para móvil (se aprobará desde el teléfono):
una lista de tarjetas por estado, con un único botón de acción principal por
tarjeta. Mismo estilo visual que el resto del panel.

## Al empezar cada sesión

1. Preguntar en qué fase estamos (o leer solo la fase marcada como en curso).
2. Leer únicamente los ficheros que esa fase va a tocar.
3. Al terminar, dejar escrito qué quedó hecho y qué falta, en pocas líneas.
