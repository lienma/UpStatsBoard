var Connection 		= require('ssh2')
  , cProcess 		= require('child_process')
  , when 			= require('when')
  , StringDecoder 	= require('string_decoder').StringDecoder;;

var Service = require('./Service');

var idCounter = 0;
function Disk(label, location, options) {
	idCounter += 1;

	this._id = idCounter;

	this.label = label;
	this.location = location;
	this.options = (options) ? options : {};
	this.remote = (this.options.remote) ? this.options.remote : false;

	if(this.remote) {
		var service = new Service(this.options.host, this.options.port);
		var username = this.options.username
		  , password = this.options.password;

		this.options.username = "";
		this.options.password = "";
	}

	this.command = function(cmd) {
		var promise = when.defer()
		  , self = this;

		function runCmd(processor) {
			processor.exec(cmd, function(err, stream) {
				if(err) return promise.reject(err);

				if(typeof stream === 'string') {
					promise.resolve(stream);
				} else {
					var decoder = new StringDecoder('utf8')
					  , resStr = '';

					stream.on('data', function(data, extended) {
						 resStr += decoder.write(data);
					});
					stream.on('end', function() {
						promise.resolve(resStr);
					});

					if(self.remote) {
						stream.on('exit', function(code, signal) {
							processor.end();
						});
					}
				}
			});
		}

		if(this.remote) {
			service.isOnline()(function(err, isOnline) {
				if(isOnline) {
					var connection = new Connection();
					connection.connect({
						host: service.getHost(), port: service.getPort(),
						username: username, password: password
					});

					connection.on('error', function(err) {
						promise.reject(err);
					});

					connection.on('ready', function() {
						runCmd(connection);
					});
				} else {
					var err = new Error('Offline');
					err.details = 'Could not reach ' + service.getHost() + ':' + service.getPort();
					promise.reject(err);
				}
			});
		} else {
			runCmd(cProcess);
		}

		return promise.promise;
	};
}

Disk.prototype.getDriveSpace = function() {
	if(this.location == '/') {
		return getRootSpace(this);
	} else {
		return getFolderSpace(this);
	}
};

Disk.prototype.getIcon = function() {
	return (this.options && this.options.icon) ? this.options.icon : false;
};

function formatResponse(drive, used, total) {
	return {
		_id: 		drive._id,
		//location: 	drive.location,
		label: 		drive.label,
		icon: 		drive.getIcon(),
		used: 		used,
		total: 		total
	};
}

function getRootSpace(drive) {
	var promise = when.defer();

	function process(stdout) {
		var lines = stdout.split('\n');
		var str_disk_info = lines[1].replace( /[\s\n\r]+/g,' ');
		var disk_info = str_disk_info.split(' ');
	
		return formatResponse(drive, parseFloat(disk_info[2]) * 1024, parseFloat(disk_info[1]) * 1024);
	}

	drive.command('df -k').then(process).then(promise.resolve);

	return promise.promise;
}

function getFolderSpace(drive) {
	var promise = when.defer();

	function process(stdout) {
		var find = stdout.match(/(\d+)/);
		return formatResponse(drive, parseInt(find[0]) * 1024, drive.options.total);
	}

	drive.command('du -s "' + drive.location + '"').then(process).then(promise.resolve);

	return promise.promise;
}

exports = module.exports = Disk;
