# Historial de migraciones

| Versión | Archivo | Cómo se aplicó | Fecha |
|---|---|---|---|
| 20260915000001 | tablas.sql | SQL Editor del dashboard (bloque `supabase/paso1_sql_editor.sql`) | 2026-09-15 |
| 20260915000002 | rls.sql | SQL Editor del dashboard (bloque `supabase/paso1_sql_editor.sql`) | 2026-09-15 |

El bloque pegado en el SQL Editor inserta también estas versiones en
`supabase_migrations.schema_migrations`, de modo que un futuro `supabase db push`
las considera ya aplicadas y no las repite.
