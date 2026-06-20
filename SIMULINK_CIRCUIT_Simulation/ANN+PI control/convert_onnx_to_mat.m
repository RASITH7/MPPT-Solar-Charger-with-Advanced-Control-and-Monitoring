% ONNX to MAT Converter Script
% --------------------------------------------------------
% Some versions of MATLAB/Simulink (like the "Predict" block) prefer to 
% load a native MATLAB Deep Learning Network object from a .mat file 
% rather than reading the .onnx file directly.
% 
% This script imports the ONNX model and saves it as a .mat file.

clc; clear;

onnx_filename = 'mppt_simulink_model.onnx';
mat_filename  = 'mppt_simulink_model.mat';

disp(['1. Importing ONNX model: ', onnx_filename, ' ...']);

try
    % Use the modern importNetworkFromONNX function.
    % We specify 'InputDataFormats', 'BC' because our input shape is (Batch, Features)
    % 'B' = Batch, 'C' = Channel (Features = 4)
    net = importNetworkFromONNX(onnx_filename, 'InputDataFormats', 'BC', 'OutputDataFormats', 'BC');
    
    disp('2. Successfully imported the ONNX network into MATLAB.');
    
    % Save the network object ('net') into a .mat file
    disp(['3. Saving network to: ', mat_filename, ' ...']);
    save(mat_filename, 'net');
    
    disp('======================================================');
    disp(['Success! The model is now saved in "', mat_filename, '".']);
    disp('You can configure your Simulink "Predict" block to load this .mat file.');
    disp('======================================================');
catch ME
    disp('======================================================');
    disp('ERROR IMPORTING ONNX MODEL!');
    disp('Please ensure you have the "Deep Learning Toolbox Converter for ONNX Model Format" Add-On installed.');
    disp('Error details:');
    disp(ME.message);
    disp('======================================================');
end
