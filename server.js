var fs = require('fs');
var connect = require('connect');
var control = require('./lib/control').control;

// Reference to the configuration
var config = null;
// Definition of the configuration file name
var configFileName = __dirname + '/configuration.json';
// Try to read the file
try{
	// Because this file needs to be read before other
	// code can start it is OK that it blocks
	config = JSON.parse( fs.readFileSync(configFileName) );
}
catch(configLoadingException){
	// If for whatever reason the configuration could not be read:
	// Log the exception
	console.log('Failed to load configuration.json, because: ' + configLoadingException);
	console.log('Reverting to default settings.');
}
if(!config){
	// Apparently a configuration file could not be loaded, reverting to the default settings
	config = {
		siteTitle: "Site Title",
		siteSubTitle: "Site subtitle",
		port: "8003"
	};
}

var dataFolder = __dirname + '/data';
var postDataFolder = dataFolder + '/post';
var posts = [];
try{
	var filenames = fs.readdirSync(postDataFolder);
	for(var i = 0, l = filenames.length; i < l; i++){
		var filename = postDataFolder + '/' + filenames[i];
		var postJson = fs.readFileSync( filename );
		posts.push(JSON.parse( postJson ));
	}
}
catch(dataReadException){
	console.log('Failed to read data, because: ' + dataReadException);
}

var app = connect()
	.use(connect.static('static'))
	.use(function(req, res){
		  res.writeHead(200, {'Content-Type': 'text/html'});
		  var page = {
			  tag: 'html',
			  isRootControl: true,
			  items : [
			      {tag: 'head', items: [{tag: 'title', controlValue: config.siteTitle}]},
			      {
			    	  tag: 'body', 
			    	  items: [
		    	          {cls: 'siteTitle', controlValue: config.siteTitle},
		    	          {cls: 'siteSubTitle', controlValue: config.siteSubTitle}
		    	  ]}
			  ]
		  };
		  res.end( new control(page).render() );
	})
	.listen(config.port);
console.log('Server running at http://127.0.0.1:' + config.port + '/');
