/**
 * Module dependencies.
 */

var express 		= require('express')
  , stylus 			= require('stylus')
  , nib 			= require('nib')
  , http 			= require('http')
  , path 			= require('path')
  , expressUglify 	= require('express-uglify');

var api 		= require('./routes/api')
  , routes 		= require('./routes')
  , stats 		= require('./routes/stats')
  , config 		= require('./libs/Config')
  , Logger 		= require('./libs/Logger');

var publicPath 	= path.join(__dirname, 'public')
  , app 		= express();
var server 		= http.createServer(app)
  , logger 		= new Logger('MAIN_APP')
  , envVal 		= process.env.NODE_ENV || 'development';

logger.info('Starting up app in ' + envVal + ' environment.');
config().then(function(conf) {
	app.config = conf;

	// all environments
	app.set('host', app.config.host);
	app.set('port', app.config.port);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	//app.use(app.config.webRoot, express.favicon());
	app.use(express.urlencoded())
	app.use(express.json())
	app.use(express.methodOverride());

	app.use(app.config.webRoot, stylus.middleware({src: publicPath, compile: function(str, path) {
		return stylus(str).set('filename', path) .use(nib())
	}}));

	app.configure('development', function() {
		app.locals.pretty = true;
		app.use(express.responseTime());
		app.use(express.logger('dev'));
		app.use(app.config.webRoot, express.static(publicPath));
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function() {
		app.enable('trust proxy');

		if(app.config.logHttpRequests) {
			app.use(express.logger());
		}

		function blankLog() {
			this.log = function() {

			};
		}

		app.use(app.config.webRoot, expressUglify.middleware({ src: publicPath, logger: new blankLog() }));

		var oneYear = 31557600000;
		app.use(app.config.webRoot, express.static(publicPath, { maxAge: oneYear }));
		app.use(express.errorHandler());
	});

	app.use(app.router);
}).then(function() {

	var webRoot = app.config.webRoot;

	app.get(webRoot + '/', routes.index);
	app.get(webRoot + '/install', routes.install);

	app.get(webRoot + '/api/plex/currentlyWatching', api.plex.currentlyWatching);
	app.get(webRoot + '/api/plex/poster', api.plex.poster);
	app.get(webRoot + '/api/plex/recentlyAddedMovies', api.plex.recentlyAddedMovies);
	app.get(webRoot + '/api/plex/recentlyAired', api.plex.recentlyAired);

	app.get(webRoot + '/api/sickbeard/poster', api.sickbeard.poster);
	app.get(webRoot + '/api/sickbeard/showsStats', api.sickbeard.showsStats);
	app.get(webRoot + '/api/sickbeard/upcoming', api.sickbeard.upcoming);

	app.get(webRoot + '/stats/all', stats.all);
	app.get(webRoot + '/stats/bandwidth', stats.bandwidth);
	app.get(webRoot + '/stats/cpu', stats.cpu);
	app.get(webRoot + '/stats/disks', stats.disks);
	app.get(webRoot + '/stats/memory', stats.memory);
	app.get(webRoot + '/stats/services', stats.services);
	app.get(webRoot + '/stats/weather', stats.weather);

}).then(function() {
	server.listen(app.get('port'), app.get('host'), function() {
		var uri = app.get('host') + ':' + app.get('port') + app.config.webRoot;

		logger.info('StatusBoard'.yellow, 'is running at',  uri.cyan);
	});
}).otherwise(function(reason) {

	if(reason instanceof Error) {
		if(reason.message == 'INVALID_CONFIG') {
			logger.fatal(reason.reason);

			if(reason.currently) {
				console.log('Currently is the configuration file:'.green);
				console.log(reason.currently);
			}
			if(reason.suggestion) {
				console.log('Suggestion:'.green);
				console.log(reason.suggestion);
			}
		} else {
			logger.error(reason.message);
			console.log(reason);
		}
	} else {
		logger.fatal(reason);
	}
});
