@echo off
echo Instalando ffmpeg (gratuito) para editar los videos...
echo.
winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
echo.
echo ----------------------------------------------------
echo Cuando termine, CIERRA esta ventana y abre una nueva
echo antes de usar procesar-videos.bat.
echo ----------------------------------------------------
pause
