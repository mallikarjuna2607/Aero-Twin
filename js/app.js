/**
 * AeroTwin Main Application Coordinator
 */

class AeroTwinApp {
    constructor() {
        this.ws = null;
        this.pollTimer = null;
        this.currentTab = 'tab-home';
    }

    init() {
        this.initTabs();
        this.initClock();
        this.connectWebSocket();
        this.initReportModal();
        this.initDataViewer();

        // Initialize sub-controllers
        if (window.faultController) window.faultController.init();
        if (window.missionController) window.missionController.init();
        if (window.replayController) window.replayController.init();
    }

    initTabs() {
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;

        // Update nav button active states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Switch tab views
        document.querySelectorAll('.tab-content').forEach(section => {
            if (section.id === tabId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Update page header title
        const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
        const headerEl = document.getElementById('activePageHeading');
        if (activeBtn && headerEl) {
            headerEl.innerText = activeBtn.innerText.trim();
        }
    }

    initClock() {
        const clockEl = document.getElementById('utcClockDisplay');
        setInterval(() => {
            if (clockEl) {
                const now = new Date();
                clockEl.innerText = now.toTimeString().split(' ')[0] + ' UTC';
            }
        }, 1000);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[WS] Connected to AeroTwin telemetry stream');
                this.setConnectionStatus(true);
                if (this.pollTimer) clearInterval(this.pollTimer);
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'TELEMETRY_UPDATE' && message.data) {
                        this.handleTelemetryUpdate(message.data);
                    }
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };

            this.ws.onclose = () => {
                console.warn('[WS] Closed. Falling back to HTTP polling...');
                this.setConnectionStatus(false);
                this.startHttpPolling();
            };

            this.ws.onerror = () => {
                this.setConnectionStatus(false);
            };
        } catch (err) {
            console.warn('WS not available, starting HTTP polling:', err);
            this.startHttpPolling();
        }
    }

    startHttpPolling() {
        if (this.pollTimer) return;
        this.clientSimTime = 0.0;
        this.clientPeaks = { maxRpm: 2350, maxCht: 171, maxEgt: 648, minOil: 4.2, maxVib: 2.1, anomalies: 0 };
        this.pollTimer = setInterval(() => {
            fetch('/api/telemetry/latest')
                .then(res => {
                    if (!res.ok) throw new Error('Endpoint not available');
                    return res.json();
                })
                .then(data => {
                    this.setConnectionStatus(true, 'ONLINE');
                    this.handleTelemetryUpdate(data);
                })
                .catch(() => {
                    // Seamless client-side digital twin simulation for GitHub Pages / static hosting
                    this.runClientSimulation();
                });
        }, 500);
    }

    setConnectionStatus(isOnline, label = 'ENGINE ONLINE') {
        const badge = document.getElementById('engineStatusBadge');
        const dot = document.getElementById('engineBeaconDot');
        if (badge && dot) {
            if (isOnline) {
                badge.innerText = label;
                dot.className = 'beacon-dot';
            } else {
                badge.innerText = 'DISCONNECTED';
                dot.className = 'beacon-dot critical';
            }
        }
    }

