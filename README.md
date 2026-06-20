# MPPT Solar Charger with Advanced Control and Monitoring

This repository contains the complete source code, hardware design files, machine learning models, and simulations for a sophisticated Maximum Power Point Tracking (MPPT) Solar Charge Controller. The system leverages an STM32 microcontroller for high-speed digital control, an ESP32 for wireless IoT monitoring, and artificial intelligence (Neural Networks) to optimize solar energy harvesting.

## Key Features

- **Advanced MPPT Algorithms**: Implements multiple MPPT algorithms including Incremental Conductance (IC) and an innovative Artificial Neural Network (ANN) combined with a PI controller for superior tracking efficiency under rapidly changing weather conditions.
- **AI at the Edge**: Deploys a trained Neural Network model directly onto the STM32 microcontroller using STMicroelectronics' X-CUBE-AI.
- **IoT Monitoring**: An ESP32 module handles data transmission to a cloud database (Firebase).
- **Web Dashboard**: A React/Vite-based web application provides real-time monitoring of solar panel voltage, current, power output, and battery status.
- **Comprehensive Simulations**: Includes MATLAB/Simulink models for comparing various MPPT algorithms (P&O, IC, FLC, and ANN+PI).

## Hardware Components

- **Main Controller**: STM32F407VGTX Microcontroller
- **IoT & Communication**: ESP32
- **Power Electronics**: DC-DC Buck/Boost Converter topology
- **Sensors**: Voltage and Current sensors for PV panel and Battery

## Repository Structure

- `ANN_ML/`: Contains the dataset (`mppt_4sensor_dataset.csv`), Python training scripts (`train_mppt.py`), and the generated ML models (`.h5` and `.onnx`). Includes scripts to convert the model for STM32 deployment.
- `STM32/`: Contains the STM32CubeIDE projects for the main controller.
  - `ANN_Plus_PI_Algorithem/`: Firmware implementing the Neural Network based MPPT using X-CUBE-AI.
  - `IC_Algorithem/`: Firmware implementing the traditional Incremental Conductance MPPT algorithm.
- `ESP32/`: Contains the firmware for the ESP32 module (handling Wi-Fi connection and pushing telemetry data to Firebase).
- `WEB_APP/`: The frontend source code for the real-time monitoring dashboard (React, Vite, Firebase).
- `SIMULINK_CIRCUIT_Simulation/`: MATLAB/Simulink models used to simulate and compare the performance of different MPPT algorithms (P&O, IC, FLC, ANN+PI).
- `MPPT-Solar-Charger-with-Advanced-Control-and-Monitoring_Report.pdf`: Comprehensive project report documenting the design, methodology, and results.

## Software & Tools Used

- **Microcontroller Programming**: STM32CubeIDE, STM32CubeMX, X-CUBE-AI
- **IoT Programming**: Arduino IDE / ESP-IDF
- **Machine Learning**: Python, TensorFlow/Keras, ONNX
- **Simulation**: MATLAB & Simulink
- **Web Frontend**: React, Vite, Node.js, Firebase (Firestore)

## Setup and Installation

### 1. Web Application (`WEB_APP`)
1. Navigate to the `WEB_APP` directory.
2. Install dependencies: `npm install`
3. Configure Firebase: Set up your `.env` based on the `.env.example` file.
4. Run the development server: `npm run dev`

### 2. Machine Learning Model (`ANN_ML`)
1. Ensure Python 3.x is installed along with TensorFlow, Keras, and ONNX tools.
2. Run `train_mppt.py` to retrain the model on the provided dataset.
3. Use the included MATLAB/Python scripts to convert the model if needed.

### 3. STM32 Firmware (`STM32`)
1. Open the `.ioc` file inside either `ANN_Plus_PI_Algorithem` or `IC_Algorithem` with STM32CubeIDE.
2. Ensure you have the X-CUBE-AI package installed if building the ANN project.
3. Build the project and flash it to your STM32F407 board.

### 4. ESP32 Firmware (`ESP32`)
1. Open the respective ESP32 project folder in your preferred IDE.
2. Update the Wi-Fi credentials and Firebase configuration in the source code.
3. Flash the firmware to the ESP32.

## Simulation
Navigate to `SIMULINK_CIRCUIT_Simulation` to find the MATLAB Simulink (`.slx`) files. You can run these simulations to visualize the theoretical performance of the implemented algorithms against standard approaches.
