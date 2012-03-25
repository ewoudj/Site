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

// Load all the posts
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
	posts.sort(function(postA, postB){
		postA.datetime = parseInt(postA.datetime || 0);
		postB.datetime = parseInt(postB.datetime || 0);
		return (postB.datetime - postA.datetime);
	});
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
		tag: 'a', 
		controlValue: config.siteTitle,
		cls: 'title', 
		href: '/'
	});
	//bodyItems.unshift(snippets.twitterFollow);
	var page = {
		tag: 'html',
		isRootControl: true,
		items : [
	         {tag: 'head', items: [
                 {tag: 'title', controlValue: config.siteTitle},
                 {tag: 'meta', attributes: { name: 'viewport', content: 'width = 460, user-scalable = yes'}},
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
	        		 	cls: 'top-bar',
	        		 	items: [ snippets.twitterFollow ]
	        	 	}, {
		        		cls:'main-container',
		        		items: bodyItems
	        	 	}//, 
	        	 	//snippets.backgroundart
        	 	]
	         }
		]
	};
	res.end( new control(page).render() );
}



var app = connect()
//	.use(function(req, res, next){
//		console.log(req.originalUrl);
//		next();
//	})
	.use(connect.static(__dirname + '/static'))
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
					var when = requestedObject.datetime || '';
					if(when){
						when = ', ' + renderDate( new Date( parseInt(when) ));
					}
					bodyItems.push({
						cls: 'by-line',
						controlValue: 'By ewoudj' + when
					});
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
				var item = {
					tag: 'a',
					cls: 'list-item',
					items: [],
					attributes: {href: '/post/' + posts[i].filename + '.html'}
				};
				item.items.push({tag: 'h2', controlValue: posts[i].title});
				item.items.push({controlValue: posts[i].summary});
				item.items.push({controlValue: 'Read more', cls: 'pseudo-link'});
				bodyItems.push(item);
			}
			returnPage(res, bodyItems);
		}
		//next();
	})
	.listen(config.port);
console.log('Server running at http://127.0.0.1:' + config.port + '/');

var month_names = new Array ( );
month_names[month_names.length] = "January";
month_names[month_names.length] = "February";
month_names[month_names.length] = "March";
month_names[month_names.length] = "April";
month_names[month_names.length] = "May";
month_names[month_names.length] = "June";
month_names[month_names.length] = "July";
month_names[month_names.length] = "August";
month_names[month_names.length] = "September";
month_names[month_names.length] = "October";
month_names[month_names.length] = "November";
month_names[month_names.length] = "December";

var day_names = new Array ( );
day_names[day_names.length] = "Sunday";
day_names[day_names.length] = "Monday";
day_names[day_names.length] = "Tuesday";
day_names[day_names.length] = "Wednesday";
day_names[day_names.length] = "Thursday";
day_names[day_names.length] = "Friday";
day_names[day_names.length] = "Saturday";

function renderDate(datetime){
	return ( day_names[datetime.getDay()] ) + ", " + ( month_names[datetime.getMonth()] ) + ( " " + datetime.getDate() ) + ( " " + datetime.getFullYear() );
}





