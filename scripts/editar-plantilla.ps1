$sp = "C:\Users\Usuario\AppData\Local\Temp\claude\C--Users-Usuario-Documents-proyectos-claude-centro-mando-redes\5f696a77-d23a-4e23-9646-123cf704b3dc\scratchpad"
Set-Location $sp
$u = New-Object System.Text.UTF8Encoding($false)
$ff = "C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
$e = "C:\Users\Usuario\Documents\proyectos claude\centro-mando-redes\videos\entrada"
$fo = "fontfile='C\:/Windows/Fonts/arialbd.ttf'"
# titulo, color, [ (texto, inicio, fin) ... ]
$v = [ordered]@{
 'G-024' = @('¡SE HA IDO`nEL WIFI!', 'ff2bd6', @(@('Se ha ido el wifi.',2.3,3.7), @('Entonces... ¿hablamos?',5.0,7.2)))
 'G-025' = @('EL AGUACATE`nEN SU PUNTO', 'ffe600', @(@('Este aguacate está en su punto.',0.6,3.1), @('Ayer estaba duro y`nmañana estará negro.',3.3,5.6), @('Entonces es hoy o nunca.',5.8,7.9)))
 'G-026' = @('LA CAMISA`nQUE ENCOGIÓ', '22e5ff', @(@('¿Esta camisa no era tuya?',1.5,3.0), @('La lavadora la ha encogido.',3.6,5.5), @('¿Y la barriga también?',6.1,7.5)))
 'G-027' = @('LA LISTA`nDE TAREAS', 'ff2bd6', @(@('Son las ocho.`nEmpieza tu lista.',0.4,3.0), @('Pues mañana a las ocho.',4.6,6.3)))
 'G-028' = @('EL SELFI', '22e5ff', @(@('Yo he salido genial.',1.4,2.9), @('¿Y yo?',3.4,4.1), @('Tú has salido...`nde decoración.',5.0,7.6)))
 'G-029' = @('EL HELADO`nQUE SE CAYÓ', 'ffe600', @(@('Se me ha caído el helado.',1.9,4.3), @('Pues el mío`nno se comparte.',5.0,6.7)))
 'G-030' = @('EL GRIFO`nDEL TUTORIAL', 'ff2bd6', @(@('¿Seguro que sabes`narreglarlo?',1.0,2.6), @('Vi un tutorial.',3.6,5.0), @('Era de otro modelo.',6.2,7.5)))
}
foreach ($cod in $v.Keys) {
  $d = $v[$cod]
  [IO.File]::WriteAllText("$sp\${cod}_t.txt", ($d[0] -replace [regex]::Escape('`n'), "`n"), $u)
  [IO.File]::WriteAllText("$sp\${cod}_h.txt", '@PEPAFAMILY', $u)
  $c = $d[1]
  $glow = "drawtext=${fo}:textfile=${cod}_t.txt:fontsize=66:fontcolor=0x${c}:borderw=14:bordercolor=0x${c}:line_spacing=12:x=(w-text_w)/2:y=h*0.07:enable='between(t,0,3)',drawtext=${fo}:textfile=${cod}_h.txt:fontsize=40:fontcolor=0x22e5ff:borderw=10:bordercolor=0x22e5ff:x=(w-text_w)/2:y=h*0.94"
  $core = "drawtext=${fo}:textfile=${cod}_t.txt:fontsize=66:fontcolor=white:borderw=3:bordercolor=0x${c}:line_spacing=12:x=(w-text_w)/2:y=h*0.07:enable='between(t,0,3)',drawtext=${fo}:textfile=${cod}_h.txt:fontsize=40:fontcolor=white:borderw=3:bordercolor=0x22e5ff:x=(w-text_w)/2:y=h*0.94"
  $subs = @(); $n = 0
  foreach ($s in $d[2]) { $n++; [IO.File]::WriteAllText("$sp\${cod}_s$n.txt", ($s[0] -replace [regex]::Escape('`n'), "`n"), $u)
    $subs += "drawtext=${fo}:textfile=${cod}_s$n.txt:fontsize=58:fontcolor=white:box=1:boxcolor=black@0.62:boxborderw=18:line_spacing=10:x=(w-text_w)/2:y=h*0.80:enable='between(t,$($s[1]),$($s[2]))'" }
  $subs = $subs -join ','
  $fc = "[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=24[base];" +
    "color=c=black@0.0:s=1080x1920:r=24:d=8,format=rgba,${glow},split[ga][gb];[ga]gblur=sigma=18[gA];[gb]gblur=sigma=6[gB];" +
    "color=c=black@0.0:s=1080x1920:r=24:d=8,format=rgba,${core}[cr];" +
    "[base][gA]overlay=format=auto[o1];[o1][gB]overlay=format=auto[o2];[o2][cr]overlay=format=auto,${subs},format=yuv420p[v];" +
    "[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]"
  $o = "$sp\${cod}_ed.mp4"
  & $ff -y -hide_banner -loglevel error -i "$e\$cod.mp4" -filter_complex $fc -map "[v]" -map "[a]" -t 8 -c:v libx264 -preset slow -crf 22 -maxrate 4000k -bufsize 8000k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart $o
  "$cod exit=$LASTEXITCODE MB=" + [Math]::Round((Get-Item $o).Length / 1MB, 2)
}
