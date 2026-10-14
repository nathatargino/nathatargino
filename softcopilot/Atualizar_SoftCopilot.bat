@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title SoftCopilot - Atualizador Automatico

echo.
echo ========================================================================
echo                  SOFTCOPILOT - ATUALIZADOR AUTOMATICO
echo ========================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET_DIR=%SCRIPT_DIR%"

if not exist "%TARGET_DIR%manifest.json" (
    if exist "%TARGET_DIR%SoftCopilot\manifest.json" (
        set "TARGET_DIR=%TARGET_DIR%SoftCopilot\"
    ) else if exist "%USERPROFILE%\Downloads\SoftCopilot\manifest.json" (
        set "TARGET_DIR=%USERPROFILE%\Downloads\SoftCopilot\"
    )
)

if not exist "%TARGET_DIR%manifest.json" (
    echo [ERRO] Pasta da extensao nao encontrada automaticamente!
    echo.
    echo Certifique-se de que a pasta 'SoftCopilot' esta em:
    echo %USERPROFILE%\Downloads\SoftCopilot
    echo.
    pause
    exit /b 1
)

cd /d "%TARGET_DIR%"
echo [1/3] Pasta da extensao localizada:
echo %CD%
echo.

set "SUCESSO=0"
set "TEM_GIT_LOCAL=0"

where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
    if exist "%TARGET_DIR%.git" (
        set "TEM_GIT_LOCAL=1"
        echo [2/3] Repositorio Git detectado. Sincronizando com GitHub...
        echo.
        git stash >nul 2>&1
        git pull origin main
        if !ERRORLEVEL! equ 0 (
            set "SUCESSO=1"
            echo.
            echo [OK] Extensao atualizada com sucesso via Git!
        ) else (
            echo.
            echo [AVISO] Git pull retornou erro.
        )
    )
)

if "!SUCESSO!"=="0" (
    if "!TEM_GIT_LOCAL!"=="1" (
        echo.
        echo [ERRO] Nao foi possivel sincronizar via Git. Para proteger seus arquivos de
        echo desenvolvimento, o download direto foi cancelado. Resolva o git pull e tente novamente.
        echo.
        pause
        exit /b 1
    )
)

if "!SUCESSO!"=="0" (
    echo [2/3] Baixando a versao mais recente do SoftCopilot...
    echo.

    set "SC_URL=https://github.com/nathatargino/nathatargino/archive/refs/heads/main.zip"
    set "SC_ZIP=%TEMP%\softcopilot_update.zip"
    set "SC_DIR=%TEMP%\softcopilot_update_extracted"
    set "SC_SRC=%TEMP%\softcopilot_update_extracted\nathatargino-main\softcopilot"

    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; if (Test-Path $env:SC_ZIP) { Remove-Item $env:SC_ZIP -Force }; if (Test-Path $env:SC_DIR) { Remove-Item $env:SC_DIR -Recurse -Force }; Write-Host '  -> Baixando pacote...' -ForegroundColor Cyan; Invoke-WebRequest -Uri $env:SC_URL -OutFile $env:SC_ZIP -UseBasicParsing; Write-Host '  -> Extraindo arquivos...' -ForegroundColor Cyan; Expand-Archive -Path $env:SC_ZIP -DestinationPath $env:SC_DIR -Force; if (-not (Test-Path (Join-Path $env:SC_SRC 'manifest.json'))) { throw 'Pacote de atualizacao invalido.' }"
    if !ERRORLEVEL! neq 0 (
        echo.
        echo [ERRO] Falha ao baixar ou extrair a atualizacao.
        echo Verifique sua conexao com a internet e tente novamente.
        echo.
        pause
        exit /b 1
    )

    echo   -^> Atualizando arquivos...
    robocopy "!SC_SRC!" "%TARGET_DIR%." /E /XF "%~nx0" /NFL /NDL /NJH /NJS /NP >nul
    if !ERRORLEVEL! geq 8 (
        echo.
        echo [ERRO] Falha ao copiar os arquivos da atualizacao.
        echo Feche o Chrome/Edge e tente novamente.
        echo.
        pause
        exit /b 1
    )

    del "!SC_ZIP!" >nul 2>&1
    rmdir /s /q "!SC_DIR!" >nul 2>&1
    echo   -^> Concluido!
    set "SUCESSO=1"
)

echo.
echo ========================================================================
echo                  SOFTCOPILOT ATUALIZADO COM SUCESSO!
echo ========================================================================
echo.
echo   Para ativar a nova versao no seu navegador agora mesmo:
echo.
echo   1. Abra o Chrome ou Edge
echo   2. Acesse: chrome://extensions (ou edge://extensions)
echo   3. Localize o card do 'SoftCopilot'
echo   4. Clique no botao de recarregar (icone de circulo com seta)
echo.
echo   Pronto! A nova versao ja estara em pleno funcionamento.
echo ========================================================================
echo.
pause
exit /b 0
