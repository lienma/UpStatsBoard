var when 			= require('when');
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
	var self = this
	  , start = new Date().getTime();

	log.debug('Getting drive space for', this.label.yellow);
	if(this.location == '/') {
		var promise = getRootSpace(this);
	} else {
		var promise = getFolderSpace(this);
	}

	promise.then(function(data) {
		var since = new Date().getTime() - start;

		log.debug('Finished processing drive stats for', self.label.yellow + '.', 'Took ' + since + 'ms');

		return when.resolve(data);
	});

	return promise;
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

	drive.command('df -k').then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;
}

function getFolderSpace(drive) {
	var promise = when.defer();

	function process(stdout) {
		var find = stdout.match(/(\d+)/);
		return formatResponse(drive, parseInt(find[0]) * 1024, drive.options.total);
	}

	drive.command('du -s "' + drive.location + '"').then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;
}

exports = module.exports = Disk;
