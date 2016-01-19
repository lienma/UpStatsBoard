var nib				= require('nib')
  , path 			= require('path')
  , Promise			= require('bluebird')
  , stylus			= require('stylus');

var bodyParser 		= require('body-parser')
  , cookieParser	= require('cookie-parser')
  , csrf			= require('csurf')
  , errorHandler	= require('errorhandler')
  , methodOverride	= require('method-override')
  , minify 			= require('express-minify')
  , morganLogger	= require('morgan')
  , responseTime	= require('response-time')
  , session			= require('cookie-session')
  , serveStatic		= require('serve-static');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

var log 			= require(paths.logger)('MIDDLEWARE')
  , config 			= require(paths.core + '/config')
  , database 		= require(paths.core + '/database');

function setupMiddleware(upsboardApp) {
	var logging = config.misc.logHttpRequests;

	upsboardApp.enable('trust proxy');
	upsboardApp.set('views', 'views');
	upsboardApp.set('view engine', 	'jade');

	upsboardApp.use(bodyParser.json());
	upsboardApp.use(bodyParser.urlencoded({ extended: true }));
	upsboardApp.use(methodOverride());
	upsboardApp.use(cookieParser());
	//app.use(app.sessions.create());
	//app.use(csrf());
	
	upsboardApp.use(stylus.middleware({src: paths.public, compile: function (str, path) { return stylus(str).set('filename', path).use(nib()); }}));

	if (logging !== false) {
		if(upsboardApp.get('env') !== 'development') {
			upsboardApp.use(morganLogger('combined'));
		} else {
			upsboardApp.use(morganLogger('dev'));
		}
	}

	if(upsboardApp.get('env') !== 'development') {
		upsboardApp.use(minify());
		upsboardApp.use(serveStatic(paths.public, { maxAge: 31557600000 }));
		upsboardApp.use(serveStatic(paths.build, { maxAge: 31557600000 }));
		upsboardApp.use(errorHandler());
	} else {
		upsboardApp.set({'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'});

		upsboardApp.locals.pretty = true;
		upsboardApp.set('json spaces',	2);
		upsboardApp.use(responseTime());

		upsboardApp.use(serveStatic(paths.public));
		upsboardApp.use(serveStatic(paths.build));
		upsboardApp.use(errorHandler({ dumpExceptions: true, showStack: true }));
	}
}

module.exports = setupMiddleware