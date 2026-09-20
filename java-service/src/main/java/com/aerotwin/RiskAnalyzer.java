package com.aerotwin;

import java.util.ArrayList;
import java.util.List;

public class RiskAnalyzer {

    public static class RiskAssessment {
        public double riskScore;       // 0 to 100
        public String riskCategory;    // LOW, MEDIUM, HIGH, CRITICAL
        public List<String> factors = new ArrayList<>();
        public String primaryConcern;

        @Override
        public String toString() {
            return String.format("RiskAssessment[Category=%s, Score=%.1f, Factors=%s]", 
                riskCategory, riskScore, String.join(", ", factors));
        }
    }

    public static RiskAssessment assess(double healthScore, double cht, double egt, 
                                       double oilPress, double vib, double altFeet, double durationHours) {
        RiskAssessment ra = new RiskAssessment();
        double score = 0.0;

        // Health impact
        if (healthScore < 60.0) {
            score += 40.0;
            ra.factors.add("Critical health degradation (Score: " + healthScore + ")");
        } else if (healthScore < 80.0) {
            score += 20.0;
            ra.factors.add("Moderate health degradation");
        }

        // Thermal stress
        if (cht > 200.0) {
            score += 25.0;
            ra.factors.add("Excessive Cylinder Head Temp (" + cht + "°C)");
        } else if (cht > 185.0) {
            score += 12.0;
            ra.factors.add("Elevated CHT (" + cht + "°C)");
        }

        // Lubrication risk
        if (oilPress < 2.5) {
            score += 25.0;
            ra.factors.add("Severe low oil pressure (" + oilPress + " bar)");
        } else if (oilPress < 3.2) {
            score += 10.0;
            ra.factors.add("Marginal oil pressure");
        }

        // Mechanical / Vibration risk
        if (vib > 6.0) {
            score += 25.0;
            ra.factors.add("High mechanical vibration (" + vib + " mm/s RMS)");
        } else if (vib > 3.0) {
            score += 10.0;
            ra.factors.add("Mild vibration anomaly");
        }

        // Operational duration & altitude factor
        if (durationHours > 8.0) {
            score += 8.0;
            ra.factors.add("Long endurance fatigue window (>8h)");
        }
        if (altFeet > 15000.0) {
            score += 5.0;
            ra.factors.add("High altitude lean-combustion regime");
        }

        ra.riskScore = Math.min(100.0, Math.max(0.0, score));

        if (ra.riskScore < 25.0) {
            ra.riskCategory = "LOW";
            ra.primaryConcern = "Nominal operating conditions. Mission can proceed safely.";
        } else if (ra.riskScore < 55.0) {
            ra.riskCategory = "MEDIUM";
            ra.primaryConcern = "Advisory limits approached. Continuously monitor telemetry trends.";
        } else if (ra.riskScore < 80.0) {
            ra.riskCategory = "HIGH";
            ra.primaryConcern = "Hazard detected. Consider aborting or descending to closer recovery waypoint.";
        } else {
            ra.riskCategory = "CRITICAL";
            ra.primaryConcern = "Imminent subsystem breakdown. Execute immediate emergency landing protocol.";
        }

        if (ra.factors.isEmpty()) {
            ra.factors.add("All subsystem parameters within nominal bounds");
        }

        return ra;
    }
}
