
var async = require('async')
  , cProcess = require('child_process')
  , moment = require('moment')
  , Connection = require('ssh2')
  , xml2js = require('xml2js');


var Service = require('./Service');

function getBytes(num, type) {
	var power;
	switch(type) {
		case 'PiB':
			power = 5;
			break;
		case 'TiB':
			power = 4;
			break;
		case 'GiB':
			power = 3;
			break;
	}
	return Math.round(num * Math.pow(1024, power));
}


var globalId = 0;
var Bandwidth = (function() {
	return function(bwConfig) {
		var base = this;
		this.id = ++globalId;

		this.label = bwConfig.label;
		this.default = (bwConfig.default) ? bwConfig.default : false;

		this.remote = (bwConfig.remote) ? bwConfig.remote : false;
		this.interface = (bwConfig.interface) ? bwConfig.interface : 'eth0';
		

		this.max = bwConfig.max;

		if(this.remote) {

			var service = new Service(bwConfig.host, (bwConfig.port) ? bwConfig.port : 22);
			var username = bwConfig.username;
			var password = bwConfig.password;

			this.remoteCommand = function(cmd, callback) {
				service.isOnline()(function(err, isOnline) {
					if(isOnline) {
						var c = new Connection();
						c.connect({
							host: service.getHost(), port: service.getPort(),
							username: username, password: password
						});

						c.on('error', function(err) {
							callback(err);
						});
						c.on('ready', function() {
							c.exec(cmd, function(err, stream) {
								if(err) callback(err);
		
								var StringDecoder = require('string_decoder').StringDecoder;
								var decoder = new StringDecoder('utf8');
								var resStr = '';
								stream.on('data', function(data, extended) {
									 resStr += decoder.write(data);
								});
								stream.on('end', function() {
									callback(null, resStr);
								});
								stream.on('exit', function(code, signal) {
									c.end();
								});
							});
						});
					} else {
						var err = new Error('Offline');
						err.details = 'Could not reach ' + service.getHost() + ':' + service.getPort();
						callback(err);
					}
				});
			};
		}
	};
})();

Bandwidth.prototype.isDefault = function() {
	return this.default;
};

Bandwidth.prototype.isRemote = function() {
	return this.remote;
};

Bandwidth.prototype.getID = function() {
	return this.id;
};

Bandwidth.prototype.getInterface = function() {
	return this.interface;
};

Bandwidth.prototype.getLabel = function() {
	return this.label;
};

Bandwidth.prototype.getMax = function() {
	return this.max;
};

Bandwidth.prototype.getBandwidth = function() {
	var base = this;

	return function(callback) {
		async.parallel([base.getLiveBandwidth(), base.getStats()], function(err, results) {
			var json = {
				_id: base.getID(),
				label: base.getLabel(),
				default: base.isDefault(),
				max: base.getMax(),
			};
			if(err === null) {
				json.offline = false;
				json.dateSince= results[1].dateSince;
				json.download = results[0].download;
				json.upload = results[0].upload;
	
				json.total = results[1].total;
				json.lastMonth = results[1].lastMonth;
				json.thisMonth = results[1].thisMonth;
				json.today = results[1].today;
			} else {
				json.offline = true;
			}
			callback(null, json);
		});
	};
};

Bandwidth.prototype.getLiveBandwidth = function() {
	var base = this;
	function processString(stdout, callback) {
		var fmtStr = stdout.replace(/[\s\n\r]+/g, ' ');

		var download = fmtStr.match(/rx(\s+)((\d+).(\d+)) (\w+)\/s/);
		var upload = fmtStr.match(/tx(\s+)((\d+).(\d+)) (\w+)\/s/);

		var downloadRate = parseFloat(download[2]);
		var uploadRate = parseFloat(upload[2]);

		var data = {
			download: (download[5] == 'kbit') ? (downloadRate / 1024).toFixed(2) : downloadRate,
			upload: (upload[5] == 'kbit') ? (uploadRate / 1024).toFixed(2) : uploadRate,
		};

		callback(null, data);
	}

	return function(callback) {
		if(!base.remote) {
			cProcess.exec('vnstat -i ' + base.interface + ' -tr', function(err, stdout, stderr) {	
				if(err) return callback(err);
				processString(stdout, callback);
			});
		} else {
			base.remoteCommand('vnstat -i ' + base.interface + ' -tr', function(err, stdout) {
				if(err) return callback(err);
				processString(stdout, callback);
			});
		}
	};
};

Bandwidth.prototype.getStats = function() {
	var base = this;
	function processString(xml, callback) {
		var json = {
		};


		xml = xml.trim();
		if(xml.substr(0,8) == '<vnstat ') { //>

			var parser = new xml2js.Parser({ mergeAttrs: true });
			parser.parseString(xml, function(err, data) {
				if(err) return callback(err);
				var interface = data.vnstat.interface[0];

				var created = interface.created[0].date[0];
				json.dateSince = moment(created.year[0] + '-' + created.month[0] + '-' + created.day[0]).format('MMMM D, YYYY');

				var traffic = interface.traffic[0];
				var months = traffic.months[0].month;
				var days = traffic.days[0].day;

				function makeArray(ary) {
					var rx = parseInt(ary.rx[0]) * 1024
					  , tx =parseInt(ary.tx[0]) * 1024;
					return [rx, tx, (rx + tx)]
				}

				json.total = makeArray(traffic.total[0]);
				json.thisMonth = makeArray(months[0]);
				json.lastMonth = (months.length > 1) ? makeArray(months[1]) : [0, 0, 0];
				json.today = makeArray(days[0]);

				callback(null, json);
			});
		} else {
			var err = new Error('not xml')
			if(typeof xml === 'string') {
				err.details = xml
			}
			callback(err);
		}
		
	}

	return function(callback) {
		var cmd = 'vnstat -i ' + base.interface + ' --xml';
		if(!base.remote) {
			cProcess.exec(cmd, function(err, stdout, stderr) {	
				if(err) return callback(err);
				processString(stdout, callback);
			});
		} else {
			base.remoteCommand(cmd, function(err, stdout) {
				if(err) return callback(err);
				processString(stdout, callback);
			});
		}
	};
};

exports = module.exports = Bandwidth;
