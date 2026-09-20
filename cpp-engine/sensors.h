#ifndef AEROTWIN_SENSORS_H
#define AEROTWIN_SENSORS_H

#include <random>

class SensorModel {
private:
    std::mt19937 generator;
    std::normal_distribution<double> noiseDist;

public:
    SensorModel();
    double sample(double trueValue, double noiseStdDev = 0.02);
    double quantize(double value, double resolution);
};

#endif // AEROTWIN_SENSORS_H
