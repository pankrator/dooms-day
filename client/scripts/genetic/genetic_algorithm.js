'use strict';

const MathHelpers = require('../utils').MathHelpers;

var GeneticAlgorithm = function (populationSize, numberOfWeights) {
    this.populationSize = populationSize;
    this.individuals = [];
    this.numberOfWeights = numberOfWeights;
}

GeneticAlgorithm.prototype.generateRandomPopulation = function () {
    for (let i = 0; i < this.populationSize; i++) {
        this.individuals.push(new Genome());
        for (let j = 0; j < this.numberOfWeights; j++) {
            this.individuals[i].weights.push(MathHelpers.randomClamped());
        }
    }
}

GeneticAlgorithm.prototype.getIndividuals = function () {
    return this.individuals;
}

var Genome = function () {
    this.weights = [];
    this.fitness = 0;
}

module.exports = GeneticAlgorithm;