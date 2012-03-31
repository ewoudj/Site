(function(){
	var canvas = document.createElement('canvas');
	document.body.appendChild(canvas);
	canvas.style.display = 'block';
	canvas.style.position = 'fixed';
	canvas.style.top = '0px';
	canvas.style.left = '0px';
	canvas.style.zIndex = -1;			
	var context = canvas.getContext('2d');
	
	function rnd(min, max) {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }
	
	function drawLineCircle(c, color){
		context.strokeStyle = color;
		
		var startRadius = rnd(5, 75);
		var endRadius = rnd(90, 300);
		
		var startPoint = {
			x: c.x,
			y: c.y + startRadius
		};
		
		var endPoint = {
			x: c.x,
			y: c.y + endRadius
		};
		
		var numberOfLines = rnd(12, 60);
		for(var i = 0; i < numberOfLines; i++){
			var angle = rnd(0,360);
			drawLine( rotate(startPoint, c, angle) , rotate(endPoint, c, angle));
		}
	}
	
	function modifyCss(selectorText, propertyName, newValue, priority){
		var rules = document.styleSheets[0].cssRules;
		for(var i = 0, l = rules.length; i < l; i++){
			var rule = rules[i];
			if(rule.selectorText == selectorText){
				rule.style.setProperty(propertyName, newValue, 'important');
			}
		}
	}
	
	function drawLine(a, b){
		context.beginPath();
	    context.moveTo(a.x,a.y);
	    context.lineTo(b.x,b.y);
	    context.stroke();
	}
	
	function fixString(s){
		var result = s;
		while(result.length < 7){
			result = result.replace('#', '#0');
		}
		return result;
	}
	
	function rotate (point, center, angle) {
		// convert angle to radians
		angle = angle * Math.PI / 180.0;
		// get coordinates relative to center
		var dx = (point.x - center.x);
		var dy = point.y - center.y;
		// calculate angle and distance
		var a = Math.atan2(dy, dx);
		var dist = Math.sqrt(dx * dx + dy * dy);
		// calculate new angle
		var a2 = a + angle;
		// calculate new coordinates
		var dx2 = Math.cos(a2) * dist;
		var dy2 = Math.sin(a2) * dist;
		// return coordinates relative to top left corner
		return { x: Math.ceil(dx2 + center.x), y: Math.ceil(dy2 + center.y) };
	}
	
	function paint (){
		context.canvas.width  = window.innerWidth;
		context.canvas.height = window.innerHeight;
		context.clearRect ( 0 , 0 , window.innerWidth , window.innerHeight );
		context.lineWidth = 5;
		var total = rnd(1,60);
		var colorA = fixString('#'+Math.floor(Math.random()*16777215).toString(16));
		var colorB = fixString('#'+Math.floor(Math.random()*16777215).toString(16));
		modifyCss('a', 'color', colorB);
		modifyCss('.main-container', 'color', colorB);
		modifyCss('.title', 'color', colorA);
		console.log('a:' + colorA);
		console.log('b:' + colorB);
		while(total--){
			var center = {
				x: rnd(0, window.innerWidth),
				y: rnd(0, window.innerHeight)
			};
			drawLineCircle(center, colorA);
			drawLineCircle(center, colorB);
			drawLineCircle(center, '#FFF');
		}
	}
	
	paint();
	
	window.onresize = function(evt) {
		paint();
	}
})();
