# AeroTwin REST & WebSocket API Specification

Base URL: `http://localhost:3000` (or WebSocket `ws://localhost:3000`)

---

## 1. REST Endpoints

### Telemetry
- `GET /api/telemetry/latest`: Returns the most recent synchronized telemetry packet.
- `GET /api/telemetry/history?limit=50`: Returns the circular history buffer for trend plotting.
- `POST /api/telemetry/conditions`: Updates simulated atmospheric parameters (`altitude`, `ambientTemp`, `throttle`).

### Engine & Digital Twin
- `GET /api/engine/twin`: Returns parallel `actual`, `twinExpected`, `twinDifference`, and `syncPercentage`.
- `GET /api/engine/status`: Returns high-level operational status, RPM, and health score.

### Faults & Diagnostics
- `POST /api/faults/inject`: Injects a fault condition. Body: `{"fault": "OVERHEATING", "severity": 1.0}`.
- `POST /api/faults/reset`: Clears all injected faults and restores nominal operation.
- `GET /api/faults/status`: Returns current active fault and AI diagnosis.

### Mission & Predictions
- `GET /api/mission/profiles`: Returns predefined UAV operational profiles.
- `POST /api/mission/start`: Configures active sortie envelope. Body: `{"profileId": "HIGH_ALTITUDE"}`.
- `GET /api/mission/risk`: Returns multi-factor mission risk assessment.
- `GET /api/prediction/rul`: Returns estimated remaining useful flight hours and confidence.
- `POST /api/reports/generate`: Compiles and returns post-flight mission intelligence summary.

### Data & Replay
- `GET /api/data/datasets`: Metadata for Mendeley and NASA datasets.
- `GET /api/data/view/:id`: Returns first sample rows of a specific dataset CSV.
- `GET /api/replay/flights`: Catalog of pre-recorded mission replay flights.
- `GET /api/replay/load/:id`: Telemetry timeline array for interactive scrubbing.

---

## 2. WebSocket Protocol
- **Client ➔ Server Messages**:
  - `{"type": "INJECT_FAULT", "fault": "LOW_OIL_PRESSURE", "severity": 1.0}`
  - `{"type": "RESET_FAULT"}`
  - `{"type": "SET_CONDITIONS", "altitude": 15000, "temperature": 5}`
- **Server ➔ Client Broadcast**:
  - `{"type": "TELEMETRY_UPDATE", "data": { ...packet... }}` (emitted every 500ms / 2Hz)
