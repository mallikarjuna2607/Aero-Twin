/**
 * AeroTwin Telemetry & Smooth Animator
 * Smoothly interpolates numeric readings and drives dynamic SVG/CSS animations.
 */

class TelemetryAnimator {
    constructor() {
        this.currentValues = {};
        this.targetValues = {};
    }

    // Smoothly interpolate towards target
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    updateMetric(id, targetVal, decimals = 1, unit = '') {
        const el = document.getElementById(id);
        if (!el) return;

        if (this.currentValues[id] === undefined) {
            this.currentValues[id] = targetVal;
        }

        // Smooth tick
        this.currentValues[id] = this.lerp(this.currentValues[id], targetVal, 0.3);
        const displayVal = this.currentValues[id].toFixed(decimals);
        el.innerText = `${displayVal} ${unit}`.trim();
    }

    updateTurbineSpeed(rpm) {
        const turbine = document.getElementById('engineTurbineBlade');
        if (!turbine) return;

        // Map RPM to rotation period: 2350 RPM -> ~0.8s rotation
        const safeRpm = Math.max(400, rpm);
        const durationSec = Math.max(0.2, (60.0 / safeRpm) * 35.0); // Scaled for visual smoothness
        document.documentElement.style.setProperty('--rpm-duration', `${durationSec.toFixed(2)}s`);
    }

    updateHealthRing(healthScore, condition) {
        const circle = document.getElementById('healthCircleProgress');
        const text = document.getElementById('healthScoreText');
        const badge = document.getElementById('healthBadgeText');

        if (circle) {
            // Circumference for r=54 is 2 * PI * 54 = 339.29
            const circumference = 339.29;
            const offset = circumference - (healthScore / 100) * circumference;
            circle.style.strokeDashoffset = offset;

            // Gradient colors based on health
            if (healthScore >= 90) {
                circle.style.stroke = '#22c55e'; // Green
                if (text) text.style.color = '#22c55e';
            } else if (healthScore >= 75) {
                circle.style.stroke = '#eab308'; // Amber
                if (text) text.style.color = '#eab308';
            } else if (healthScore >= 60) {
                circle.style.stroke = '#f97316'; // Orange
                if (text) text.style.color = '#f97316';
            } else {
                circle.style.stroke = '#ef4444'; // Red
                if (text) text.style.color = '#ef4444';
            }
        }

        if (text) text.innerText = `${Math.round(healthScore)}%`;
        if (badge) {
            badge.innerText = condition || 'NORMAL';
            badge.className = `health-condition-tag ${condition ? condition.toLowerCase() : 'normal'}`;
        }
    }

    updateSyncBar(syncPercentage) {
        const bar = document.getElementById('twinSyncFill');
        const text = document.getElementById('twinSyncText');
        if (bar) bar.style.width = `${syncPercentage}%`;
        if (text) text.innerText = `${syncPercentage.toFixed(1)}%`;
    }
}

window.telemetryAnimator = new TelemetryAnimator();
