CXX = g++
CXXFLAGS = -O3 -std=c++11 -Wall

all: aerotwin_engine

aerotwin_engine: main.cpp engine.cpp sensors.cpp faults.cpp
	$(CXX) $(CXXFLAGS) main.cpp engine.cpp sensors.cpp faults.cpp -o aerotwin_engine

clean:
	rm -f aerotwin_engine aerotwin_engine.exe
