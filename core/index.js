const express     = require('express');
const path        = require('path');

const appRoot     = path.resolve(__dirname, '../');
const paths       = require(appRoot + '/core/paths');

const log         = require(paths.logger)('MAKE_SERVER');
const config      = require(paths.core + '/config');
const database    = require(paths.core + '/database');
const middleware  = require(paths.core + '/middleware');
const router      = require(paths.core + '/router');
const server      = require(paths.core + '/server');

function makeServer(options) {
    options = options || {};

   	const upsboardApp = express();

    return config.load().then(() => {
		var conf = config.get();
		upsboardApp.set('host', conf.server.host);
		upsboardApp.set('port', conf.server.port);
		upsboardApp.set('webRoot', conf.server.webRoot);
		upsboardApp.set('mode', conf.misc.mode);
		upsboardApp.set('clientId', conf.misc.clientId);
	})
	.then(() => database.load() )
	.then(() => middleware(upsboardApp) )
	.then(() => router(upsboardApp) )
	.then(() => new server(upsboardApp) );
}

var operatingSystem = false;
switch(process.platform) {
	case 'linux':
	case 'darwin':
		operatingSystem = process.platform;
		break;
	case 'win32':
		operatingSystem = 'windows';
		break;
}

makeServer.os = operatingSystem;
module.exports = makeServer;

