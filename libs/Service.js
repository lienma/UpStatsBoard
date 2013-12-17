var counter = 0;

function Service(host, port, options) {
	counter += 1;

	this._id = counter;
	this.label = (options && options.label) ? options.label : '';
	this.host = host;
	this.port = port;

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

Service.prototype.isOnline = function() {
	var base = this, isOnline = false
	  , Socket = new require('net').Socket();

	Socket.setTimeout(400);
	Socket.connect(this.port, this.host);

	return function(callback) {
		Socket.on('connect', function() {
			isOnline = true;
			callback(null, true);
			Socket.end();
		});

		function failed() {
			if(!isOnline) {
				callback(null, false);
			}
			Socket.destroy()
		}
		Socket.on('error', failed);
		Socket.on('timeout', failed);
	};
};


exports = module.exports = Service