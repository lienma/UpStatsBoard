var request 		= require('request')
  , when 			= require('when');

var CPU				= require('./../libs/Cpu')
  , Memory 			= require('./../libs/Memory');

exports.all = function(req, res) {

	when.all([getCpu(req), getBandwidth(req), getMemory(req)]).then(function(data) {
		res.json({ cpu: data[0], bandwidth: data[1], memory: data[2] });
	});
};

exports.bandwidth = function(req, res) {
	getBandwidth(req).then(function(data) {
		res.json(data);
	});
};

exports.cpu = function(req, res) {
	getCpu(req).then(function(data) {
		res.json(data);
	});
};

exports.memory = function(req, res) {
	getMemory(req).then(function(data) {
		res.json(data);
	});
};

exports.disks = function(req, res) {
	var drives = req.app.config.drives;

	var funcArray = [];
	drives.forEach(function(drive) {
		funcArray.push(drive.getDriveSpace());
	});

	when.all(funcArray).then(function(results) {
		res.json(results);

	}).otherwise(function(reason) {
		res.json([]);
	});
};

exports.services = function(req, res) {
	var services = req.app.config.services;

	var funcArray = [];
	services.forEach(function(service) {
		funcArray.push(service.isOnline());
	});

	when.all(funcArray).then(function(results) {
		var resServices = [];
		for(var i = 0; i < results.length; i++) {
			var online = results[i]
			  , service = services[i];

			var json = {
				_id: 		service.getID(),
				label: 		service.getLabel(),
				url: 		service.getURL(),
				online: 	online,
				status: 	(online) ? 'Online' : 'Offline'
			};
			resServices.push(json);
		}

		res.json(resServices);
	}).otherwise(function(reason) {
		res.json([]);
	});
};

exports.weather = function(req, res) {
	var config = req.app.config.weather;

	var useFahrenheit = (config.useFahrenheit) ? '' : '&units=si'
	  , forecastExcludes = '?exclude=daily,flags' + useFahrenheit
	  , url = 'https://api.forecast.io/forecast/' + config.apiKey;
		url += '/' + config.latitude + ',' + config.longitude + forecastExcludes;

	request({
		uri: url, json: true, timeout: 10000
	}, function(err, resp, body) {
		if(err && !body.currently) {
			res.json({});
		}

		res.json({
			currentSummary: body.currently.summary,
			currentIcon: body.currently.icon,
			currentTemp: Math.round(body.currently.temperature),
			currentWindSpeed: Math.round(body.currently.windSpeed),
			currentWindBearing: body.currently.windBearing,

			minutelySummary: (body.minutely) ? body.minutely.summary : false,
			hourlySummary: body.hourly.summary,

			useFahrenheit: config.useFahrenheit,

			alerts: (body.alerts) ? body.alerts : []
		});
	});
};

function getBandwidth(req) {
	var promise = when.defer()
	  , bw = req.app.config.bandwidth;

	var funcArray = [];
	for(var i = 0; i < bw.length; i++) {
		funcArray.push(bw[i].getBandwidth());
	}

	when.all(funcArray).then(function(results) {
		promise.resolve(results);
	}).otherwise(function(reason) {
console.log(reason);
		promise.resolve([]);
	});

	return promise.promise;
}

function getCpu() {
	var promise 	= when.defer()

	CPU().then(function(data) {
		promise.resolve(data);
	});

	return promise.promise;
}

function getMemory(req) {
	var promise = when.defer();
	Memory(req).then(function(data) {
		promise.resolve(data);
	});

	return promise.promise;
}
