import tensorflow as tf
import os

def convert_h5_to_onnx(h5_model_path, onnx_output_path):
    print(f"1. Loading STM32 model: {h5_model_path}...")
    try:
        model = tf.keras.models.load_model(h5_model_path, compile=False)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # In modern TensorFlow (2.16+), tf2onnx works best with the SavedModel format.
    # We export the loaded .h5 model to a temporary SavedModel directory first.
    temp_dir = "temp_mppt_saved_model"
    print(f"2. Exporting to temporary SavedModel format: {temp_dir}...")
    model.export(temp_dir)

    print(f"3. Converting to ONNX format: {onnx_output_path}...")
    # opset 13 is highly compatible with MATLAB/Simulink ONNX importers
    command = f"python -m tf2onnx.convert --saved-model {temp_dir} --output {onnx_output_path} --opset 13"
    
    result = os.system(command)
    
    if result == 0:
        print(f"\nSuccess! You can now import '{onnx_output_path}' into Simulink.")
    else:
        print("\nFailed to convert the model. Please ensure tf2onnx is installed: pip install tf2onnx")

if __name__ == "__main__":
    # Define file names
    INPUT_H5_FILE = "mppt_stm32_model.h5"
    OUTPUT_ONNX_FILE = "mppt_simulink_model.onnx"
    
    convert_h5_to_onnx(INPUT_H5_FILE, OUTPUT_ONNX_FILE)
