'use strict';

const WORLD_GRAVITY = 0.3;

var Physics = function () {};

Physics.prototype.update = function (objects) {
    for (let i = 0; i < objects.length; i++) {
        let object = objects[i];

        // if (!object.onGround && object.velocityX != 0) {
        //     object.velocityX = Math.sign(object.velocityX) * (object.speed / 2);
        // }

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