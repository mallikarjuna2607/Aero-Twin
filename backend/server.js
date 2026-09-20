const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');

const telemetryService = require('./services/telemetryService');
const faultService = require('./services/faultService');

// Route modules
const telemetryRoutes = require('./routes/telemetry');
const engineRoutes = require('./routes/engine');
const faultsRoutes = require('./routes/faults');
const predictionRoutes = require('./routes/prediction');
const missionRoutes = require('./routes/mission');
const reportsRoutes = require('./routes/reports');
const dataRoutes = require('./routes/data');
const replayRoutes = require('./routes/replay');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount API Routes
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/engine', engineRoutes);
app.use('/api/faults', faultsRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/replay', replayRoutes);

// General health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        service: 'AeroTwin Digital Twin Core Backend',
        timestamp: new Date().toISOString()
    });
});

// WebSocket real-time telemetry streaming
wss.on('connection', (ws) => {
    console.log('[WS] Client dashboard connected to live telemetry stream');

    // Send latest packet immediately on connection
    ws.send(JSON.stringify({ type: 'TELEMETRY_UPDATE', data: telemetryService.getLatest() }));

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.type === 'INJECT_FAULT') {
                faultService.injectFault(parsed.fault, parsed.severity || 1.0);
                console.log(`[FAULT INJECTED via WS]: ${parsed.fault}`);
            } else if (parsed.type === 'RESET_FAULT') {
                faultService.resetFault();
                console.log('[FAULT RESET via WS]');
            } else if (parsed.type === 'SET_CONDITIONS') {
                telemetryService.setFlightConditions(parsed.altitude, parsed.temperature, parsed.throttle);
            }
        } catch (e) {
            console.error('[WS Error] Bad message format:', e.message);
        }
    });

    ws.on('close', () => {
        console.log('[WS] Client disconnected');
    });
});

// Broadcast real-time telemetry to all connected clients every 500ms (2Hz)
setInterval(() => {
    const packet = telemetryService.generateNextStep(0.5);
    const message = JSON.stringify({
        type: 'TELEMETRY_UPDATE',
        data: packet
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}, 500);

server.listen(PORT, () => {
    console.log('===============================================================');
    console.log('  AEROTWIN - UAV ENGINE HEALTH DIGITAL TWIN SERVER RUNNING     ');
    console.log('  DRDO / SIH MALE-UAV Aero-Piston Engine Prototype (SIH26054)  ');
    console.log('===============================================================');
    console.log(`  Local Web Dashboard:   http://localhost:${PORT}`);
    console.log(`  WebSocket Telemetry:   ws://localhost:${PORT}`);
    console.log(`  REST API Base:         http://localhost:${PORT}/api/`);
    console.log('===============================================================');
});
