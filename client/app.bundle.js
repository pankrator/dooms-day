(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Camera = function (viewport, platformSize) {
    this.viewport = viewport;
    this.platformSize = platformSize;
    this.position = {x: 0, y: 0};
};

Camera.prototype.follow = function (target) {
    var position = this.position;

    position.x = target.x - this.viewport.x / 2;
    position.y = target.y - this.viewport.y / 2;

    if (position.x < -1000) {
        position.x = -1000;
    }
    if (position.y < -1000) {
        position.y = 1000;
    }
    if (position.x + this.viewport.x > this.platformSize.x) {
        position.x = this.platformSize.x - this.viewport.x;
    }
    if (position.y + this.viewport.y > this.platformSize.y) {
        position.y = this.platformSize.y - this.viewport.y;
    }
};

module.exports = Camera;
},{}],2:[function(require,module,exports){
'use strict';

const INITIAL_HEIGHT = 10;
const WORLD_GRAVITY = 0.3;
const DISPLACEMENT_HEAD_STEP = 1.2;
const DISPLACEMENT_HEAD_LIMIT = 10;

var utils = require('./utils');
var percentOf = utils.MathHelpers.percentOf;

var Character = function (x, y, color, images) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.muscles = 7;
    this.height = 200;

    this.velocityY = 0;
    this.velocityX = 0;

    this.images = images;
    this.color = color || 'red';

    this.onGroundSince = Date.now();
    this.onGround = true;
    this.randomHeadDisplacement = -DISPLACEMENT_HEAD_LIMIT;
    this.randomHeadDisplacementStep = DISPLACEMENT_HEAD_STEP;
    this.__calculateBodyProportions();
}

Character.prototype.jump = function () {
    if (this.onGround) {
        this.velocityY = -this.muscles * 2;
        this.onGround = false;
    }
}

Character.prototype.update = function () {
    this.randomHeadDisplacement += this.randomHeadDisplacementStep;
    if (this.randomHeadDisplacement >= DISPLACEMENT_HEAD_LIMIT) {
        this.randomHeadDisplacementStep = -DISPLACEMENT_HEAD_STEP;
    } else if (this.randomHeadDisplacement <= -DISPLACEMENT_HEAD_LIMIT) {
        this.randomHeadDisplacementStep = DISPLACEMENT_HEAD_STEP;
    }

    this.headX = this.x + this.randomHeadDisplacement;
    this.headY = this.y - (this.height / 2) + Math.abs(this.randomHeadDisplacement);
    this.bodyUpperY = this.y - (this.height / 2) + this.headR;
    this.bodyBottomY = this.y - (this.height / 2) + this.headR + this.bodyLength;
    this.bottom = this.bodyBottomY + (this.height / 2);
    this.left = this.x - this.legBaseWidth / 2;
    this.right = this.x + this.legBaseWidth / 2;

    if (this.muscles > 7) {
        this.muscles = 7;
    }
    if (this.muscles <= 2) {
        this.muscles = 2;
    }
}

Character.prototype.setHeight = function (height) {
    this.height = height;
    this.__calculateBodyProportions();
}

Character.prototype.setMuscles = function (muscles) {
    this.muscles = muscles;
    this.__calculateBodyProportions();
}

Character.prototype.__calculateBodyProportions = function () {
    this.headR = percentOf(10, this.height);
    this.legBaseWidth = percentOf(30, this.height);
    this.bodyLength = percentOf(40, this.height);
}

Character.prototype.render = function (ctx) {
    //Draw Head
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.headX, this.headY, this.headR, 0, 2 * Math.PI, 0);
    ctx.stroke();

    //Draw body
    ctx.drawImage(this.images[0], this.x - this.legBaseWidth / 2, this.bodyUpperY, this.legBaseWidth, this.bodyLength);

    // Draw left leg
    const legWidth = percentOf(this.muscles * 15, this.legBaseWidth / 2);
    ctx.drawImage(this.images[1],
                  this.x - this.legBaseWidth / 2 + percentOf(10, this.legBaseWidth),
                  this.bodyBottomY, legWidth,
                  this.bottom - this.bodyBottomY);

    // Draw right leg
    ctx.drawImage(this.images[1],
                  this.x + this.legBaseWidth / 2 - legWidth + percentOf(10, this.legBaseWidth),
                  this.bodyBottomY,
                  legWidth,
                  this.bottom - this.bodyBottomY);
}

