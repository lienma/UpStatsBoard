var when 			= require('when')
  , _ 				= require('underscore');
var Command 		= require('./../libs/Command')
  , Service 		= require('./../libs/Service')
  , log 			= new (require('./../libs/Logger'))('DRIVE_SPACE');

var idCounter = 0;
function Disk(label, location, options) {
	idCounter += 1;

	this._id = idCounter;

	this.label = label;
	this.location = location;
	this.options = (options) ? options : {};
	this.remote = (this.options.remote) ? this.options.remote : false;
	var service = false;

	if(this.remote) {
		service = new Service(this.options.host, this.options.port, {username: this.options.username, password: this.options.password});
	}

	this.command = Command(service);
}

Disk.prototype.getDriveSpace = function() {
	var self = this, promise = when.defer()
	  , start = new Date().getTime();

	log.debug('Getting drive space for', this.label.yellow, 'using', 'df'.red, 'command');

	
	df(this).then(function(data) {
		if(_.isNaN(data.used)) {
			log.debug('Falling back to', 'du'.red, 'for', self.label.yellow);
			du(self).then(finish).otherwise(promise.reject);
		} else {
			finish(data);
		}
	}).otherwise(promise.reject)

	function finish(data) {
		var since = new Date().getTime() - start;

		log.debug('Finished processing drive stats for', self.label.yellow + '.', 'Took ' + since + 'ms');

		promise.resolve(data);
	}

	return promise.promise;
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

function df(drive) {
	var promise = when.defer();

	function process(stdout) {
		var lines = stdout.split('\n');
		var str_disk_info = lines[1].replace( /[\s\n\r]+/g,' ');
		var disk_info = str_disk_info.split(' ');
	
		return formatResponse(drive, parseFloat(disk_info[2]), parseFloat(disk_info[1]));
	}

	drive.command('df --block-size=1 "' + drive.location + '"').then(process).then(promise.resolve).otherwise(function(reason) {
		var json = {err: reason.message, offline: true};

		switch(reason.message) {
			case 'AUTHENTICATION_FAILED':
				json.detail = 'Username and password failed. Please double check username and password for drive settings \'' + self.label + '\'';
				break;

			case 'CONNECTION_FAILED':
			case 'SERVER_OFFLINE':
				json.detail = 'Connection failed. Please double check the settings for drive settings \'' + self.label + '\'';
				break;

			case 'CONNECTION_TIMEOUT':
				json.detail = 'Connection timed out to getting drive information \'' + self.label + '\'';
				break;
		}

		promise.resolve(json);
	});

	return promise.promise;
}

function du(drive) {
	var promise = when.defer();

	function process(stdout) {
		var find = stdout.match(/(\d+)/);
		return formatResponse(drive, parseInt(find[0]) * 1024, drive.options.total);
	}

	drive.command('du --block-size=1 -s "' + drive.location + '"').then(process).then(promise.resolve).otherwise(function(reason) {
		var json = {err: reason.message, offline: true};

		switch(reason.message) {
			case 'AUTHENTICATION_FAILED':
				json.detail = 'Username and password failed. Please double check username and password for drive settings \'' + self.label + '\'';
				break;

			case 'CONNECTION_FAILED':
			case 'SERVER_OFFLINE':
				json.detail = 'Connection failed. Please double check the settings for drive settings \'' + self.label + '\'';
				break;

			case 'CONNECTION_TIMEOUT':
				json.detail = 'Connection timed out to getting drive information \'' + self.label + '\'';
				break;
		}

		promise.resolve(json);
	});

	return promise.promise;
}

exports = module.exports = Disk;
