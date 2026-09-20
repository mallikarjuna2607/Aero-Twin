/**
 * AeroTwin Mission Simulator & Risk Controller
 */

class MissionController {
    constructor() {
        this.selectedProfile = 'NORMAL';
    }

    init() {
        // Bind profile radios
        const profileInputs = document.querySelectorAll('input[name="missionProfile"]');
        profileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.selectProfile(e.target.value);
            });
        });

        // Sliders
        const altSlider = document.getElementById('missionAltSlider');
        const altDisplay = document.getElementById('missionAltDisplay');
        if (altSlider && altDisplay) {
            altSlider.addEventListener('input', (e) => {
                altDisplay.innerText = `${parseInt(e.target.value).toLocaleString()} ft`;
            });
        }

        const tempSlider = document.getElementById('missionTempSlider');
        const tempDisplay = document.getElementById('missionTempDisplay');
        if (tempSlider && tempDisplay) {
            tempSlider.addEventListener('input', (e) => {
                tempDisplay.innerText = `${e.target.value}°C`;
            });
        }

        // Start mission button
        const startBtn = document.getElementById('startMissionBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startMission();
            });
        }
    }

    selectProfile(profileId) {
        this.selectedProfile = profileId;
        const altSlider = document.getElementById('missionAltSlider');
        const altDisplay = document.getElementById('missionAltDisplay');
        const tempSlider = document.getElementById('missionTempSlider');
        const tempDisplay = document.getElementById('missionTempDisplay');

        const map = {
            'NORMAL': { alt: 10000, temp: 18 },
            'LONG_ENDURANCE': { alt: 12000, temp: 14 },
            'HIGH_ALTITUDE': { alt: 18000, temp: -5 },
            'HOT_WEATHER': { alt: 8000, temp: 42 },
            'RAPID_THROTTLE': { alt: 9000, temp: 24 }
        };

        const config = map[profileId] || map['NORMAL'];
        if (altSlider) {
            altSlider.value = config.alt;
            if (altDisplay) altDisplay.innerText = `${config.alt.toLocaleString()} ft`;
        }
        if (tempSlider) {
            tempSlider.value = config.temp;
            if (tempDisplay) tempDisplay.innerText = `${config.temp}°C`;
        }
    }

    startMission() {
        const alt = parseFloat(document.getElementById('missionAltSlider')?.value || 10000);
        const temp = parseFloat(document.getElementById('missionTempSlider')?.value || 18);

        fetch('/api/mission/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profileId: this.selectedProfile,
                altitude: alt,
                temperature: temp
            })
        }).then(res => res.json())
          .then(data => {
              const banner = document.getElementById('missionActiveBanner');
              if (banner) {
                  banner.innerText = `● ACTIVE: ${data.name || 'Flight'} (${alt.toLocaleString()} ft, ${temp}°C)`;
                  banner.style.display = 'inline-block';
              }
          }).catch(err => console.warn('Mission start fallback:', err));
    }

    updateRiskUI(risk) {
        if (!risk) return;

        const scoreEl = document.getElementById('missionRiskScore');
        const catEl = document.getElementById('missionRiskCategory');
        const barEl = document.getElementById('missionRiskBar');
        const factorsContainer = document.getElementById('missionRiskFactors');

        if (scoreEl) scoreEl.innerText = `${risk.riskScore || 15}/100`;
        if (catEl) {
            const cat = risk.riskCategory || 'LOW';
            catEl.innerText = cat;
            catEl.className = `health-condition-tag ${cat.toLowerCase()}`;
        }
        if (barEl) {
            barEl.style.width = `${risk.riskScore || 15}%`;
            if (risk.riskScore > 75) barEl.style.background = '#ef4444';
            else if (risk.riskScore > 45) barEl.style.background = '#f97316';
            else if (risk.riskScore > 25) barEl.style.background = '#eab308';
            else barEl.style.background = '#22c55e';
        }

        if (factorsContainer && risk.factors) {
            factorsContainer.innerHTML = '';
            risk.factors.forEach(f => {
                const pill = document.createElement('span');
                pill.className = 'target-badge';
                pill.innerText = f;
                factorsContainer.appendChild(pill);
            });
        }
    }
}

window.missionController = new MissionController();
