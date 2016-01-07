var express     = require('express')
  , path        = require('path');

var appRoot     = path.resolve(__dirname, '../')
  , paths       = require(appRoot + '/core/paths');

var log         = require(paths.logger)('MAKE_SERVER')
  , config      = require(paths.core + '/config')
  , database    = require(paths.core + '/database')
  , middleware  = require(paths.core + '/middleware')
  , router      = require(paths.core + '/router')
  , server      = require(paths.core + '/server');

function makeServer(options) {
    options = options || {};

    var upsboardApp = express();

    return config.load().then(function() {
		var conf = config.get();
		upsboardApp.set('host', conf.server.host);
		upsboardApp.set('port', conf.server.port);
		upsboardApp.set('webRoot', conf.server.webRoot);
		upsboardApp.set('mode', conf.misc.mode);
		upsboardApp.set('clientId', conf.misc.clientId);
	}).then(function() {
		return database.load();
	}).then(function() {
		middleware(upsboardApp);
		router(upsboardApp);
	}).then(function() {
    	return new server(upsboardApp);
	});
}

module.exports = makeServer;
