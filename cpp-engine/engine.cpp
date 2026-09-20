#include "engine.h"
#include "sensors.h"
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>

static SensorModel sensorSys;

AeroEngine::AeroEngine() 
    : baseRpm(2350.0), throttle(0.72), altitude(10000.0), simTime(0.0),
      currentFault(FaultType::NONE), faultSeverity(0.0) {}

void AeroEngine::setThrottle(double t) {
    throttle = std::max(0.2, std::min(1.0, t));
}

void AeroEngine::setAltitude(double alt) {
    altitude = std::max(0.0, std::min(25000.0, alt));
}

void AeroEngine::injectFault(FaultType fault, double severity) {
    currentFault = fault;
    faultSeverity = std::max(0.1, std::min(1.0, severity));
}

void AeroEngine::clearFault() {
    currentFault = FaultType::NONE;
    faultSeverity = 0.0;
}

TelemetryPoint AeroEngine::computeNominalPhysics(double throttleLevel, double altLevel) {
    TelemetryPoint p;
    // Standard ISA atmosphere estimation
    double altRatio = altLevel / 10000.0;
    p.ambientTemp = 20.0 - (altRatio * 6.5);
    
    p.rpm = 2000.0 + (throttleLevel * 500.0);
    p.engineLoad = throttleLevel * 100.0;
    p.altitude = altLevel;
    
    // Thermodynamics based on load and ambient
    p.cht = 150.0 + (throttleLevel * 30.0) + (p.ambientTemp * 0.1);
    p.egt = 580.0 + (throttleLevel * 90.0) - (altRatio * 5.0);
    p.oilPressure = 4.3 - (throttleLevel * 0.2);
    p.oilTemperature = 85.0 + (throttleLevel * 10.0);
    p.fuelFlow = 12.0 + (throttleLevel * 8.5) * (1.0 - altRatio * 0.05);
    p.vibration = 1.8 + (throttleLevel * 0.4);
    p.healthScore = 95.0;
    p.condition = "NORMAL";
    return p;
}

DigitalTwinState AeroEngine::step(double dt) {
    simTime += dt;
    DigitalTwinState state;
    
    // 1. Compute Expected Nominal Physics (Digital Twin)
    state.twinExpected = computeNominalPhysics(throttle, altitude);

    // 2. Compute Physical Engine State (with noise and dynamics)
    TelemetryPoint act = state.twinExpected;
    
    // Add small realistic harmonic noise to actual engine
    double harmonic = std::sin(simTime * 2.0);
    act.rpm += sensorSys.sample(0.0, 3.5) + (harmonic * 2.0);
    act.cht += sensorSys.sample(0.0, 0.4);
    act.egt += sensorSys.sample(0.0, 1.2);
    act.oilPressure += sensorSys.sample(0.0, 0.03);
    act.oilTemperature += sensorSys.sample(0.0, 0.3);
    act.fuelFlow += sensorSys.sample(0.0, 0.1);
    act.vibration += sensorSys.sample(0.0, 0.05);

    // 3. Apply Injected Fault Dynamics
    if (currentFault == FaultType::OVERHEATING) {
        act.cht += 35.0 * faultSeverity + (simTime * 0.1);
        act.egt += 75.0 * faultSeverity;
        act.oilTemperature += 22.0 * faultSeverity;
        act.oilPressure -= 0.5 * faultSeverity;
        act.vibration += 0.8 * faultSeverity;
    } else if (currentFault == FaultType::LOW_OIL_PRESSURE) {
        act.oilPressure = std::max(1.2, act.oilPressure - (2.4 * faultSeverity));
        act.oilTemperature += 28.0 * faultSeverity;
        act.vibration += 1.2 * faultSeverity;
    } else if (currentFault == FaultType::HIGH_VIBRATION) {
        act.vibration += 6.5 * faultSeverity;
        act.oilTemperature += 8.0 * faultSeverity;
    } else if (currentFault == FaultType::MISFIRE) {
        act.rpm -= (120.0 * faultSeverity) + (std::sin(simTime * 12.0) * 45.0);
        act.cht -= 18.0 * faultSeverity;
        act.egt -= 60.0 * faultSeverity;
        act.vibration += 3.2 * faultSeverity;
        act.fuelFlow -= 2.5 * faultSeverity;
    } else if (currentFault == FaultType::INJECTOR_FAULT) {
        act.egt += 65.0 * faultSeverity;
        act.fuelFlow += 4.5 * faultSeverity;
        act.vibration += 1.4 * faultSeverity;
    } else if (currentFault == FaultType::SENSOR_DRIFT) {
        // Transducer fault: Only CHT climbs erroneously
        act.cht += 80.0 * faultSeverity;
    }

    // 4. Calculate Health Score and Condition Tier
    double health = 100.0;
    
    // Thermal penalty
    if (act.cht > 185.0) health -= (act.cht - 185.0) * 1.5;
    if (act.egt > 710.0) health -= (act.egt - 710.0) * 0.4;
    
    // Lubrication penalty
    if (act.oilPressure < 3.2) health -= (3.2 - act.oilPressure) * 25.0;
    if (act.oilTemperature > 105.0) health -= (act.oilTemperature - 105.0) * 1.5;
    
    // Vibration penalty
    if (act.vibration > 3.0) health -= (act.vibration - 3.0) * 12.0;

    act.healthScore = std::max(10.0, std::min(100.0, health));

    if (act.healthScore >= 90.0) act.condition = "NORMAL";
    else if (act.healthScore >= 80.0) act.condition = "WATCH";
    else if (act.healthScore >= 65.0) act.condition = "WARNING";
    else act.condition = "CRITICAL";

    state.actual = act;

    // 5. Calculate Digital Twin Differences
    state.rpmDiff = std::abs(act.rpm - state.twinExpected.rpm);
    state.chtDiff = std::abs(act.cht - state.twinExpected.cht);
    state.egtDiff = std::abs(act.egt - state.twinExpected.egt);
    state.oilPressureDiff = std::abs(act.oilPressure - state.twinExpected.oilPressure);
    state.vibDiff = std::abs(act.vibration - state.twinExpected.vibration);

    // Compute Twin Synchronization %
    double errorSum = (state.rpmDiff / 2350.0 * 20.0) +
                      (state.chtDiff / 170.0 * 25.0) +
                      (state.egtDiff / 640.0 * 20.0) +
                      (state.oilPressureDiff / 4.2 * 20.0) +
                      (state.vibDiff / 2.0 * 15.0);
    state.syncPercentage = std::max(10.0, std::min(100.0, 100.0 - errorSum));

    state.activeFault = currentFault;
    state.faultName = FaultManager::faultToString(currentFault);

    return state;
}

