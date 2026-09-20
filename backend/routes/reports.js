const express = require('express');
const router = express.Router();
const missionService = require('../services/missionService');
const telemetryService = require('../services/telemetryService');

// Generate automated flight report
router.post('/generate', (req, res) => {
    const peaks = telemetryService.getPeaks();
    const latest = telemetryService.getLatest();

    const stats = {
        durationMinutes: (telemetryService.simTime / 60.0) + 15.0,
        maxRpm: peaks.maxRpm,
        maxCht: peaks.maxCht,
        maxEgt: peaks.maxEgt,
        minOilPressure: peaks.minOilPressure,
        maxVibration: peaks.maxVibration,
        finalHealth: latest.actual.healthScore,
        anomaliesLogged: peaks.anomaliesCount,
        riskSummary: latest.missionRisk.riskCategory + ' Risk - ' + latest.missionRisk.primaryConcern,
        maintenanceAction: latest.aiDiagnosis.recommendation
    };

    const report = missionService.generateReport(stats);
    res.json(report);
});

module.exports = router;
