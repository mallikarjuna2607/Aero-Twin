@echo off
echo ========================================================
echo Compiling AeroTwin Java Mission Reliability Service
echo ========================================================
if exist bin rd /s /q bin
mkdir bin
javac -d bin src/main/java/com/aerotwin/*.java
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Java service compiled successfully!
    echo Running demo:
    java -cp bin com.aerotwin.Main --report-demo
) else (
    echo [ERROR] Compilation failed. Ensure JDK (javac) is installed and in PATH.
)
pause
