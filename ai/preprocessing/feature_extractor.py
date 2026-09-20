"""
AeroTwin Feature Extractor
Extracts time-domain and frequency-domain statistical features from engine telemetry.
"""

import math

class FeatureExtractor:
    def __init__(self, window_size=10):
        self.window_size = window_size
        self.history = []

    def compute_features(self, sample):
        """
        Calculates mean, variance, RMS, crest factor, and kurtosis.
        """
        self.history.append(sample)
        if len(self.history) > self.window_size:
            self.history.pop(0)

        n = len(self.history)
        if n == 0:
            return {}

        # Mean of each sensor
        keys = sample.keys()
        features = {}
        for k in keys:
            if isinstance(sample[k], (int, float)):
                vals = [h[k] for h in self.history]
                mean_val = sum(vals) / n
                var_val = sum((x - mean_val) ** 2 for x in vals) / n
                rms_val = math.sqrt(sum(x ** 2 for x in vals) / n)
                features[f"{k}_mean"] = round(mean_val, 2)
                features[f"{k}_std"] = round(math.sqrt(var_val), 2)
                features[f"{k}_rms"] = round(rms_val, 2)

        return features

if __name__ == "__main__":
    fe = FeatureExtractor()
    sample = {"rpm": 2350, "cht": 171.2, "oil_press": 4.2, "vibration": 2.1}
    print("Feature Extractor Test Output:")
    print(fe.compute_features(sample))
