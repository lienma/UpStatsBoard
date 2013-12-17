var request 		= require('request')
  , when 			= require('when');


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

exports.bandwidth = function(req, res) {
	var async = require('async')
	  , cProcess = require('child_process')
	  , moment = require('moment');

	var bw = req.app.config.bandwidth;

	var funcs = [];
	for(var i = 0; i < bw.length; i++) {
		funcs.push(bw[i].getBandwidth());
	}

	async.parallel(funcs, function(err, results) {
		res.json(results);
	});
};

exports.cpu = function(req, res) {
	var resJSON = {};

	var os = require('os');
	var osUtils  = require('os-utils');

	var totalCPUs = os.cpus().length;
	resJSON.totalCPUs = totalCPUs;
	resJSON.cpu = os.cpus()[0].model;

	var cpuNow = getCPUInfo();

	setTimeout(function() {
		var cpuLater = getCPUInfo();
		resJSON.user = getAvgCPU(cpuNow, cpuLater, 'user');
		resJSON.nice = getAvgCPU(cpuNow, cpuLater, 'nice');
		resJSON.sys = getAvgCPU(cpuNow, cpuLater, 'sys');
		resJSON.idle = getAvgCPU(cpuNow, cpuLater, 'idle');
		resJSON.time = new Date().getTime();
		resJSON.loadAvg = os.loadavg();
		res.json(resJSON);
	}, 5000);
};

exports.disks = function(req, res) {
	var Disk = require('../libs/Disk')
	  , async = require('async');

	var drives = req.app.config.drives;

	var funcArray = [];
	for(var i = 0; i < drives.length; i++) {
		funcArray.push(drives[i].getDriveSpace());
	}

	var promise = when.all(funcArray);

	promise.then(function(results) {
		res.json(results);

	}).otherwise(function(reason) {
		res.json([]);
	});
};

exports.memory = function(req, res) {
	var resJSON = {};

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
		res.json(resJSON);
	});
};


exports.services = function(req, res) {
	var async = require('async');
	var services = req.app.config.services;

	var aServices = [];
	for(var i = 0; i < services.length; i++) {
		aServices.push(services[i].isOnline());
	}

	async.parallel(aServices, function(err, results) {
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
	});
};


exports.weather = function(req, res) {
	var config = req.app.config.weather;

	var forecastExcludes = '?exclude=daily,flags';
	var url = 'https://api.forecast.io/forecast/' + config.apiKey;
		url += '/' + config.lat + ',' + config.long + forecastExcludes;

	request({
		uri: url, json: true, timeout: 10000
	}, function(err, resp, body) {
		if(err) {
			res.json({});
		}

		res.json({
			currentSummary: body.currently.summary,
			currentIcon: body.currently.icon,
			currentTemp: Math.round(body.currently.temperature),
			currentWindSpeed: Math.round(body.currently.windSpeed),
			currentWindBearing: body.currently.windBearing,

			minutelySummary: body.minutely.summary,
			hourlySummary: body.hourly.summary,

			alerts: (body.alerts) ? body.alerts : []
		});
	});
};