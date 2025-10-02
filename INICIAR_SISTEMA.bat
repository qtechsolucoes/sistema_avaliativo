@echo off
echo ========================================
echo   SISTEMA DE AVALIACOES EDUCACIONAIS
echo ========================================
echo.
echo Iniciando servidor local...
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Por favor, instale o Python:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado
echo.
echo Servidor iniciando em http://localhost:8000
echo.
echo ========================================
echo   INSTRUCOES:
echo ========================================
echo.
echo 1. Acesse: http://localhost:8000
echo 2. Para PARAR o servidor: Pressione Ctrl+C
echo.
echo ========================================
echo.

REM Inicia o servidor Python
python -m http.server 8000

pause