module.exports = Character;
},{"./utils":11}],3:[function(require,module,exports){
'use strict';

let ContentManager = function() {
    this.images = {};
};

ContentManager.prototype.loadImages = function (images) {
    let loaded = 0;
    let deffered = Q.defer();
    images.forEach((src) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            const name = src.substring(src.lastIndexOf('/') + 1);
            this.images[name] = image;
            loaded++;
            if (loaded == images.length) {
                deffered.resolve();
            }
        };
    });

    return deffered.promise;
}

ContentManager.prototype.getImage = function (name) {
    return this.images[name];
}

module.exports = ContentManager;
},{}],4:[function(require,module,exports){
'use strict';


},{}],5:[function(require,module,exports){
'use strict';

const MathHelpers = require('../utils').MathHelpers;
const ELITISM = 2;
const MUTATION_RATE = 0.1;
const MUTATION_AMOUNT = 0.3;

let GeneticAlgorithm = function (populationSize, numberOfWeights) {
    this.generationCounter = 0;
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
    this.generationCounter++;
    
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
},{"../utils":11}],6:[function(require,module,exports){
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
},{"../utils":11}],7:[function(require,module,exports){
'use strict';

const PATH_TYPES = {
    FLOOR: 0,
    HIGH: 1,
    DOWN: 2,
    GAP: 3,
    CEILING: 4,
};

let LevelGenerator = function (startX, startY) {
    this.elements = [];
    this.sortedElements = [];
    this.startY = startY;
    this.startX = startX;
}

LevelGenerator.prototype.generate = function (size) {
    this.elements = [];
    let currentY = this.startY;
    let currentX = this.startX;
    if (this.elements.length > 0) {
        currentY = this.elements[this.elements.length - 1].y;
        currentX = this.elements[this.elements.length - 1].x;
    }

    for (let i = 0; i < size; i++) {
        let type, element;
        do {
            type = getRandomPathType();
            element = getElementByType(type, currentX, currentY);
        } while (!checkRestrictions(element, this.elements));

        this.elements.push(element);
        currentX = element.toX;
        currentY = element.toY;
    }

    this.sortedElements = _.cloneDeep(this.elements);
    this.sortedElements.sort((a, b) => {
        return a.x - b.x;
    });
}

LevelGenerator.prototype.isPositionUnderLevel = function (x, y) {
    let index = _.findIndex(this.elements, (el) => { return x >= el.x && x <= el.toX });

    return (y > this.elements[index].y);
}

LevelGenerator.prototype.getNearestElementsSorted = function (x, y) {
    let result = [];

    let index = _.sortedIndexBy(this.sortedElements, { x: x }, (el) => { return el.x; });
    index = Math.max(index - 6, 0);
    const until = Math.min(this.elements.length, index + 15);
    for (let i = index; i < until; i++) {
        result.push(this.elements[i]);
    }

    return result;
}

LevelGenerator.prototype.getNearestElements = function (x, y) {
    let result = [];

    let index = _.findIndex(this.elements, (el) => { return el.type === PATH_TYPES.FLOOR && x >= el.x && x <= el.toX });
    index = Math.max(index - 6, 0);
    const until = Math.min(this.elements.length, index + 15);
    for (let i = index; i < until; i++) {
        result.push(this.elements[i]);
    }

    return result;
}

LevelGenerator.prototype.getNextObstacle = function (x, y, type) {
    let index = _.findIndex(this.elements, (el) => { return el.type !== PATH_TYPES.HIGH && x >= el.x && x <= el.toX });
    while (this.elements[index++].type != type);

    return this.elements[index - 1];
}

LevelGenerator.prototype.getNextHigh = function (x, y) {
    return this.getNextObstacle(x, y, PATH_TYPES.HIGH)
}

LevelGenerator.prototype.getNextDown = function (x, y) {
    return this.getNextObstacle(x, y, PATH_TYPES.DOWN);
}

LevelGenerator.prototype.getNextGap = function (x, y) {
    return this.getNextObstacle(x, y, PATH_TYPES.GAP);
}

LevelGenerator.prototype.getStartX = function () {
    return this.startX;
}

LevelGenerator.prototype.getStartY = function () {
    return this.startY;
}

LevelGenerator.prototype.getElements = function () {
    return this.elements;
}

function checkRestrictions(element, elements) {
    if (element.type === PATH_TYPES.HIGH &&
        (elements.length === 0 || elements[elements.length - 1].type === PATH_TYPES.HIGH ||
        elements[elements.length - 1].type === PATH_TYPES.DOWN)) {
        return false;
    }
    if (element.type === PATH_TYPES.DOWN) {
        if (elements.length === 0 || elements[elements.length - 1].type === PATH_TYPES.HIGH) {
            return false;
        }

        return !_.takeRight(elements, 2).every((el) => {
            return el.type === PATH_TYPES.DOWN;
        });
    }
    if (element.type === PATH_TYPES.GAP) {
        if (elements.length === 0) {
            return false;
        }
        return !_.takeRight(elements, 3).some((el) => {
            return el.type == PATH_TYPES.GAP || el.type == PATH_TYPES.HIGH;
        });
    }

    return true;
}

function getElementByType(type, xPosition, yPosition) {
    if (type === PATH_TYPES.FLOOR) {
        return floor(Math.floor(Math.random() * 100) + 120, xPosition, yPosition);
    } else if (type === PATH_TYPES.HIGH) {
        return high(Math.floor(Math.random() * 120) + 50, xPosition, yPosition);
    } else if (type === PATH_TYPES.DOWN) {
        return down(Math.floor(Math.random() * 120) + 50, xPosition, yPosition);
    } else if (type === PATH_TYPES.GAP) {
        return gap(Math.floor(Math.random() * 100) + 50, xPosition, yPosition);
    }
}

function getRandomPathType() {
    const dice = Math.random();
    if (dice > 0.70) {
        return 1
    }
    if (dice >= 0.40 && dice <= 0.70) {
        return 2;
    }
    if (dice <= 0.40 && dice >= 0.30) {
        return 3;
    }
    return 0;
}

function gap(length, x, y) {
    return {
        type: PATH_TYPES.GAP, 
        length: length,
        x: x,
        y: y,
        toX: x + length,
        toY: y
    };
}

function down(height, x, y) {
    return {
        type: PATH_TYPES.DOWN,
        height: height,
        x: x,
        y: y,
        toX: x,
        toY: y + height
    };
}

function high(height, x, y) {
    return {
        type: PATH_TYPES.HIGH,
        height: height,
        x: x,
        y: y,
        toX: x,
        toY: y - height
    };
}

function floor(length, x, y) {
    return {
        type: PATH_TYPES.FLOOR, 
        length: length,
        x: x,
        y: y,
        toX: x + length,
        toY: y
    };
}

module.exports = LevelGenerator;
},{}],8:[function(require,module,exports){
"use strict";

const MathHelpers = require("./utils").MathHelpers;
const Character = require('./character');
const LevelGenerator = require('./level_generator');
const Physics = require('./physics');
const Camera = require('./camera');
const NeuralNet = require('./genetic/neural_net');
const GeneticAlgorithm = require('./genetic/genetic_algorithm');
const Renderer = require('./renderer');
const ContentManager = require('./content_manager');

const NUMBER_OF_INPUTS = 6;
const NUMBER_OF_HIDDEN_LAYERS = 2;
const NUMBER_OF_NODES_PER_HIDDEN = 8;
const NUMBER_OF_OUTPUTS = 4;
const POPULATION_SIZE = 16;

const STEPS_TO_SIMULATE = 3000;

const colors = [
    'red',
    'green',
    'yellow',
    'blue',
    'black',
    'gray'
];


function Game() {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');
    this.characterControllers = [];
    this.keys = new Array(300);
    this.characters = [];
    this.testCharacter = null;
    this.levelGenerator = new LevelGenerator(40, 460);
    this.physics = new Physics();
    this.camera = new Camera({x: 600, y: 600}, {x: 30000, y: 30000});
    this.currentSimStep = 0;
    this.renderer = new Renderer(this.context, this.canvas, this.camera);
    this.contentManager = new ContentManager();
};

Game.prototype.render = function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.save();
    this.context.translate(-this.camera.position.x, -this.camera.position.y);

    const elements = this.levelGenerator.getElements();
    this.context.beginPath();
    this.context.lineWidth = 10;
    this.context.strokeStyle = "blue";
    elements.forEach((el) => {
        if (el.type === 3) {
            return;
        }
        this.context.moveTo(el.x, el.y);
        this.context.lineTo(el.toX, el.toY);
    });
    this.context.stroke();
    this.context.lineWidth = 1;
    
    this.testCharacter.render(this.context);

    this.context.restore();
}

Game.prototype.renderSimulation = function () {
    const controller = this.characterControllers[_.indexOf(this.characters, this.bestCharacter)];
    const elements = this.levelGenerator.getElements();
    this.renderer.render(this.characters, elements, controller, this.bestCharacter);
}

Game.prototype.doAction = function (character, controller, inputs) {
    // HIGH
    inputs[0] = MathHelpers.normalize(inputs[0] || 500, 20, 500);
    inputs[1] = MathHelpers.normalize(inputs[1] || 200, 5, 200);

    // DOWN
    inputs[2] = MathHelpers.normalize(inputs[0] || 500, 20, 500);
    inputs[3] = MathHelpers.normalize(inputs[1] || 200, 5, 200);

    // GAP
    inputs[4] = MathHelpers.normalize(inputs[0] || 500, 20, 500);
    inputs[5] = MathHelpers.normalize(inputs[1] || 150, 50, 140);

    const outputs = controller.activate(inputs);
    if (outputs[2] > 0.75) {
        character.muscles += outputs[1];
    } else if (outputs[2] < 0.25) {
        character.muscles -= outputs[1];
    }
    if (outputs[0] < 0.3) {
        character.jump();
    }
    if (outputs[3] > 0.5) {
        character.velocityX = character.speed;
    } else {
        character.velocityX = 0;
    }
}

Game.prototype.update = function () {
    var character = this.testCharacter;

    this.camera.follow(character);

    // first get possible collisions using physics agains level elements
    character.velocityX = 0;
    character.onGround = false;

    const nearestObstacles = this.levelGenerator.getNearestElementsSorted(character.x, character.y);
    let collisions = this.physics.getPossibleCollision(character, nearestObstacles, {down: true, right: true, left: true});
    collisions.down.forEach((collision) => {
        if (character.bottom + character.velocityY >= collision.object.y && character.velocityY > 0) {
            character.onGround = true;
            character.velocityY = 0;
            character.y = collision.object.y - character.height / 2;
        }
    });

    this.handleInput();

    collisions.right.forEach((collision) => {
        if (character.x + character.legBaseWidth / 2 + character.velocityX >= collision.object.x) {
            character.x = collision.object.x - character.legBaseWidth / 2;
            character.velocityX = 0;
        }
    });

    collisions.left.forEach((collision) => {
        if (character.x - character.legBaseWidth / 2 + character.velocityX <= collision.object.x) {
            character.x = collision.object.x + character.legBaseWidth / 2;
            character.velocityX = 0;
        }
    });


    this.physics.update([character]);
    character.update();

    this.render();
    setTimeout(this.update.bind(this), 1000 / 60);
}

Game.prototype.updateSimulation = function () {
    if (this.currentSimStep > STEPS_TO_SIMULATE) {
        this.evaluateAndReset();
    }
    this.currentSimStep++;
    
    let characterWithNoFallen = this.characters.filter((c) => !c.fallen);
    this.bestCharacter = _.maxBy(characterWithNoFallen, 'x');
    if (characterWithNoFallen.length === 0) {
        this.evaluateAndReset();
    }
    this.camera.follow(this.bestCharacter || _.sample(characterWithNoFallen));

    for (let i = 0; i < this.characters.length; i++) {
        let character = this.characters[i];
        if (character.fallen) {
            continue;
        }

        let inputs = [];

        character.onGround = false;
        const nearestObstacles = this.levelGenerator.getNearestElementsSorted(character.x, character.y);
        let collisions = this.physics.getPossibleCollision(character, nearestObstacles, {down: true, right: true, left: true});
        collisions.down.forEach((collision) => {
            if (character.bottom + character.velocityY >= collision.object.y && character.velocityY > 0) {
                character.onGround = true;
                character.velocityY = 0;
                character.y = collision.object.y - character.height / 2;
            }
        });

        const nextHighObstacle = this.levelGenerator.getNextHigh(character.x, character.y);
        let dist = Math.sqrt((nextHighObstacle.x - character.x) * (nextHighObstacle.x - character.x));
        if (dist < 500) {
            inputs[0] = dist;
            inputs[1] = nextHighObstacle.height;
        }

        const nextDownObstacle = this.levelGenerator.getNextDown(character.x, character.y);
        dist = Math.sqrt((nextDownObstacle.x - character.x) * (nextDownObstacle.x - character.x));
        if (dist < 500) {
            inputs[2] = dist;
            inputs[3] = nextDownObstacle.height;
        }

        const nextGap = this.levelGenerator.getNextGap(character.x, character.y);
        dist = Math.sqrt((nextGap.x - character.x) * (nextGap.x - character.x));
        if (dist < 500) {
            inputs[4] = dist;
            inputs[5] = nextGap.length;
        }

        if (this.levelGenerator.isPositionUnderLevel(character.x, character.y)) {
            character.fallen = true;
        }

        this.doAction(character, this.characterControllers[i], inputs);

        collisions.right.forEach((collision) => {
            if (character.x + character.legBaseWidth / 2 + character.velocityX >= collision.object.x) {
                character.x = collision.object.x - character.legBaseWidth / 2;
                character.velocityX = 0;
            }
        });

        collisions.left.forEach((collision) => {
            if (character.x - character.legBaseWidth / 2 + character.velocityX <= collision.object.x) {
                character.x = collision.object.x + character.legBaseWidth / 2;
                character.velocityX = 0;
            }
        });

        this.physics.update([character]);
        character.update();
        evaluationManager.evaluate(character, nextHighObstacle, nextDownObstacle, nextGap);
    }

    this.renderSimulation();
    setTimeout(this.updateSimulation.bind(this), 1000 / 60);
}

Game.prototype.handleKeyUp = function (event) {
    this.keys[event.keyCode] = false;
}

Game.prototype.handleKeyDown = function (event) {
    this.keys[event.keyCode] = true;
};

Game.prototype.evaluateAndReset = function () {
    this.currentSimStep = 0;
    this.bestCharacter = _.maxBy(this.characters, 'x');
    console.log('distance traveled', this.bestCharacter.x);

    this.levelGenerator.generate(700);
    this.characters.forEach((character, index) => {
        this.evolutionController.individuals[index].fitness = character.x;
        character.x = 100;
        character.y = 300;
        character.fallen = false;
    });

    this.evolutionController.nextGeneration();
    this.evolutionController.individuals.forEach((individual, index) => {
        this.characterControllers[index].updateWeights(individual.weights);
    });
    console.log("generarion", this.evolutionController.generationCounter);
}

Game.prototype.handleInput = function () {
    if (this.keys[37]) {
        this.testCharacter.velocityX = -this.testCharacter.speed;
    }
    
    if (this.keys[39]) {
        this.testCharacter.velocityX = this.testCharacter.speed;
    }
    if (this.keys[32])  {
        this.testCharacter.jump();
    }
}

Game.prototype.__loadContent = function () {
    return this.contentManager.loadImages(['resources/body.png',
                                    'resources/left.png']);
    
}

Q.longStackSupport = true;
Game.prototype.main = function main() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    const contentLoadPromise = this.__loadContent();

    contentLoadPromise.then(() => {
        const characterImages = [this.contentManager.getImage('body.png'),
                                 this.contentManager.getImage('left.png')];

        this.testCharacter = new Character(100, 300, "red", characterImages);

        for (let i = 0; i < POPULATION_SIZE; i++) {
            
            const character = new Character(100, 300, colors[i % colors.length], characterImages);
            this.characters.push(character);

            this.characterControllers.push(new NeuralNet(NUMBER_OF_INPUTS, NUMBER_OF_OUTPUTS,
                                                        NUMBER_OF_HIDDEN_LAYERS, NUMBER_OF_NODES_PER_HIDDEN));
        }
        this.evolutionController = new GeneticAlgorithm(POPULATION_SIZE, this.characterControllers[0].getNumberOfWeights());
        this.evolutionController.generateRandomPopulation();
        this.characterControllers.forEach((controller, index) => {
            this.characterControllers[index].updateWeights(this.evolutionController.individuals[index].weights);
        });

        this.levelGenerator.generate(700);

        this.updateSimulation();
    });

};
let game = new Game();
game.main();

},{"./camera":1,"./character":2,"./content_manager":3,"./genetic/genetic_algorithm":5,"./genetic/neural_net":6,"./level_generator":7,"./physics":9,"./renderer":10,"./utils":11}],9:[function(require,module,exports){
'use strict';

const WORLD_GRAVITY = 0.3;

var Physics = function () {};

Physics.prototype.update = function (objects) {
    for (let i = 0; i < objects.length; i++) {
        let object = objects[i];

        if (!object.onGround && object.velocityX != 0) {
            object.velocityX = Math.sign(object.velocityX) * (object.speed / 2);
        }

        object.x += object.velocityX;
        object.y += object.velocityY;

        object.velocityY += WORLD_GRAVITY;

        if (object.velocityY > 20) {
            object.velocityY = 20;
        } 
    }
}

Physics.prototype.getPossibleCollision = function (object, against, flags) {
    // object.top, object.left, object.right, object.bottom, object.x, object.y
    let result = {};
    if (flags['down']) {
        result.down = [];
        const floors = against.filter((el) => { return el.type === 0; });

        let leftLeg = this.rayCast(object.left, object.bottom, 0, 1, floors, 100);
        leftLeg && result.down.push(leftLeg);

        let rightLeg = this.rayCast(object.right, object.bottom, 0, 1, floors, 100)
        rightLeg && result.down.push(rightLeg);
    }
    if (flags['up']) {
        result.up = [];

        let toUp = this.rayCast(object.x, object.y, 0, -1, against, 100);
        toUp && result.up.push(toUp);
    }
    if (flags['right']) {
        result.right = [];

        let toRight = this.rayCast(object.x, object.bottom - 1, 1, 0, against, 100);
        toRight && result.right.push(toRight); 
    }
    if (flags['left']) {
        result.left = [];

        let toLeft = this.rayCast(object.x, object.bottom - 1, -1, 0, against, 100);
        toLeft && result.left.push(toLeft)
    }

    return result;
}

Physics.prototype.rayCast = function (fromX, fromY, dirX, dirY, testAgainst, steps) {
    const stepsToTake = steps || 400;
    const stepDist = 1;
    
    let currX = parseInt(fromX);
    let currY = parseInt(fromY);
    for (let i = 0; i < stepsToTake; i++) {
        for (let j = 0; j < testAgainst.length; j++) {
            const against = testAgainst[j];
            if (this.isPointOnLineSegment(against, {x: currX, y: currY})) {
                return { object: against, distance: this.distanceBetween(fromX, fromY, currX, currY) };
            }
        }
        currX += dirX * stepDist;
        currY += dirY * stepDist;
    }

    return null;
}

Physics.prototype.distanceBetween = function (x, y, toX, toY) {
    return Math.sqrt((toX - x) * (toX - x) + (toY - y) * (toY -y));
}

Physics.prototype.isPointOnLineSegment = function(line, point) {
    const lineX = Math.min(line.x, line.toX);
    const lineToX = Math.max(line.x, line.toX);
    const lineY = Math.min(line.y, line.toY);
    const lineToY = Math.max(line.y, line.toY);

    return point.x >= lineX && point.x <= lineToX &&
           point.y >= lineY && point.y <= lineToY;
}



module.exports = Physics;
},{}],10:[function(require,module,exports){
'use strict';

let Renderer = function (context, canvas, camera) {
    this.context = context;
    this.canvas = canvas;
    this.camera = camera;
}

Renderer.prototype.renderPopulationIcon = function (ctx, characters, individuals) {
    ctx.strokeStyle = "black";
    ctx.rect(400, 0, 200, 250);
    ctx.stroke();

    let yOffset = 10;
    characters.forEach((character, index) => {
        ctx.rect(420, yOffset, 200, 30);
        ctx.fillText(index + ' character', 430, yOffset + 15);
        ctx.stroke();
        yOffset += 40;
    });
}

Renderer.prototype.renderNeuralNet = function (ctx, neuralNet) {
    let maxHeight = 240;
    let yBetween = 200 / neuralNet.neuronsPerHiddenLayer;

    const weights = neuralNet.getWeights();
    
    let xOffset = 400;
    let yOffset = 50;
    ctx.strokeStyle = "red";
    for (let i = 0; i < neuralNet.numberOfHiddenLayers; i++) {
        for (let j = 0; j < neuralNet.neuronsPerHiddenLayer; j++) {
            ctx.beginPath();
            ctx.arc(xOffset, yOffset, 10, 0, Math.PI * 2);
            ctx.stroke();
            yOffset += yBetween;
        }
        yOffset = 50;
        xOffset += 80;
    }

    yOffset = 50 + yBetween * ((neuralNet.neuronsPerHiddenLayer - neuralNet.numberOfOutputs) / 2);
    for (let i = 0; i < neuralNet.numberOfOutputs; i++) {
        ctx.beginPath();
        ctx.arc(xOffset, yOffset, 10, 0, Math.PI * 2);
        ctx.stroke();
        yOffset += yBetween;
    }

    // xOffset = 400;
    // yOffset = 50;
    // for (let i = 0; i < neuralNet.numberOfHiddenLayers; i++) {
    //     for (let j = 0; j < neuralNet.neuronsPerHiddenLayer; j++) {
    //         for (let k = 0; k < neuralNet.neuronsPerHiddenLayer; k++) {
    //             this.renderLineWithText(ctx, xOffset, yOffset, (xOffset + 80), yOffset + (k+1) * (yBetween), "asd");
    //         }
    //         yOffset = 50 + j * yBetween;
    //     }
    //     xOffset += 80;
    // }
}

Renderer.prototype.renderLineWithText = function (ctx, x, y, toX, toY, text) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.fillText((toX - x) / 2, (toY - y) / 2, text);
    ctx.fill();
}

Renderer.prototype.clearCanvas = function (canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

Renderer.prototype.render = function (characters, elements, controller, bestCharacter) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderNeuralNet(this.context, controller);

    this.context.save();
    this.context.translate(-this.camera.position.x, -this.camera.position.y);

    this.context.beginPath();
    this.context.lineWidth = 10;
    this.context.strokeStyle = "blue";
    elements.forEach((el) => {
        if (el.type === 3) {
            return;
        }
        this.context.moveTo(el.x, el.y);
        this.context.lineTo(el.toX, el.toY);
    });
    this.context.stroke();
    this.context.lineWidth = 1;

    this.context.beginPath();
    this.context.fillStyle = "green";
    this.context.arc(bestCharacter.x, bestCharacter.y - bestCharacter.height / 2, 15, 0, Math.PI * 2);
    this.context.fill();
    
    characters.forEach((character) => {
        if (!character.fallen) {
            character.render(this.context);
        }
    });

    this.context.restore();
}


module.exports = Renderer;
},{}],11:[function(require,module,exports){
"use strict";

function sendData(path, verb, body) {
    let xhr = new XMLHttpRequest();
    let deferred = Q.defer();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE ) {
            if (xhr.status === 200) {
                deferred.resolve(xhr);
            } else {
                let error = `Could not open ${path}. ` +
                            `Status code: ${xhr.status}`;
                console.error(error);
                deferred.reject(xhr);
            }
        }
    };
    xhr.open(verb, path, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(body));

    return deferred.promise;
};

