#ifndef AEROTWIN_FAULTS_H
#define AEROTWIN_FAULTS_H

#include <string>

enum class FaultType {
    NONE = 0,
    OVERHEATING,
    LOW_OIL_PRESSURE,
    HIGH_VIBRATION,
    MISFIRE,
    INJECTOR_FAULT,
    SENSOR_DRIFT
};

class FaultManager {
public:
    static std::string faultToString(FaultType f);
    static FaultType stringToFault(const std::string& str);
    static std::string getRecommendedAction(FaultType f);
};

#endif // AEROTWIN_FAULTS_H
