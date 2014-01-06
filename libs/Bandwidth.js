
var async = require('async')
  , moment 	= require('moment')
  , when 	= require('when')
  , xml2js 	= require('xml2js');


var Command = require('./../libs/Command')
  , Service = require('./../libs/Service')
  , log 	= new (require('./../libs/Logger'))('BANDWIDTH');

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


		var service = false;
		if(this.remote) {
			var port = (bwConfig.port) ? bwConfig.port : 22;
			service = new Service(bwConfig.host, port, {username: bwConfig.username, password: bwConfig.password});
		}

		this.command = Command(service);
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
	var self = this, promise = when.defer();

	log.debug('Getting bandwidth data for', self.label.yellow);

	var waitForData = when.all([this.getLiveBandwidth(), this.getStats()]);
	waitForData.then(function(results) {
		var json = {
			_id: self.getID(),
			label: self.getLabel(),
			default: self.isDefault(),
			max: self.getMax(),
		};

		//if(err === null) {
			json.offline = false;
			json.dateSince= results[1].dateSince;
			json.download = results[0].download;
			json.upload = results[0].upload;

			json.total = results[1].total;
			json.lastMonth = results[1].lastMonth;
			json.thisMonth = results[1].thisMonth;
			json.today = results[1].today;
		//} else {
		//	json.offline = true;
		//}

		promise.resolve(json);
	}).otherwise(promise.reject);

	return promise.promise;
};

Bandwidth.prototype.getLiveBandwidth = function() {
	var self = this, start = new Date().getTime()
	  , promise = when.defer();

	log.debug('Getting live bandwidth data for', this.label.yellow, 'from', ((this.remote) ? 'remote' : 'local'), 'server.');

	var cmd = 'vnstat -i ' + self.interface + ' -tr';
	self.command(cmd).then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;

	function process(stdout) {
		var since = new Date().getTime() - start;

		log.debug('Finished getting live bandwidth for', self.label.yellow + '.', 'Took ' + since + 'ms');

		var fmtStr = stdout.replace(/[\s\n\r]+/g, ' ');

		var download = fmtStr.match(/rx(\s+)((\d+).(\d+)) (\w+)\/s/);
		var upload = fmtStr.match(/tx(\s+)((\d+).(\d+)) (\w+)\/s/);

		var downloadRate = parseFloat(download[2]);
		var uploadRate = parseFloat(upload[2]);

		return {
			download: (download[5] == 'kbit') ? (downloadRate / 1024).toFixed(2) : downloadRate,
			upload: (upload[5] == 'kbit') ? (uploadRate / 1024).toFixed(2) : uploadRate,
		};
	}
};

Bandwidth.prototype.getStats = function() {
	var self = this, start = new Date().getTime()
	  , promise = when.defer();

	var cmd = 'vnstat -i ' + this.interface + ' --xml';
	self.command(cmd).then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;

	function process(xml) {
		var processPromise = when.defer()
		  , since = new Date().getTime() - start;;

		log.debug('Finished getting history of bandwidth for', self.label.yellow + '.', 'Took ' + since + 'ms');

		var json = {};

		xml = xml.trim();
		if(xml.substr(1,7) == 'vnstat ') {

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

				processPromise.resolve(json);
			});
		} else {
			var err = new Error('NOT_XML');
			if(typeof xml === 'string') {
				err.details = xml
			}
			processPromise.reject(err);
		}

		return processPromise.promise;
	}
};

exports = module.exports = Bandwidth;
