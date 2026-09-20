/**
 * AeroTwin Canvas Real-Time Telemetry Strip Chart
 * High-performance 60fps waveform renderer for live engine sensors.
 */

class RealTimeStripChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.bufferLength = 60;
        
        // Sensor series buffers
        this.series = {
            rpm: [],
            cht: [],
            oil: [],
            vib: []
        };

        this.initCanvas();
    }

    initCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 220;
    }

    pushData(rpm, cht, oil, vib) {
        this.series.rpm.push(rpm);
        this.series.cht.push(cht);
        this.series.oil.push(oil);
        this.series.vib.push(vib);

        for (let k in this.series) {
            if (this.series[k].length > this.bufferLength) {
                this.series[k].shift();
            }
        }

        this.render();
    }

    render() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // Clear background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Draw horizontal grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let y = 20; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw vertical grid lines
        for (let x = 0; x < w; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        const len = this.series.rpm.length;
        if (len < 2) return;

        // Helper to draw single line series
        const drawLine = (data, minVal, maxVal, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            const stepX = w / (this.bufferLength - 1);
            const startIdx = this.bufferLength - len;

            for (let i = 0; i < len; i++) {
                const x = (startIdx + i) * stepX;
                const normalized = (data[i] - minVal) / (maxVal - minVal);
                const y = h - 20 - (normalized * (h - 40));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        // Draw waveforms
        drawLine(this.series.rpm, 1800, 2700, '#38bdf8'); // RPM (Cyan)
        drawLine(this.series.cht, 140, 230, '#f97316');   // CHT (Orange)
        drawLine(this.series.oil, 1.0, 5.0, '#22c55e');   // Oil Pressure (Green)
        drawLine(this.series.vib, 0.5, 9.0, '#c084fc');   // Vibration (Purple)
    }
}

window.stripChart = null;
window.addEventListener('load', () => {
    window.stripChart = new RealTimeStripChart('liveTelemetryCanvas');
});