function loadJSON(path, verb, body) {
    let deferred = Q.defer();
    let onfulfill = (xhr) => {
        try {
            let obj = eval("new Object(" + xhr.responseText + ");");
            deferred.resolve(obj);
        } catch (error) {
            console.error(error);
            deferred.reject(xhr);
        }
        return deferred.promise;
    };
    let onerror = (xhr) => {
        deferred.reject(xhr);
        return deferred.promise;
    };
    return sendData(path, verb, body).then(onfulfill, onerror);
};


let randomColor = function () {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
};

const MathHelpers = {
    min: (array) => array.reduce((previous, element) => Math.min(previous, element), array[0]),
    max: (array) => array.reduce((previous, element) => Math.max(previous, element), array[0]),
    sum: (array) => array.reduce((previous, element) => previous + element, 0),
    argmin: (array, transform) => {
        let minElementIndex = 0;
        for (let i = 0; i < array.length; i++) {
            if (transform(array[i]) < transform(array[minElementIndex])) {
                minElementIndex = i;
            }
        }
        return array[minElementIndex];
    },
    count: (array, element) => {
        return array.reduce((count, value) => count += value == element, 0);
    },
    percentOf: (percent, value) => {
        return (percent / 100) * value;
    },
    randomClamped: () => {return Math.random() - Math.random();},
    sigmoid: (netInput, activationResponse) => {
        return ( 1 / ( 1 + Math.exp(-activationResponse / netInput)));
    },
    normalize: (value, min, max) => {
        return (value - min) / (max - min);
    }
};

