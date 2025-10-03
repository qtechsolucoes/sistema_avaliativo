@echo off
chcp 65001 > nul
title Sistema de Avaliações - Servidor Local

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   SISTEMA DE AVALIAÇÕES - SERVIDOR COM CACHE      ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 🚀 Iniciando servidor local...
echo.
echo 📋 O que este script faz:
echo    • Carrega dados do Supabase uma única vez
echo    • Cria cache em memória para acesso rápido
echo    • Serve dados na rede local (192.168.5.1:8000)
echo    • Recebe e envia submissões automaticamente
echo.
echo ⏳ Aguarde o carregamento...
echo.

REM Verifica se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo 📥 Baixe e instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Verifica se as dependências estão instaladas
if not exist "node_modules\" (
    echo 📦 Instalando dependências...
    call npm install
    echo.
)

REM Verifica se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  ATENÇÃO: Arquivo .env não encontrado!
    echo.
    echo 📝 Crie um arquivo .env com suas credenciais do Supabase:
    echo    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    echo    VITE_SUPABASE_ANON_KEY=sua-chave-anonima
    echo.
    echo 💡 Você pode copiar .env.example como base
    echo.
    pause
)

echo ═══════════════════════════════════════════════════
echo.

REM Inicia o servidor
call npm start

pause
