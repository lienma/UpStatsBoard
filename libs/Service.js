var Connection 	= require('ssh2')
  , when 		= require('when')

var log 		= new (require('./../libs/Logger'))('SERVICE');

var counter = 0;

function Service(host, port, options) {
	var self = this;

	counter += 1;
	this._id = counter;

	var options = (options) ? options : {};

	this.label = (options.label) ? options.label : '';
	this.host = host;
	this.port = port;

	if(options.username) {
		var username = options.username;
		var password = (options.password) ? options.password : '';

		this.connect = function() {
			var promise = when.defer();
			log.debug('Testing to see if server,', self.toString().yellow, 'is online');
			self.isOnline().then(function(isOnline) {
				if(isOnline) {
					var connection = new Connection();
					connection.connect({
						host: self.host, port: self.port,
						username: username, password: password
					});

					connection.on('error', function(err) {
						promise.reject(err);
					});

					connection.on('ready', function() {
						log.debug('Connection made to server', self.toString().yellow);
						promise.resolve(connection);
					});
				} else {
					var err = new Error('SERVER_OFFLINE');
					err.reason = 'Could not reach ' + self.toString();
					log.error('Failed to connection to server', self.toString().yellow);
					promise.reject(err);
				}
			}).otherwise(promise.reject);
			return promise.promise;
		}
	}

	this.url = (options && options.url) ? options.url : false;
}

Service.prototype.getHost = function() {
	return this.host;
};

Service.prototype.getPort = function() {
	return this.port;
};

Service.prototype.getID = function() {
	return this._id;
};

Service.prototype.getLabel = function() {
	return this.label;
};

Service.prototype.getURL = function() {
	return this.url;
};

Service.prototype.toString = function() {
	return this.host + ':' + this.port;
};

Service.prototype.isOnline = function() {
	var promise = when.defer()
	  , self = this, isOnline = false
	  , Socket = new require('net').Socket();

	Socket.setTimeout(400);
	Socket.connect(this.port, this.host);

	Socket.on('connect', function() {
		isOnline = true;
		promise.resolve(true);
		Socket.end();
	});

	function failed() {
		if(!isOnline) {
			promise.resolve(false);
		}
		Socket.destroy()
	}
	Socket.on('error', failed);
	Socket.on('timeout', failed);

	return promise.promise;
}

exports = module.exports = Service