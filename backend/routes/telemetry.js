const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');

// Get current telemetry packet
router.get('/latest', (req, res) => {
    res.json(telemetryService.getLatest());
});

// Get historical telemetry window
router.get('/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(telemetryService.getHistory(limit));
});

// Update flight envelope parameters
router.post('/conditions', (req, res) => {
    const { altitude, ambientTemp, throttle } = req.body;
    telemetryService.setFlightConditions(altitude, ambientTemp, throttle);
    res.json({ status: 'UPDATED', altitude, ambientTemp, throttle });
});

module.exports = router;
