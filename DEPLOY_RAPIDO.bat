@echo off
chcp 65001 >nul
echo ========================================
echo   🚀 DEPLOY RÁPIDO - VERCEL
echo ========================================
echo.
echo Este script fará deploy do sistema
echo para que funcione em Chromebooks!
echo.
echo ========================================
echo.

REM Verifica se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale Node.js:
    echo https://nodejs.org
    echo.
    echo OU use deploy manual (veja CHROMEBOOKS_SEM_SERVIDOR.md)
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verifica se Vercel CLI está instalado
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando Vercel CLI...
    echo.
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Erro ao instalar Vercel CLI
        echo.
        echo Tente manualmente:
        echo npm install -g vercel
        echo.
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI instalado!
    echo.
)

echo ✅ Vercel CLI pronto
echo.
echo ========================================
echo   📤 INICIANDO DEPLOY...
echo ========================================
echo.
echo Você será redirecionado para login (se necessário)
echo Siga as instruções na tela
echo.
pause

REM Executa deploy
vercel

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ DEPLOY CONCLUÍDO COM SUCESSO!
    echo ========================================
    echo.
    echo 🎉 Seu sistema está online!
    echo.
    echo 📋 PRÓXIMOS PASSOS:
    echo.
    echo 1. Copie o link gerado acima
    echo 2. Acesse no navegador para testar
    echo 3. Configure variáveis de ambiente:
    echo    - Acesse: vercel.com
    echo    - Projeto ^> Settings ^> Environment Variables
    echo    - Adicione SUPABASE_URL e SUPABASE_ANON_KEY
    echo 4. Compartilhe o link com os Chromebooks
    echo.
    echo ========================================
) else (
    echo.
    echo ❌ Erro durante deploy
    echo.
    echo Tente:
    echo 1. vercel login (para fazer login)
    echo 2. vercel (para tentar novamente)
    echo.
    echo OU veja: CHROMEBOOKS_SEM_SERVIDOR.md
    echo.
)

echo.
pause
