# Edge Functions

Se despliegan pegando el contenido de cada `index.ts` en el dashboard de Supabase:
Edge Functions → Deploy a new function → Via Editor. El nombre de la función debe ser
exactamente el de la carpeta.

| Función | Quién la llama | Verify JWT | Secretos que usa |
|---|---|---|---|
| `oauth-callback` | `conectar.html` tras el consentimiento de Google | Desactivado (comprueba el usuario por sí misma) | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| `sync-youtube` | el cron diario (cabecera `x-cron-secret`) y el botón "Sincronizar ahora" | Desactivado | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET |

Los secretos se crean en Edge Functions → Secrets. Nunca en el código ni en git.
