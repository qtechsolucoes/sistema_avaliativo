@echo off
chcp 65001 >nul
echo ========================================
echo   🔓 LIBERAR FIREWALL DO WINDOWS
echo ========================================
echo.
echo Este script libera a porta 8000 para
echo que Chromebooks possam acessar o sistema
echo.
echo ⚠️  EXECUTE COMO ADMINISTRADOR
echo    (Clique com botão direito → Executar como administrador)
echo.
echo ========================================
echo.
pause

netsh advfirewall firewall add rule name="Python Server 8000" dir=in action=allow protocol=TCP localport=8000

if %errorlevel% equ 0 (
    echo.
    echo ✅ FIREWALL LIBERADO COM SUCESSO!
    echo.
    echo Agora os Chromebooks podem acessar:
    echo http://192.168.137.1:8000
    echo.
) else (
    echo.
    echo ❌ ERRO: Execute como Administrador
    echo.
    echo Clique com botão direito no arquivo e
    echo selecione "Executar como administrador"
    echo.
)

echo.
pause
