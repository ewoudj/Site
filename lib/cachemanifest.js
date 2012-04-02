/*!
 * cachemanifest
 * Copyright(c) 2012 ewoudj
 * MIT Licensed
 */

var fs = require('fs')
  , path = require('path')
  , join = path.join
  , basename = path.basename
  , normalize = path.normalize
  , parse = require('url').parse;

exports = module.exports = function cachemanifest(root, options){
  options = options || {};
  options.cache = {};
  // root required
  if (!root) throw new Error('cachemanifest() root path required');
  options.root = root;

  return function cachemanifest(req, res, next) {
	  if(req && req.url && req.url.endsWith('cache.manifest')){
		  
		  res.writeHead(200, {'Content-Type': 'text/cache-manifest'});
		  
		  // parse url
		  var url = parse(req.url)
		    , path = decodeURIComponent(url.pathname);
		  
		  if(options.cache[req.url]){
			  res.end(options.cache[req.url]);
			  return;
		  }
		  else{
			  if ((   ~path.indexOf('\0')) // null byte(s)
					  || (!root && ~path.indexOf('..')) // when root is not given, consider .. malicious
					  || (root && 0 != normalize(join(root, path)).indexOf(root)) ){ // malicious path
				  options.cache[req.url] = 'Invalid path';
				  res.end(options.cache[req.url]);
				  return;
			  }
			  else {
				  // join / normalize from optional root dir
				  path = normalize(join(root, path));
				  
				  var walkRoot = path.substr(0, path.length - '/cache.manifest'.length);
				  var walkRootLength = walkRoot.length + 1;
				  walk(walkRoot, function(err, files){
					  var result = 'CACHE MANIFEST\n';
					  result += ('# Cache manifest generated at: ' + new Date().getTime() + '\n');
					  for(var i = 0, l = files.length; i < l; i++){
						  result += (files[i] + '\n').substr(walkRootLength);
					  }
					  result += "NETWORK:\n*\n";
					  options.cache[req.url] = result;
					  res.end(options.cache[req.url]);  
				  });
			  }
		  }
	  }
	  else {
		  return next();
	  }
  };
};

// From: http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

// Based on answers in: http://stackoverflow.com/questions/280634/endswith-in-javascript
if (!String.prototype.hasOwnProperty("endsWith")){
	String.prototype.endsWith = function(suffix) {
	    return this.length >= suffix.length && this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}