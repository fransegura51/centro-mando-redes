# Historial de migraciones

| Versión | Archivo | Cómo se aplicó | Fecha |
|---|---|---|---|
| 20260915000001 | tablas.sql | SQL Editor del dashboard (bloque `supabase/paso1_sql_editor.sql`) | 2026-09-15 |
| 20260915000002 | rls.sql | SQL Editor del dashboard (bloque `supabase/paso1_sql_editor.sql`) | 2026-09-15 |

El bloque pegado en el SQL Editor inserta también estas versiones en
`supabase_migrations.schema_migrations`, de modo que un futuro `supabase db push`
las considera ya aplicadas y no las repite.
| 20260915000003 | cron_youtube.sql | SQL Editor del dashboard (bloque `supabase/paso3_cron.sql`) | pendiente |
| 20261002000002 | guiones_borrar.sql | SQL Editor (pegado por el usuario, 2026-10-03) | aplicada |
| 20261003000001 | peticiones_guiones.sql | SQL Editor (pegado por el usuario, 2026-10-03) | aplicada |
| 20261003000002 | bucket_videos_editados.sql | conector MCP (apply_migration, 2026-10-03) | aplicada |
| 20261003000003 | publicacion.sql | conector MCP (apply_migration, 2026-10-03) | aplicada |
