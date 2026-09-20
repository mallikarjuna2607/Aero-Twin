@echo off
title AeroTwin - DRDO / SIH UAV Engine Health Digital Twin
cls
echo ==============================================================================
echo       AEROTWIN - AI-BASED DIGITAL TWIN FOR UAV ENGINE HEALTH MONITORING
echo              DRDO / Smart India Hackathon Problem Statement SIH26054
echo ==============================================================================
echo.
echo Select Execution Mode:
echo   [1] Instant Prototype Runner (Runs immediately using installed Python)
echo   [2] Node.js Backend Server (Requires Node.js installed)
echo   [3] Compile C++ Engine Simulator (Requires MinGW g++)
echo   [4] Compile Java Mission Service (Requires JDK javac)
echo   [5] Exit
echo.
set /p opt="Enter option [1-5]: "

if "%opt%"=="1" (
    echo.
    echo Starting instant prototype server at http://localhost:3000 ...
    python run_instant_demo.py
    goto end
)

if "%opt%"=="2" (
    echo.
    echo Launching Node.js Backend...
    node backend/server.js
    goto end
)

if "%opt%"=="3" (
    echo.
    cd cpp-engine
    call compile.bat
    cd ..
    goto end
)

if "%opt%"=="4" (
    echo.
    cd java-service
    call compile.bat
    cd ..
    goto end
)

:end
pause
