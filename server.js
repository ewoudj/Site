var connect = require('connect');
var control = require('./lib/control').control;

var app = connect()
	.use(connect.static('static'))
	.use(function(req, res){
		  res.writeHead(200, {'Content-Type': 'text/html'});
		  res.end(
				  
			  new control({
				  tag: 'html',
				  isRootControl: true,
				  items : [
				      {tag: 'head', items: [{tag: 'title', controlValue: 'Hello world app.'}]},
				      {tag: 'body', items: [{tag: 'h1', controlValue: 'Het werkt!'}]}
				  ]
			  }).render()
			  
		  );
	})
	.listen(8099);
console.log('Server running at http://127.0.0.1:80/');
