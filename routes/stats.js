var request 		= require('request')
  , when 			= require('when');

exports.all = function(req, res) {

	var waitingFunctions = [
		getCpu(req),
		getBandwidth(req),
		getMemory(req),
	];

	when.all(waitingFunctions).then(function(results) {
		res.json({
			cpu: results[0],
			bandwidth: results[1],
			memory: results[2]
		});
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

function getCPUInfo() {
	var os = require('os');
    var cpus = os.cpus();
	var cpuData = [];

	for(var i = 0, len = cpus.length; i < len; i++) {
		var cpu = cpus[i], total = 0;
		var cpuArray = {};

		for(type in cpu.times)
			total += cpu.times[type];

		for(type in cpu.times) {
			cpuArray[type] = cpu.times[type];
		}
		cpuArray.total = total;
		cpuData.push(cpuArray);
	}

	return cpuData;
}


function getAvgCPU(oldCpus, newCpus, avgType) {
	var average = 0;
	for(var i = 0, len = oldCpus.length; i < len; i++) {
		for(type in oldCpus[i]) {
			if(type == avgType) {
				var total = newCpus[i].total - oldCpus[i].total;
				var difference = newCpus[i][type] - oldCpus[i][type];
				var avg = Math.round(10000 * (difference / total)) / 100;
				average += avg;
			}
		}
	}
	return Math.round(100 * average) / 100;
}

function getCpu() {
	var promise 	= when.defer()
	  , data 	= {}
	  , os 			= require('os')
	  , osUtils 	= require('os-utils');

	var totalCPUs = os.cpus().length;
	data.totalCPUs = totalCPUs;
	data.cpu = os.cpus()[0].model;

	var cpuNow = getCPUInfo();

	setTimeout(function() {
		var cpuLater = getCPUInfo();
		data.user = getAvgCPU(cpuNow, cpuLater, 'user');
		data.nice = getAvgCPU(cpuNow, cpuLater, 'nice');
		data.sys = getAvgCPU(cpuNow, cpuLater, 'sys');
		data.idle = getAvgCPU(cpuNow, cpuLater, 'idle');
		data.time = new Date().getTime();
		data.loadAvg = os.loadavg();
		promise.resolve(data);
	}, 5000);

	return promise.promise;
}

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

function getMemory() {
	var promise = when.defer();

	require('child_process').exec('free -m', function(error, stdout, stderr) {
		var lines = stdout.split("\n");
		var str_mem_info = lines[1].replace( /[\s\n\r]+/g,' ');
		var str_swap_info = lines[3].replace( /[\s\n\r]+/g,' ');
		var mem_info = str_mem_info.split(' ');
		var swap_info = str_swap_info.split(' ');
      
		var bytes = Math.pow(1024, 2)
		resJSON = {
			total: 		parseFloat(mem_info[1]) * bytes,
			free: 		parseFloat(mem_info[3]) * bytes,
			buffer: 	parseFloat(mem_info[5]) * bytes,
			cache: 		parseFloat(mem_info[6]) * bytes,
			swap: 		parseFloat(swap_info[2]) * bytes
		};
		resJSON.used = (parseFloat(mem_info[2]) * bytes) - resJSON.buffer - resJSON.cache;
		promise.resolve(resJSON);
	});

	return promise.promise;
};
