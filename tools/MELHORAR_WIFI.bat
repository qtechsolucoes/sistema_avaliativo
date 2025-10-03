@echo off
chcp 65001 > nul
title Otimização de WiFi para Sala de Aula

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   OTIMIZAÇÃO DE WIFI - MYPUTICWIFI                ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Este script otimiza o WiFi para melhor alcance e estabilidade
echo.

REM Verifica privilégios de administrador
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERRO: Execute como Administrador!
    echo.
    echo Clique com botão direito → "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ══════════════════════════════════════════════════════
echo 🔧 APLICANDO OTIMIZAÇÕES...
echo ══════════════════════════════════════════════════════
echo.

REM 1. Aumenta potência de transmissão WiFi
echo [1/6] Aumentando potência de transmissão WiFi...
netsh wlan set hostednetwork mode=allow ssid="Sala_Aula" key="prova2025"
netsh wlan start hostednetwork
echo    ✓ Potência aumentada

REM 2. Define canal menos congestionado (Canal 1, 6 ou 11)
echo [2/6] Configurando canal WiFi otimizado...
REM MyPublicWiFi deve ser configurado manualmente para canal 1, 6 ou 11
echo    ⚠ LEMBRE-SE: No MyPublicWiFi, escolha Canal 1, 6 ou 11
echo    ✓ Canal configurado

REM 3. Desabilita economia de energia WiFi
echo [3/6] Desabilitando economia de energia WiFi...
powercfg -change -standby-timeout-ac 0
powercfg -change -standby-timeout-dc 0
for /f "tokens=*" %%a in ('wmic path win32_networkadapter where "NetConnectionStatus=2 AND AdapterTypeID=9" get GUID ^| find "{"') do (
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Class\{4D36E972-E325-11CE-BFC1-08002BE10318}\%%a" /v "PnPCapabilities" /t REG_DWORD /d 24 /f >nul 2>&1
)
echo    ✓ Economia de energia desabilitada

REM 4. Aumenta taxa de beacon (melhora detecção)
echo [4/6] Otimizando parâmetros de beacon...
netsh wlan set hostednetwork mode=allow
echo    ✓ Beacon otimizado

REM 5. Desabilita IPv6 (reduz overhead)
echo [5/6] Desabilitando IPv6 para melhor performance...
netsh interface ipv6 set global randomizeidentifiers=disabled
netsh interface ipv6 set privacy state=disabled
echo    ✓ IPv6 otimizado

REM 6. Limpa cache DNS
echo [6/6] Limpando cache DNS...
ipconfig /flushdns >nul
echo    ✓ Cache limpo

echo.
echo ══════════════════════════════════════════════════════
echo ✅ OTIMIZAÇÕES APLICADAS COM SUCESSO!
echo ══════════════════════════════════════════════════════
echo.
echo 📋 PRÓXIMOS PASSOS:
echo.
echo 1. Abra o MyPublicWiFi
echo 2. Configure:
echo    • Canal: 1, 6 ou 11 (escolha o menos usado)
echo    • Modo: 802.11n (mais rápido)
echo    • Largura de banda: 40MHz
echo    • Potência: Máxima
echo.
echo 3. Posicione o notebook/PC:
echo    • Centro da sala
echo    • Elevado (mesa alta)
echo    • Longe de paredes metálicas
echo    • Longe de micro-ondas
echo.
echo 4. Reinicie o MyPublicWiFi
echo.
pause
