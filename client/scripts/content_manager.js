'use strict';

let ContentManager = function() {
    this.images = {};
};

ContentManager.prototype.loadImages = function (images) {
    let loaded = 0;
    let deffered = Q.defer();
    images.forEach((src) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            const name = src.substring(src.lastIndexOf('/') + 1);
            this.images[name] = image;
            loaded++;
            if (loaded == images.length) {
                deffered.resolve();
            }
        };
    });

    return deffered.promise;
}

ContentManager.prototype.getImage = function (name) {
    return this.images[name];
}

module.exports = ContentManager;