---
name: flow-automatico
description: Skill para que Claude Code genere en Google Flow el vídeo de un guion aprobado del panel "Producción" (centro-mando-redes), manejando el navegador del usuario con la sesión de Flow ya iniciada, y deje el vídeo descargado como G-###.mp4 en videos\entrada. Úsalo siempre que el usuario diga "genera el vídeo en Flow", "haz el guion G-###", "recoge el vídeo de Flow", "fase 7", "Flow automático" o "agente de Flow". Es la fase 7 de la skill estudio-contenido-redes. Define el procedimiento, las condiciones de parada y las reglas de ahorro de tokens y de créditos.
---

# Flow automático — fase 7 de estudio-contenido-redes

Objetivo: tomar el siguiente guion aprobado del panel, generarlo en el Flow del
usuario (plan Google AI Pro, ya iniciado en su Chrome) y dejar el vídeo
descargado. Después, el resto del flujo (edición, aprobación, publicación) lo
hacen las demás fases.

## Reglas de oro (obligatorias)

1. **Nunca credenciales ni pagos.** No iniciar sesión, no escribir contraseñas,
   no aceptar ofertas, no comprar créditos, no cambiar de plan, no aceptar
   cuadros de condiciones nuevas. Si Flow pide cualquiera de eso: PARAR y
   avisar. Se usa la sesión que el usuario ya tiene abierta (extensión Claude
   en Chrome). Si se usa el navegador integrado de Claude Code y pide importar
   cookies, que el usuario elija solo el sitio de Flow, nunca todo el navegador.
   **Cero gasto de dinero real (regla del usuario, 2026-10-02):** gastar puntos/créditos
   del plan sí es aceptable; cualquier cosa que pueda costar dinero, no. Descargar
   SIEMPRE en 720p "Tamaño original"; nunca 1080p mejorada, 4K, "Actualizar", compras
   de puntos, upgrades ni pruebas de pago. Si algo muestra un precio en dinero o
   pide tarjeta/plan: PARAR y avisar.
2. **Un solo vídeo por ejecución.** Una sola pulsación de "generar". Jamás
   reintentar, regenerar ni "probar otra vez": un fallo también gasta créditos.
3. **Parar ante lo inesperado**: mensaje de error en Flow, ventana emergente
   no prevista, captcha o petición de login, personaje de referencia que no
   aparece en la biblioteca, botón que no se encuentra tras 2 intentos, o más
   de 25 acciones de navegador en una ejecución. Parar significa dejar todo
   como está y explicar al usuario, en pocas líneas, qué se vio.
4. **No tocar nada que no sea el guion en curso**: no borrar vídeos ni
   proyectos, no abrir otros proyectos de Flow, no modificar ajustes.
5. **Ahorro agresivo de tokens.** Leer solo lo necesario; preferir leer el
   texto de la página en lugar de hacer capturas tras cada clic; no explorar
   menús. Esperar con pausas largas y pocas comprobaciones (máximo 6 en total
   por vídeo). Una vez aprendida la pantalla de Flow, apuntarla en
   `flow-mapa.md` (nombres de botones y rutas) y usar ese fichero en las
   siguientes ejecuciones en vez de volver a descubrirla. Usar el modelo
   Sonnet 5.5.
6. **El usuario sabe** que automatizar Flow con un navegador puede ir contra
   las condiciones de Google y que el riesgo para la cuenta es suyo. No
   repetirlo cada vez.

## Datos que ya conocemos de su Flow

- En su Flow la **duración del clip va dentro del prompt** (no hay selector) y
  **se admite más de una voz por clip**. Los prompts del panel ya incluyen
  duración y voces; no modificarlos.
