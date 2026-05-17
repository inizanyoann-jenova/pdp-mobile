@echo off
title PdP & Risques Terrain - Serveur local
color 0A
cls

echo.
echo  =====================================================
echo   PdP ^& Analyse de Risques - Serveur de developpement
echo  =====================================================
echo.
echo  Demarrage du serveur...
echo  Une fois lance, ouvrez sur votre telephone :
echo.

:: Affiche l'IP locale du PC
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
  set IP=%%a
  goto :found
)
:found
set IP=%IP: =%

echo    http://%IP%:5174
echo.
echo  (Telephone et PC doivent etre sur le meme Wi-Fi)
echo  Appuyez sur Ctrl+C pour arreter le serveur.
echo.
echo  =====================================================
echo.

cd /d "%~dp0"
npm run dev

pause
