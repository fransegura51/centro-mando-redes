param([string[]]$codigos)
$sp = "C:\Users\Usuario\AppData\Local\Temp\claude\C--Users-Usuario-Documents-proyectos-claude-centro-mando-redes\5f696a77-d23a-4e23-9646-123cf704b3dc\scratchpad"
Set-Location $sp
$u = New-Object System.Text.UTF8Encoding($false)
$ff = "C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
$e = "C:\Users\Usuario\Documents\proyectos claude\centro-mando-redes\videos\entrada"
$fo = "fontfile='C\:/Windows/Fonts/arialbd.ttf'"
New-Item -ItemType Directory -Force "$sp\ed16" | Out-Null
[IO.File]::WriteAllText("$sp\url.txt", 'pepafamilyapp.es', $u)
[IO.File]::WriteAllText("$sp\oferta.txt", 'Las 20 primeras familias, gratis', $u)
# neon: (texto, color, inicio, fin, y)  |  subs: (texto, inicio, fin)
$v = [ordered]@{
 'G-101' = @{ neon = @( @('«ESTOY BIEN»','ff2bd6',0,3,'h*0.07'), @('¿TE HAN PUESTO`nLA PRUEBA ALGUNA VEZ?','ffe600',13,16,'h*0.07') );
   subs = @( @('Estoy bien.',0.5,1.4), @('Perfecto.',1.95,2.7), @('Pregúntame qué me pasa.',3.9,5.4), @('¿Pero no estabas bien?',6.1,7.3), @('Es una prueba.',8.5,9.5), @('¿La puedo repetir?',10.5,11.5), @('No hay repetición.',12.85,14.2), @('Socorro.',14.9,16) ) }
 'G-102' = @{ neon = @( @('ENTREVISTA`nDE TRABAJO','22e5ff',0,3,'h*0.07'), @('¿QUÉ CONTESTARÍA`nTU PAREJA?','ffe600',13,16,'h*0.07') );
   subs = @( @('¿Dónde te ves dentro`nde cinco años?',0.45,2.5), @('En el sofá.',3.1,3.75), @('¿Y dentro de diez?',4.4,5.45), @('En el mismo sofá,`npero más cómodo.',5.9,7.7), @('¿Cuál es tu mayor defecto?',8.77,10.22), @('Ninguno.',10.87,11.36), @('Descartado. Buscamos`na alguien con defectos.',11.6,14.4), @('¡Tengo muchos!',14.9,15.8) ) }
 'G-103' = @{ neon = @( @('CINCO MINUTOS','ff7a00',0,3,'h*0.07'), @('4 HORAS DESPUÉS','22e5ff',8,10.2,'h*0.07'), @('¿QUÉ PIEZA TE`nSOBRÓ A TI?','ffe600',13,16,'h*0.07') );
   subs = @( @('Eso lo arreglo yo`nen cinco minutos.',0.7,2.9), @('¿Seguro?',3.05,3.7), @('Confía en mí.',5.15,6), @('Han pasado cuatro horas.',8.55,10.2), @('Ya casi.',10.6,11.4), @('¿Y el grifo?',12.45,13.2), @('Esta pieza sobra.',14.05,15.3) ) }
 'G-104' = @{ neon = @( @('LA LISTA`nDE HOY','ff2bd6',0,3,'h*0.07'), @('¿CUÁL ES LO MÁS`nFÁCIL PARA TI?','ffe600',13,16,'h*0.07') );
   subs = @( @('Esta es la lista de hoy.',0.55,1.9), @('Empiezo por lo más fácil.',3.0,4.5), @('¿Cuál?',5.0,5.45), @('Sentarme.',6.1,6.85), @('Eso no está en la lista.',8.5,9.95), @('Apúntalo y lo tacho.',10.6,12.05), @('Ya está apuntado.',12.65,13.95), @('Tachado.',14.8,15.5) ) }
}
foreach ($cod in $codigos) {
  $d = $v[$cod]
  $nt = @(); $i = 0
  foreach ($n in $d.neon) { $i++; $f = "${cod}_n$i.txt"; [IO.File]::WriteAllText("$sp\$f", ($n[0] -replace [regex]::Escape('`n'), "`n"), $u)
    $nt += @{ f = $f; c = $n[1]; a = $n[2]; b = $n[3]; y = $n[4] } }
  $glow = ($nt | % { "drawtext=${fo}:textfile=$($_.f):fontsize=66:fontcolor=0x$($_.c):borderw=14:bordercolor=0x$($_.c):line_spacing=12:x=(w-text_w)/2:y=$($_.y):enable='between(t,$($_.a),$($_.b))'" }) -join ','
  $core = ($nt | % { "drawtext=${fo}:textfile=$($_.f):fontsize=66:fontcolor=white:borderw=3:bordercolor=0x$($_.c):line_spacing=12:x=(w-text_w)/2:y=$($_.y):enable='between(t,$($_.a),$($_.b))'" }) -join ','
  $subs = @(); $k = 0
  foreach ($s in $d.subs) { $k++; $f = "${cod}_s$k.txt"; [IO.File]::WriteAllText("$sp\$f", ($s[0] -replace [regex]::Escape('`n'), "`n"), $u)
    $subs += "drawtext=${fo}:textfile=${f}:fontsize=58:fontcolor=white:box=1:boxcolor=black@0.62:boxborderw=18:line_spacing=10:x=(w-text_w)/2:y=h*0.78:enable='between(t,$($s[1]),$($s[2]))'" }
  $subs = $subs -join ','
  $pie = "drawbox=x=0:y=ih*0.915:w=iw:h=ih:color=black@0.97:t=fill,drawtext=${fo}:textfile=oferta.txt:fontsize=w*0.03:fontcolor=0xffe600:x=(w-text_w)/2:y=h*0.926,drawtext=${fo}:textfile=url.txt:fontsize=w*0.034:fontcolor=white:borderw=2:bordercolor=0x22e5ff:x=(w-text_w)/2:y=h*0.957"
  $fc = "[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=24[v0];[1:v]scale=1080:1920:flags=lanczos,setsar=1,fps=24[v1];[v0][v1]concat=n=2:v=1:a=0[base];" +
    "color=c=black@0.0:s=1080x1920:r=24:d=16,format=rgba,${glow},split[ga][gb];[ga]gblur=sigma=18[gA];[gb]gblur=sigma=6[gB];" +
    "color=c=black@0.0:s=1080x1920:r=24:d=16,format=rgba,${core}[cr];" +
    "[base][gA]overlay=format=auto[o1];[o1][gB]overlay=format=auto[o2];[o2][cr]overlay=format=auto,${subs},${pie},format=yuv420p[v];" +
    "[0:a][1:a]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
  $o = "$sp\ed16\$cod.mp4"
  & $ff -y -hide_banner -loglevel error -i "$e\${cod}_clip1.mp4" -i "$e\${cod}_clip2.mp4" -filter_complex $fc -map "[v]" -map "[a]" -t 16 -c:v libx264 -preset medium -crf 22 -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart $o
  "$cod exit=$LASTEXITCODE MB=" + [Math]::Round((Get-Item $o).Length / 1MB, 2)
}
