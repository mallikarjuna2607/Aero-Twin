#include "sensors.h"
#include <cmath>

SensorModel::SensorModel() : generator(1337), noiseDist(0.0, 1.0) {}

double SensorModel::sample(double trueValue, double noiseStdDev) {
    double noise = noiseDist(generator) * noiseStdDev * std::abs(trueValue);
    return trueValue + noise;
}

double SensorModel::quantize(double value, double resolution) {
    if (resolution <= 0.0) return value;
    return std::round(value / resolution) * resolution;
}
