if (!window.art) {
    window.art = {};
}

window.art.helpers = {

    // Creates a canvas element in the target elements and makes it resize with the target
    createCanvas: function (target) {
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        target.appendChild(canvas);
        target.onresize = function () {
            canvas.width = target.clientWidth;
            canvas.height = target.clientHeight;
        };
        target.onresize();
        return canvas;
    },

    // Function returns random number between (and including) 0 and provided max value
    rnd: function (min, max) {
            return Math.floor(Math.random() * ((max - min) + 1)) + min;
    },

    // Function return random item from input array
    rndFromArray: function (arr) {
        return arr[window.art.helpers.rnd(0, arr.length - 1)];
    }
};