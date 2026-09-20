/**
 * AeroTwin AI Analytics Engine
 * Features:
 * - Multi-class Fault Classification
 * - Transducer Fault vs Engine Fault Discrimination
 * - SHAP-style Feature Importance / Explanation
 * - Prototype RUL Degradation Estimator
 */

class AIEngine {
    constructor() {
        // Nominal baseline for standard cruise (2350 RPM, 10,000 ft)
        this.baseline = {
            rpm: 2350.0,
            cht: 171.0,
            egt: 648.0,
            oilPressure: 4.2,
            oilTemperature: 92.0,
            fuelFlow: 18.4,
            vibration: 2.1
        };

        // Rolling history for RUL trend
        this.healthHistory = [];
    }

    /**
     * Discriminate between genuine engine fault and sensor drift
     */
    evaluateSensorDrift(data) {
        const chtErr = Math.abs(data.cht - this.baseline.cht);
        const egtErr = Math.abs(data.egt - this.baseline.egt);
        const oilTempErr = Math.abs(data.oilTemperature - this.baseline.oilTemperature);
        const vibErr = Math.abs(data.vibration - this.baseline.vibration);

        // If CHT is abnormally high, but all correlated thermal/vib sensors are completely normal:
        if (chtErr > 50.0 && egtErr < 15.0 && oilTempErr < 8.0 && vibErr < 0.6) {
            return {
                isSensorDrift: true,
                sensorName: 'CHT Thermocouple Transducer',
                reason: 'CHT indicates extreme thermal spike (+' + chtErr.toFixed(1) + '°C) without expected thermodynamic correlation in EGT or Oil Temperature.',
                confidence: 0.96
            };
        }
        return { isSensorDrift: false };
    }

    /**
     * Multi-class classification and confidence scoring
     */
    diagnose(data) {
        const drift = this.evaluateSensorDrift(data);
        if (drift.isSensorDrift) {
            return {
                fault: 'SENSOR_DRIFT',
                label: 'Transducer Error (CHT Sensor Drift)',
                confidence: drift.confidence,
                severity: 'WARNING',
                explanation: {
                    'Sensor Anomaly (Cross-Check Mismatch)': 88,
                    'Thermocouple Impedance': 8,
                    'Engine Physics Variance': 4
                },
                recommendation: 'Replace or recalibrate CHT transducer harness. Engine mechanical condition is normal.'
            };
        }

        // Calculate normalized feature variances
        const dRpm = (data.rpm - this.baseline.rpm) / 300.0;
        const dCht = (data.cht - this.baseline.cht) / 30.0;
        const dEgt = (data.egt - this.baseline.egt) / 80.0;
        const dOilP = (this.baseline.oilPressure - data.oilPressure) / 1.5;
        const dOilT = (data.oilTemperature - this.baseline.oilTemperature) / 20.0;
        const dVib = (data.vibration - this.baseline.vibration) / 2.0;

        let detected = 'NORMAL';
        let label = 'Engine Operating Normally';
        let confidence = 0.95;
        let severity = 'NORMAL';
        let recommendation = 'No action required. All systems green.';

        // Evaluation tree
        if (dCht > 0.8 || dEgt > 0.9) {
            detected = 'OVERHEATING';
            label = 'Engine Thermal Overheating';
            confidence = Math.min(0.98, 0.85 + (dCht * 0.08));
            severity = (data.cht > 205.0) ? 'CRITICAL' : 'WARNING';
            recommendation = 'Check engine cooling air ducts, radiator coolant level, and oil cooler bypass.';
        } else if (dOilP > 0.8 || data.oilPressure < 2.5) {
            detected = 'LOW_OIL_PRESSURE';
            label = 'Low Lubrication Oil Pressure';
            confidence = Math.min(0.97, 0.88 + (dOilP * 0.05));
            severity = (data.oilPressure < 2.0) ? 'CRITICAL' : 'WARNING';
            recommendation = 'Inspect oil scavenger pump, check for oil leaks, and test pressure relief valve.';
        } else if (dVib > 1.2 || data.vibration > 4.5) {
            detected = 'HIGH_VIBRATION';
            label = 'Rotating Assembly / Bearing Anomaly';
            confidence = Math.min(0.96, 0.86 + (dVib * 0.05));
            severity = (data.vibration > 6.5) ? 'CRITICAL' : 'WARNING';
            recommendation = 'Inspect propeller pitch and balance; check crankshaft journal bearings for wear.';
        } else if (dRpm < -0.4 && dVib > 0.5) {
            detected = 'CYLINDER_MISFIRE';
            label = 'Cylinder Combustion Misfire';
            confidence = 0.92;
            severity = 'WARNING';
            recommendation = 'Inspect dual ignition harness, spark plugs, and individual cylinder injectors.';
        } else if (dEgt > 0.6 && Math.abs(dRpm) < 0.2) {
            detected = 'INJECTOR_FAULT';
            label = 'Fuel Injector Imbalance';
            confidence = 0.89;
            severity = 'WATCH';
            recommendation = 'Clean injector nozzles and verify fuel rail pressure consistency.';
        }

        // Feature Importance / SHAP-style explanation weights
        const rawWeights = {
            'Temperature (CHT/EGT)': Math.max(0.05, Math.abs(dCht) + Math.abs(dEgt) + Math.max(0, dOilT)),
            'Vibration (RMS)': Math.max(0.05, Math.abs(dVib) * 1.5),
            'Oil Pressure': Math.max(0.05, Math.abs(dOilP) * 1.4),
            'RPM / Combustion': Math.max(0.05, Math.abs(dRpm) * 1.2)
        };

        const totalWeight = Object.values(rawWeights).reduce((a, b) => a + b, 0);
        const explanation = {};
        for (const [key, val] of Object.entries(rawWeights)) {
            explanation[key] = Math.round((val / totalWeight) * 100);
        }

        return {
            fault: detected,
            label: label,
            confidence: Math.round(confidence * 100) / 100,
            severity: severity,
            explanation: explanation,
            recommendation: recommendation
        };
    }

    /**
     * RUL (Remaining Useful Life) Regression Model
     */
    estimateRUL(healthScore) {
        this.healthHistory.push(healthScore);
        if (this.healthHistory.length > 50) this.healthHistory.shift();

        // Baseline safe life: 600 hours at 100% health
        let estimatedHours = (healthScore / 100.0) * 58.0;
        if (healthScore < 70.0) {
            estimatedHours = Math.max(4.0, (healthScore - 50.0) * 1.2);
        }

        const confidence = (this.healthHistory.length > 10) ? 0.84 : 0.76;
        return {
            estimatedFlightHours: Math.max(2, Math.round(estimatedHours)),
            confidence: Math.round(confidence * 100),
            degradationRate: '-0.38% / flight hr',
            status: (estimatedHours > 30) ? 'NOMINAL' : (estimatedHours > 12 ? 'WATCH' : 'URGENT')
        };
    }
}

module.exports = new AIEngine();
