const aiEngine = require('../../ai/prediction/ai_engine');

class PredictionService {
    getRULPrediction(healthScore) {
        return aiEngine.estimateRUL(healthScore);
    }

    getHealthBreakdown(telemetry, healthScore) {
        // Subsystem health scores (0-100)
        let thermal = 100.0;
        if (telemetry.cht > 175.0) thermal -= (telemetry.cht - 175.0) * 2.0;
        if (telemetry.egt > 680.0) thermal -= (telemetry.egt - 680.0) * 0.3;

        let lubrication = 100.0;
        if (telemetry.oilPressure < 3.8) lubrication -= (3.8 - telemetry.oilPressure) * 35.0;
        if (telemetry.oilTemperature > 95.0) lubrication -= (telemetry.oilTemperature - 95.0) * 1.8;

        let mechanical = 100.0;
        if (telemetry.vibration > 2.4) mechanical -= (telemetry.vibration - 2.4) * 15.0;

        let combustion = 100.0;
        const rpmDeviation = Math.abs(telemetry.rpm - 2350.0);
        if (rpmDeviation > 50.0) combustion -= (rpmDeviation - 50.0) * 0.4;

        return {
            overallHealth: Math.round(healthScore),
            subsystems: {
                thermal: Math.max(10, Math.min(100, Math.round(thermal))),
                lubrication: Math.max(10, Math.min(100, Math.round(lubrication))),
                mechanical: Math.max(10, Math.min(100, Math.round(mechanical))),
                combustion: Math.max(10, Math.min(100, Math.round(combustion)))
            },
            status: healthScore >= 90 ? 'NORMAL' : (healthScore >= 80 ? 'WATCH' : (healthScore >= 65 ? 'WARNING' : 'CRITICAL'))
        };
    }
}

module.exports = new PredictionService();
