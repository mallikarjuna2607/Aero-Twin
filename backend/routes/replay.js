const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SAMPLE_DIR = path.join(__dirname, '../../data/sample');

// List pre-recorded flights
router.get('/flights', (req, res) => {
    res.json({
        flights: [
            { id: 'flight_001', name: 'Flight 001 - Nominal Surveillance Cruise', file: 'flight_001_normal_patrol.csv', duration: '20 min', fault: 'None (Healthy)' },
            { id: 'flight_002', name: 'Flight 002 - High Altitude Envelope Test', file: 'flight_002_high_altitude.csv', duration: '18 min', fault: 'Thin Air Thermal Watch' },
            { id: 'flight_003', name: 'Flight 003 - Cooling System Overheat', file: 'flight_003_thermal_overheat.csv', duration: '15 min', fault: 'Coolant Pump Failure' },
            { id: 'flight_004', name: 'Flight 004 - Journal Bearing Vibration', file: 'flight_004_bearing_degradation.csv', duration: '15 min', fault: 'Bearing Mechanical Wear' }
        ]
    });
});

// Load flight timeline telemetry
router.get('/load/:flightId', (req, res) => {
    const flightId = req.params.flightId;
    const flightMap = {
        'flight_001': 'flight_001_normal_patrol.csv',
        'flight_002': 'flight_002_high_altitude.csv',
        'flight_003': 'flight_003_thermal_overheat.csv',
        'flight_004': 'flight_004_bearing_degradation.csv'
    };
    const filename = flightMap[flightId] || (flightId.endsWith('.csv') ? flightId : `${flightId}.csv`);
    const fullPath = path.join(SAMPLE_DIR, filename);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Flight replay file not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataPoints = lines.slice(1).map(line => {
        const parts = line.split(',').map(p => p.trim());
        const row = {};
        headers.forEach((h, i) => {
            const num = parseFloat(parts[i]);
            row[h] = isNaN(num) ? parts[i] : num;
        });
        return row;
    });

    res.json({ flightId, totalSteps: dataPoints.length, timeline: dataPoints });
});

module.exports = router;