std::string AeroEngine::toJSON(const DigitalTwinState& s) {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"timestamp\":" << simTime << ","
       << "\"actual\":{"
       << "\"rpm\":" << s.actual.rpm << ","
       << "\"cht\":" << s.actual.cht << ","
       << "\"egt\":" << s.actual.egt << ","
       << "\"oilPressure\":" << s.actual.oilPressure << ","
       << "\"oilTemperature\":" << s.actual.oilTemperature << ","
       << "\"fuelFlow\":" << s.actual.fuelFlow << ","
       << "\"vibration\":" << s.actual.vibration << ","
       << "\"altitude\":" << s.actual.altitude << ","
       << "\"ambientTemp\":" << s.actual.ambientTemp << ","
       << "\"engineLoad\":" << s.actual.engineLoad << ","
       << "\"healthScore\":" << s.actual.healthScore << ","
       << "\"condition\":\"" << s.actual.condition << "\""
       << "},"
       << "\"twinExpected\":{"
       << "\"rpm\":" << s.twinExpected.rpm << ","
       << "\"cht\":" << s.twinExpected.cht << ","
       << "\"egt\":" << s.twinExpected.egt << ","
       << "\"oilPressure\":" << s.twinExpected.oilPressure << ","
       << "\"oilTemperature\":" << s.twinExpected.oilTemperature << ","
       << "\"fuelFlow\":" << s.twinExpected.fuelFlow << ","
       << "\"vibration\":" << s.twinExpected.vibration
       << "},"
       << "\"twinDifference\":{"
       << "\"rpm\":" << s.rpmDiff << ","
       << "\"cht\":" << s.chtDiff << ","
       << "\"egt\":" << s.egtDiff << ","
       << "\"oilPressure\":" << s.oilPressureDiff << ","
       << "\"vibration\":" << s.vibDiff << ","
       << "\"syncPercentage\":" << s.syncPercentage
       << "},"
       << "\"activeFault\":\"" << s.faultName << "\","
       << "\"recommendedAction\":\"" << FaultManager::getRecommendedAction(s.activeFault) << "\""
       << "}";
    return ss.str();
}
