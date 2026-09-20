#!/usr/bin/env python3
"""
AeroTwin Instant Zero-Install Prototype Runner
Runs a complete simulated REST and streaming server using Python 3 built-in libraries.
Allows running and demonstrating the full web dashboard immediately in VS Code.
"""

import http.server
import socketserver
import json
import os
import math
import time
import threading
from urllib.parse import urlparse, parse_qs

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DATA_DIR = os.path.join(BASE_DIR, "data")

class EngineSimulator:
    def __init__(self):
        self.sim_time = 0.0
        self.active_fault = "NONE"
        self.severity = 1.0
        self.altitude = 10000.0
        self.ambient_temp = 18.0
        self.throttle = 0.72
        self.history = []
        self.peaks = {
            "maxRpm": 2350, "maxCht": 171, "maxEgt": 648,
            "minOilPressure": 4.2, "maxVibration": 2.1, "anomaliesCount": 0
        }
        self.lock = threading.Lock()

    def step(self, dt=0.5):
        with self.lock:
            self.sim_time += dt
            alt_ratio = self.altitude / 10000.0
            
            # Expected Digital Twin Physics
            exp_rpm = 2000.0 + (self.throttle * 500.0)
            exp_cht = 150.0 + (self.throttle * 30.0) + (self.ambient_temp * 0.1)
            exp_egt = 580.0 + (self.throttle * 90.0) - (alt_ratio * 5.0)
            exp_oil_p = 4.3 - (self.throttle * 0.2)
            exp_oil_t = 85.0 + (self.throttle * 10.0)
            exp_fuel = 12.0 + (self.throttle * 8.5) * (1.0 - alt_ratio * 0.05)
            exp_vib = 1.8 + (self.throttle * 0.4)

            twin_expected = {
                "rpm": round(exp_rpm),
                "cht": round(exp_cht, 1),
                "egt": round(exp_egt, 1),
                "oilPressure": round(exp_oil_p, 2),
                "oilTemperature": round(exp_oil_t, 1),
                "fuelFlow": round(exp_fuel, 1),
                "vibration": round(exp_vib, 2)
            }

            # Actual Physical Sensor Values (with noise & fault propagation)
            rpm = exp_rpm + math.sin(self.sim_time * 2.5) * 6.0
            cht = exp_cht + math.sin(self.sim_time * 0.8) * 0.5
            egt = exp_egt + math.sin(self.sim_time * 1.1) * 1.5
            oil_p = exp_oil_p
            oil_t = exp_oil_t + math.sin(self.sim_time * 0.5) * 0.4
            fuel = exp_fuel
            vib = exp_vib

            # Fault dynamics
            if self.active_fault == "OVERHEATING":
                cht += (36.0 * self.severity) + min(25.0, self.sim_time * 0.2)
                egt += (78.0 * self.severity)
                oil_t += (26.0 * self.severity)
                oil_p -= (0.45 * self.severity)
                vib += (0.6 * self.severity)
            elif self.active_fault == "LOW_OIL_PRESSURE":
                oil_p = max(1.3, oil_p - (2.6 * self.severity))
                oil_t += (24.0 * self.severity)
                vib += (1.1 * self.severity)
            elif self.active_fault == "HIGH_VIBRATION":
                vib += (6.8 * self.severity)
                oil_t += (9.0 * self.severity)
            elif self.active_fault == "MISFIRE":
                rpm -= (140.0 * self.severity) + math.sin(self.sim_time * 18.0) * 55.0
                cht -= (20.0 * self.severity)
                egt -= (65.0 * self.severity)
                vib += (3.4 * self.severity)
                fuel -= (2.8 * self.severity)
            elif self.active_fault == "INJECTOR_FAULT":
                egt += (70.0 * self.severity)
                fuel += (4.8 * self.severity)
                vib += (1.5 * self.severity)
            elif self.active_fault == "SENSOR_DRIFT":
                # Transducer drift: only CHT jumps
                cht += (78.0 * self.severity)

            # Health calculation
            health = 100.0
            if cht > 185.0: health -= (cht - 185.0) * 1.6
            if egt > 710.0: health -= (egt - 710.0) * 0.4
            if oil_p < 3.2: health -= (3.2 - oil_p) * 28.0
            if oil_t > 105.0: health -= (oil_t - 105.0) * 1.5
            if vib > 3.0: health -= (vib - 3.0) * 13.0
            health = max(10.0, min(100.0, health))

            condition = "NORMAL"
            if health < 60.0: condition = "CRITICAL"
            elif health < 75.0: condition = "WARNING"
            elif health < 88.0: condition = "WATCH"

            actual = {
                "rpm": round(rpm),
                "cht": round(cht, 1),
                "egt": round(egt, 1),
                "oilPressure": round(oil_p, 2),
                "oilTemperature": round(oil_t, 1),
                "fuelFlow": round(fuel, 1),
                "vibration": round(vib, 2),
                "altitude": round(self.altitude),
                "ambientTemp": round(self.ambient_temp, 1),
                "engineLoad": round(self.throttle * 100.0),
                "healthScore": round(health, 1),
                "condition": condition
            }

            # Peaks
            self.peaks["maxRpm"] = max(self.peaks["maxRpm"], actual["rpm"])
            self.peaks["maxCht"] = max(self.peaks["maxCht"], actual["cht"])
            self.peaks["maxEgt"] = max(self.peaks["maxEgt"], actual["egt"])
            self.peaks["minOilPressure"] = min(self.peaks["minOilPressure"], actual["oilPressure"])
            self.peaks["maxVibration"] = max(self.peaks["maxVibration"], actual["vibration"])
            if condition in ["WARNING", "CRITICAL"]:
                self.peaks["anomaliesCount"] += 1

            # Twin Difference
            rpm_diff = abs(actual["rpm"] - twin_expected["rpm"])
            cht_diff = abs(actual["cht"] - twin_expected["cht"])
            egt_diff = abs(actual["egt"] - twin_expected["egt"])
            oil_diff = abs(actual["oilPressure"] - twin_expected["oilPressure"])
            vib_diff = abs(actual["vibration"] - twin_expected["vibration"])
            err_sum = (rpm_diff/2350*20) + (cht_diff/170*25) + (egt_diff/640*20) + (oil_diff/4.2*20) + (vib_diff/2.0*15)
            sync_pct = max(10.0, min(100.0, 100.0 - err_sum))

            twin_diff = {
                "rpmDiff": round(rpm_diff, 1),
                "chtDiff": round(cht_diff, 1),
                "egtDiff": round(egt_diff, 1),
                "oilPressureDiff": round(oil_diff, 2),
                "vibDiff": round(vib_diff, 2),
                "syncPercentage": round(sync_pct, 1)
            }

            # AI Diagnosis & Discrimination
            ai_diag = self.run_ai_diagnosis(actual)

            # RUL Prediction
            rul_hours = max(2, round((health / 100.0) * 58.0 if health >= 70.0 else (health - 50.0) * 1.2))
            rul_prediction = {
                "estimatedFlightHours": rul_hours,
                "confidence": 84,
                "degradationRate": "-0.38% / flight hr",
                "status": "NOMINAL" if rul_hours > 30 else ("WATCH" if rul_hours > 12 else "URGENT")
            }

            # Mission Risk
            risk_score = 100 - health
            if self.altitude > 15000: risk_score += 10
            risk_score = max(5, min(100, round(risk_score)))
            risk_category = "LOW" if risk_score < 30 else ("MEDIUM" if risk_score < 60 else ("HIGH" if risk_score < 80 else "CRITICAL"))

            packet = {
                "timestamp": round(self.sim_time, 1),
                "actual": actual,
                "twinExpected": twin_expected,
                "twinDifference": twin_diff,
                "aiDiagnosis": ai_diag,
                "rulPrediction": rul_prediction,
                "missionRisk": {
                    "riskScore": risk_score,
                    "riskCategory": risk_category,
                    "factors": [f"Current condition: {condition}", f"Active fault: {self.active_fault}"]
                },
                "activeFault": self.active_fault
            }

            self.history.append(packet)
            if len(self.history) > 100:
                self.history.pop(0)

            return packet

    def run_ai_diagnosis(self, data):
        # Sensor drift discrimination
        cht_dev = abs(data["cht"] - 171.0)
        egt_dev = abs(data["egt"] - 648.0)
        oil_t_dev = abs(data["oilTemperature"] - 92.0)
        if cht_dev > 50.0 and egt_dev < 15.0 and oil_t_dev < 8.0:
            return {
                "fault": "SENSOR_DRIFT",
                "label": "Transducer Drift (CHT Sensor Error)",
                "confidence": 0.96,
                "severity": "WARNING",
                "explanation": {"Sensor Discrepancy": 86, "Harness Impedance": 10, "Engine Dynamics": 4},
                "recommendation": "Recalibrate or replace CHT thermocouple transducer harness."
            }

        if data["cht"] > 185.0 or data["egt"] > 710.0:
            return {
                "fault": "OVERHEATING",
                "label": "Engine Thermal Overheating",
                "confidence": 0.94,
                "severity": "CRITICAL" if data["cht"] > 200 else "WARNING",
                "explanation": {"Temperature (CHT/EGT)": 78, "Vibration": 12, "Oil Pressure": 10},
                "recommendation": "Inspect cooling air ducting, radiator coolant circulation, and cylinder baffles."
            }
        elif data["oilPressure"] < 2.5:
            return {
                "fault": "LOW_OIL_PRESSURE",
                "label": "Lubrication Pressure Deficiency",
                "confidence": 0.95,
                "severity": "CRITICAL",
                "explanation": {"Oil Pressure": 82, "Oil Temp": 12, "RPM": 6},
                "recommendation": "Check oil scavenge pump, filter screen for metal particles, and sump level."
            }
        elif data["vibration"] > 4.5:
            return {
                "fault": "HIGH_VIBRATION",
                "label": "Bearing / Rotating Assembly Anomaly",
                "confidence": 0.93,
                "severity": "CRITICAL" if data["vibration"] > 6.0 else "WARNING",
                "explanation": {"Vibration (RMS)": 84, "Temperature": 10, "RPM Variance": 6},
                "recommendation": "Check journal bearings, propeller hub dynamic balance, and mounting dampers."
            }
        elif self.active_fault == "MISFIRE":
            return {
                "fault": "MISFIRE",
                "label": "Cylinder Combustion Misfire",
                "confidence": 0.91,
                "severity": "WARNING",
                "explanation": {"RPM Instability": 65, "Vibration": 25, "EGT Drop": 10},
                "recommendation": "Inspect dual spark ignition system and fuel injectors."
            }
        elif self.active_fault == "INJECTOR_FAULT":
            return {
                "fault": "INJECTOR_FAULT",
                "label": "Fuel Injector Imbalance",
                "confidence": 0.89,
                "severity": "WATCH",
                "explanation": {"EGT Disparity": 68, "Fuel Flow": 22, "Vibration": 10},
                "recommendation": "Clean and calibrate high-pressure fuel injectors."
            }
        else:
            return {
                "fault": "NONE",
                "label": "Normal Operation",
                "confidence": 0.98,
                "severity": "NORMAL",
                "explanation": {"Temperature": 25, "Vibration": 25, "Oil Pressure": 25, "RPM": 25},
                "recommendation": "Engine healthy. Continue nominal flight profile."
            }

