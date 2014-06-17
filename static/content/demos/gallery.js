if (!window.art) {
    window.art = {};
}

window.art.gallery = {

    animate: function (target, imageProducer) {
        // The canvas will be used to draw the actual painting on
        var canvas = document.createElement('canvas');
        // Start by getting a first painting
        var currentImage = imageProducer.getImage(canvas);
        // Prepare the target canvas, this represents the 'museum wall', 
        // the paintings will be animate on top of this.
        var targetCanvas = window.art.helpers.createCanvas(target);
        var targetContext = targetCanvas.getContext('2d');
        // Light gray background ('museum wall' color)
        var museumWallColor = "#EEE";
        // Left is used to scroll the canvas from right to left
        var left = targetCanvas.clientWidth;
        // Starts the animation
        (function mainLoop() {
            requestAnimationFrame(mainLoop);
            var smallestTargetDimension = (targetCanvas.clientWidth < targetCanvas.clientHeight ? targetCanvas.clientWidth : targetCanvas.clientHeight);
            var largestCanvasDimension = (currentImage.width > currentImage.height ? currentImage.width : currentImage.height);
            var scale = smallestTargetDimension / (1.5 * largestCanvasDimension);
            var scaledSize = (largestCanvasDimension * scale);
            if (currentImage.deg != 0) {
                //scaledSize = Math.sqrt(Math.pow(width * scale, 2));
                scaledSize = Math.sqrt(Math.pow(largestCanvasDimension * scale, 2));
            }
            var clientWidth = targetCanvas.clientWidth;
            if (left < -scaledSize) {
                // Reset the left so the canvas is completly to the right of the screen
                left = clientWidth;
                currentImage = imageProducer.getImage(canvas);
            }
            else {
                // Calculate new left for the canvas animation
                left -= ((Math.abs(((clientWidth - scaledSize) / 2) - left) / 40) + 1);
            }
            // Clear the target canvas
            targetContext.save();
            targetContext.fillStyle = museumWallColor;
            targetContext.fillRect(0, 0, targetCanvas.clientWidth, targetCanvas.clientHeight);
            // Set the shadow
            targetContext.shadowColor = '#999';
            targetContext.shadowBlur = 20 * scale;
            targetContext.shadowOffsetX = 0;
            targetContext.shadowOffsetY = 10 * scale;
            // The x / left is animated
            var targetX = left;
            // The y is used to center the canvas
            var targetY = ((targetCanvas.clientHeight - scaledSize) / 2);
            if (currentImage.deg != 0) {
                var cx = targetX + 0.5 * scaledSize;   // x of shape center
                var cy = targetY + 0.5 * scaledSize;  // y of shape center
                targetContext.translate(cx, cy);
                targetContext.rotate(Math.PI / 4);
                targetContext.translate(-cx, -cy);
            }
            targetContext.drawImage(canvas, targetX, targetY, currentImage.width * scale, currentImage.height * scale);
            targetContext.restore();
        })();

        var lastCalledTime;
        var fps;

        function calcFps() {
            if (!lastCalledTime) {
                lastCalledTime = new Date().getTime();
                fps = 0;
            }
            else {
                delta = (new Date().getTime() - lastCalledTime) / 1000;
                lastCalledTime = new Date().getTime();
                fps = 1 / delta;
            }
            console.log(fps);
        }

    }

};