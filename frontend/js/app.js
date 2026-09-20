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
        this.pollTimer = setInterval(() => {
            fetch('/api/telemetry/latest')
                .then(res => res.json())
                .then(data => {
                    this.setConnectionStatus(true);
                    this.handleTelemetryUpdate(data);
                })
                .catch(() => this.setConnectionStatus(false));
        }, 500);
    }

    setConnectionStatus(isOnline) {
        const badge = document.getElementById('engineStatusBadge');
        const dot = document.getElementById('engineBeaconDot');
        if (badge && dot) {
            if (isOnline) {
                badge.innerText = 'ENGINE ONLINE';
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
                    }).catch(err => console.warn('Report generation fallback:', err));
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
            .then(res => res.json())
            .then(data => {
                const thead = document.getElementById('datasetTableHead');
                const tbody = document.getElementById('datasetTableBody');
                if (!thead || !tbody) return;

                thead.innerHTML = '';
                tbody.innerHTML = '';

                // Headers
                const hrow = document.createElement('tr');
                data.headers.forEach(h => {
                    const th = document.createElement('th');
                    th.innerText = h;
                    hrow.appendChild(th);
                });
                thead.appendChild(hrow);

                // Rows
                data.rows.forEach(r => {
                    const row = document.createElement('tr');
                    data.headers.forEach(h => {
                        const td = document.createElement('td');
                        td.innerText = r[h] !== undefined ? r[h] : '-';
                        row.appendChild(td);
                    });
                    tbody.appendChild(row);
                });
            }).catch(err => console.warn('Dataset preview load error:', err));
    }
}

window.app = new AeroTwinApp();
window.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
