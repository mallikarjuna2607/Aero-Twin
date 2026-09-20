package com.aerotwin;

public class ReliabilityService {

    public static class ReliabilityMetrics {
        public double mtbfHours;             // Mean Time Between Failures
        public double failureProbability;     // Probability of failure before mission end (0-1)
        public double weibullHazardRate;      // Instantaneous hazard rate
        public double remainingSafeCycles;    // Safe flight cycles remaining
        public String maintenanceStatus;
    }

    public static ReliabilityMetrics evaluate(double flightHoursTotal, double currentHealthScore, double missionDuration) {
        ReliabilityMetrics rm = new ReliabilityMetrics();

        // Baseline MTBF for MALE-UAV aero-piston engines: approx 650 flight hours
        double baseMtbf = 650.0;
        double healthFactor = currentHealthScore / 100.0;
        rm.mtbfHours = Math.max(50.0, baseMtbf * Math.pow(healthFactor, 1.8));

        // Weibull distribution hazard rate: beta ~ 2.1 (wear-out phase), eta ~ 700 hours
        double beta = 2.1;
        double eta = 700.0;
        rm.weibullHazardRate = (beta / eta) * Math.pow(flightHoursTotal / eta, beta - 1.0);

        // Mission failure probability P(F) = 1 - exp(-(missionDuration / MTBF)^beta)
        rm.failureProbability = 1.0 - Math.exp(-Math.pow(missionDuration / rm.mtbfHours, beta));
        rm.failureProbability = Math.min(1.0, Math.max(0.0, rm.failureProbability));

        // Remaining safe cycles estimate
        double remainingHours = (100.0 - (flightHoursTotal % 100.0)) * healthFactor;
        rm.remainingSafeCycles = Math.max(1.0, remainingHours / Math.max(1.0, missionDuration));

        if (rm.failureProbability < 0.05) {
            rm.maintenanceStatus = "NORMAL - System flight-ready";
        } else if (rm.failureProbability < 0.18) {
            rm.maintenanceStatus = "ADVISORY - Schedule routine inspection after flight";
        } else {
            rm.maintenanceStatus = "RESTRICTED - Ground aircraft for maintenance check";
        }

        return rm;
    }
}
