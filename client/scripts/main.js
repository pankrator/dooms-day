"use strict";

const Utils = require("./utils");
const Character = require('./character');
const LevelGenerator = require('./level_generator');
const Physics = require('./physics');
const Camera = require('./camera');

const POPULATION_SIZE = 50;

function Game() {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d'); 
    this.characters = [];
    this.levelGenerator = new LevelGenerator(40, 460);
    this.physics = new Physics();
    this.camera = new Camera({x: 600, y: 600}, {x: 30000, y: 30000});
};

Game.prototype.render = function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.save();
    this.context.translate(-this.camera.position.x, -this.camera.position.y);
    const elements = this.levelGenerator.getElements();
    this.context.beginPath();
    this.context.strokeStyle = "blue";
    elements.forEach((el) => {
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

Game.prototype.takeInput = function () {
    this.characters.forEach((character) => {
        if (Math.random() > 0.95) {
            character.jump();
        }
    });
}

Game.prototype.update = function () {
    this.bestCharacter = _.maxBy(this.characters, 'x');
    this.camera.follow(this.bestCharacter);
    this.takeInput();

    this.physics.update(this.characters);

    for (let i = 0; i < this.characters.length; i++) {
        let character = this.characters[i];
        character.velocityX = character.speed;
        if (character.velocityY > 20) {
            character.velocityY = 20;
        }
        character.onGround = false;

        let levelData = this.levelGenerator.getDataByPosition(character);

        if (levelData) {
            
            let collision = this.physics.rayCast(character.x, character.bottom - 5, 1, 0, [levelData.nextObstacle]);
            if (collision) {
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
    }

    this.render();
    setTimeout(this.update.bind(this), 1000 / 60);
}

Game.prototype.handleKeyDown = function (event) {
    if (event.keyCode === 32 /* Space */)  {
        // this.character.jump();
    }
};

Q.longStackSupport = true;
Game.prototype.main = function main() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
        const character = new Character(100, 300);
        character.velocityX = character.speed;
        this.characters.push(new Character(100, 300));
    }

    this.levelGenerator.generate(700);

    this.update();
};
let game = new Game();
game.main();
