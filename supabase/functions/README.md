# Edge Functions

Se despliegan pegando el contenido de cada `index.ts` en el dashboard de Supabase:
Edge Functions → Deploy a new function → Via Editor. El nombre de la función debe ser
exactamente el de la carpeta.

| Función | Quién la llama | Verify JWT | Secretos que usa |
|---|---|---|---|
| `oauth-callback` | `conectar.html` tras el consentimiento de Google | Desactivado (comprueba el usuario por sí misma) | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| `sonyc-youtube` | el cron diario (cabecera `x-cron-secret`) y el botón "Sincronizar ahora" | Desactivado | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET |
| `publicar` | el cron cada 5 minutos (`x-cron-secret`) | Desactivado (comprueba cron o usuario) | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET; Meta: META_IG_USER_ID, META_ACCESS_TOKEN, META_PAGE_ID, META_PAGE_TOKEN |

`publicar` (fases 3-6): escrita y **sin desplegar todavía** (2026-10-03: el despliegue
automático por el conector fue bloqueado; lo despliega el usuario con "Via Editor").
Solo publica guiones en `aprobado_publicar`. Sin probar con un vídeo real: probarla con 1
vídeo antes de darla por terminada. Para YouTube hay que añadir el scope
`youtube.upload` en `conectar.html` y volver a pulsar Conectar. Instagram/Facebook solo
funcionan cuando existen los secretos de Meta; si faltan, la publicación queda en
`error` con un mensaje claro. Falta crear el cron (ver `supabase/paso4_cron_publicar.sql`).

Los secretos se crean en Edge Functions → Secrets. Nunca en el código ni en git.
