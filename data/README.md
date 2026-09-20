# AeroTwin Datasets & Academic Grounding

## Problem Statement Alignment
**SIH26054 / DRDO**: *"AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines used in MALE UAVs."*

Because publicly available MALE-UAV aero-piston run-to-failure telemetry is limited in open research literature, the AeroTwin prototype combines three authoritative open benchmarks with a physics-inspired aero-piston digital twin simulation layer:

---

### 1. Dataset A — Diesel Engine Faults (3500-DEFault)
- **Source**: Mendeley Data / Open Research Archive
- **DOI / Reference**: [Mendeley Data - Diesel Engine Faults (k22zxz29kr)](https://data.mendeley.com/datasets/k22zxz29kr/1)
- **Features Captured**:
  - Cylinder internal pressure (bar)
  - Cylinder head & exhaust temperatures (°C)
  - Torsional crankshaft vibration (mm/s, RMS)
  - Manifold intake pressure and fuel delivery rates
- **Engine Fault Classes**:
  - `NORMAL`: Healthy thermodynamic & combustion balance
  - `OVERHEATING`: High CHT/EGT indicating coolant or oil circulation deficit
  - `MISFIRE`: Cylinder combustion drop, sudden torque fluctuation
  - `VALVE_FAULT`: Intake/exhaust valve leakage, compression drop
  - `INJECTOR_FAULT`: Uneven fuel distribution, lean/rich burn
- **File**: `data/raw/diesel_engine_faults_sample.csv`

---

### 2. Dataset B — IC Engine Bearing Vibration Dataset
- **Source**: Mendeley Data
- **DOI / Reference**: [Mendeley Data - IC Engine Bearing Dataset (3fcrrdjjvk)](https://data.mendeley.com/datasets/3fcrrdjjvk)
- **Features Captured**:
  - Tri-axial accelerometer vibration signals (X, Y, Z axis)
  - Bearing oil film temperature
  - Peak-to-peak amplitude, Crest Factor, Kurtosis
- **Application in AeroTwin**:
  - Provides empirical vibration baselines for rotating assembly and journal bearing degradation.
  - Feeds vibration anomaly detection and mechanical wear health index.
- **File**: `data/raw/bearing_vibration_sample.csv`

---

### 3. Dataset C — NASA C-MAPSS Turbofan Degradation Dataset
- **Source**: NASA Prognostics Center of Excellence (PCoE)
- **Reference**: [NASA C-MAPSS Aircraft Engine Dataset](https://data.nasa.gov/dataset/cmapss-jet-engine-simulated-data)
- **Important Technical Disclosure**:
  - C-MAPSS captures aircraft turbofan run-to-failure cycles.
  - It is used in AeroTwin as an established benchmark for **Remaining Useful Life (RUL) regression algorithms** and exponential degradation modeling.
  - The degradation curve parameters (Weibull hazard rate, exponential wear envelope) are adapted to UAV aero-piston flight hours.
- **File**: `data/raw/nasa_cmapss_sample.csv`

---

### 4. Harmonized UAV Piston Engine Features & Flight Missions
- **File**: `data/processed/uav_piston_engine_features.csv`
  - Normalized multi-sensor matrix mapping public datasets to 10 UAV aero-piston telemetry channels.
- **Flight Missions**:
  - `data/sample/flight_001_normal_patrol.csv`: 2-hour nominal surveillance mission at 10,000 ft.
  - `data/sample/flight_002_high_altitude.csv`: Ceiling endurance climb to 18,000 ft with thin air mixture compensation.
  - `data/sample/flight_003_thermal_overheat.csv`: Progressive cooling failure scenario showing warning propagation.
  - `data/sample/flight_004_bearing_degradation.csv`: Journal bearing friction build-up leading to high vibration.
