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