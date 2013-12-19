var when    	= require('when')
  , _    		= require('underscore')
  , fs 			= require('fs')
  , path 		= require('path');

var Bandwidth 	= require('./../libs/Bandwidth')
  , Disk 		= require('./../libs/Disk')
  , Sabnzbd 	= require('./../libs/Sabnzbd')
  , Service 	= require('./../libs/Service')
  , Plex 		= require('./../libs/Plex')
  , SickBeard 	= require('./../libs/SickBeard');

var appRoot 	= path.resolve(__dirname, '../')
  , cachePath 	= path.resolve(appRoot, 'cache');

function Config() {
	var promise = when.defer();

	getConfigData()
		.then(validateSiteSettings)
		.then(validateDrives)
		.then(validateBandwidthServers)
		.then(validateServices)

		//.then(validateSabnzbd)
		.then(validateSickbeard)
		.then(validatePlex)
		.then(validateWeather)

		.then(function(data) {
			console.log('Configuration Valid!'.green);

			promise.resolve(data.config);
		}).otherwise(promise.reject);

	return promise.promise;
}

function getPaths() {
	return {
		'appRoot': appRoot,
		'cache': cachePath
	};
}

function getConfigData() {
	
	var data = require(path.join(appRoot, 'config.js'));

	var config = {
		paths: getPaths
	};

	return when.resolve({data: data, config: config});
}

function validateSiteSettings(data) {
	data.config.host 	= (data.data.host) ? data.data.host : '0.0.0.0';
	data.config.port	= (data.data.port) ? data.data.port : 8084;
	data.config.webRoot = (data.data.webRoot || data.data.webRoot != '/') ? data.data.webRoot : '';

	data.config.debugStopUpdating = (data.data.debugStopUpdating) ? true : false;
	data.config.logHttpRequests = (data.data.logHttpRequests) ? true : false;

	var cacheFolderExists = fs.existsSync(cachePath);
	if(!cacheFolderExists) {
		fs.mkdirSync(cachePath);
	}

	return when.resolve(data);
}

function validateDrives(data) {
	var drives = [];

	for(var label in data.data.drives) {
		if(data.data.drives.hasOwnProperty(label)) {
			if(_.isEmpty(label)) {
				return when.reject(new Error('A label is required for the drive'));
			}

			var drive = data.data.drives[label];

			var remote 		= (drive.remote) ? true : false
			  , location	= (_.isString(drive.location)) ? drive.location : '/'
			  , options 	= {};

			if(remote) {
				if(!_.isString(drive.username) || _.isEmpty(drive.username)) {
					return when.reject(new Error('Username is required for getting remote drive stats'));
				}

				options = {
					remote: true,
					host: (_.isString(drive.host)) ? drive.host : 'localhost',
					port: (_.isNumber(drive.port)) ? drive.port : 22,
					username: drive.username,
					password: (_.isString(drive.password)) ? drive.password : ''
				};
			}

			if(drive.total) {
				if(!_.isNumber(drive.total)) {
					return when.reject(new Error('Invalid total drive space for drive ' + label));
				}

				options.total = parseFloat(drive.total) * Math.pow(1024, 4);
			}

			if(drive.icon) {
				options.icon = drive.icon;
			}

			drives.push(new Disk(label, location, options));
		}
	}

	data.config.drives = drives;
	return when.resolve(data);
}

function validateBandwidthServers(data) {
	var servers = [];

	for(var label in data.data.bandwidthServers) {
		if(data.data.bandwidthServers.hasOwnProperty(label)) {
			if(_.isEmpty(label)) {
				return when.reject(new Error('A label is required for the bandwidth server'));
			}

			var server = data.data.bandwidthServers[label];
			var remote = (server.remote) ? true : false;

			var options = {
				label: label,
				'default': (server['default']) ? true : false,

				interface: (_.isString(server.interface)) ? server.interface : 'eth0',
				max: (server.maxSpeed) ? server.maxSpeed : [100, 100],
				remote: remote
			};

			if(remote) {
				if(!_.isString(server.username) || _.isEmpty(server.username)) {
					return when.reject(new Error('Username is required for getting remote bandwidth stats'));
				}

				options.host = (_.isString(server.host)) ? server.host : 'localhost',
				options.port = (_.isNumber(server.port)) ? server.port : 22,
				options.username = server.username,
				options.password = (_.isString(server.password)) ? server.password : ''
			};

			servers.push(new Bandwidth(options));
		}
	}

	data.config.bandwidth = servers;
	return when.resolve(data);
}

function validateServices(data) {
	var services = [];

	for(var label in data.data.services) {
		if(data.data.services.hasOwnProperty(label)) {
			if(_.isEmpty(label)) {
				return when.reject(new Error('A label is required for the services'));
			}

			var service = data.data.services[label];

			if(!_.isString(service.host) || _.isEmpty(service.host)) {
				return when.reject(new Error('Host must be specified for this service'));
			}

			if(!_.isNumber(service.port)) {
				return when.reject(new Error('Port must be specified for this service'));
			}

			services.push(new Service(service.host, service.port, {
				label: label, url: (service.url) ? service.url : ''
			}));
		}
	}

	data.config.services = services;
	return when.resolve(data);
}

