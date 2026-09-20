@echo off
echo =======================================================
echo Compiling AeroTwin C++ Physics Simulator & Digital Twin
echo =======================================================
g++ -O3 -std=c++11 main.cpp engine.cpp sensors.cpp faults.cpp -o aerotwin_engine.exe
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] aerotwin_engine.exe compiled successfully!
    echo Run: aerotwin_engine.exe --fault NONE 50
) else (
    echo [ERROR] Compilation failed. Ensure g++ (MinGW-w64) is in your PATH.
)
pause
