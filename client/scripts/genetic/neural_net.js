'use strict';

const MathHelpers = require('../utils').MathHelpers;
const BIAS = -1;
const ACTIVATION_RESPONSE = 1;

let NeuralNet = function (numberOfInputs, numberOfOutputs, numberOfHiddenLayers, neuronsPerHiddenLayer) {
    this.numberOfInputs = numberOfInputs;
    this.numberOfOutputs = numberOfOutputs;
    this.numberOfHiddenLayers = numberOfHiddenLayers;
    this.neuronsPerHiddenLayer = neuronsPerHiddenLayer;

    this.layers = [];

    this.__init();
}

NeuralNet.prototype.__init = function () {
    if (this.numberOfHiddenLayers > 0) {
        this.layers.push(new Layer(this.neuronsPerHiddenLayer, this.numberOfInputs));

        for (let i = 0; i < this.numberOfHiddenLayers - 1; i++) {
            this.layers.push(new Layer(this.neuronsPerHiddenLayer, this.neuronsPerHiddenLayer));
        }
        
        this.layers.push(new Layer(this.numberOfOutputs, this.neuronsPerHiddenLayer));
    } else {
        this.layers.push(new Layer(this.numberOfOutputs, this.numberOfInputs));
    }
}

NeuralNet.prototype.activate = function (inputs) {
    let outputs = [];

    if (inputs.length != this.numberOfInputs) {
        return outputs;
    }

    this.layers.forEach((layer, index) => {
        if (index > 0) {
            inputs = outputs;
        }

        outputs = [];
        let netInput = 0;
        layer.neurons.forEach((neuron) => {
            let weightIndex = 0;
            netInput = neuron.weights.slice(0, neuron.numberOfInputs - 1).reduce((prev, current) => {
                return prev + current * inputs[weightIndex++];
            }, 0);

            netInput += neuron.weights[neuron.numberOfInputs - 1] * BIAS;

            outputs.push(MathHelpers.sigmoid(netInput, ACTIVATION_RESPONSE));
        });
    });

    return outputs;
}

NeuralNet.prototype.updateWeights = function (weights) {
    let index = 0;
    this.layers.forEach((layer) => {
        layer.neurons.forEach((neuron) => {
            neuron.weights.forEach((currWeight, i) => {
                neuron.weights[i] = weights[index++];
            });
        });
    });
}

NeuralNet.prototype.getWeights = function () {
    let weights = [];
    this.layers.forEach((layer) => {
        layer.neurons.forEach((neuron) => {
            neuron.weights.forEach((currWeight) => {
                weights.push(currWeight);
            });
        });
    });

    return weights;
}

NeuralNet.prototype.getNumberOfWeights = function () {
    let counter = 0;
    this.layers.forEach((layer) => {
        layer.neurons.forEach((neuron) => {
            neuron.weights.forEach((currWeight) => {
                counter++;
            });
        });
    });

    return counter;
}

let Neuron = function (numberOfInputs) {
    this.numberOfInputs = numberOfInputs;
    this.weights = [];

    for (let i = 0; i < numberOfInputs; i++) {
        this.weights.push(MathHelpers.randomClamped());
    }
}

let Layer = function (numberOfNeurons, inputsPerNeuron) {
    this.numberOfNeurons = numberOfNeurons;
    this.inputsPerNeuron = inputsPerNeuron;

    this.neurons = [];
    for (let i = 0; i < numberOfNeurons; i++) {
        this.neurons.push(new Neuron(inputsPerNeuron));
    }
}

module.exports = NeuralNet;