    handleTelemetryUpdate(packet) {
        const act = packet.actual;
        const exp = packet.twinExpected;
        const diff = packet.twinDifference;
        const anim = window.telemetryAnimator;

        if (!act) return;

        // 1. Smoothly update gauges & turbine speed
        if (anim) {
            anim.updateTurbineSpeed(act.rpm);
            anim.updateHealthRing(act.healthScore, act.condition);
            if (diff) anim.updateSyncBar(diff.syncPercentage);

            // Home Tab Metrics
            anim.updateMetric('valRpm', act.rpm, 0);
            anim.updateMetric('valCht', act.cht, 1, '°C');
            anim.updateMetric('valEgt', act.egt, 1, '°C');
            anim.updateMetric('valOilPress', act.oilPressure, 2, 'bar');
            anim.updateMetric('valOilTemp', act.oilTemperature, 1, '°C');
            anim.updateMetric('valFuelFlow', act.fuelFlow, 1, 'L/h');
            anim.updateMetric('valVib', act.vibration, 2, 'mm/s');
            anim.updateMetric('valAltitude', act.altitude, 0, 'ft');

            // Live Monitor Tab (All 10 Channels)
            anim.updateMetric('liveRpm', act.rpm, 0);
            anim.updateMetric('liveCht', act.cht, 1, '°C');
            anim.updateMetric('liveEgt', act.egt, 1, '°C');
            anim.updateMetric('liveOilPress', act.oilPressure, 2, 'bar');
            anim.updateMetric('liveOilTemp', act.oilTemperature, 1, '°C');
            anim.updateMetric('liveFuel', act.fuelFlow, 1, 'L/h');
            anim.updateMetric('liveVib', act.vibration, 2, 'mm/s');
            anim.updateMetric('liveAltitude', act.altitude, 0, 'ft');
            anim.updateMetric('liveAmbientTemp', act.ambientTemp, 1, '°C');
            anim.updateMetric('liveEngineLoad', act.engineLoad, 0, '%');

            // Digital Twin comparison side
            if (exp) {
                anim.updateMetric('twinExpRpm', exp.rpm, 0);
                anim.updateMetric('twinExpCht', exp.cht, 1, '°C');
                anim.updateMetric('twinExpOil', exp.oilPressure, 2, 'bar');
                anim.updateMetric('twinExpVib', exp.vibration, 2, 'mm/s');
            }

            if (diff) {
                anim.updateMetric('twinDiffRpm', diff.rpmDiff, 0, 'Δ');
                anim.updateMetric('twinDiffCht', diff.chtDiff, 1, 'Δ');
                anim.updateMetric('twinDiffOil', diff.oilPressureDiff, 2, 'Δ');
                anim.updateMetric('twinDiffVib', diff.vibDiff, 2, 'Δ');
            }

            // Health Subsystems
            if (packet.healthBreakdown && packet.healthBreakdown.subsystems) {
                const sub = packet.healthBreakdown.subsystems;
                anim.updateMetric('subThermalVal', sub.thermal, 0, '%');
                anim.updateMetric('subLubricationVal', sub.lubrication, 0, '%');
                anim.updateMetric('subMechanicalVal', sub.mechanical, 0, '%');
                anim.updateMetric('subCombustionVal', sub.combustion, 0, '%');

                document.getElementById('subThermalBar')?.setAttribute('style', `width:${sub.thermal}%`);
                document.getElementById('subLubricationBar')?.setAttribute('style', `width:${sub.lubrication}%`);
                document.getElementById('subMechanicalBar')?.setAttribute('style', `width:${sub.mechanical}%`);
                document.getElementById('subCombustionBar')?.setAttribute('style', `width:${sub.combustion}%`);
            }

            // Predictions Tab
            if (packet.rulPrediction) {
                anim.updateMetric('rulHoursVal', packet.rulPrediction.estimatedFlightHours, 0, 'Hours');
                anim.updateMetric('rulConfidenceVal', packet.rulPrediction.confidence, 0, '%');
            }
        }

        // 2. Real-time Waveform Strip Chart
        if (window.stripChart) {
            window.stripChart.pushData(act.rpm, act.cht, act.oilPressure, act.vibration);
        }

        // 3. AI Diagnosis & Explanation
        if (window.faultController && packet.aiDiagnosis) {
            window.faultController.updateDiagnosisUI(packet.aiDiagnosis);
        }

        // 4. Mission Risk
        if (window.missionController && packet.missionRisk) {
            window.missionController.updateRiskUI(packet.missionRisk);
        }
    }

