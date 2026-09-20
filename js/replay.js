/**
 * AeroTwin Mission Replay & CSV Scrubber
 */

class ReplayController {
    constructor() {
        this.timelineData = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.playbackSpeed = 1;
    }

    init() {
        // Flight selector
        const select = document.getElementById('flightSelectDropdown');
        if (select) {
            select.addEventListener('change', (e) => {
                this.loadFlight(e.target.value);
            });
        }

        // Timeline scrubber
        const scrubber = document.getElementById('replayScrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                this.seekTo(parseInt(e.target.value));
            });
        }

        // Play/Pause button
        const playBtn = document.getElementById('replayPlayBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.togglePlay();
            });
        }

        // Restart button
        const restartBtn = document.getElementById('replayRestartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.seekTo(0);
            });
        }

        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.playbackSpeed = parseFloat(e.target.getAttribute('data-speed') || 1);
                if (this.isPlaying) {
                    this.pause();
                    this.play();
                }
            });
        });

        // CSV File Upload input
        const fileInput = document.getElementById('csvUploadInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.parseUploadedCSV(file);
            });
        }

        // Load default flight
        this.loadFlight('flight_001');
    }

    loadFlight(flightId) {
        fetch(`/api/replay/load/${flightId}`)
            .then(res => res.json())
            .then(data => {
                if (data.timeline && data.timeline.length > 0) {
                    this.timelineData = data.timeline;
                    const scrubber = document.getElementById('replayScrubber');
                    if (scrubber) {
                        scrubber.max = this.timelineData.length - 1;
                        scrubber.value = 0;
                    }
                    this.seekTo(0);
                }
            }).catch(() => {
                // Client-side fallback frames for GitHub Pages & static hosting
                const fallbackFrames = [];
                const isOverheat = flightId === 'flight_003';
                const isBearing = flightId === 'flight_004';
                for (let i = 0; i < 15; i++) {
                    const sec = i * 10;
                    fallbackFrames.push({
                        time_sec: sec,
                        rpm: 2350 + (isOverheat ? i * 5 : (isBearing ? -i * 3 : 0)),
                        cht: 168.0 + (isOverheat ? i * 4.2 : 0.4),
                        egt: 640.0 + (isOverheat ? i * 9.5 : 1.0),
                        oil_press: Math.max(1.8, 4.25 - (isOverheat ? i * 0.08 : (isBearing ? i * 0.09 : 0.01))),
                        vibration: 2.0 + (isBearing ? i * 0.8 : (isOverheat ? i * 0.15 : 0.05)),
                        health: Math.max(25, 96 - (isOverheat ? i * 4.5 : (isBearing ? i * 5 : 0.1)))
                    });
                }
                this.timelineData = fallbackFrames;
                const scrubber = document.getElementById('replayScrubber');
                if (scrubber) {
                    scrubber.max = this.timelineData.length - 1;
                    scrubber.value = 0;
                }
                this.seekTo(0);
            });
    }

    parseUploadedCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                const row = {};
                headers.forEach((h, idx) => {
                    const val = parseFloat(parts[idx]);
                    row[h] = isNaN(val) ? parts[idx] : val;
                });
                rows.push(row);
            }
            if (rows.length > 0) {
                this.timelineData = rows;
                const scrubber = document.getElementById('replayScrubber');
                if (scrubber) {
                    scrubber.max = this.timelineData.length - 1;
                    scrubber.value = 0;
                }
                const banner = document.getElementById('replayFlightNameBanner');
                if (banner) banner.innerText = `Loaded Custom CSV: ${file.name} (${rows.length} frames)`;
                this.seekTo(0);
            }
        };
        reader.readAsText(file);
    }

    seekTo(index) {
        if (!this.timelineData || this.timelineData.length === 0) return;
        this.currentIndex = Math.max(0, Math.min(this.timelineData.length - 1, index));
        const point = this.timelineData[this.currentIndex];

        // Update timeline display
        const timeEl = document.getElementById('replayTimeDisplay');
        if (timeEl) {
            const sec = point.time_sec !== undefined ? point.time_sec : (this.currentIndex * 10);
            const m = Math.floor(sec / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            timeEl.innerText = `${m}:${s}`;
        }

        // Apply point to gauges
        if (window.telemetryAnimator) {
            window.telemetryAnimator.updateMetric('replayRpmVal', point.rpm || 2350, 0);
            window.telemetryAnimator.updateMetric('replayChtVal', point.cht || 170, 1, '°C');
            window.telemetryAnimator.updateMetric('replayEgtVal', point.egt || 645, 1, '°C');
            window.telemetryAnimator.updateMetric('replayOilPVal', point.oil_press || point.oilPressure || 4.2, 2, 'bar');
            window.telemetryAnimator.updateMetric('replayVibVal', point.vibration || 2.1, 2, 'mm/s');
            window.telemetryAnimator.updateMetric('replayHealthVal', point.health || 94, 0, '%');
        }

        const scrubber = document.getElementById('replayScrubber');
        if (scrubber) scrubber.value = this.currentIndex;
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        this.isPlaying = true;
        const playBtn = document.getElementById('replayPlayBtn');
        if (playBtn) playBtn.innerText = '⏸ Pause';

        const delay = Math.max(100, 800 / this.playbackSpeed);
        this.playInterval = setInterval(() => {
            if (this.currentIndex >= this.timelineData.length - 1) {
                this.pause();
            } else {
                this.seekTo(this.currentIndex + 1);
            }
        }, delay);
    }

    pause() {
        this.isPlaying = false;
        const playBtn = document.getElementById('replayPlayBtn');
        if (playBtn) playBtn.innerText = '▶ Play';
        clearInterval(this.playInterval);
    }
}

window.replayController = new ReplayController();
