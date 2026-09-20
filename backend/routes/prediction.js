const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');

// Remaining Useful Life prediction
router.get('/rul', (req, res) => {
    const latest = telemetryService.getLatest();
    res.json({
        healthScore: latest.actual.healthScore,
        rulPrediction: latest.rulPrediction,
        condition: latest.actual.condition
    });
});

// Comprehensive health breakdown
router.get('/health', (req, res) => {
    const latest = telemetryService.getLatest();
    res.json({
        healthScore: latest.actual.healthScore,
        healthBreakdown: latest.healthBreakdown,
        condition: latest.actual.condition
    });
});

module.exports = router;
