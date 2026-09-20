const express = require('express');
const router = express.Router();
const missionService = require('../services/missionService');
const telemetryService = require('../services/telemetryService');

// Get mission profiles
router.get('/profiles', (req, res) => {
    res.json(missionService.getProfiles());
});

// Start mission with profile
router.post('/start', (req, res) => {
    const { profileId, altitude, temperature, duration } = req.body;
    const mission = missionService.startMission(profileId, { altitude, temperature, duration });
    
    // Apply altitude & ambient temp to telemetry generator
    telemetryService.setFlightConditions(mission.altitudeTarget, mission.ambientTempTarget);
    
    res.json(mission);
});

// Real-time mission risk assessment
router.get('/risk', (req, res) => {
    const latest = telemetryService.getLatest();
    res.json(latest.missionRisk);
});

module.exports = router;
