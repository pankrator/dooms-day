'use strict';

const MathHelpers = require('../utils').MathHelpers;
const ELITISM = 2;
const MUTATION_RATE = 0.1;
const MUTATION_AMOUNT = 0.3;

let GeneticAlgorithm = function (populationSize, numberOfWeights) {
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

GeneticAlgorithm.prototype.getRandomIndividual = function () {
    const halfPopulation = Math.floor(this.populationSize / 2);
    const which = Math.floor(Math.random() * halfPopulation);
    return this.individuals[which];
}

GeneticAlgorithm.prototype.mutate = function (genome) {
    genome.weights.forEach((weight, index) => {
        if (Math.random() < MUTATION_RATE) {
            genome.weights[index] += (MathHelpers.randomClamped() * MUTATION_AMOUNT);
        }
    });
}

GeneticAlgorithm.prototype.crossover = function (mum, dad) {
    if (mum == dad) {
        return [mum, dad];
    }

    let baby1 = new Genome();
    let baby2 = new Genome();
    let cp = Math.floor(Math.random() * this.numberOfWeights - 1);
    for (let i = 0; i < cp; i++) {
        baby1.weights.push(mum.weights[i]);
        baby2.weights.push(dad.weights[i]);
    }
    for (let i = cp; i < mum.weights.length; i++) {
        baby1.weights.push(dad.weights[i]);
        baby2.weights.push(mum.weights[i]);
    }

    return [baby1, baby2];
}

GeneticAlgorithm.prototype.nextGeneration = function () {
    let newIndividuals = [];
    this.individuals.sort((a, b) => { return b.fitness - a.fitness; });

    for (let i = 0; i < ELITISM; i++) {
        this.individuals[i].fitness = 0;
        newIndividuals.push(this.individuals[i]);
    }
    while (newIndividuals.length < this.populationSize) {
        const mum = this.getRandomIndividual();
        const dad = this.getRandomIndividual();

        let babies = this.crossover(mum, dad);
        this.mutate[babies[0]];
        this.mutate[babies[1]];
        newIndividuals.push(babies[0]);
        newIndividuals.push(babies[1]);
    }
    this.individuals = newIndividuals;
}

let Genome = function () {
    this.weights = [];
    this.fitness = 0;
}

module.exports = GeneticAlgorithm;