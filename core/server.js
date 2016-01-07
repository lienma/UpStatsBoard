var moment 			= require('moment')
  , path 			= require('path')
  , util 			= require('util');

var appRoot 		= path.resolve(__dirname, '../')
  , paths 			= require(appRoot + '/core/paths');

var config 			= require(paths.core + '/config');
var log 			= require(paths.logger)('SERVER');

function Server(rootApp) {
    this.rootApp = rootApp;
    this.httpServer = null;
    this.connections = {};
    this.connectionId = 0;

    this.config = config;
}

Server.prototype.start = function (externalApp) {
	var self = this, rootApp = externalApp ? externalApp : self.rootApp;

	this._startTime = moment();

	return new Promise(function (resolve) {
		self.httpServer = rootApp.listen(config.server.port, config.server.host);

		self.httpServer.on('error', function (error) {
			if(error.errno === 'EADDRINUSE') {
				log.fatal('EADDRINUSE', util.format('The port number %s is currently being used.', config.server.port), 'Please close the other program and start Upsboard again.');
			} else {

			}

			//log.exit();
		});

		self.httpServer.on('connection', self.connection.bind(self));
		self.httpServer.on('listening', function () {

			resolve(self);
		});
	});
};

Server.prototype.connection = function (socket) {
    var self = this;

    self.connectionId += 1;
    socket._connectionId = self.connectionId;

    socket.on('close', function () {
        delete self.connections[this._connectionId];
    });

    self.connections[socket._connectionId] = socket;
};

module.exports = Server;