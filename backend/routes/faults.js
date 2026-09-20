const express = require('express');
const router = express.Router();
const faultService = require('../services/faultService');
const telemetryService = require('../services/telemetryService');

// Inject a simulated fault
router.post('/inject', (req, res) => {
    const { fault, severity } = req.body;
    if (!fault) {
        return res.status(400).json({ error: 'Missing fault parameter' });
    }
    const result = faultService.injectFault(fault, severity || 1.0);
    res.json(result);
});

// Reset faults to normal
router.post('/reset', (req, res) => {
    const result = faultService.resetFault();
    res.json(result);
});

// Get current diagnostic status
router.get('/status', (req, res) => {
    const active = faultService.getActiveFault();
    const latest = telemetryService.getLatest();
    res.json({
        activeFault: active,
        diagnosis: latest.aiDiagnosis
    });
});

module.exports = router;
