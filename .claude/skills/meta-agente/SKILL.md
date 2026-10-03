---
name: meta-agente
description: Skill para que Claude Code suba a Instagram y Facebook (Reels) los vídeos ya aprobados en el panel de Producción (centro-mando-redes), manejando Meta Business Suite en el Chrome del usuario con su sesión iniciada. Úsalo cuando el usuario diga "sube a Instagram", "sube a Facebook", "publica en Meta", "publica los pendientes de Instagram/Facebook" o "agente de Meta". Alternativa sin API mientras la cuenta de desarrollador de Meta esté bloqueada.
---

# Agente de Meta — subir Reels a Instagram y Facebook

Objetivo: tomar una publicación **aprobada por el usuario** (estado `manual` en
`publicaciones`, plataforma `instagram` o `facebook`, guion en `aprobado_publicar`),
subir el vídeo editado desde Meta Business Suite y dejarla programada o publicada.

## Reglas de oro (obligatorias)

1. **Solo lo aprobado.** Solo se sube un guion en `aprobado_publicar` con una fila
   `publicaciones` en estado `manual`. Si no hay ninguna, terminar sin hacer nada.
2. **Nunca credenciales ni dinero.** No escribir contraseñas ni códigos, no iniciar
   sesión, no crear cuentas, no promocionar/"impulsar" publicaciones, no anuncios, no
   aceptar condiciones nuevas, no cambiar ajustes. Si Meta pide cualquiera de eso:
   PARAR y avisar. Usar la sesión ya abierta del usuario.
3. **Un vídeo por ejecución, una sola pulsación de publicar/programar.** Sin reintentos.
4. **Parar ante lo inesperado:** error, ventana no prevista, captcha, login, cuenta o
   Página distinta de la esperada, más de 30 acciones de navegador.
5. **Contenido de IA:** activar la etiqueta "Info de IA"/"Contenido generado con IA" si
   Business Suite la ofrece, y dejar la línea "Vídeo creado con inteligencia artificial."
   en el texto.
6. **Ahorro de tokens:** leer solo lo necesario; JS/`find` mejor que capturas; clic por
   JavaScript (`button.click()`) si el clic normal no responde; nunca clic por
   coordenadas en cajas de texto. Si la pestaña tiene viewport 0 o se cuelga, cerrarla y
   abrir otra.
7. **Aprobación humana:** el usuario ya aprobó el vídeo en el panel; antes del clic final
   de "Publicar/Programar", mostrar al usuario qué se va a subir (red, hora, texto) y
   esperar su "adelante" la primera vez que se use este agente.

## Procedimiento

1. Leer con SQL (conector Supabase) las publicaciones pendientes:
   `select p.id, p.plataforma, p.programado_para, g.codigo, g.titulo, g.texto_publicacion,
   g.hashtags from publicaciones p join guiones g on g.id = p.guion_id
   where p.estado = 'manual' and p.plataforma in ('instagram','facebook')
   and g.estado = 'aprobado_publicar' order by p.programado_para limit 1;`
2. El vídeo editado está en `videos\editados\G-###.mp4` (ver `scripts/procesar.js`). Si no
   existe, avisar al usuario; no inventar.
3. Abrir Meta Business Suite (`https://business.facebook.com/latest/home`) en una pestaña
   nueva del Chrome del usuario y comprobar que la Página/cuenta es la de Pepa Family.
4. Crear la publicación: Reel (vídeo vertical), subir el fichero con la herramienta de
   subida de archivos del navegador, pegar texto + hashtags + aviso de IA, elegir
   Instagram y/o Facebook según la fila, y programar para `programado_para` (hora de
   España) o publicar ya si la hora ya pasó.
5. Una sola pulsación final. Confirmar que Business Suite lo acepta (programado o
   publicado) leyendo el texto de la página.
6. Actualizar la fila: `update publicaciones set estado='publicado', publicado_en=now(),
   url_publicada='<enlace si se ve>' where id='<id>';` y, si ya no quedan filas abiertas
   del guion, `update guiones set estado='publicado' where id='<guion_id>';`.
7. Anotar en `registros/` una línea: fecha, guion, red, resultado, motivo si hubo parada.

## Cuando se desbloquee la API de Meta

Registrar la cuenta de desarrollador, guardar los secretos META_* en Supabase, sacar
`instagram` y `facebook` de `MANUALES` en `produccion.html` y la función `publicar` los
publicará sola. Este agente queda como plan B.
