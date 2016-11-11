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

const NUMBER_OF_INPUTS = 2;
const NUMBER_OF_HIDDEN_LAYERS = 1;
const NUMBER_OF_NODES_PER_HIDDEN = 6;
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
    this.statsCanvas = document.getElementById('stats');
    this.statsContext = this.statsCanvas.getContext('2d');
    this.characterControllers = [];
    this.keys = new Array(300);
    this.characters = [];
    this.testCharacter = null;
    this.levelGenerator = new LevelGenerator(40, 460);
    this.physics = new Physics();
    this.camera = new Camera({x: 600, y: 600}, {x: 30000, y: 30000});
    this.currentSimStep = 0;
    this.renderer = new Renderer();
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
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.save();
    this.context.translate(-this.camera.position.x, -this.camera.position.y);


    const elements = this.levelGenerator.getElements();
    this.context.beginPath();
    this.context.strokeStyle = "blue";
    elements.forEach((el) => {
        if (el.type === 3) {
            return;
        }
        this.context.moveTo(el.x, el.y);
        this.context.lineTo(el.toX, el.toY);
    });
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = "green";
    this.context.arc(this.bestCharacter.x, this.bestCharacter.y - this.bestCharacter.height / 2, 15, 0, Math.PI * 2);
    this.context.fill();
    
    this.characters.forEach((character) => {
        character.render(this.context);
    });

    this.context.restore();
}

Game.prototype.doAction = function (character, controller, inputs) {
    inputs[0] = MathHelpers.normalize(inputs[0] || 500, 20, 500);
    inputs[1] = MathHelpers.normalize(inputs[1] || 200, 5, 200);
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
    character.onGround = false;
    character.velocityX = 0;

    const nearestObstacles = this.levelGenerator.getNearestElements(character.x, character.y);
    let collisions = this.physics.getPossibleCollision(character, nearestObstacles, {down: true, right: true, left: true});
    collisions.down.forEach((collision) => {
        if (character.bottom + character.velocityY >= collision.object.y && character.velocityY > 0) {
            character.onGround = true;
            character.velocityY = 0;
            character.y = collision.object.y - character.height / 2;
        }
    });

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

    this.handleInput();

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
    this.bestCharacter = _.maxBy(this.characters, 'x');
    this.camera.follow(this.characterToFollow || this.bestCharacter);

    this.physics.update(this.characters);

    for (let i = 0; i < this.characters.length; i++) {
        let inputs = [];
        let character = this.characters[i];

        if (character.velocityY > 20) {
            character.velocityY = 20;
        }
        character.onGround = false;

        let levelData = this.levelGenerator.getDataByPosition(character);

        if (levelData) {
            let collision = this.physics.rayCast(character.x, character.bottom - 5, 1, 0, [levelData.nextObstacle]);
            if (collision) {
                inputs[0] = Math.sqrt((collision.object.x - character.x) * (collision.object.x - character.x));
                inputs[1] = collision.object.height;
                if (character.x + character.legBaseWidth / 2 + character.velocityX >= collision.object.x) {
                    character.x = collision.object.x - character.legBaseWidth / 2;
                    character.velocityX = 0;
                }
            }

            let floors = this.levelGenerator.getFloorsByPosition(character);
            /**
             * Subtract the velocityY from character.y because otherwise if height is less than velocityX
             * it might happen that next starting point of raycast is under the floor and thus there will be
             * reported no collision 
             */
            let collisionLeft = this.physics.rayCast(character.x - character.legBaseWidth / 2, character.y - character.velocityY * 2, 0, 1, floors);
            let collisionRight = this.physics.rayCast(character.x + character.legBaseWidth / 2, character.y - character.velocityY * 2, 0, 1, floors);

            if (!collisionRight) {
                collision = collisionLeft;
            } else if (!collisionLeft) {
                collision = collisionRight;
            } else if (Math.abs(collisionLeft.object.y - character.bottom) < Math.abs(collisionRight.object.y - character.bottom)) {
                collision = collisionLeft;
            } else {
                collision = collisionRight;
            }

            if (collision) {
                if (character.bottom + character.velocityY >= collision.object.y && character.velocityY > 0) {
                    character.onGround = true;
                    character.velocityY = 0;
                    character.y = collision.object.y - character.height / 2;
                }
            }
        }
        character.update();
        this.doAction(character, this.characterControllers[i], inputs);
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
    });

    this.evolutionController.nextGeneration();
    this.evolutionController.individuals.forEach((individual, index) => {
        this.characterControllers[index].updateWeights(individual.weights);
    });
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

        this.update();
    });

};
let game = new Game();
game.main();
