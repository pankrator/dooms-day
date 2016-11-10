'use strict';

let Renderer = function () {}

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

Renderer.prototype.clearCanvas = function (canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}


module.exports = Renderer;