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
	.use(connect.static('static'))
	.use(connect.query())
	.use(function(req, res){
		if(req.originalUrl === '/filelist.json'){
			res.setHeader('Content-type', 'application/json');
			res.write(fileListJson);
			res.end();
		}
		else if(req.originalUrl.indexOf('/persist.json') === 0 && req.query){
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
					res.setHeader('Content-type', 'application/json');
					res.write( JSON.stringify(requestedObject) );
				}
				else{
					var bodyItems = [requestedObject.content];
					bodyItems.push(snippets.facebook);
					bodyItems.push(snippets.twitterTweet);
					bodyItems.push(snippets.disqus);
					returnPage(res, bodyItems);
				}
			}
			res.end();
		}
		else if(req.query && req.query.json && req.query.filename){
			res.setHeader('Content-disposition', 'attachment; filename=' + req.query.filename);
			res.setHeader('Content-type', 'application/json');
			res.write(req.query.json);
			res.end();
		}
		else {
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
	})
	.listen(config.port);
console.log('Server running at http://127.0.0.1:' + config.port + '/');