sim = EngineSimulator()

# Background thread for simulation tick
def sim_worker():
    while True:
        sim.step(0.5)
        time.sleep(0.5)

sim_thread = threading.Thread(target=sim_worker, daemon=True)
sim_thread.start()

class AeroTwinHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_get(path, parse_qs(parsed.query))
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        self.handle_api_post(path, payload)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_api_get(self, path, query):
        if path == "/api/health":
            self.send_json({"status": "ONLINE", "mode": "AEROTWIN_INSTANT_PYTHON_PROTOTYPE"})
        elif path == "/api/telemetry/latest":
            latest = sim.history[-1] if sim.history else sim.step(0.5)
            self.send_json(latest)
        elif path == "/api/telemetry/history":
            self.send_json(sim.history[-50:])
        elif path == "/api/engine/twin":
            latest = sim.history[-1] if sim.history else sim.step(0.5)
            self.send_json({
                "actual": latest["actual"],
                "twinExpected": latest["twinExpected"],
                "twinDifference": latest["twinDifference"],
                "activeFault": latest["activeFault"]
            })
        elif path == "/api/engine/status":
            latest = sim.history[-1] if sim.history else sim.step(0.5)
            self.send_json({
                "status": "ONLINE",
                "rpm": latest["actual"]["rpm"],
                "healthScore": latest["actual"]["healthScore"],
                "condition": latest["actual"]["condition"],
                "syncPercentage": latest["twinDifference"]["syncPercentage"]
            })
        elif path == "/api/mission/profiles":
            profiles = [
                {"id": "NORMAL", "name": "Normal Flight", "altitude": 10000, "duration": 180, "temp": 18, "desc": "Nominal surveillance patrol"},
                {"id": "LONG_ENDURANCE", "name": "Long Endurance", "altitude": 12000, "duration": 840, "temp": 14, "desc": "Extended loiter surveillance profile"},
                {"id": "HIGH_ALTITUDE", "name": "High Altitude", "altitude": 18000, "duration": 240, "temp": -5, "desc": "Upper airspace envelope exploration"},
                {"id": "HOT_WEATHER", "name": "Hot Weather Desert", "altitude": 8000, "duration": 210, "temp": 42, "desc": "Severe ambient thermal test"},
                {"id": "RAPID_THROTTLE", "name": "Rapid Throttle Tactical", "altitude": 9000, "duration": 90, "temp": 24, "desc": "High transient tactical maneuvering"}
            ]
            self.send_json(profiles)
        elif path == "/api/mission/risk":
            latest = sim.history[-1] if sim.history else sim.step(0.5)
            self.send_json(latest["missionRisk"])
        elif path == "/api/data/datasets":
            self.send_json({
                "datasets": [
                    {"id": "diesel_faults", "title": "Diesel Engine Fault Dataset (3500-DEFault)", "source": "Mendeley Data", "type": "Piston Engine Faults"},
                    {"id": "bearing_vibration", "title": "IC Engine Bearing Vibration Dataset", "source": "Mendeley Data", "type": "Bearing Vibration RMS"},
                    {"id": "nasa_cmapss", "title": "NASA C-MAPSS Turbofan Degradation", "source": "NASA PCoE", "type": "RUL Benchmark"}
                ]
            })
        elif path.startswith("/api/data/view/"):
            ds_id = path.replace("/api/data/view/", "")
            file_map = {
                "diesel_faults": os.path.join(DATA_DIR, "raw", "diesel_engine_faults_sample.csv"),
                "bearing_vibration": os.path.join(DATA_DIR, "raw", "bearing_vibration_sample.csv"),
                "nasa_cmapss": os.path.join(DATA_DIR, "raw", "nasa_cmapss_sample.csv")
            }
            target = file_map.get(ds_id, file_map["diesel_faults"])
            if os.path.exists(target):
                with open(target, 'r') as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                    headers = lines[0].split(',')
                    rows = [dict(zip(headers, l.split(','))) for l in lines[1:12]]
                    self.send_json({"headers": headers, "rows": rows, "totalRows": len(lines)-1})
            else:
                self.send_json({"error": "File not found"}, 404)
        elif path == "/api/replay/flights":
            self.send_json({
                "flights": [
                    {"id": "flight_001", "name": "Flight 001 - Nominal Surveillance Cruise", "file": "flight_001_normal_patrol.csv", "duration": "20 min", "fault": "None (Healthy)"},
                    {"id": "flight_002", "name": "Flight 002 - High Altitude Envelope Test", "file": "flight_002_high_altitude.csv", "duration": "18 min", "fault": "Thin Air Thermal Watch"},
                    {"id": "flight_003", "name": "Flight 003 - Cooling System Overheat", "file": "flight_003_thermal_overheat.csv", "duration": "15 min", "fault": "Coolant Pump Failure"},
                    {"id": "flight_004", "name": "Flight 004 - Journal Bearing Vibration", "file": "flight_004_bearing_degradation.csv", "duration": "15 min", "fault": "Bearing Mechanical Wear"}
                ]
            })
        elif path.startswith("/api/replay/load/"):
            f_id = path.replace("/api/replay/load/", "")
            flight_files = {
                "flight_001": "flight_001_normal_patrol.csv",
                "flight_002": "flight_002_high_altitude.csv",
                "flight_003": "flight_003_thermal_overheat.csv",
                "flight_004": "flight_004_bearing_degradation.csv"
            }
            fname = flight_files.get(f_id, f"{f_id}.csv" if not f_id.endswith(".csv") else f_id)
            fpath = os.path.join(DATA_DIR, "sample", fname)
            if os.path.exists(fpath):
                with open(fpath, 'r') as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                    headers = lines[0].split(',')
                    rows = []
                    for l in lines[1:]:
                        parts = l.split(',')
                        row = {}
                        for i, h in enumerate(headers):
                            try:
                                row[h] = float(parts[i])
                            except Exception:
                                row[h] = parts[i]
                        rows.append(row)
                    self.send_json({"flightId": f_id, "totalSteps": len(rows), "timeline": rows})
            else:
                self.send_json({"error": "Not found"}, 404)
        else:
            self.send_json({"error": "Unknown API endpoint"}, 404)

    def handle_api_post(self, path, payload):
        if path == "/api/faults/inject":
            fault = payload.get("fault", "NONE")
            severity = float(payload.get("severity", 1.0))
            with sim.lock:
                sim.active_fault = fault.upper()
                sim.severity = severity
            self.send_json({"status": "SUCCESS", "activeFault": sim.active_fault, "severity": sim.severity})
        elif path == "/api/faults/reset":
            with sim.lock:
                sim.active_fault = "NONE"
                sim.severity = 0.0
            self.send_json({"status": "CLEARED", "activeFault": "NONE"})
        elif path == "/api/mission/start":
            alt = float(payload.get("altitude", 10000.0))
            temp = float(payload.get("temperature", 18.0))
            with sim.lock:
                sim.altitude = alt
                sim.ambient_temp = temp
            self.send_json({"status": "STARTED", "altitude": alt, "temperature": temp})
        elif path == "/api/reports/generate":
            latest = sim.history[-1] if sim.history else sim.step(0.5)
            report = {
                "reportId": f"REP-{int(time.time()*1000)%1000000}",
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "missionName": "MALE-UAV Tactical Sortie",
                "durationMinutes": round((sim.sim_time / 60.0) + 18.5, 1),
                "stats": {
                    "maxRpm": round(sim.peaks["maxRpm"]),
                    "maxCht": round(sim.peaks["maxCht"], 1),
                    "maxEgt": round(sim.peaks["maxEgt"], 1),
                    "minOilPressure": round(sim.peaks["minOilPressure"], 2),
                    "maxVibration": round(sim.peaks["maxVibration"], 2),
                    "finalHealth": round(latest["actual"]["healthScore"], 1)
                },
                "anomaliesLogged": sim.peaks["anomaliesCount"],
                "riskSummary": f"{latest['missionRisk']['riskCategory']} Risk Level",
                "maintenanceAction": latest["aiDiagnosis"]["recommendation"]
            }
            self.send_json(report)
        else:
            self.send_json({"error": "Endpoint not supported"}, 404)

print("==================================================================")
print("   AEROTWIN - UAV ENGINE HEALTH DIGITAL TWIN (INSTANT RUNNER)     ")
print("   DRDO / SIH MALE-UAV Aero-Piston Engine Prototype (SIH26054)    ")
print("==================================================================")
print(f"   Dashboard URL: http://localhost:{PORT}")
print("   Serving frontend and simulated telemetry REST stream...")
print("   Press Ctrl+C to stop the server.")
print("==================================================================")

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), AeroTwinHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