function validateSickbeard(data) {
	var promise = when.defer();
	var sbData = data.data.sickbeard;

	if(!_.isString(sbData.apiKey) || _.isEmpty(sbData.apiKey)) {
		return when.reject(new Error('SickBeard api key is required'));
	}

	var options = {
		protocol: (_.isString(sbData.protocol)) ? sbData.protocol : 'http://',
		host: (_.isString(sbData.host)) ? sbData.host : 'localhost',
		port: (_.isNumber(sbData.port)) ? sbData.port : 8081,
		webRoot: (_.isString(sbData.webRoot)) ? sbData.webRoot : '',
		apiKey: sbData.apiKey
	};

	if(_.isString(sbData.url)) {
		options.url = sbData.url;
	} else {
		options.url = options.protocol + options.host + ':' + options.port + '/' + options.webRoot;
	}

	var sickbeard = new SickBeard(options);

	console.log('Testing sickbeard\'s api key'.grey);
	sickbeard.ping().then(function() {
		data.config.sickbeard = sickbeard;
		promise.resolve(data);

	}).otherwise(function(reason) {
		if(reason.message == 'DENIED' || reason.message == 'WRONG_SETTINGS') {
			promise.reject(reason.reason);
		}
	});

	var sickbeardCacheFolder = path.join(cachePath, 'sickbeard');
	var cacheFolderExists = fs.existsSync(sickbeardCacheFolder);
	if(!cacheFolderExists) {
		fs.mkdirSync(sickbeardCacheFolder);
	}

	return promise.promise;
}

function validatePlex(data) {
	var promise = when.defer()
	  , plexData = data.data.plex;

	if(!_.isString(plexData.username) || _.isEmpty(plexData.username)) {
		return when.reject(new Error('Plex requires your myPlex username and password'));
	}

	if(!_.isString(plexData.password) || _.isEmpty(plexData.password)) {
		return when.reject(new Error('Plex requires your myPlex username and password'));
	}

	var options = {
		protocol: (_.isString(plexData.protocol)) ? plexData.protocol : 'http://',
		host: (_.isString(plexData.host)) ? plexData.host : 'localhost',
		port: (_.isNumber(plexData.port)) ? plexData.port : 32400,

		username: plexData.username,
		password: plexData.password,

		recentTVSection: (_.isNumber(plexData.recentTVSection)) ? plexData.recentTVSection : -1,
		recentMovieSection: (_.isNumber(plexData.recentMovieSection)) ? plexData.recentMovieSection : -1
	};

	if(_.isString(plexData.url)) {
		options.url = plexData.url;
	} else {
		options.url = options.protocol + options.host + ':' + options.port;
	}
	var plex = new Plex(options);

	function vaidateSection(sectionId, type, err) {
		var promise = when.defer();

		plex.getSectionType(sectionId).then(function(sectionType) {
			if(sectionType == type) {
				promise.resolve();
			} else {
				promise.reject(err);
			}
		}).otherwise(promise.reject);	

		return promise.promise;
	}

	console.log('Getting token for myPlex.'.grey);
	plex.getMyPlexToken()
.then(function() { console.log('Sending ping to plex'); })
		.then(plex.ping.bind(plex))
.then(function() { console.log('Checking tv section id'); })
		.then(function() {
			var err = new Error('WRONG_TV_SECTION_ID');
			err.reason = 'The TV section ID is not a tv section.';
			return vaidateSection(options.recentTVSection, 'show', err);
		})
.then(function() { console.log('Checking movie section id'); })
		.then(function() {
			var err = new Error('WRONG_MOVIE_SECTION_ID');
			err.reason = 'The Movie section ID is not a movie section.';
			return vaidateSection(options.recentMovieSection, 'movie', err);
		})
		.then(function() {
			data.config.plex = plex;
			promise.resolve(data);
		}).otherwise(promise.reject);

	var plexCacheFolder = path.join(cachePath, 'plex');
	var cacheFolderExists = fs.existsSync(plexCacheFolder);
	if(!cacheFolderExists) {
		fs.mkdirSync(plexCacheFolder);
	}

	return promise.promise;
}

function validateWeather(data) {
	if(data.data.weather && data.data.weather.apiKey) {
		var weather = data.data.weather;
	
		data.config.weather = {
			enabled: true,
			apiKey: weather.apiKey,
			lat: weather.lat,
			long: weather.long,
			useFahrenheit: (weather.useFahrenheit) ? weather.useFahrenheit : false
		};
	} else {
		data.config.weather = {
			enabled: false,
			apiKey: '',
			lat: '',
			long: '',
			useFahrenheit: ''
		};
	}
	return when.resolve(data);
}

exports = module.exports = Config;
