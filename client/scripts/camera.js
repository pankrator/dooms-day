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