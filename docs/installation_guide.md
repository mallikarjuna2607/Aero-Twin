# AeroTwin: Complete PC Tools Installation Guide (From Starting to Ending)

This guide walks you through setting up all necessary software, compilers, runtimes, and tools from scratch on Windows for the **AeroTwin** DRDO / SIH project in Visual Studio Code.

---

## Quick Summary of Required Tools
| Tool | Purpose | Version |
|---|---|---|
| **Python** | Instant zero-install prototype & AI training | Python 3.10+ (already on your PC) |
| **VS Code** | Code editor & integrated terminal | Latest |
| **Node.js** | Backend server & real-time WebSocket hub | v20.x or v22.x LTS |
| **Java JDK** | Mission reliability & risk microservice | OpenJDK 17 or JDK 21/25 LTS |
| **C++ (MinGW-w64)** | High-speed aero-piston physics simulator | GCC 11+ via MSYS2 / MinGW |
| **Git** | Version control & repository tracking | Latest |

---

## Step 1: Install Visual Studio Code (VS Code)
1. Visit the official website: [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. Click **"Download for Windows"** (User Installer x64).
3. Run the installer:
   - Check the boxes:
     - `[x] Add "Open with Code" action to Windows Explorer file context menu`
     - `[x] Add "Open with Code" action to Windows Explorer directory context menu`
     - `[x] Add to PATH (requires shell restart)`
4. Click **Finish**.

---

## Step 2: Install Recommended VS Code Extensions
Open VS Code, press `Ctrl + Shift + X` (Extensions view), and search & install:
1. **Live Server** (by Ritwick Dey) — for quick HTML preview
2. **C/C++** (by Microsoft) — for C++ syntax highlighting and debugging
3. **Extension Pack for Java** (by Microsoft) — for Java development
4. **Prettier - Code formatter** — for clean code formatting
5. **GitLens** — for Git commit history

---

## Step 3: Install Node.js & NPM
1. Visit: [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
2. Choose **LTS (Recommended for Most Users)**.
3. Run the `.msi` installer, keep default settings, and ensure **"Add to PATH"** is selected.
4. Verify in a new Command Prompt (`cmd`) or PowerShell:
   ```powershell
   node -v
   npm -v
   ```
   You should see output like `v22.x.x` and `10.x.x`.

---

## Step 4: Install Java Development Kit (JDK)
1. Download OpenJDK from Adoptium: [https://adoptium.net/temurin/releases/](https://adoptium.net/temurin/releases/) (Temurin 17 or 21 LTS).
   *(Or Oracle JDK: https://www.oracle.com/java/technologies/downloads/)*
2. Run the `.msi` installer.
3. In custom setup, select:
   - `[x] Set JAVA_HOME variable`
   - `[x] Add to PATH`
4. Verify in a new terminal:
   ```powershell
   java -version
   javac -version
   ```

---

## Step 5: Install C++ Compiler (GCC / G++) via MSYS2
1. Download MSYS2 installer: [https://www.msys2.org/](https://www.msys2.org/)
2. Run installer and install to default directory `C:\msys64`.
3. When finished, open the **MSYS2 UCRT64** terminal from your Start Menu.
4. Run the package manager command to install GCC toolchain:
   ```bash
   pacman -S --noconfirm mingw-w64-ucrt-x86_64-gcc mingw-w64-ucrt-x86_64-make
   ```
5. Add GCC to your Windows PATH:
   - Press Windows Key, search **"Environment Variables"**
   - Under *System Variables*, edit `Path`
   - Add: `C:\msys64\ucrt64\bin`
   - Click OK.
6. Verify in PowerShell:
   ```powershell
   g++ --version
   ```

---

## Step 6: Install Git
1. Download from: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer with standard options.
3. Verify:
   ```powershell
   git --version
   ```

---

## Step 7: Running the AeroTwin Prototype

You have **two convenient ways** to run AeroTwin:

### Option A: Instant 1-Click Zero-Install Runner (Using Installed Python)
Because Python 3 is already on your PC, you can run the working animated prototype **right now**:
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd AeroTwin
   python run_instant_demo.py
   ```
2. Open your browser to: **`http://localhost:3000`**
3. You will immediately see the full animated dashboard with rotating turbine, live telemetry stream, fault injection, and replay scrubber!

### Option B: Full Stack Multi-Language Execution (Node.js + C++ + Java)
Once Node.js, GCC, and Java are installed:
1. **Install Node dependencies**:
   ```powershell
   cd AeroTwin
   npm install
   ```
2. **Compile C++ Engine Simulator**:
   ```powershell
   cd cpp-engine
   .\compile.bat
   cd ..
   ```
3. **Compile Java Mission Reliability Service**:
   ```powershell
   cd java-service
   .\compile.bat
   cd ..
   ```
4. **Launch Node.js Backend**:
   ```powershell
   npm start
   ```
5. Open your browser to: **`http://localhost:3000`**
