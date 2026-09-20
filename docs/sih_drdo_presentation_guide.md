# AeroTwin: DRDO / SIH Presentation & Demonstration Script

Use this structured 10-step demonstration flow during your Smart India Hackathon / DRDO jury evaluations.

---

## 1. Opening Pitch (30 seconds)
> *"Respected evaluators, AeroTwin is a real-time digital twin system engineered for health monitoring, fault prediction, and mission reliability enhancement of MALE-UAV aero-piston engines (Problem Statement SIH26054).*
>
> *Because publicly available MALE-UAV aero-piston run-to-failure data is limited in open literature, our methodology is grounded in three established benchmarks: Mendeley 3500-DEFault Diesel Engine data for thermodynamic faults, Mendeley Bearing Vibration data for rotating assembly wear, and NASA C-MAPSS for multivariate RUL degradation. We combined these with a high-speed physics-based aero-piston digital twin simulation layer."*

---

## 2. Step-by-Step Live Demo Flow

### Step 1: Baseline Dashboard (🏠 Home)
- Show the **rotating engine turbine** smoothly spinning at 2350 RPM.
- Highlight the **glowing health ring** showing **94% (NORMAL)**.
- Point to the **Digital Twin Difference** gauge: `95.2% SYNCHRONIZED` (`Actual CHT: 171.0°C vs Twin Model: 170.6°C`).
- Point out that every sensor reading ticks smoothly without sudden jarring jumps.

### Step 2: Live Monitor (📊 Live Monitor)
- Switch to the **Live Monitor** tab.
- Explain the 10 real-time telemetry parameters:
  `RPM, CHT, EGT, Oil Pressure, Oil Temp, Fuel Flow, Vibration, Altitude, Ambient Temp, Throttle Load`.
- Show the live real-time canvas waveform stream continuously plotting trends.

### Step 3: Mission Simulation (✈️ Mission)
- Switch to **Mission**.
- Select **High Altitude** or **Hot Weather Desert**.
- Adjust the Altitude slider to `18,000 ft` and click **"Start Mission Simulation"**.
- Point out how the digital twin dynamically accounts for thin air and ambient temperature drops.

### Step 4: Inject Overheating Fault (⚠️ Faults)
- Switch to **Faults**.
- Click the **"🔥 Overheating"** fault injection button.
- Walk the jury through the chain reaction:
  1. Cylinder Head Temp (CHT) climbs from `171°C ➔ 188°C ➔ 205°C`.
  2. Health score drops from `94% ➔ 84% (WATCH) ➔ 68% (WARNING)`.
  3. Status beacon turns amber/red.
  4. Digital Twin Synchronization drops from `95% ➔ 72%` as physical behavior departs from expected model!

### Step 5: AI Explanation & Maintenance Advice (⚠️ Faults)
- Show the **AI Explanation bars**:
  - The system explains *why* the fault was detected (e.g. `Temperature contribution: 78%`).
- Read the AI recommendation: *"Inspect cylinder cooling air ducting, radiator coolant circulation, and baffles."*

### Step 6: Highlight Feature — Transducer Drift vs Engine Fault (⚠️ Faults)
- Click **"Reset to Normal"**, then click **"📡 Sensor Drift (Transducer Error)"**.
- Show that only CHT spikes to 248°C, while EGT, Oil Pressure, and Vibration remain completely normal.
- Point to the blue alert banner:
  > *"TRANSDUCER DRIFT DISCRIMINATED: Identified as an instrumentation transducer error, not a mechanical engine failure."*
- Explain: *"This prevents unnecessary emergency landings or false engine teardowns!"*

### Step 7: Remaining Useful Life & Predictions (📈 Predictions)
- Switch to **Predictions**.
- Show the prototype RUL estimate: `42 Flight Hours remaining` with `84% Confidence`.
- Explain how the degradation model forecasts wear horizons based on historical run-to-failure cycles.

### Step 8: Mission Risk Elevation (✈️ Mission)
- Show how the **Mission Risk Meter** elevated from `LOW (14/100)` to `HIGH/CRITICAL` due to thermal and health penalties.

### Step 9: Replay Historical Flight & Custom CSV (🔄 Replay)
- Switch to **Replay**.
- Select **Flight 003 - Cooling System Overheat** or load a custom CSV.
- Scrub the timeline slider and press **Play (2x speed)**.
- Demonstrate how flight telemetry can be re-analyzed second-by-second post-mission.

### Step 10: Automatic Flight Intelligence Report (🔧 Maintenance)
- Switch to **Maintenance**.
- Click **"📑 GENERATE POST-FLIGHT REPORT"**.
- Show the formatted flight report modal displaying:
  - Extreme peaks (Max RPM, Max CHT, Min Oil Pressure, Max Vibration)
  - Logged anomaly count
  - Computed mission risk category
  - Official maintenance directives
- Click Print / Save PDF.

---

## 3. Concluding Statement
> *"By integrating high-frequency physical simulation, multi-class AI fault discrimination, and digital twin deviation monitoring into a responsive aerospace dashboard, AeroTwin provides commanders and ground crews with total situational awareness and predictive maintenance confidence."*
