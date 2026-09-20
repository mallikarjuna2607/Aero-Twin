package com.aerotwin;

import java.time.Instant;

public class ReportGenerator {

    public static String generateFlightReport(String missionName, double durationMin, 
                                             double maxRpm, double maxCht, double maxEgt, 
                                             double minOilPress, double maxVib, 
                                             double finalHealth, int faultCount, int warningCount) {
        StringBuilder sb = new StringBuilder();
        sb.append("================================================================================\n");
        sb.append("                 AEROTWIN UAV ENGINE FLIGHT INTELLIGENCE REPORT                \n");
        sb.append("                DRDO / SIH MALE-UAV AERO-PISTON DIGITAL TWIN                   \n");
        sb.append("================================================================================\n");
        sb.append(String.format("Generated At:         %s\n", Instant.now().toString()));
        sb.append(String.format("Mission Profile:      %s\n", missionName));
        sb.append(String.format("Recorded Duration:    %.1f minutes\n", durationMin));
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append("EXTREME ENGINE PARAMETERS ENCOUNTERED:\n");
        sb.append(String.format("  • Peak RPM:                   %.0f RPM  (Redline: 2750)\n", maxRpm));
        sb.append(String.format("  • Peak Cylinder Head Temp:    %.1f °C   (Threshold: 200°C)\n", maxCht));
        sb.append(String.format("  • Peak Exhaust Gas Temp:      %.1f °C   (Threshold: 740°C)\n", maxEgt));
        sb.append(String.format("  • Lowest Oil Pressure:        %.2f bar  (Minimum Safe: 2.2 bar)\n", minOilPress));
        sb.append(String.format("  • Maximum RMS Vibration:      %.2f mm/s (Threshold: 5.0 mm/s)\n", maxVib));
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append("HEALTH & ANOMALY SUMMARY:\n");
        sb.append(String.format("  • Final Health Index:         %.1f / 100\n", finalHealth));
        sb.append(String.format("  • Total Warnings Logged:      %d\n", warningCount));
        sb.append(String.format("  • Critical Faults Logged:     %d\n", faultCount));
        
        RiskAnalyzer.RiskAssessment risk = RiskAnalyzer.assess(finalHealth, maxCht, maxEgt, minOilPress, maxVib, 10000.0, durationMin / 60.0);
        sb.append(String.format("  • Computed Mission Risk:      %s (Risk Score: %.1f)\n", risk.riskCategory, risk.riskScore));
        sb.append(String.format("  • Primary Concern:            %s\n", risk.primaryConcern));
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append("MAINTENANCE ADVISORY:\n");
        if (faultCount > 0 || finalHealth < 70.0) {
            sb.append("  [ACTION REQUIRED] Immediate ground inspection recommended before next sortie.\n");
            sb.append("  Recommended checks:\n");
            if (maxCht > 195.0) sb.append("    - Flush cooling system and inspect cylinder baffles.\n");
            if (minOilPress < 2.5) sb.append("    - Check oil sump for metal particle contamination and inspect pump.\n");
            if (maxVib > 4.5) sb.append("    - Dynamic balancing of propeller assembly and journal bearing check.\n");
        } else {
            sb.append("  [CLEARED] Aircraft is ready for subsequent sortie under standard pre-flight checklist.\n");
        }
        sb.append("================================================================================\n");

        return sb.toString();
    }
}
