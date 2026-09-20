# AeroTwin Architecture & Technical Flow

## End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GROUNDED PUBLIC DATA BENCHMARKS                     │
│  • Mendeley 3500-DEFault (Internal Combustion Piston Faults)            │
│  • Mendeley 3fcrrdjjvk (IC Engine Journal Bearing Vibration)            │
│  • NASA C-MAPSS (Multivariate Run-to-Failure Degradation & RUL)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 C++ PHYSICAL DIGITAL TWIN & SIMULATOR                   │
│  • 4-Stroke Aero-Piston Thermodynamic Simulator (RPM, CHT, EGT, Oil)    │
│  • Expected Physics Model vs Actual Physical Transducers                │
│  • Interactive Fault Injector (Thermal, Pressure, Vibration, Misfire)   │
│  • Real-time Twin Difference: Actual - Expected (Sync %)                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS / WEBSOCKET HUB                    │
│  • High-Frequency WebSocket Broadcaster (2Hz / 500ms Push)             │
│  • Telemetry Buffer & Peak Boundary Tracker                            │
│  • REST APIs for Mission Profiles, Replay Timelines & Fault Injection   │
└─────────────┬─────────────────────────────────────────────┬─────────────┘
              │                                             │
              ▼                                             ▼
┌───────────────────────────┐                 ┌───────────────────────────┐
│  AI DIAGNOSTIC ENGINE     │                 │   JAVA RELIABILITY ENGINE │
│  • Multi-Class Classifier │                 │  • Weibull Hazard Rate    │
│  • Sensor Drift Detector  │                 │  • MTBF Calculation       │
│  • SHAP-Style Explanation │                 │  • Mission Risk Analyzer  │
│  • Prototype RUL Regressor│                 │  • Flight Report Builder  │
└─────────────┬─────────────┘                 └─────────────┬─────────────┘
              │                                             │
              └──────────────────────┬──────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AEROTWIN WEB COCKPIT (HTML5 / CSS3 / JS)            │
│  • 10 Simplified Navigation Tabs with Glassmorphic Cockpit Aesthetic    │
│  • Smooth GPU-Accelerated Rotating Turbine Visual (Linked to RPM)       │
│  • Glowing Dynamic Health Ring Gauge (Normal ➔ Watch ➔ Warning ➔ Crit)  │
│  • Real-Time Multi-Channel HTML5 Canvas Telemetry Strip Chart           │
│  • Interactive Scrubber Replay & Custom CSV Telemetry Ingestion         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dataflow Description
1. **Telemetry Generation**: Physical sensors and digital twin expected values are synthesized according to aerodynamic load and ambient atmospheric altitude regimes.
2. **Deviation Tracking**: Real-time divergence metrics (`Actual - Twin`) quantify thermodynamic or mechanical breakdown.
3. **AI Inference**: Telemetry packets undergo multi-class classification and correlation validation (discriminating single-transducer drift from true mechanical faults).
4. **Reliability & Mission Assessment**: Probability of mission failure and risk categorization (LOW, MEDIUM, HIGH, CRITICAL) are computed.
5. **HUD Delivery**: Updates are pushed over low-latency WebSockets directly to the web client, smoothly animating gauges, meters, and charts.
