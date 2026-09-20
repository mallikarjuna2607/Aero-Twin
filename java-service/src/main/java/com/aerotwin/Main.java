package com.aerotwin;

public class Main {
    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println(" AeroTwin Java Mission Reliability Service       ");
        System.out.println(" DRDO / SIH MALE-UAV Aero-Piston Digital Twin    ");
        System.out.println("=================================================");

        if (args.length > 0 && args[0].equals("--report-demo")) {
            String report = ReportGenerator.generateFlightReport("HIGH_ALTITUDE", 124.5, 2580, 198.5, 725.0, 3.8, 4.2, 84.0, 0, 2);
            System.out.println(report);
            return;
        }

        // Test run
        System.out.println("\n[1] Testing Mission Risk Analyzer:");
        RiskAnalyzer.RiskAssessment ra = RiskAnalyzer.assess(92.0, 172.0, 648.0, 4.2, 2.1, 10000.0, 3.5);
        System.out.println("  Result: " + ra);

        System.out.println("\n[2] Testing Reliability & Weibull Modeling:");
        ReliabilityService.ReliabilityMetrics rm = ReliabilityService.evaluate(120.0, 92.0, 4.0);
        System.out.printf("  MTBF: %.1f hours | Failure Prob: %.3f | Status: %s\n", 
            rm.mtbfHours, rm.failureProbability, rm.maintenanceStatus);

        System.out.println("\n[3] Service Status: READY for REST / WebSocket integration.");
    }
}
