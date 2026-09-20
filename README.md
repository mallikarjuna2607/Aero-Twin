# AeroTwin: AI-Based Digital Twin for UAV Engine Health Monitoring

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-AeroTwin%20Dashboard-0284c7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mallikarjuna2607.github.io/Aero-Twin/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/mallikarjuna2607/Aero-Twin)
[![Problem Statement](https://img.shields.io/badge/DRDO%20%2F%20SIH-SIH26054-blue?style=for-the-badge)](https://github.com/mallikarjuna2607/Aero-Twin)

> 🌐 **Live Interactive Website**: **[https://mallikarjuna2607.github.io/Aero-Twin/](https://mallikarjuna2607.github.io/Aero-Twin/)**  
> 📂 **GitHub Repository**: **[https://github.com/mallikarjuna2607/Aero-Twin](https://github.com/mallikarjuna2607/Aero-Twin)**

### DRDO / Smart India Hackathon Problem Statement SIH26054
**"AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines used in MALE UAVs."**

---

## 🎯 Executive Summary & Academic Dataset Grounding
Publicly available run-to-failure telemetry specifically for MALE-UAV aero-piston engines is scarce in open literature. **AeroTwin** resolves this with an honest, robust, and academically defensible prototype architecture:
1. **Mendeley 3500-DEFault Diesel Engine Dataset**: Real internal-combustion cylinder pressure, cylinder temperatures, manifold dynamics, and misfire/overheating faults.
2. **Mendeley IC Engine Bearing Vibration Dataset**: Tri-axial accelerometer signals capturing rotational assembly wear, crest factor, and bearing degradation.
3. **NASA C-MAPSS Turbofan Degradation Dataset**: Multivariate run-to-failure cycles used to benchmark and calibrate Remaining Useful Life (RUL) regression and Weibull hazard rate models.
4. **C++ Aero-Piston Digital Twin Physics Layer**: A 4-stroke thermodynamics engine computing parallel nominal expected values to track real-time **Digital Twin Differences** (`Actual Sensor - Twin Model`) and **Twin Synchronization %**.

---

## 🚀 Key Features

### 1. Simplified 10-Item Navigation
- 🏠 **Home**: Quick status, rotating turbine visual, glowing health ring, metric cards, twin sync bar.
- 📊 **Live Monitor**: 10 live telemetry channels with real-time strip charts (RPM, CHT, EGT, Oil Pressure, Oil Temp, Fuel Flow, Vibration, Altitude, Ambient Temp, Throttle Load).
- ❤️ **Engine Health**: Composite 0–100 health score, 4-tier condition status (**NORMAL ➔ WATCH ➔ WARNING ➔ CRITICAL**), and subsystem breakdown (Thermal, Lubrication, Mechanical, Combustion).
- ⚠️ **Faults**: Interactive fault injector with physics propagation (Overheating, Low Oil Pressure, High Vibration, Cylinder Misfire, Injector Issue, Sensor Drift).
- 📈 **Predictions**: Prototype RUL estimate in flight hours with confidence bounds and degradation trajectory curve.
- ✈️ **Mission**: Mission simulator with selectable profiles (Normal Flight, Long Endurance, High Altitude, Hot Weather, Rapid Throttle) and real-time **Mission Risk Meter**.
- 🔄 **Replay**: Recorded flight selector (Flights 001–004), interactive timeline scrubber with Play/Pause/Speed, and **Custom CSV Upload & Replay**.
- 🔧 **Maintenance**: Inspection countdown, prioritized maintenance advisories, and **Automatic Post-Flight Report Generator**.
- 📁 **Data**: Dataset explorer showing Mendeley & C-MAPSS metadata, sample rows, and feature explanations.
- ⚙️ **Settings**: Telemetry frequency adjustment, audio alarm toggles, and simulation tolerances.

### 2. Smooth Aerospace Animations
- **RPM-Synchronized Rotating Turbine**: Dynamic SVG blade rotation scaled continuously to current RPM.
- **Glowing Conic Health Ring**: Smooth SVG circular gauge transitioning from green to yellow, orange, and red.
- **Smooth Metric Interpolation**: Telemetry readings tick smoothly without jarring jumps.
- **Live Canvas Waveform Stream**: 60fps antialiased sensor strip chart.

### 3. Advanced Diagnostic Innovations
- **Twin Difference & Synchronization**: Calculates exact variance between physical engine transducers and digital twin expected model.
- **AI Explainability**: Feature contribution bars showing *why* a fault was detected (e.g. Temperature 78%, Vibration 12%, Oil 10%).
- **Sensor Drift vs Engine Fault Discriminator**: Distinguishes single-sensor thermocouple drift from true mechanical engine failure.

---

## 🛠️ Complete Tools Installation (Starting to Ending)
Refer to [docs/installation_guide.md](docs/installation_guide.md) for full screenshots and step-by-step instructions:
1. **VS Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. **Node.js LTS**: [https://nodejs.org/en/download/](https://nodejs.org/en/download/) (v20+ or v22+)
3. **Java JDK**: [https://adoptium.net/](https://adoptium.net/) (Temurin 17 or 21 LTS)
4. **C++ (MinGW-w64 via MSYS2)**: [https://www.msys2.org/](https://www.msys2.org/) (`pacman -S mingw-w64-ucrt-x86_64-gcc`)
5. **Git**: [https://git-scm.com/download/win](https://git-scm.com/download/win)

---

## ⚡ How to Run the Prototype

### Method 1: Instant 1-Click Runner (No extra downloads needed!)
Python 3 is already on your PC:
```powershell
cd AeroTwin
python run_instant_demo.py
```
Open your browser to: **`http://localhost:3000`**

### Method 2: Full Node.js + C++ + Java Stack
```powershell
# 1. Install Node modules
npm install

# 2. Compile C++ engine simulator
cd cpp-engine
.\compile.bat
cd ..

# 3. Compile Java service
cd java-service
.\compile.bat
cd ..

# 4. Start Node.js backend
npm start
```
Open your browser to: **`http://localhost:3000`**

---

## 📂 Project Structure
```
AeroTwin/
├── README.md                          # Project documentation
├── package.json                       # Node.js backend configuration
├── run_project.bat                    # 1-Click launcher
├── run_instant_demo.py                # Instant zero-install prototype runner
│
├── frontend/                          # Animated Aerospace Web Cockpit
│   ├── index.html                     # Cockpit HUD with 10 simple tabs
│   ├── css/                           # Aerospace glassmorphic styling & keyframes
│   └── js/                            # Telemetry animators, Canvas strip chart & controllers
│
├── backend/                           # Node.js REST API & WebSocket Broadcaster
│   ├── server.js                      # Express + WebSocket hub
│   ├── routes/                        # Modular REST endpoints
│   └── services/                      # Rolling telemetry buffers & calculations
│
├── cpp-engine/                        # C++ Aero-Piston Simulator & Physics Twin
│   ├── engine.cpp / engine.h          # 4-stroke thermodynamics model
│   ├── sensors.cpp / sensors.h        # Noise & quantization transducer model
│   ├── faults.cpp / faults.h          # Injected fault dynamics
│   └── main.cpp                       # Real-time NDJSON telemetry stream
│
├── java-service/                      # Java Mission Reliability Service
│   ├── pom.xml                        # Maven configuration
│   └── src/main/java/com/aerotwin/    # RiskAnalyzer, ReliabilityService & ReportGenerator
│
├── ai/                                # AI Layer
│   ├── preprocessing/                 # Feature extraction (RMS, crest factor)
│   ├── training/                      # Model training scripts
│   └── prediction/                    # Zero-dependency real-time inference engine
│
├── data/                              # Grounded Public Datasets & Flight Missions
│   ├── raw/                           # Mendeley Diesel, Bearing & NASA C-MAPSS samples
│   ├── processed/                     # Harmonized 10-channel feature matrix
│   └── sample/                        # Pre-recorded flight missions (Flights 001-004)
│
└── docs/                              # Guides & Documentation
    ├── architecture.md                # System diagrams
    ├── installation_guide.md          # Setup instructions
    ├── sih_drdo_presentation_guide.md # 10-Step jury demonstration script
    └── api.md                         # REST & WebSocket API specification
```
