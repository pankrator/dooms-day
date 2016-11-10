'use strict';

const INITIAL_HEIGHT = 10;
const WORLD_GRAVITY = 0.3;
const DISPLACEMENT_HEAD_STEP = 1.2;
const DISPLACEMENT_HEAD_LIMIT = 10;

var utils = require('./utils');
var percentOf = utils.MathHelpers.percentOf;


var Character = function (x, y, color) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.muscles = 5;
    this.height = 150;

    this.velocityY = 0;
    this.velocityX = 0;

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

    //Draw body
    ctx.moveTo(this.x, this.bodyUpperY);
    ctx.lineTo(this.x, this.bodyBottomY);

    // Draw leg base
    ctx.moveTo(this.x - this.legBaseWidth / 2, this.bodyBottomY);
    ctx.lineTo(this.x + this.legBaseWidth / 2, this.bodyBottomY);

    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = this.color;
    // Draw left leg
    ctx.rect(this.x - this.legBaseWidth / 2,
             this.bodyBottomY,
             percentOf(this.muscles * 10, this.legBaseWidth / 2),
             this.bottom - this.bodyBottomY);

    // Draw right leg
    ctx.rect(this.x + this.legBaseWidth / 2,
             this.bodyBottomY,
             -percentOf(this.muscles * 10, this.legBaseWidth / 2),
             this.bottom - this.bodyBottomY);
    ctx.fill();
}

module.exports = Character;