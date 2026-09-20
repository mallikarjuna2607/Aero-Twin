#include "engine.h"
#include <iostream>
#include <string>
#include <chrono>
#include <thread>

int main(int argc, char* argv[]) {
    AeroEngine engine;
    
    // Check command line arguments for fault injection
    if (argc > 1) {
        std::string arg = argv[1];
        if (arg == "--fault" && argc > 2) {
            std::string fStr = argv[2];
            engine.injectFault(FaultManager::stringToFault(fStr));
        } else if (arg == "--altitude" && argc > 2) {
            engine.setAltitude(std::stod(argv[2]));
        }
    }

    // Interactive or stream mode
    int steps = 100;
    if (argc > 3) {
        steps = std::stoi(argv[3]);
    }

    for (int i = 0; i < steps; ++i) {
        DigitalTwinState state = engine.step(0.2); // 200ms step
        std::cout << engine.toJSON(state) << std::endl;
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    return 0;
}
