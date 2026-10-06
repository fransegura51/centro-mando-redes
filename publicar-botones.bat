@echo off
cd /d "%~dp0"
echo Publicando los cambios del proyecto...
echo.
git add .gitignore index.html produccion.html conectar.html ventas.html manifest-ventas.json sw-ventas.js icon-ventas-192.png icon-ventas-512.png scripts supabase instalar-ffmpeg.bat procesar-videos.bat publicar-botones.bat .claude/skills
git -c user.name=fransegura51 -c user.email=fransegura51@users.noreply.github.com commit -m "Fase 2: script de edicion de videos, bucket de videos y guiones con dialogo y estilo 3D"
git push origin main
echo.
echo ----------------------------------------------------
echo Si arriba ves una linea con "main -> main", ya esta publicado.
echo Si ves un error en rojo, saca una foto y mandamela.
echo ----------------------------------------------------
pause
