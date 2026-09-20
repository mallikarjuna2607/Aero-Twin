class MissionService {
    constructor() {
        this.currentMission = {
            id: 'FLIGHT-MALE-042',
            type: 'NORMAL',
            name: 'Normal Border Surveillance',
            startTime: new Date(),
            altitudeTarget: 10000,
            ambientTempTarget: 18,
            durationTargetMin: 180,
            status: 'ACTIVE'
        };

        this.missionHistory = [];
    }

    getProfiles() {
        return [
            { id: 'NORMAL', name: 'Normal Flight', altitude: 10000, duration: 180, temp: 18, desc: 'Nominal endurance surveillance patrol' },
            { id: 'LONG_ENDURANCE', name: 'Long Endurance', altitude: 12000, duration: 840, temp: 14, desc: 'Extended loiter surveillance profile' },
            { id: 'HIGH_ALTITUDE', name: 'High Altitude', altitude: 18000, duration: 240, temp: -5, desc: 'Upper airspace envelope exploration' },
            { id: 'HOT_WEATHER', name: 'Hot Weather Desert', altitude: 8000, duration: 210, temp: 42, desc: 'Severe ambient thermal test' },
            { id: 'RAPID_THROTTLE', name: 'Rapid Throttle Tactical', altitude: 9000, duration: 90, temp: 24, desc: 'High transient tactical maneuvering' }
        ];
    }

    startMission(profileId, customSettings = {}) {
        const profiles = this.getProfiles();
        const selected = profiles.find(p => p.id === profileId) || profiles[0];

        this.currentMission = {
            id: 'FLIGHT-MALE-' + Math.floor(100 + Math.random() * 900),
            type: selected.id,
            name: selected.name,
            startTime: new Date(),
            altitudeTarget: customSettings.altitude || selected.altitude,
            ambientTempTarget: customSettings.temperature || selected.temp,
            durationTargetMin: customSettings.duration || selected.duration,
            status: 'ACTIVE'
        };
        return this.currentMission;
    }

    assessRisk(telemetry, healthScore) {
        let score = 0;
        const factors = [];

        if (healthScore < 60) {
            score += 40;
            factors.push('Health index below critical threshold (Score: ' + Math.round(healthScore) + ')');
        } else if (healthScore < 80) {
            score += 20;
            factors.push('Health index in watch zone');
        }

        if (telemetry.cht > 195) {
            score += 25;
            factors.push('Elevated CHT (' + telemetry.cht.toFixed(1) + '°C)');
        }
        if (telemetry.oilPressure < 2.5) {
            score += 25;
            factors.push('Depressed oil pressure (' + telemetry.oilPressure.toFixed(2) + ' bar)');
        }
        if (telemetry.vibration > 5.0) {
            score += 25;
            factors.push('Vibration anomaly (' + telemetry.vibration.toFixed(2) + ' mm/s)');
        }
        if (telemetry.altitude > 15000) {
            score += 5;
            factors.push('High altitude operating regime');
        }

        score = Math.min(100, Math.max(5, score));
        let category = 'LOW';
        if (score >= 75) category = 'CRITICAL';
        else if (score >= 50) category = 'HIGH';
        else if (score >= 25) category = 'MEDIUM';

        if (factors.length === 0) {
            factors.push('All subsystems operating within nominal flight envelope');
        }

        return {
            riskScore: score,
            riskCategory: category,
            factors: factors,
            missionId: this.currentMission.id,
            missionName: this.currentMission.name
        };
    }

    generateReport(flightStats) {
        const report = {
            reportId: 'REP-' + Date.now().toString().slice(-6),
            generatedAt: new Date().toISOString(),
            missionId: this.currentMission.id,
            missionName: this.currentMission.name,
            durationMinutes: flightStats.durationMinutes || 45.2,
            stats: {
                maxRpm: Math.round(flightStats.maxRpm || 2410),
                maxCht: (flightStats.maxCht || 178.4).toFixed(1),
                maxEgt: (flightStats.maxEgt || 662.0).toFixed(1),
                minOilPressure: (flightStats.minOilPressure || 4.02).toFixed(2),
                maxVibration: (flightStats.maxVibration || 2.45).toFixed(2),
                finalHealth: Math.round(flightStats.finalHealth || 92)
            },
            anomaliesLogged: flightStats.anomaliesLogged || 0,
            riskSummary: flightStats.riskSummary || 'LOW - Mission completed within normal limits',
            maintenanceAction: flightStats.maintenanceAction || 'No maintenance required. Cleared for next scheduled flight.'
        };
        return report;
    }
}

module.exports = new MissionService();
