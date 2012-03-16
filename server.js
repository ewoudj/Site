var fs = require('fs');
var connect = require('connect');
var control = require('./lib/control').control;
var merge = require('./lib/control').utils.merge;

var defaultConfig, config, editorConfig, configFilename, editorConfigFilename;  

// Create the default configuration
defaultConfig = {
	siteTitle: "Site Title",
	port: "8003"
};
// Definition of the configuration file name
configFilename = __dirname + '/configuration.json';
// Try to read the file
try{
	// Because this file needs to be read before other
	// code can start it is OK that it blocks
	config = JSON.parse( fs.readFileSync(configFilename) );
}
catch(configLoadingException){
	// If for whatever reason the configuration could not be read:
	// Log the exception
	console.log('Failed to load configuration.json, because: ' + configLoadingException);
	console.log('Reverting to default settings.');
}
if(config){
	config = merge(defaultConfig, config);
}
else{
	config = defaultConfig;
}
// Try to read the editor config file
editorConfigFilename = __dirname + '/editorConfiguration.json';
try{
	editorConfig = JSON.parse( fs.readFileSync(editorConfigFilename) );
	if( editorConfig ){
		merge(config, editorConfig);
	}
}
catch(configLoadingException){
	// Does not matter
}
if( config.enableEditor ){
	console.log('WARNING: editor enabled, this is HIGHLY INSECURE, make sure this application is not accessible from the internet.');
}

var dataFolder = __dirname + '/data';
var postDataFolder = dataFolder + '/post';
var posts = [];
var postsById = {};
var postsByFilename = {};
var fileList = [];
var fileListJson;

try{
	var filenames = fs.readdirSync(postDataFolder);
	for(var i = 0, l = filenames.length; i < l; i++){
		var filename = postDataFolder + '/' + filenames[i];
		var postJson = fs.readFileSync( filename );
		var post = JSON.parse( postJson );
		posts.push(post);
		postsById[post.id] = post;
		postsByFilename[post.filename] = post;	
		fileList.push({
			title: post.title,
			id: post.id
		});
	}
	fileListJson = JSON.stringify(fileList);
}
catch(exc){
	console.log('Failed to read data, because: ' + exc);
}

var snippetsFolder = __dirname + '/snippets';
var snippets = {};
try{
	var filenames = fs.readdirSync(snippetsFolder);
	for(var i = 0, l = filenames.length; i < l; i++){
		var filename = snippetsFolder + '/' + filenames[i];
		snippets[filenames[i]] = fs.readFileSync( filename ).toString();
	}
}
catch(exc){
	console.log('Failed to read snippets, because: ' + exc);
}

function returnPage(res, bodyItems){
	res.writeHead(200, {'Content-Type': 'text/html'});
	bodyItems.unshift({
		tag: 'h1', 
		controlValue: config.siteTitle,
		attributes: {cls: 'title'}
	});
	bodyItems.unshift(snippets.twitterFollow);
	var page = {
		tag: 'html',
		isRootControl: true,
		items : [
	         {tag: 'head', items: [
                 {tag: 'title', controlValue: config.siteTitle},
                 {
     				tag: 'link',
    				voidElement: true,
    				attributes: {
    					rel: 'stylesheet',
    					href: '/style/style.css'
				}}
             ]},
	         {
	        	 tag: 'body',
	        	 items: [{
	        		 attributes:{cls:'main-container'},
	        		 items: bodyItems
	        	 }]
	         }
		]
	};
	res.end( new control(page).render() );
}



var app = connect()
	.use(connect.static('static/'))
	.use(connect.query())
	.use(function(req, res, next){
		req.ipAddress = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
		req.clientIsLocal = (req.ipAddress == '127.0.0.1');
		next();
	})
	.use(function(req, res, next){
		if(config.enableEditor && req.clientIsLocal && req.originalUrl === '/filelist.json'){
			// Returns list of all post JSON files
			res.setHeader('Content-type', 'application/json');
			res.write(fileListJson);
			res.end();
		}
		else if(config.enableEditor && req.clientIsLocal && req.originalUrl.indexOf('/persist.json') === 0 && req.query){
			// Writes a post to the file system
			fs.writeFile(dataFolder + '/post/' + req.query.id + '.json', JSON.stringify(req.query), function (err) {
				res.setHeader('Content-type', 'application/json');
				if(err){
					res.write(JSON.stringify({succes: false, error: err}));
				}
				else{
					res.write(JSON.stringify({succes: true}));
				}
				res.end();
			});
		}
		else if(req.originalUrl.indexOf('/post/') === 0){
			// Returns an individual post
			var filePart = req.originalUrl.replace('/post/', '');
			var extension = '.html';
			var lastDot = filePart.lastIndexOf('.');
			if(lastDot > -1){
				extension = filePart.substr(lastDot);
				filePart = filePart.replace(extension, '');
			}
			var requestedObject = postsById[filePart] || postsByFilename[filePart];
			if(requestedObject){
				if(extension === '.json'){
					// Return format is JSON
					res.setHeader('Content-type', 'application/json');
					res.write( JSON.stringify(requestedObject) );
				}
				else{
					// Default return format is HTML 
					var bodyItems = [requestedObject.content];
					bodyItems.push(snippets.facebook);
					bodyItems.push(snippets.twitterTweet);
					bodyItems.push(snippets.disqus);
					returnPage(res, bodyItems);
				}
			}
			res.end();
		}
		else {
			// Return the home page (a list of all posts)
			var bodyItems = [];
			for(var i = 0, l = posts.length; i < l; i++){
				bodyItems.push({tag: 'h2', controlValue: posts[i].title});
				bodyItems.push({controlValue: posts[i].summary});
				bodyItems.push({
					tag: 'a',
					attributes: {href: '/post/' + posts[i].filename + '.html'},
					controlValue: 'Read more'
				});
			}
			returnPage(res, bodyItems);
		}
		//next();
	})
	.listen(config.port);
console.log('Server running at http://127.0.0.1:' + config.port + '/');