module.exports = {
    sendData: sendData,
    loadJSON: loadJSON,
    randomColor: randomColor,
    MathHelpers: MathHelpers,
};

},{}],12:[function(require,module,exports){
"use strict";

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype = {
    negated: function () {
        return new Vector(-this.x, -this.y);
    },
    add: function (v) {
        if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y);
        else return new Vector(this.x + v, this.y + v);
    },
    subtract: function (v) {
        if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y);
        else return new Vector(this.x - v, this.y - v);
    },
    multiply: function (v) {
        if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y);
        else return new Vector(this.x * v, this.y * v);
    },
    divide: function (v) {
        if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y);
        else return new Vector(this.x / v, this.y / v);
    },
    equals: function (v) {
        return this.x == v.x && this.y == v.y;
    },
    dot: function (v) {
        return this.x * v.x + this.y * v.y;
    },
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    lengthSquared: function () {
        return this.x * this.x + this.y * this.y;
    },
    distanceTo: function (v) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    distanceToSquared: function (v) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        return dx * dx + dy * dy;
    },
    normalized: function () {
        return this.divide(this.length());
    },
    min: function () {
        return Math.min(this.x, this.y);
    },
    max: function () {
        return Math.max(this.x, this.y);
    },
    rotate: function (angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle);
        return new Vector(this.x * cos - this.y * sin,
                          this.x * sin + this.y * cos);
    },
    angleTo: function (a) {
        return Math.acos(this.dot(a) / (this.length() * a.length()));
    },
    angleTo360: function (a) {
        var n1 = this.clone(),
            n2 = a.clone();
        Vector.normalize(n1);
        Vector.normalize(n2);
        var cos = n1.dot(n2);
        var sin = ((n2.x + n2.y) - (n1.x + n1.y) * cos) / (n1.x - n1.y);
        var angle = Math.acos(cos);

        if (sin <= 0)
            angle = -angle;

        angle += Math.PI / 2;
        return angle;
    },
    toArray: function () {
        return [this.x, this.y];
    },
    clone: function () {
        return new Vector(this.x, this.y);
    },
    set: function (x, y) {
        if (y === undefined) {
            this.x = x.x;
            this.y = x.y;
            return this;
        }
        this.x = x; this.y = y;
        return this;
    },
    toString: function () {
        return "(" + this.x + ", " + this.y + ")";
    }
};

