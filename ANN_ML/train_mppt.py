# --- IMPORTS ---
import pandas as pd # Data manipulation and analysis
import numpy as np # Numerical operations
import tensorflow as tf # Core deep learning library
from tensorflow.keras.models import Sequential # For building linear stack of layers
from tensorflow.keras.layers import Dense # Fully connected neural network layers
from sklearn.model_selection import train_test_split # To split data into train and test sets
from sklearn.preprocessing import MinMaxScaler # For scaling features to a specific range (0 to 1)
import tf2onnx # Converts TensorFlow models to ONNX format (for Simulink)
import os # Operating system interactions
import matplotlib.pyplot as plt # Plotting graphs

# 1. Load the dataset
print("Loading dataset...")
df = pd.read_csv('mppt_4sensor_dataset.csv')

# ==============================================================================
# CONFIGURATION: Set your specific Simulink Load Resistance here!
# A feed-forward Neural Network WITHOUT memory (no PI controller) cannot mathematically 
# guess the load resistance. It must be trained for the exact load you are using!
print("Calculating mathematically perfect V_mpp targets for the dataset...")

# FIX FOR DATASET ERRORS:
# We must find the Absolute Maximum Power (V_pv * I_pv) for each group, 
# and extract the exact V_pv that achieved that peak power!

# Calculate the actual power for each row
df['P_pv'] = df['V_pv'] * df['I_pv']

# Find the indices of the rows that contain the maximum power for each unique combination of Irradiance and Temperature
idx_max_power = df.groupby(['Irradiance', 'Temperature'])['P_pv'].idxmax()

# Extract only the Irradiance, Temperature, and the corresponding V_pv at maximum power
true_vmpp_mapping = df.loc[idx_max_power, ['Irradiance', 'Temperature', 'V_pv']]

# Rename 'V_pv' to 'True_V_mpp' since it's the target maximum power point voltage
true_vmpp_mapping = true_vmpp_mapping.rename(columns={'V_pv': 'True_V_mpp'})

# Merge this true V_mpp back into the main dataframe so every row has the target V_mpp
df = pd.merge(df, true_vmpp_mapping, on=['Irradiance', 'Temperature'], how='left')

# Define features (inputs) and labels (outputs)
X = df[['Irradiance', 'Temperature', 'V_pv', 'I_pv']]
y = df['True_V_mpp'] # Our target is now Voltage!

# Scale the input features to the range [0, 1] to improve neural network training stability
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

print("\n=== CRITICAL FOR C-CODE (SAVE THESE!) ===")
print("Min values [Irr, Temp, V_pv, I_pv]:", scaler.data_min_)
print("Max values [Irr, Temp, V_pv, I_pv]:", scaler.data_max_)
print("=========================================\n")

# Split the dataset into 80% training data and 20% testing data
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

print("Building Voltage-Target Neural Network...")
# Define the input layer to accept 4 features
inputs = tf.keras.Input(shape=(4,), name="mppt_inputs")

# We MASK (multiply by zero) V_pv and I_pv so the model is forced to ONLY learn from Irr and Temp.
mask = tf.constant([1.0, 1.0, 0.0, 0.0], dtype=tf.float32)
masked_inputs = inputs * mask

# Hidden layers to learn the non-linear relationship between inputs and output
x = Dense(32, activation='relu')(masked_inputs) # First hidden layer with 32 neurons
x = Dense(16, activation='relu')(x)             # Second hidden layer with 16 neurons
outputs = Dense(1, activation='linear')(x)      # Output layer predicting a single continuous value (V_mpp)

# Construct the model
model = tf.keras.Model(inputs=inputs, outputs=outputs)

# Compile the model specifying the optimizer and loss function (Mean Squared Error)
model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# 4. Train
print("Training the Microcontroller AI to predict V_mpp...")
# Train the model for 300 epochs, tracking validation performance to detect overfitting
history = model.fit(X_train, y_train, epochs=300, batch_size=16, validation_data=(X_test, y_test), verbose=1)

print("\n=== Training Results ===")
print(f"Final Training Loss (MSE): {history.history['loss'][-1]:.4f}")
print(f"Final Validation Loss (MSE): {history.history['val_loss'][-1]:.4f}")
print(f"Final Training Accuracy (MAE): {history.history['mae'][-1]:.4f}")
print(f"Final Validation Accuracy (MAE): {history.history['val_mae'][-1]:.4f}")

# --- CALCULATE TRUE MPPT TRACKING EFFICIENCY ---
print("\nCalculating True MPPT Tracking Efficiency...")

# Unscale the test data back to original physical values to compute efficiency correctly
X_test_unscaled = scaler.inverse_transform(X_test)
irr_test = X_test_unscaled[:, 0]
temp_test = X_test_unscaled[:, 1]

# Predict V_mpp on the test dataset
v_pred = model.predict(X_test, verbose=0)

efficiencies = []
# We'll use a fast grouped dictionary to avoid slow Pandas filtering in a loop
grouped = df.groupby(['Irradiance', 'Temperature'])

# Calculate the efficiency for each test sample
for i in range(len(v_pred)):
    irr = irr_test[i]
    temp = temp_test[i]
    pred_v = v_pred[i][0]
    
    try:
        # Get the dataset records corresponding to the current environmental conditions
        group = grouped.get_group((irr, temp))
        
        # The theoretical maximum power for these conditions
        P_mpp = group['P_pv'].max()
        
        # Find the actual power that corresponds to our predicted voltage
        closest_idx = (group['V_pv'] - pred_v).abs().idxmin()
        P_actual = group.loc[closest_idx, 'P_pv']
        
        # Calculate percentage efficiency: (Actual Power Achieved / Maximum Possible Power) * 100
        if P_mpp > 0:
            efficiencies.append((P_actual / P_mpp) * 100.0)
    except KeyError:
        continue

# Average the tracking efficiencies across the test set
true_efficiency = np.mean(efficiencies)
print(f"True MPPT Tracking Efficiency: {true_efficiency:.2f}%")
print("========================\n")

# --- GENERATE FYP REPORT GRAPH ---
plt.figure(figsize=(8, 6))
plt.plot(history.history['loss'], label='Training Loss', color='blue', linewidth=2)
plt.plot(history.history['val_loss'], label='Validation Loss', color='orange', linewidth=2)
plt.title('Neural Network Training Convergence', fontsize=14, fontweight='bold')
plt.xlabel('Epochs', fontsize=12)
plt.ylabel('Mean Squared Error (MSE)', fontsize=12)
plt.legend(fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)

# Save a high-resolution image for your Word document!
plt.savefig('FYP_Loss_Curve.png', dpi=300, bbox_inches='tight')
print("Graph saved as FYP_Loss_Curve.png!")

# 5. Save for STM32Cube.AI (.h5 format)
# .h5 format is widely used for Keras models and is natively supported by STM32Cube.AI for embedded deployment
model.save('mppt_stm32_model.h5')
print("Saved STM32 Model -> mppt_stm32_model.h5")

# 6. Save for Simulink (.onnx format)
print("Exporting model to ONNX...")
# First export to TensorFlow SavedModel format
model.export("mppt_saved_model")
# Convert the SavedModel to ONNX (Open Neural Network Exchange) format, which is compatible with Simulink
os.system("python -m tf2onnx.convert --saved-model mppt_saved_model --output mppt_simulink_model.onnx --opset 13")
print("Saved Simulink Model -> mppt_simulink_model.onnx")