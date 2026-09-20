const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');

// Digital Twin comparison state
router.get('/twin', (req, res) => {
    const latest = telemetryService.getLatest();
    res.json({
        actual: latest.actual,
        twinExpected: latest.twinExpected,
        twinDifference: latest.twinDifference,
        activeFault: latest.activeFault
    });
});

// Engine operational overview
router.get('/status', (req, res) => {
    const latest = telemetryService.getLatest();
    res.json({
        status: 'ONLINE',
        mode: 'AIRBORNE_DIGITAL_TWIN',
        rpm: latest.actual.rpm,
        healthScore: latest.actual.healthScore,
        condition: latest.actual.condition,
        syncPercentage: latest.twinDifference.syncPercentage
    });
});

module.exports = router;