Vector.zero = new Vector(0, 0);
Vector.right = new Vector(1, 0);
Vector.up = new Vector(0, 1);
Vector.left = new Vector(-1, 0);
Vector.down = new Vector(0, -1);
Vector.one = new Vector(1, 1);

Vector.add = function (a, b, c) {
    if (b instanceof Vector) {
        c.x = a.x + b.x;
        c.y = a.y + b.y;
    }
    else {
        c.x = a.x + b;
        c.y = a.y + b;
    }
    return c;
};

Vector.subtract = function (a, b, c) {
    if (b instanceof Vector) {
        c.x = a.x - b.x;
        c.y = a.y - b.y;
    }
    else {
        c.x = a.x - b;
        c.y = a.y - b;
    }
    return c;
};

Vector.negate = function (a, b) {
    b.x = -a.x;
    b.y = -a.y;
    return b;
};

Vector.multiply = function (a, b, c) {
    if (b instanceof Vector) {
        c.x = a.x * b.x;
        c.y = a.y * b.y;
    }
    else {
        c.x = a.x * b;
        c.y = a.y * b;
    }
    return c;
};

Vector.divide = function (a, b, c) {
    if (b instanceof Vector) {
        c.x = a.x / b.x;
        c.y = a.y / b.y;
    }
    else {
        c.x = a.x / b;
        c.y = a.y / b;
    }
    return c;
};

Vector.unit = function (a, b) {
    var length = a.length();
    b.x = a.x / length;
    b.y = a.y / length;
    return b;
};

Vector.normalize = function (a) {
    var length = a.length();
    a.x /= length;
    a.y /= length;
    return a;
};

Vector.rotate = function (a, b, angle) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle);
    var x = a.x,
        y = a.y;
    b.set(x * cos - y * sin, x * sin + y * cos);
    return b;
};

Vector.fromAngles = function (phi) {
    return new Vector(Math.cos(phi), Math.sin(phi));
};

Vector.randomDirection = function () {
    return Vector.fromAngles(Math.random() * Math.PI * 2);
};

Vector.min = function (a, b) {
    return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y));
};

Vector.max = function (a, b) {
    return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y));
};

Vector.lerp = function (a, b, alpha) {
    return b.subtract(a).multiply(alpha).add(a);
};

Vector.fromArray = function (a) {
    return new Vector(a[0], a[1]);
};

Vector.angleBetween = function (a, b) {
    return a.angleTo(b);
};

module.exports = Vector;

},{}]},{},[1,2,3,4,7,8,9,10,11,12]);
