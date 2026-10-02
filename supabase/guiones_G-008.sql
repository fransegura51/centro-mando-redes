-- Guion G-008 (generado por Claude a partir de la petición del panel).
-- Se pega en Supabase > SQL Editor y se ejecuta con Run.

insert into public.guiones
  (codigo, titulo, guion, prompt_flow, personajes, fotogramas_notas, hashtags, texto_publicacion, estado)
values (
  'G-008',
  'La lista de la compra',
  $g$PACO (entra con dos bolsas, orgulloso): "Misión cumplida."
JENNIFER (revisando la lista, tranquila): "¿Has traído todo lo de la lista?"
PACO (se queda quieto, pausa): "Todo. Bueno... la lista se me quedó en la mesa."
JENNIFER (a cámara): "¿A quién más se le olvida siempre la lista en casa?"$g$,
  $p$Vertical 9:16, plano medio fijo en una cocina acogedora de día, luz natural cálida. Paco entra por la derecha con dos bolsas de la compra, muy orgulloso, y las deja sobre la encimera. Jennifer, de pie junto a la mesa, lo mira con una media sonrisa. Paco se queda quieto de golpe cuando se da cuenta de que se ha olvidado la lista. Al final Jennifer gira la cabeza hacia la cámara.

Una sola persona habla a la vez: mientras habla uno, el otro tiene la boca cerrada y lo mira. Diálogo en español, natural y divertido.
PACO (voz masculina adulta, cálida y algo grave): "Misión cumplida."
JENNIFER (voz femenina adulta, clara y tranquila): "¿Has traído todo lo de la lista?"
PACO (voz masculina adulta, cálida y algo grave): "Todo. Bueno... la lista se me quedó en la mesa."
JENNIFER (a cámara, voz femenina adulta, clara y tranquila): "¿A quién más se le olvida siempre la lista en casa?"

Ambiente: sonido de bolsas de papel, cocina tranquila. Tono de comedia familiar, 12 segundos, sin marcas ni logotipos visibles.
Animación 3D de dibujos animados, personajes con aspecto de dibujo animado en 3D, no fotorrealista, aunque las referencias de lugares sean fotos reales.$p$,
  array['Paco','Jennifer'],
  'Personajes PACO y JENNIFER de la biblioteca de Flow. Escenario: la imagen "COCINA LA SERIE.png" (subidas del proyecto "videos de paco").',
  '#humor #pareja #comedia #familia #cosasdeparejas #pepafamily',
  'Hay cosas que nunca fallan: ir a por la lista de la compra y dejarla en casa. ¿Os pasa también? Contádnoslo en los comentarios.',
  'borrador'
);

-- Las peticiones del panel quedan atendidas.
update public.peticiones_guiones
   set estado = 'atendida', atendida_en = now()
 where estado = 'pendiente';
