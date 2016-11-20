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
