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