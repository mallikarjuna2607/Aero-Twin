const faultService = require('./faultService');
const digitalTwinService = require('./digitalTwinService');
const predictionService = require('./predictionService');
const missionService = require('./missionService');

class TelemetryService {
    constructor() {
        this.history = [];
        this.maxHistory = 150;
        this.simTime = 0.0;

        // Peak tracker for flight report
        this.peaks = {
            maxRpm: 2350,
            maxCht: 171,
            maxEgt: 648,
            minOilPressure: 4.2,
            maxVibration: 2.1,
            anomaliesCount: 0
        };

        // Mission parameters
        this.altitude = 10000;
        this.ambientTemp = 18;
        this.throttle = 0.72;
    }

    setFlightConditions(alt, temp, throttle) {
        if (alt !== undefined) this.altitude = alt;
        if (temp !== undefined) this.ambientTemp = temp;
        if (throttle !== undefined) this.throttle = throttle;
    }

    generateNextStep(dt = 0.5) {
        this.simTime += dt;
        const faultState = faultService.getActiveFault();
        const fName = faultState.fault;
        const severity = faultState.severity;

        // 1. Digital Twin Expected Physics (Nominal)
        const altRatio = this.altitude / 10000.0;
        const expectedRpm = 2000.0 + (this.throttle * 500.0);
        const expectedCht = 150.0 + (this.throttle * 30.0) + (this.ambientTemp * 0.1);
        const expectedEgt = 580.0 + (this.throttle * 90.0) - (altRatio * 5.0);
        const expectedOilP = 4.3 - (this.throttle * 0.2);
        const expectedOilT = 85.0 + (this.throttle * 10.0);
        const expectedFuel = 12.0 + (this.throttle * 8.5) * (1.0 - altRatio * 0.05);
        const expectedVib = 1.8 + (this.throttle * 0.4);

        const twinExpected = {
            rpm: parseFloat(expectedRpm.toFixed(0)),
            cht: parseFloat(expectedCht.toFixed(1)),
            egt: parseFloat(expectedEgt.toFixed(1)),
            oilPressure: parseFloat(expectedOilP.toFixed(2)),
            oilTemperature: parseFloat(expectedOilT.toFixed(1)),
            fuelFlow: parseFloat(expectedFuel.toFixed(1)),
            vibration: parseFloat(expectedVib.toFixed(2))
        };

        // 2. Physical Engine Telemetry (with sensor noise and fault dynamics)
        let rpm = expectedRpm + (Math.sin(this.simTime * 2.5) * 6.0) + ((Math.random() - 0.5) * 8.0);
        let cht = expectedCht + (Math.sin(this.simTime * 0.8) * 0.5) + ((Math.random() - 0.5) * 0.6);
        let egt = expectedEgt + (Math.sin(this.simTime * 1.1) * 1.5) + ((Math.random() - 0.5) * 2.0);
        let oilP = expectedOilP + ((Math.random() - 0.5) * 0.04);
        let oilT = expectedOilT + (Math.sin(this.simTime * 0.5) * 0.4);
        let fuel = expectedFuel + ((Math.random() - 0.5) * 0.15);
        let vib = expectedVib + ((Math.random() - 0.5) * 0.08);

        // Apply fault dynamics
        if (fName === 'OVERHEATING') {
            cht += (36.0 * severity) + Math.min(25.0, this.simTime * 0.2);
            egt += (78.0 * severity);
            oilT += (26.0 * severity);
            oilP -= (0.45 * severity);
            vib += (0.6 * severity);
        } else if (fName === 'LOW_OIL_PRESSURE') {
            oilP = Math.max(1.3, oilP - (2.6 * severity));
            oilT += (24.0 * severity);
            vib += (1.1 * severity);
        } else if (fName === 'HIGH_VIBRATION') {
            vib += (6.8 * severity) + ((Math.random() - 0.5) * 0.5);
            oilT += (9.0 * severity);
        } else if (fName === 'MISFIRE') {
            rpm -= (140.0 * severity) + (Math.sin(this.simTime * 18.0) * 55.0);
            cht -= (20.0 * severity);
            egt -= (65.0 * severity);
            vib += (3.4 * severity);
            fuel -= (2.8 * severity);
        } else if (fName === 'INJECTOR_FAULT') {
            egt += (70.0 * severity);
            fuel += (4.8 * severity);
            vib += (1.5 * severity);
        } else if (fName === 'SENSOR_DRIFT') {
            // Transducer fault: ONLY CHT jumps erroneously
            cht += (78.0 * severity);
        }

        // Calculate health score
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
            rpm: parseFloat(rpm.toFixed(0)),
            cht: parseFloat(cht.toFixed(1)),
            egt: parseFloat(egt.toFixed(1)),
            oilPressure: parseFloat(oilP.toFixed(2)),
            oilTemperature: parseFloat(oilT.toFixed(1)),
            fuelFlow: parseFloat(fuel.toFixed(1)),
            vibration: parseFloat(vib.toFixed(2)),
            altitude: Math.round(this.altitude),
            ambientTemp: parseFloat(this.ambientTemp.toFixed(1)),
            engineLoad: parseFloat((this.throttle * 100).toFixed(0)),
            healthScore: parseFloat(health.toFixed(1)),
            condition: condition
        };

        // Update peaks
        this.peaks.maxRpm = Math.max(this.peaks.maxRpm, actual.rpm);
        this.peaks.maxCht = Math.max(this.peaks.maxCht, actual.cht);
        this.peaks.maxEgt = Math.max(this.peaks.maxEgt, actual.egt);
        this.peaks.minOilPressure = Math.min(this.peaks.minOilPressure, actual.oilPressure);
        this.peaks.maxVibration = Math.max(this.peaks.maxVibration, actual.vibration);
        if (condition === 'WARNING' || condition === 'CRITICAL') {
            this.peaks.anomaliesCount++;
        }

        // Digital twin comparison
        const twinDiff = digitalTwinService.calculateDifferences(actual, twinExpected);

        // AI Diagnosis
        const aiDiagnosis = faultService.analyze(actual);

        // RUL Prediction
        const rul = predictionService.getRULPrediction(actual.healthScore);

        // Health breakdown
        const healthBreakdown = predictionService.getHealthBreakdown(actual, actual.healthScore);

        // Mission Risk
        const risk = missionService.assessRisk(actual, actual.healthScore);

        const packet = {
            timestamp: parseFloat(this.simTime.toFixed(1)),
            isoTime: new Date().toISOString(),
            actual: actual,
            twinExpected: twinExpected,
            twinDifference: twinDiff,
            aiDiagnosis: aiDiagnosis,
            rulPrediction: rul,
            healthBreakdown: healthBreakdown,
            missionRisk: risk,
            activeFault: fName
        };

        this.history.push(packet);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        return packet;
    }

    getLatest() {
        if (this.history.length === 0) {
            return this.generateNextStep();
        }
        return this.history[this.history.length - 1];
    }

    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    getPeaks() {
        return this.peaks;
    }
}

module.exports = new TelemetryService();
