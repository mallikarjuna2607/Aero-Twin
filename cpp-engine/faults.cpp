#include "faults.h"

std::string FaultManager::faultToString(FaultType f) {
    switch (f) {
        case FaultType::OVERHEATING: return "OVERHEATING";
        case FaultType::LOW_OIL_PRESSURE: return "LOW_OIL_PRESSURE";
        case FaultType::HIGH_VIBRATION: return "HIGH_VIBRATION";
        case FaultType::MISFIRE: return "MISFIRE";
        case FaultType::INJECTOR_FAULT: return "INJECTOR_FAULT";
        case FaultType::SENSOR_DRIFT: return "SENSOR_DRIFT";
        default: return "NONE";
    }
}

FaultType FaultManager::stringToFault(const std::string& str) {
    if (str == "OVERHEATING") return FaultType::OVERHEATING;
    if (str == "LOW_OIL_PRESSURE") return FaultType::LOW_OIL_PRESSURE;
    if (str == "HIGH_VIBRATION") return FaultType::HIGH_VIBRATION;
    if (str == "MISFIRE") return FaultType::MISFIRE;
    if (str == "INJECTOR_FAULT") return FaultType::INJECTOR_FAULT;
    if (str == "SENSOR_DRIFT") return FaultType::SENSOR_DRIFT;
    return FaultType::NONE;
}

std::string FaultManager::getRecommendedAction(FaultType f) {
    switch (f) {
        case FaultType::OVERHEATING:
            return "Inspect cylinder cooling baffles, radiator airflow, and coolant circulator.";
        case FaultType::LOW_OIL_PRESSURE:
            return "Check oil pump bypass valve, oil level, and filter element for blockage.";
        case FaultType::HIGH_VIBRATION:
            return "Inspect propeller dynamic balance and crankshaft journal bearings.";
        case FaultType::MISFIRE:
            return "Check ignition harness, dual spark plugs, and ECU ignition timing.";
        case FaultType::INJECTOR_FAULT:
            return "Clean fuel injector nozzles and inspect fuel rail delivery pressure.";
        case FaultType::SENSOR_DRIFT:
            return "Inspect thermocouple wiring harness; calibrate or replace CHT transducer.";
        default:
            return "No maintenance action required. System operating normally.";
    }
}
