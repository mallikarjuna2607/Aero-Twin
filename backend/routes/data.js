const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// List datasets metadata
router.get('/datasets', (req, res) => {
    res.json({
        datasets: [
            {
                id: 'diesel_faults',
                title: 'Diesel Engine Fault Dataset (3500-DEFault)',
                source: 'Mendeley Data (k22zxz29kr)',
                type: 'Internal Combustion / Piston Faults',
                features: ['Cylinder Head Temp', 'Exhaust Gas Temp', 'Oil Pressure', 'Torsional Vibration', 'Manifold Intake'],
                classes: ['NORMAL', 'OVERHEATING', 'MISFIRE', 'LOW_OIL_PRESSURE', 'BEARING_FAULT', 'INJECTOR_FAULT'],
                file: 'data/raw/diesel_engine_faults_sample.csv'
            },
            {
                id: 'bearing_vibration',
                title: 'IC Engine Bearing Vibration Dataset',
                source: 'Mendeley Data (3fcrrdjjvk)',
                type: 'Rotational Assembly Vibration',
                features: ['Tri-axial RMS Vibration', 'Crest Factor', 'Kurtosis', 'Oil Temp', 'Bearing Health Index'],
                classes: ['HEALTHY', 'INNER_RACE_WEAR', 'OUTER_RACE_WEAR', 'BALL_DEFECT', 'SEVERE_LOOSENESS'],
                file: 'data/raw/bearing_vibration_sample.csv'
            },
            {
                id: 'nasa_cmapss',
                title: 'NASA C-MAPSS Aircraft Engine Run-to-Failure',
                source: 'NASA PCoE Prognostics Data Repository',
                type: 'Aircraft Engine Degradation Benchmark',
                features: ['Time in Cycles', 'Altitude', 'Inlet Temp', 'Turbine Pressures', 'Bypass Ratio', 'RUL Cycles'],
                classes: ['Run-to-Failure Degradation Trajectories'],
                file: 'data/raw/nasa_cmapss_sample.csv'
            }
        ]
    });
});

// View dataset sample rows
router.get('/view/:datasetId', (req, res) => {
    const map = {
        'diesel_faults': 'raw/diesel_engine_faults_sample.csv',
        'bearing_vibration': 'raw/bearing_vibration_sample.csv',
        'nasa_cmapss': 'raw/nasa_cmapss_sample.csv',
        'uav_features': 'processed/uav_piston_engine_features.csv'
    };

    const relPath = map[req.params.datasetId] || 'raw/diesel_engine_faults_sample.csv';
    const fullPath = path.join(DATA_DIR, relPath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Dataset file not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1, 15).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => obj[h] = vals[idx]);
        return obj;
    });

    res.json({ headers, rows, totalRows: lines.length - 1 });
});

module.exports = router;
