package com.aerotwin;

import java.util.HashMap;
import java.util.Map;

public class MissionService {

    public static class MissionProfile {
        public String name;
        public double altitudeCeiling;
        public double expectedDurationHours;
        public double cruiseThrottle;
        public double ambientTempRange;
        public String description;

        public MissionProfile(String name, double alt, double dur, double thr, double temp, String desc) {
            this.name = name;
            this.altitudeCeiling = alt;
            this.expectedDurationHours = dur;
            this.cruiseThrottle = thr;
            this.ambientTempRange = temp;
            this.description = desc;
        }
    }

    private static final Map<String, MissionProfile> PROFILES = new HashMap<>();

    static {
        PROFILES.put("NORMAL", new MissionProfile("Normal Flight", 10000.0, 4.0, 0.70, 20.0, "Standard border/perimeter reconnaissance mission"));
        PROFILES.put("LONG_ENDURANCE", new MissionProfile("Long Endurance", 12000.0, 14.0, 0.65, 15.0, "Extended loiter surveillance profile"));
        PROFILES.put("HIGH_ALTITUDE", new MissionProfile("High Altitude", 18000.0, 6.0, 0.85, -5.0, "Upper airspace ceiling test with thin air mixture"));
        PROFILES.put("HOT_WEATHER", new MissionProfile("Hot Weather Desert", 8000.0, 5.0, 0.75, 42.0, "High ambient temperature thermal stress envelope"));
        PROFILES.put("RAPID_THROTTLE", new MissionProfile("Rapid Throttle Tactical", 9000.0, 2.5, 0.90, 25.0, "Frequent climb and descent power transients"));
    }

    public static MissionProfile getProfile(String key) {
        return PROFILES.getOrDefault(key.toUpperCase(), PROFILES.get("NORMAL"));
    }

    public static Map<String, MissionProfile> getAllProfiles() {
        return PROFILES;
    }
}
