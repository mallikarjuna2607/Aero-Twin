/**
 * AeroTwin Fault Manager & AI Explanation Controller
 */

class FaultController {
    constructor() {
        this.activeFault = 'NONE';
    }

    init() {
        // Bind fault injection buttons
        const faultButtons = document.querySelectorAll('.fault-btn');
        faultButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fault = e.currentTarget.getAttribute('data-fault');
                if (fault === 'RESET') {
                    this.resetFault();
                } else {
                    this.injectFault(fault);
                }
            });
        });
    }

    injectFault(faultName) {
        this.activeFault = faultName;
        window.clientFault = faultName;
        console.log(`[FAULT INJECTION]: ${faultName}`);

        // Update UI button highlights
        document.querySelectorAll('.fault-btn').forEach(b => {
            if (b.getAttribute('data-fault') === faultName) {
                b.classList.add('active-fault');
            } else {
                b.classList.remove('active-fault');
            }
        });

        // Send via WebSocket or REST API
        if (window.app && window.app.ws && window.app.ws.readyState === WebSocket.OPEN) {
            window.app.ws.send(JSON.stringify({ type: 'INJECT_FAULT', fault: faultName, severity: 1.0 }));
        } else {
            fetch('/api/faults/inject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fault: faultName, severity: 1.0 })
            }).catch(err => console.warn('HTTP fault injection fallback:', err));
        }
    }

    resetFault() {
        this.activeFault = 'NONE';
        window.clientFault = 'NONE';
        document.querySelectorAll('.fault-btn').forEach(b => b.classList.remove('active-fault'));

        if (window.app && window.app.ws && window.app.ws.readyState === WebSocket.OPEN) {
            window.app.ws.send(JSON.stringify({ type: 'RESET_FAULT' }));
        } else {
            fetch('/api/faults/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.warn('HTTP fault reset fallback:', err));
        }
    }

    updateDiagnosisUI(diagnosis) {
        if (!diagnosis) return;

        const diagTitle = document.getElementById('diagTitle');
        const diagConfidence = document.getElementById('diagConfidence');
        const diagSeverity = document.getElementById('diagSeverity');
        const diagRecommendation = document.getElementById('diagRecommendation');
        const transducerAlertBox = document.getElementById('transducerAlertBox');

        if (diagTitle) diagTitle.innerText = diagnosis.label || 'Normal Operation';
        if (diagConfidence) diagConfidence.innerText = `${Math.round((diagnosis.confidence || 0.95) * 100)}% Confidence`;
        
        if (diagSeverity) {
            const sev = diagnosis.severity || 'NORMAL';
            diagSeverity.innerText = sev;
            diagSeverity.className = `health-condition-tag ${sev.toLowerCase()}`;
        }

        if (diagRecommendation) {
            diagRecommendation.innerText = diagnosis.recommendation || 'No maintenance action required.';
        }

        // Transducer drift check
        if (transducerAlertBox) {
            if (diagnosis.fault === 'SENSOR_DRIFT') {
                transducerAlertBox.style.display = 'block';
            } else {
                transducerAlertBox.style.display = 'none';
            }
        }

        // Render AI Explanation / Feature Weights
        this.renderExplanationBars(diagnosis.explanation);
    }

    renderExplanationBars(explanation) {
        const container = document.getElementById('explanationBarsContainer');
        if (!container || !explanation) return;

        container.innerHTML = '';
        for (const [feature, weight] of Object.entries(explanation)) {
            const item = document.createElement('div');
            item.className = 'explanation-bar-item';
            item.innerHTML = `
                <div class="explanation-header">
                    <span>${feature}</span>
                    <span>${weight}%</span>
                </div>
                <div class="explanation-track">
                    <div class="explanation-fill bar-grow" style="width: ${weight}%"></div>
                </div>
            `;
            container.appendChild(item);
        }
    }
}

window.faultController = new FaultController();
