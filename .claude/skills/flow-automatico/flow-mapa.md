# Mapa de Flow (aprendido en la fase 7a, 2026-10-02)

## Acceso
- Inicio: https://flow.google.com/ (la sesión del usuario ya está iniciada, plan PRO).
- Proyecto habitual: **"videos de paco"**
  https://flow.google.com/project/09d696ab-4eac-49e6-922b-9ec575b211da
- En el inicio los proyectos se llaman por fecha/hora salvo "videos de paco" y
  "pepa personajes master". Los nombres tardan en aparecer; si no se ve, recargar.
- Vista pequeña (~1366x543): preferir `find` y `ref` a coordenadas.

## Panel de Producción
- https://fransegura51.github.io/centro-mando-redes/produccion.html
- "Listos para Flow": el más antiguo es el primero de la lista.
- Prompt y fotogramas están en `<details>`; se leen con JS:
  `document.querySelectorAll('details')[0].innerText` (prompt) y `[1]` (fotogramas).

## Dentro del proyecto
- Barra lateral: Todo el contenido, Imágenes, Vídeos, Caracteres, Escenas, Subidas, Herramientas.
- Asistente (panel derecho): botón "Iniciar sesión nueva" (icono de lápiz arriba a la
  derecha del panel) → conversación vacía. Hacerlo SIEMPRE antes de pegar el prompt.
- Caja: "¿Qué quieres crear?". El texto se escribe con `type` y no se envía hasta
  pulsar la flecha (botón con flecha de la derecha). NO pulsarla en 7a.
- Referencias: botón "+" ("Añadir ingredientes") de la caja → selector "Buscar
  recursos" con filtros Todo / Imágenes / Vídeos / Voces / Caracteres / Subidas y
  botón "Añadir a petición".

## Biblioteca (estado el 2 oct 2026)
- Caracteres: **PACO** y **JENNIFER** (separados). David y Álvaro NO están.
- Subidas/imágenes: `COCINA LA SERIE.png`, 3 imágenes conjuntas Paco+Jennifer
  del aeropuerto (`PACO_JENNIFER_AEROP...` x2 e "Imagen de ChatGPT 30...").
- No existe fotograma conjunto Paco+Jennifer "con ropa de casa en el salón".
- Subida por el usuario el 2 oct 2026: `salon la pelicula.png` (imagen de un salón
  vacío, sin personajes). Referencias previstas para G-001: personajes PACO y
  JENNIFER + esta imagen como escenario (pendiente de confirmar por el usuario).
- Tras subir algo a mano, la pestaña de Claude no ve el cambio hasta recargar.
- Vídeos previos: "Jennifer stares at Paco", "Characters talking in air...",
  "Paco and Jennifer at air...". Modelo usado: Omni 1.1 Flash, 720p, 9:16.

## Pendiente de aprender (7b)
- Dónde se ven los créditos (no localizados en 7a).
- Cómo aparece el vídeo en cola y dónde se descarga.

## Lecciones de la 7b (2026-10-02)
- Clic normal (ref o coordenadas) NO abre la sesion nueva ni el selector "+" tras
  cargar; sí funciona `button.click()` por JS buscando por aria-label
  ("Iniciar sesión nueva", "Añadir ingredientes", "Añadir a petición").
- NUNCA clic por coordenadas en la caja: abrio un video antiguo en el editor.
  Dar foco por JS (`contenteditable` de la derecha, `.focus()`) y luego `type`.
- En el selector: clic en la opcion y luego "Añadir a petición"; el selector se
  cierra solo. El primer elemento (ya resaltado) se añade sin pulsar Añadir.
- Enviar: boton "Iniciar generación" (find + clic por ref). El clic JS no envio.
- Si la pestana queda con viewport diminuto (213x80), cerrarla y abrir otra.
- Tras enviar, el chat muestra el prompt con las 3 miniaturas y puntos de proceso.
