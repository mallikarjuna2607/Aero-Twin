class DigitalTwinService {
    calculateDifferences(actual, twinExpected) {
        const rpmDiff = Math.abs(actual.rpm - twinExpected.rpm);
        const chtDiff = Math.abs(actual.cht - twinExpected.cht);
        const egtDiff = Math.abs(actual.egt - twinExpected.egt);
        const oilPressureDiff = Math.abs(actual.oilPressure - twinExpected.oilPressure);
        const oilTempDiff = Math.abs(actual.oilTemperature - twinExpected.oilTemperature);
        const vibDiff = Math.abs(actual.vibration - twinExpected.vibration);
        const fuelDiff = Math.abs(actual.fuelFlow - twinExpected.fuelFlow);

        // Normalize difference errors
        const errorScore = (rpmDiff / 2350.0 * 20.0) +
                           (chtDiff / 170.0 * 25.0) +
                           (egtDiff / 640.0 * 20.0) +
                           (oilPressureDiff / 4.2 * 20.0) +
                           (vibDiff / 2.0 * 15.0);

        const syncPercentage = Math.max(10.0, Math.min(100.0, 100.0 - errorScore));

        return {
            rpmDiff: parseFloat(rpmDiff.toFixed(1)),
            chtDiff: parseFloat(chtDiff.toFixed(1)),
            egtDiff: parseFloat(egtDiff.toFixed(1)),
            oilPressureDiff: parseFloat(oilPressureDiff.toFixed(2)),
            oilTempDiff: parseFloat(oilTempDiff.toFixed(1)),
            vibDiff: parseFloat(vibDiff.toFixed(2)),
            fuelDiff: parseFloat(fuelDiff.toFixed(2)),
            syncPercentage: parseFloat(syncPercentage.toFixed(1))
        };
    }
}

module.exports = new DigitalTwinService();
