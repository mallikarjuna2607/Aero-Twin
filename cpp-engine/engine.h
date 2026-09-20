#ifndef AEROTWIN_ENGINE_H
#define AEROTWIN_ENGINE_H

#include <string>
#include "faults.h"

struct TelemetryPoint {
    double rpm;
    double cht;             // Cylinder Head Temperature (°C)
    double egt;             // Exhaust Gas Temperature (°C)
    double oilPressure;     // Oil Pressure (bar)
    double oilTemperature;  // Oil Temperature (°C)
    double fuelFlow;        // Fuel Flow (L/h)
    double vibration;       // Vibration RMS (mm/s)
    double altitude;        // Altitude (ft)
    double ambientTemp;     // Ambient Temperature (°C)
    double engineLoad;      // Engine Load (%)
    double healthScore;     // Health Index (0-100)
    std::string condition;  // NORMAL, WATCH, WARNING, CRITICAL
};

struct DigitalTwinState {
    TelemetryPoint actual;
    TelemetryPoint twinExpected;
    double syncPercentage;
    double rpmDiff;
    double chtDiff;
    double egtDiff;
    double oilPressureDiff;
    double vibDiff;
    FaultType activeFault;
    std::string faultName;
};

class AeroEngine {
private:
    double baseRpm;
    double throttle;
    double altitude;
    double simTime;
    FaultType currentFault;
    double faultSeverity;

    TelemetryPoint computeNominalPhysics(double throttleLevel, double altLevel);

public:
    AeroEngine();
    void setThrottle(double t);
    void setAltitude(double alt);
    void injectFault(FaultType fault, double severity = 1.0);
    void clearFault();
    DigitalTwinState step(double dt);
    std::string toJSON(const DigitalTwinState& state);
};

#endif // AEROTWIN_ENGINE_H