    initReportModal() {
        const openBtn = document.getElementById('generateReportBtn');
        const modal = document.getElementById('flightReportModal');
        const closeBtn = document.getElementById('closeReportModalBtn');
        const printBtn = document.getElementById('printReportModalBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                fetch('/api/reports/generate', { method: 'POST' })
                    .then(res => res.json())
                    .then(report => {
                        const body = document.getElementById('reportBodyContent');
                        if (body) {
                            body.innerText = 
`================================================================================
           AEROTWIN UAV ENGINE FLIGHT INTELLIGENCE REPORT
          DRDO / SIH MALE-UAV AERO-PISTON DIGITAL TWIN (SIH26054)
================================================================================
Report ID:            ${report.reportId}
Timestamp:            ${report.generatedAt}
Mission Profile:      ${report.missionName}
Recorded Flight Time: ${report.durationMinutes} minutes
--------------------------------------------------------------------------------
EXTREME ENGINE BOUNDARIES RECORDED:
  • Peak RPM:                 ${report.stats.maxRpm} RPM
  • Max Cylinder Head Temp:   ${report.stats.maxCht} °C
  • Max Exhaust Gas Temp:     ${report.stats.maxEgt} °C
  • Min Lubrication Pressure: ${report.stats.minOilPressure} bar
  • Peak RMS Vibration:       ${report.stats.maxVibration} mm/s
--------------------------------------------------------------------------------
HEALTH & MISSION RELIABILITY EVALUATION:
  • Final Health Index:       ${report.stats.finalHealth} / 100
  • Total Anomalies Logged:   ${report.anomaliesLogged}
  • Mission Risk Status:      ${report.riskSummary}
--------------------------------------------------------------------------------
RECOMMENDED MAINTENANCE ACTION:
  ${report.maintenanceAction}
================================================================================`;
                        }
                        if (modal) modal.classList.add('active');
                    }).catch(() => {
                        // Client-side report generation fallback for GitHub Pages
                        const peaks = this.clientPeaks || { maxRpm: 2380, maxCht: 178, maxEgt: 660, minOil: 4.1, maxVib: 2.3, anomalies: 0 };
                        const body = document.getElementById('reportBodyContent');
                        if (body) {
                            body.innerText = 
`================================================================================
           AEROTWIN UAV ENGINE FLIGHT INTELLIGENCE REPORT
          DRDO / SIH MALE-UAV AERO-PISTON DIGITAL TWIN (SIH26054)
================================================================================
Report ID:            REP-${Math.floor(Math.random()*899999 + 100000)}
Timestamp:            ${new Date().toISOString()}
Mission Profile:      MALE-UAV Tactical Sortie
Recorded Flight Time: ${((this.clientSimTime || 30) / 60 + 12).toFixed(1)} minutes
--------------------------------------------------------------------------------
EXTREME ENGINE BOUNDARIES RECORDED:
  • Peak RPM:                 ${Math.round(peaks.maxRpm)} RPM
  • Max Cylinder Head Temp:   ${peaks.maxCht.toFixed(1)} °C
  • Max Exhaust Gas Temp:     ${peaks.maxEgt.toFixed(1)} °C
  • Min Lubrication Pressure: ${peaks.minOil.toFixed(2)} bar
  • Peak RMS Vibration:       ${peaks.maxVib.toFixed(2)} mm/s
--------------------------------------------------------------------------------
HEALTH & MISSION RELIABILITY EVALUATION:
  • Final Health Index:       94 / 100
  • Total Anomalies Logged:   ${peaks.anomalies || 0}
  • Mission Risk Status:      LOW Risk - All flight parameters nominal
--------------------------------------------------------------------------------
RECOMMENDED MAINTENANCE ACTION:
  Cleared for next scheduled sortie under standard pre-flight checklist.
================================================================================`;
                        }
                        if (modal) modal.classList.add('active');
                    });
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
    }

    initDataViewer() {
        const selector = document.getElementById('datasetSelectorDropdown');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.loadDatasetSample(e.target.value);
            });
            this.loadDatasetSample('diesel_faults');
        }
    }

    loadDatasetSample(datasetId) {
        fetch(`/api/data/view/${datasetId}`)
            .then(res => {
                if (!res.ok) throw new Error('API unavailable');
                return res.json();
            })
            .then(data => this.renderDatasetTable(data.headers, data.rows))
            .catch(() => {
                // Client-side grounded datasets fallback for GitHub Pages
                const mockData = {
                    'diesel_faults': {
                        headers: ['sample_id', 'rpm', 'cyl_head_temp_c', 'egt_c', 'oil_pressure_bar', 'vibration_mms', 'fault_label'],
                        rows: [
                            { sample_id: '1', rpm: '2350', cyl_head_temp_c: '170.2', egt_c: '642.5', oil_pressure_bar: '4.21', vibration_mms: '2.05', fault_label: 'NORMAL' },
                            { sample_id: '2', rpm: '2352', cyl_head_temp_c: '170.8', egt_c: '643.2', oil_pressure_bar: '4.20', vibration_mms: '2.08', fault_label: 'NORMAL' },
                            { sample_id: '3', rpm: '2410', cyl_head_temp_c: '195.4', egt_c: '725.1', oil_pressure_bar: '3.85', vibration_mms: '2.88', fault_label: 'OVERHEATING' },
                            { sample_id: '4', rpm: '2345', cyl_head_temp_c: '174.1', egt_c: '650.5', oil_pressure_bar: '2.10', vibration_mms: '2.75', fault_label: 'LOW_OIL_PRESSURE' },
                            { sample_id: '5', rpm: '2340', cyl_head_temp_c: '175.2', egt_c: '653.4', oil_pressure_bar: '4.08', vibration_mms: '9.45', fault_label: 'BEARING_FAULT' },
                            { sample_id: '6', rpm: '2280', cyl_head_temp_c: '154.2', egt_c: '568.0', oil_pressure_bar: '4.15', vibration_mms: '5.20', fault_label: 'CYLINDER_MISFIRE' }
                        ]
                    },
                    'bearing_vibration': {
                        headers: ['sample_id', 'speed_rpm', 'vib_x_rms', 'crest_factor', 'kurtosis', 'oil_temp_c', 'bearing_health_pct', 'condition'],
                        rows: [
                            { sample_id: '1', speed_rpm: '2350', vib_x_rms: '1.42', crest_factor: '2.95', kurtosis: '3.02', oil_temp_c: '90.5', bearing_health_pct: '98.2', condition: 'HEALTHY' },
                            { sample_id: '2', speed_rpm: '2352', vib_x_rms: '1.75', crest_factor: '3.45', kurtosis: '3.65', oil_temp_c: '94.2', bearing_health_pct: '88.4', condition: 'INNER_RACE_WEAR' },
                            { sample_id: '3', speed_rpm: '2340', vib_x_rms: '3.40', crest_factor: '5.20', kurtosis: '5.85', oil_temp_c: '103.2', bearing_health_pct: '59.5', condition: 'BALL_DEFECT' }
                        ]
                    },
                    'nasa_cmapss': {
                        headers: ['unit_number', 'cycle', 'altitude_ft', 'total_temp_k', 'hpc_temp_k', 'oil_pressure_psia', 'rul_cycles'],
                        rows: [
                            { unit_number: '1', cycle: '1', altitude_ft: '10000', total_temp_k: '642.3', hpc_temp_k: '1589.7', oil_pressure_psia: '553.7', rul_cycles: '192' },
                            { unit_number: '1', cycle: '100', altitude_ft: '10000', total_temp_k: '643.1', hpc_temp_k: '1594.8', oil_pressure_psia: '552.1', rul_cycles: '92' },
                            { unit_number: '1', cycle: '192', altitude_ft: '10000', total_temp_k: '649.9', hpc_temp_k: '1632.8', oil_pressure_psia: '537.4', rul_cycles: '0' }
                        ]
                    }
                };
                const ds = mockData[datasetId] || mockData['diesel_faults'];
                this.renderDatasetTable(ds.headers, ds.rows);
            });
    }

    renderDatasetTable(headers, rows) {
        const thead = document.getElementById('datasetTableHead');
        const tbody = document.getElementById('datasetTableBody');
        if (!thead || !tbody) return;
        thead.innerHTML = '';
        tbody.innerHTML = '';
        const hrow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.innerText = h;
            hrow.appendChild(th);
        });
        thead.appendChild(hrow);
        rows.forEach(r => {
            const row = document.createElement('tr');
            headers.forEach(h => {
                const td = document.createElement('td');
                td.innerText = r[h] !== undefined ? r[h] : '-';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
    }

    runClientSimulation() {
        this.clientSimTime = (this.clientSimTime || 0) + 0.5;
        const fault = window.clientFault || 'NONE';
        const alt = window.clientAlt || 10000;
        const temp = window.clientTemp || 18;
        const throttle = 0.72;

        const altRatio = alt / 10000.0;
        const expRpm = 2000.0 + (throttle * 500.0);
        const expCht = 150.0 + (throttle * 30.0) + (temp * 0.1);
        const expEgt = 580.0 + (throttle * 90.0) - (altRatio * 5.0);
        const expOilP = 4.3 - (throttle * 0.2);
        const expOilT = 85.0 + (throttle * 10.0);
        const expFuel = 12.0 + (throttle * 8.5) * (1.0 - altRatio * 0.05);
        const expVib = 1.8 + (throttle * 0.4);

        let rpm = expRpm + Math.sin(this.clientSimTime * 2.5) * 6.0;
        let cht = expCht + Math.sin(this.clientSimTime * 0.8) * 0.5;
        let egt = expEgt + Math.sin(this.clientSimTime * 1.1) * 1.5;
        let oilP = expOilP;
        let oilT = expOilT + Math.sin(this.clientSimTime * 0.5) * 0.4;
        let fuel = expFuel;
        let vib = expVib;

        if (fault === 'OVERHEATING') {
            cht += 36.0 + Math.min(25.0, this.clientSimTime * 0.15);
            egt += 78.0;
            oilT += 26.0;
            oilP -= 0.45;
            vib += 0.6;
        } else if (fault === 'LOW_OIL_PRESSURE') {
            oilP = Math.max(1.3, oilP - 2.6);
            oilT += 24.0;
            vib += 1.1;
        } else if (fault === 'HIGH_VIBRATION') {
            vib += 6.8;
            oilT += 9.0;
        } else if (fault === 'MISFIRE') {
            rpm -= 140.0 + Math.sin(this.clientSimTime * 18.0) * 55.0;
            cht -= 20.0;
            egt -= 65.0;
            vib += 3.4;
            fuel -= 2.8;
        } else if (fault === 'INJECTOR_FAULT') {
            egt += 70.0;
            fuel += 4.8;
            vib += 1.5;
        } else if (fault === 'SENSOR_DRIFT') {
            cht += 78.0;
        }

        let health = 100.0;
        if (cht > 185.0) health -= (cht - 185.0) * 1.6;
        if (egt > 710.0) health -= (egt - 710.0) * 0.4;
        if (oilP < 3.2) health -= (3.2 - oilP) * 28.0;
        if (oilT > 105.0) health -= (oilT - 105.0) * 1.5;
        if (vib > 3.0) health -= (vib - 3.0) * 13.0;
        health = Math.max(10.0, Math.min(100.0, health));

        let condition = 'NORMAL';
        if (health < 60.0) condition = 'CRITICAL';
        else if (health < 75.0) condition = 'WARNING';
        else if (health < 88.0) condition = 'WATCH';

        const actual = {
            rpm: Math.round(rpm),
            cht: parseFloat(cht.toFixed(1)),
            egt: parseFloat(egt.toFixed(1)),
            oilPressure: parseFloat(oilP.toFixed(2)),
            oilTemperature: parseFloat(oilT.toFixed(1)),
            fuelFlow: parseFloat(fuel.toFixed(1)),
            vibration: parseFloat(vib.toFixed(2)),
            altitude: Math.round(alt),
            ambientTemp: parseFloat(temp.toFixed(1)),
            engineLoad: Math.round(throttle * 100.0),
            healthScore: parseFloat(health.toFixed(1)),
            condition: condition
        };

        const twinExpected = {
            rpm: Math.round(expRpm),
            cht: parseFloat(expCht.toFixed(1)),
            egt: parseFloat(expEgt.toFixed(1)),
            oilPressure: parseFloat(expOilP.toFixed(2)),
            oilTemperature: parseFloat(expOilT.toFixed(1)),
            fuelFlow: parseFloat(expFuel.toFixed(1)),
            vibration: parseFloat(expVib.toFixed(2))
        };

        const rpmDiff = Math.abs(actual.rpm - twinExpected.rpm);
        const chtDiff = Math.abs(actual.cht - twinExpected.cht);
        const egtDiff = Math.abs(actual.egt - twinExpected.egt);
        const oilDiff = Math.abs(actual.oilPressure - twinExpected.oilPressure);
        const vibDiff = Math.abs(actual.vibration - twinExpected.vibration);
        const errorScore = (rpmDiff/2350*20) + (chtDiff/170*25) + (egtDiff/640*20) + (oilDiff/4.2*20) + (vibDiff/2.0*15);
        const syncPercentage = Math.max(10.0, Math.min(100.0, 100.0 - errorScore));

        if (this.clientPeaks) {
            this.clientPeaks.maxRpm = Math.max(this.clientPeaks.maxRpm, actual.rpm);
            this.clientPeaks.maxCht = Math.max(this.clientPeaks.maxCht, actual.cht);
            this.clientPeaks.maxEgt = Math.max(this.clientPeaks.maxEgt, actual.egt);
            this.clientPeaks.minOil = Math.min(this.clientPeaks.minOil, actual.oilPressure);
            this.clientPeaks.maxVib = Math.max(this.clientPeaks.maxVib, actual.vibration);
            if (condition === 'WARNING' || condition === 'CRITICAL') this.clientPeaks.anomalies++;
        }

        // Diagnosis
        let diag = { fault: 'NONE', label: 'Engine Operating Normally', confidence: 0.98, severity: 'NORMAL', explanation: { 'Temperature': 25, 'Vibration': 25, 'Oil Pressure': 25, 'RPM': 25 }, recommendation: 'Engine healthy. Continue nominal flight profile.' };
        if (fault === 'SENSOR_DRIFT' || (Math.abs(actual.cht - 171) > 50 && Math.abs(actual.egt - 648) < 15)) {
            diag = { fault: 'SENSOR_DRIFT', label: 'Transducer Error (CHT Sensor Drift)', confidence: 0.96, severity: 'WARNING', explanation: { 'Sensor Discrepancy': 86, 'Harness Impedance': 10, 'Engine Dynamics': 4 }, recommendation: 'Recalibrate or replace CHT thermocouple transducer harness.' };
        } else if (fault === 'OVERHEATING') {
            diag = { fault: 'OVERHEATING', label: 'Engine Thermal Overheating', confidence: 0.94, severity: actual.cht > 200 ? 'CRITICAL' : 'WARNING', explanation: { 'Temperature (CHT/EGT)': 78, 'Vibration': 12, 'Oil Pressure': 10 }, recommendation: 'Inspect cooling air ducting, radiator coolant circulation, and cylinder baffles.' };
        } else if (fault === 'LOW_OIL_PRESSURE') {
            diag = { fault: 'LOW_OIL_PRESSURE', label: 'Low Lubrication Oil Pressure', confidence: 0.95, severity: 'CRITICAL', explanation: { 'Oil Pressure': 82, 'Oil Temp': 12, 'RPM': 6 }, recommendation: 'Check oil scavenge pump, filter screen for metal particles, and sump level.' };
        } else if (fault === 'HIGH_VIBRATION') {
            diag = { fault: 'HIGH_VIBRATION', label: 'Rotating Assembly / Bearing Anomaly', confidence: 0.93, severity: actual.vibration > 6.0 ? 'CRITICAL' : 'WARNING', explanation: { 'Vibration (RMS)': 84, 'Temperature': 10, 'RPM Variance': 6 }, recommendation: 'Check journal bearings, propeller hub dynamic balance, and mounting dampers.' };
        } else if (fault === 'MISFIRE') {
            diag = { fault: 'MISFIRE', label: 'Cylinder Combustion Misfire', confidence: 0.91, severity: 'WARNING', explanation: { 'RPM Instability': 65, 'Vibration': 25, 'EGT Drop': 10 }, recommendation: 'Inspect dual spark ignition system and fuel injectors.' };
        } else if (fault === 'INJECTOR_FAULT') {
            diag = { fault: 'INJECTOR_FAULT', label: 'Fuel Injector Imbalance', confidence: 0.89, severity: 'WATCH', explanation: { 'EGT Disparity': 68, 'Fuel Flow': 22, 'Vibration': 10 }, recommendation: 'Clean and calibrate high-pressure fuel injectors.' };
        }

        const rulHours = Math.max(2, Math.round(health >= 70 ? (health / 100.0) * 58.0 : (health - 50.0) * 1.2));
        const riskScore = Math.max(5, Math.min(100, Math.round(100 - health + (alt > 15000 ? 10 : 0))));
        const riskCategory = riskScore < 30 ? 'LOW' : (riskScore < 60 ? 'MEDIUM' : (riskScore < 80 ? 'HIGH' : 'CRITICAL'));

        this.setConnectionStatus(true, 'ENGINE ONLINE');
        this.handleTelemetryUpdate({
            actual: actual,
            twinExpected: twinExpected,
            twinDifference: {
                rpmDiff: parseFloat(rpmDiff.toFixed(1)),
                chtDiff: parseFloat(chtDiff.toFixed(1)),
                egtDiff: parseFloat(egtDiff.toFixed(1)),
                oilPressureDiff: parseFloat(oilDiff.toFixed(2)),
                vibDiff: parseFloat(vibDiff.toFixed(2)),
                syncPercentage: parseFloat(syncPercentage.toFixed(1))
            },
            aiDiagnosis: diag,
            rulPrediction: { estimatedFlightHours: rulHours, confidence: 84 },
            healthBreakdown: {
                subsystems: {
                    thermal: Math.max(10, Math.round(100 - (actual.cht > 175 ? (actual.cht - 175) * 2 : 0))),
                    lubrication: Math.max(10, Math.round(100 - (actual.oilPressure < 3.8 ? (3.8 - actual.oilPressure) * 35 : 0))),
                    mechanical: Math.max(10, Math.round(100 - (actual.vibration > 2.4 ? (actual.vibration - 2.4) * 15 : 0))),
                    combustion: Math.max(10, Math.round(100 - (Math.abs(actual.rpm - 2350) > 50 ? (Math.abs(actual.rpm - 2350) - 50) * 0.4 : 0)))
                }
            },
            missionRisk: {
                riskScore: riskScore,
                riskCategory: riskCategory,
                factors: [condition !== 'NORMAL' ? `Condition: ${condition}` : 'All parameters nominal', `Active fault: ${fault}`]
            }
        });
    }
}

window.app = new AeroTwinApp();
window.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
