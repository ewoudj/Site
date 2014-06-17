if (!window.art) {
    window.art = {};
}

window.art.neoplasticism = {

    getImage: function (canvas) {

        // References to helper functions
        var rnd = window.art.helpers.rnd;
        var rndFromArray = window.art.helpers.rndFromArray;
        var context = canvas.getContext('2d');
        // Color table
        var colorTable = ["#000", "#FFF", "#F11", "#11D", "#FE0", "#F11", "#11D", "#FE0", "#FFF"];
        // Width, height (as the canvas is always square the w var is used for both width and height
        var canvasWidth = canvas.width = 400;
        var canvasHeight = canvas.height = 400;
        var lineWidth = canvasWidth / 80;
        // Canvas rotation in degrees
        var deg = 0;

        // Function generates the black lines, input cols true to generate columns, else generates rows,
        // return an array of numbers representing the start positions for the generated lines.
        function generateLines(vertical, length, width) {
            var result = [-width];
            context.fillStyle = colorTable[0];
            for (var i = 0, l = rnd(1, 10) ; i < l; i++) {
                result.push(rnd(0, length));
                if (vertical) { // Vertical line
                    context.fillRect(result[i + 1], 0, width, length);
                }
                else { // Horizontal line
                    context.fillRect(0, result[i + 1], length, width);
                }
            }
            if (vertical) {
                result.push(canvasWidth);
            }
            else {
                result.push(canvasHeight)
            }
            return result;
        }

        // Canvas rotation
        if (!rnd(0, 3)) {
            // This deg value determines the rotation of the canvas element
            deg = 45;
            // Rotates the 2D drawing context 45 degrees the opposite of the canvas element
            context.save();
            var canvasCx = 0.5 * canvasWidth;   // x of shape center
            var canvasCy = 0.5 * canvasHeight;  // y of shape center
            context.translate(canvasCx, -canvasCy);
            context.rotate(Math.PI / 4);
        }
        else {
            // This deg value determines the rotation of the canvas element
            deg = 0;
        }

        // Actual rendering happens here
        // Clear the canvas (white)
        context.fillStyle = colorTable[1];
        // Fillrect
        var factor = (deg == 0 ? 1 : 2);
        context.fillRect(0, 0, canvasWidth * factor, canvasHeight * factor);
        // Initialize rows and columns, including '-lineWidth' for the left or top edge and w (width / height)
        var columns = generateLines(true, canvasWidth * factor, lineWidth);
        var rows = generateLines(false, canvasHeight * factor, lineWidth);
        // Fills random rects in the columns / rows grid, using colors from the color table
        for (var i = 0, l = rnd(1, 10) ; i < l; i++) {
            context.fillStyle = colorTable[rnd(0, 8)];
            // Random columns
            var rc = rndFromArray(columns);
            var rc2 = rndFromArray(columns);
            // Random rows
            var rr = rndFromArray(rows);
            var rr2 = rndFromArray(rows);
            // Fillrect
            context.fillRect(
                Math.min(rc, rc2) + lineWidth,
                Math.min(rr, rr2) + lineWidth,
                Math.abs(rc - rc2) - lineWidth,
                Math.abs(rr - rr2) - lineWidth
            );
        }
        // Restore the 2D context (to the 'unrotated' version)
        context.restore();
        return {
            width: canvasWidth,
            height: canvasHeight,
            deg: deg
        };
    }
};