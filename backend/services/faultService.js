const aiEngine = require('../../ai/prediction/ai_engine');

class FaultService {
    constructor() {
        this.activeFault = 'NONE';
        this.severity = 1.0;
        this.injectedAt = null;
    }

    injectFault(faultName, severity = 1.0) {
        this.activeFault = faultName.toUpperCase();
        this.severity = Math.min(1.0, Math.max(0.1, severity));
        this.injectedAt = new Date();
        return {
            status: 'SUCCESS',
            activeFault: this.activeFault,
            severity: this.severity,
            injectedAt: this.injectedAt
        };
    }

    resetFault() {
        this.activeFault = 'NONE';
        this.severity = 0.0;
        this.injectedAt = null;
        return {
            status: 'CLEARED',
            activeFault: 'NONE'
        };
    }

    getActiveFault() {
        return {
            fault: this.activeFault,
            severity: this.severity,
            injectedAt: this.injectedAt
        };
    }

    analyze(telemetryData) {
        return aiEngine.diagnose(telemetryData);
    }
}

module.exports = new FaultService();
