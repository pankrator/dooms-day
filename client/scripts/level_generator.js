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
}

LevelGenerator.prototype.getFloorsByPosition = function (character) {
    let result = [];
    let index = _.findIndex(this.elements, (el) => { return el.type === PATH_TYPES.FLOOR && character.x >= el.x && character.x <= el.toX });
    index = Math.max(index - 5, 0);
    const until = Math.min(this.elements.length, index + 15);
    for (let i = index; i < until; i++) {
        if (this.elements[i].type == PATH_TYPES.FLOOR) {
            result.push(this.elements[i]);
        }
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

// TODO: Move this somewhere else
LevelGenerator.prototype.getDataByPosition = function (character) {
    const left = character.x - character.legBaseWidth / 2;
    const right = character.x + character.legBaseWidth / 2;

    let currentFloorIndex = _.findIndex(this.elements, (el) => { return el.type === PATH_TYPES.FLOOR && left >= el.x && left <= el.toX });
    let currentFloorIndex2 = _.findIndex(this.elements, (el) => { return el.type === PATH_TYPES.FLOOR && right >= el.x && right <= el.toX });
    if (currentFloorIndex < 0 || currentFloorIndex2 < 0) {
        return null;
    }
    const bottom = character.bottom;
    if (Math.abs(this.elements[currentFloorIndex].y - bottom) > Math.abs(this.elements[currentFloorIndex2].y - bottom)) {
        currentFloorIndex = currentFloorIndex2;
    }
    let result = {
        floor: this.elements[currentFloorIndex]
    };

    while (currentFloorIndex < this.elements.length - 1 &&
           this.elements[currentFloorIndex++].type === PATH_TYPES.FLOOR);
    result.nextObstacle = this.elements[currentFloorIndex - 1]; 
    
    return result;
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
            el.type === PATH_TYPES.DOWN;
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
        return gap(Math.floor(Math.random() * 100) + 120, xPosition, yPosition);
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
    // if (dice <= 0.40 && dice >= 0.30) {
    //     return 3;
    // }
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