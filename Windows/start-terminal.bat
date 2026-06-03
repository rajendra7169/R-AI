@echo off
title R-AI - Terminal
color 0B

:: -------------------------------------------------------
:: Find Python: prefer portable USB copy, then system
:: -------------------------------------------------------
set "PYTHON_CMD="

if exist "%~dp0..\Shared\python\python.exe" (
    set "PYTHON_CMD=%~dp0..\Shared\python\python.exe"
    goto :Ready
)

python --version >nul 2>&1
if %errorlevel%==0 (
    set "PYTHON_CMD=python"
    goto :Ready
)

echo ===================================================
echo  ERROR: Python not found.
echo ===================================================
echo.
echo  Run Windows\start-fast-chat.bat once first — it will
echo  download a portable Python next to R-AI.
echo.
pause
exit /b 1

:Ready
%PYTHON_CMD% "%~dp0..\Shared\r-ai-tui.py" %*
