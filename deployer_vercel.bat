@echo off
title Deploiement PdP Terrain sur Vercel
color 0B
cls

echo.
echo  =====================================================
echo   DEPLOIEMENT - PdP ^& Analyse de Risques Terrain
echo  =====================================================
echo.

cd /d "%~dp0"

:: Verifier si deja connecte a Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo  [1/4] Connexion a Vercel...
    echo  Une page va s'ouvrir dans votre navigateur.
    echo  Connectez-vous avec votre compte Vercel.
    echo.
    vercel login
    if %errorlevel% neq 0 (
        echo.
        echo  ERREUR : Connexion Vercel echouee.
        pause
        exit /b 1
    )
)

echo.
echo  [2/4] Configuration des variables d'environnement Supabase...
echo.

:: Supprimer les anciennes valeurs si elles existent
vercel env rm VITE_SUPABASE_URL production --yes >nul 2>&1
vercel env rm VITE_SUPABASE_ANON_KEY production --yes >nul 2>&1

:: Ajouter les variables Supabase (production)
echo https://cwreletuirtrnviqlila.supabase.co | vercel env add VITE_SUPABASE_URL production
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cmVsZXR1aXJ0cm52aXFsaWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODU4ODMsImV4cCI6MjA4ODk2MTg4M30.JX5TnGveHtu8Tkyo33LIIzM9BgKlHr9i5-86UZB8Sfo | vercel env add VITE_SUPABASE_ANON_KEY production

echo.
echo  [3/4] Deploiement en production...
echo.

vercel --prod --yes

if %errorlevel% neq 0 (
    echo.
    echo  ERREUR lors du deploiement. Verifiez les messages ci-dessus.
    pause
    exit /b 1
)

echo.
echo  =====================================================
echo   DEPLOIEMENT REUSSI !
echo   Votre app est accessible depuis n'importe quel
echo   telephone, n'importe ou dans le monde.
echo  =====================================================
echo.
echo  L'URL est affichee ci-dessus (*.vercel.app)
echo.

pause