- **Reglas del usuario para el prompt (2026-10-02, obligatorias):**
  1. El diálogo exacto del guion (cada línea con su personaje, entre comillas) va
     SIEMPRE dentro del prompt que se pega en Flow, para que digan lo aprobado y
     el asistente de Flow no invente frases. Si el prompt del panel no lo trae
     literal, añadirlo al final antes de pegar. Esto sustituye a "no modificar
     los prompts": se puede añadir el diálogo, nada más.
  2. Los personajes son SIEMPRE en 3D (animación 3D estilo Pixar, como los
     vídeos anteriores del proyecto), nunca "estilo realista". Si el prompt del
     panel dice "Estilo realista", sustituirlo por "animación 3D estilo Pixar,
     personajes 3D estilizados" antes de pegar.
  2b. 3D reforzado: el prompt debe EMPEZAR con "ESTILO OBLIGATORIO: película de animación
     3D de dibujos animados (estilo Pixar)…" y terminar con un recordatorio de estilo.
     Si el vídeo sale realista, mirar primero las imágenes de referencia: las fotos
     reales de escenarios tiran del resultado hacia el realismo (G-008, 2026-10-03).
  2c. Personajes consistentes: el prompt debe llevar el bloque "ASPECTO FIJO DE LOS
     PERSONAJES" (ropa y altura de Paco y Jennifer) de la skill estudio-contenido-redes.
     Si no está, añadirlo antes de pegar. Flow cambiaba ropa y tamaño sin él.
  3. Una sola boca a la vez: el prompt debe decir quién habla en cada línea y que
     el otro tiene la boca cerrada escuchando (en G-001 los dos abrían la boca a
     la vez al hablar). Comprobarlo antes de pegar.
  3b. VOCES (regla del usuario, 2026-10-04): todos los prompts llevan "VOCES: usar
     exclusivamente las voces ya asignadas a los personajes PACO y JENNIFER en Flow; no
     inventar, cambiar ni mezclar voces; todo en español de España, sin acento inglés ni de
     ningún otro idioma." (En la biblioteca de Flow la voz de JENNIFER es "achernar" y la de
     PACO "charon".) Al añadir la referencia del personaje se queda su voz.
  3c. POSICIONES FIJAS en guiones de varios clips: indicar en TODOS los clips en qué lado
     de la imagen está cada personaje, desde dónde mira la cámara y que el decorado es el
     mismo; comparar el último fotograma de un clip con el primero del siguiente antes de unir.
  4. Tras enviar, el asistente de Flow pide aprobar el coste (p. ej. 15 puntos):
     pulsar "Aprobar" solo una vez, nunca "Aprobar siempre".
  G-001 se generó sin estas dos reglas (diálogo inventado por Flow y "estilo
  realista"): revisar el resultado y avisar al usuario.
- Flow tiene un panel de asistente con la caja "¿Qué quieres crear?" donde se
  pega el prompt. El vídeo puede quedar **en cola** varios minutos por la
  demanda.
- Los personajes (Paco, Jennifer, David, Álvaro) deben estar ya subidos a la
  biblioteca/proyecto de Flow. Claude NO sube archivos desde Windows. Si falta
  alguno, parar y pedir al usuario que lo suba a mano.
- Pestañas habituales del usuario: el proyecto de Flow ("Vídeos de Paco" u
  otro), el panel `https://fransegura51.github.io/centro-mando-redes/` (pestaña
  Producción) y el Supabase del proyecto.

## Fases de puesta en marcha (una por sesión, esperar confirmación)

**7a — Prueba en seco (sin generar).** Con el usuario mirando: abrir el panel,
leer el primer guion de "Listos para Flow", ir a Flow, localizar la caja del
asistente y la biblioteca de personajes, pegar el prompt **sin enviarlo**, y
comprobar que las referencias se pueden seleccionar. Escribir `flow-mapa.md`
con lo aprendido. No pulsar generar.

**7b — Primera generación real, supervisada.** Hacer el procedimiento completo
con 1 guion mientras el usuario mira. Ajustar `flow-mapa.md`.

**7c — Uso normal.** El usuario dice "genera el siguiente" o "recoge el vídeo".

## Procedimiento "generar"

1. Panel, pestaña Producción: tomar el guion **más antiguo** en "Listos para
   Flow". Leer su código (G-###), el **Prompt para Flow** y los **Fotogramas de
   referencia** (qué personajes y fotogramas usar).
2. Antes de empezar, anotar los créditos que muestra Flow, si los muestra.
3. En Flow, abrir el proyecto habitual (preguntar su nombre solo la primera
   vez y guardarlo en `flow-mapa.md`).
4. En la caja del asistente, pegar el prompt completo y verificar que se pegó
   entero.
5. Seleccionar las referencias que indica el guion, desde la biblioteca.
6. Pulsar generar **una vez**. Confirmar que el vídeo aparece en cola o en
   proceso.
7. Marcar el guion en el panel con el estado que ofrezca la fase 1 para
   "generando"; si el panel no tiene esa acción, no escribir en la base de
   datos por cuenta propia: avisar al usuario y proponer añadirla.
8. Terminar la ejecución e informar: guion, hora, créditos antes. No quedarse
   esperando la cola.

## Procedimiento "recoger"

1. En Flow, abrir el proyecto y buscar el vídeo del guion en curso (el más
   reciente). Si sigue en cola o en proceso, decirlo y terminar; no insistir.
2. Si falló, parar y avisar sin regenerar.
3. Si está listo: descargarlo (la carpeta de descargas de Chrome ya apunta a
   `videos\entrada`).
4. Con las herramientas locales de Claude Code, renombrar el fichero recién
   descargado a `G-###.mp4` y comprobar que existe en `videos\entrada`.
5. Actualizar el estado del guion según la fase 1 (por ejemplo `video_subido`)
   solo con la acción que ofrezca el panel; si no existe, avisar.
6. Anotar los créditos después y completar el registro.

## Dónde guardar los vídeos (regla del usuario, 2026-10-03)

Además de `videos\entrada\G-###.mp4`, dejar SIEMPRE una copia en
`C:\Users\Usuario\Documents\Vídeos cloud` (carpeta fijada en el Acceso rápido del
Explorador). **NO subir vídeos a la Biblioteca del panel ni a Supabase** (regla del
usuario, 2026-10-08: el tráfico de salida del plan gratuito se agotó): los vídeos viven
solo en el ordenador. Decir al usuario la ruta
exacta y abrirle el Explorador con el fichero seleccionado. El usuario a veces mueve los
vídeos por su cuenta (p. ej. a `Escritorio\Family App PEPA\videos terminados pepa`):
buscar ahí antes de decir que falta.

## Registro de gasto (para medir el consumo real)

Mantener `registros/flow-gasto.md` con una línea por ejecución: fecha, guion,
"generar" o "recoger", nº aproximado de acciones de navegador, créditos de Flow
antes y después (si se ven), resultado (ok / error / parado) y motivo. Al
terminar cada ejecución pedir al usuario que anote el **porcentaje de Ajustes >
Uso** de Claude antes y después, y apuntarlo en la misma línea. Tras 3 vídeos,
resumir cuánto cuesta de media cada vídeo en uso de Claude y en créditos de
Flow.

## Al empezar cada sesión

1. Preguntar en qué fase estamos (7a, 7b o 7c) y qué orden toca ("generar" o
   "recoger").
2. Leer únicamente esta skill, `flow-mapa.md` si existe, y el guion en curso.
3. Al terminar, dejar escrito en pocas líneas qué quedó hecho y qué falta.
