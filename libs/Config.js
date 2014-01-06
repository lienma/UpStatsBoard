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

var log 		= new (require('./../libs/Logger'))('CONFIG');

var appRoot 	= path.resolve(__dirname, '../')
  , cachePath 	= path.resolve(appRoot, 'cache');

function Config() {
	var promise = when.defer();

	log.debug('Loading configuration data.')

	getConfigData()
		.then(validateSiteSettings)
		.then(validateGoogleAnalytics)
		.then(validateDrives)
		.then(validateBandwidthServers)
		.then(validateServices)

		//.then(validateSabnzbd)
		.then(validateSickbeard)
		.then(validatePlex)
		.then(validateWeather)

		.then(function(data) {
			log.info('Good to launch! All configuration has been validated and tested!'.green);

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

	if(!fs.existsSync(cachePath)) {
		log.debug('Cache folders does not exist. Attempting to create folder');
		fs.mkdirSync(cachePath);
	}

	log.info('Validated general configuration'.green);
	return when.resolve(data);
}

function validateGoogleAnalytics(data) {
	if(_.isString(data.data.googleAnalyticsId)) {
		data.config.googleAnalytics = true;
		data.config.googleAnalyticsId = data.data.googleAnalyticsId;
		data.config.googleAnalyticsUrl = data.data.googleAnalyticsUrl;
	} else {
		data.config.googleAnalytics = false;
		data.config.googleAnalyticsId = '';
		data.config.googleAnalyticsUrl = '';
	}
	return when.resolve(data);
}

function validateDrives(data) {
	var drives = [];

	for(var label in data.data.drives) {
		if(data.data.drives.hasOwnProperty(label)) {
			var drive = data.data.drives[label];

			var remote 		= (drive.remote) ? true : false
			  , location	= (_.isString(drive.location)) ? drive.location : '/'
			  , options 	= {};

			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the drives.';

				var printObj = '{\n' + log.printObject(drive, 2) + '\n\t\t},';
				error.suggestion = '\t\t"Main Hard Drive": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);
			}



			if(remote) {
				if(!_.isString(drive.username) || _.isEmpty(drive.username)) {
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Username is required for getting remote drive statistics.';
					return when.reject(error);
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
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Invalid total drive space for drive ' + label + ', needs to be a number';
					return when.reject(error);
				}

				options.total = parseFloat(drive.total) * Math.pow(1024, 4);
			}

			if(drive.icon) {
				options.icon = drive.icon;
			}

			drives.push(new Disk(label, location, options));
		}
	}

	log.info('Validated drives configuration'.green);
	data.config.drives = drives;
	return when.resolve(data);
}

function validateBandwidthServers(data) {
	var servers = [];

	for(var label in data.data.bandwidthServers) {
		if(data.data.bandwidthServers.hasOwnProperty(label)) {
			var server = data.data.bandwidthServers[label];
			var remote = (server.remote) ? true : false;

			var options = {
				label: label,
				'default': (server['default']) ? true : false,

				interface: (_.isString(server.interface)) ? server.interface : 'eth0',
				max: (server.maxSpeed) ? server.maxSpeed : [100, 100],
				remote: remote
			};

			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the drives.';

				var printObj = '{\n' + log.printObject(server, 2) + '\n\t\t},';
				error.suggestion = '\t\t"Home Server": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);

			}

			if(remote) {
				if(!_.isString(server.username) || _.isEmpty(server.username)) {
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Username is required for getting bandwidth statistics from remote source.';
					return when.reject(error);
				}

				options.host = (_.isString(server.host)) ? server.host : 'localhost',
				options.port = (_.isNumber(server.port)) ? server.port : 22,
				options.username = server.username,
				options.password = (_.isString(server.password)) ? server.password : ''
			};
			servers.push(new Bandwidth(options));
		}
	}

	log.info('Validated bandwidth servers configuration.'.green);
	data.config.bandwidth = servers;
	return when.resolve(data);
}

function validateServices(data) {
	var services = [];

	for(var label in data.data.services) {
		if(data.data.services.hasOwnProperty(label)) {
			var service = data.data.services[label];

			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the monitoring services.';

				var printObj = '{\n' + log.printObject(service, 2) + '\n\t\t},';
				error.suggestion = '\t\t"WebSite": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);
			}


			if(!_.isString(service.host) || _.isEmpty(service.host)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'A host must be specified for this monitoring service, ' + label;
				return when.reject(error);
			}

			if(!_.isNumber(service.port)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'A port must be specified for this monitoring service, ' + label;
				return when.reject(error);
			}

			services.push(new Service(service.host, service.port, {
				label: label, url: (service.url) ? service.url : ''
			}));
		}
	}

	log.info('Validated monitoring services configuration'.green);
	data.config.services = services;
	return when.resolve(data);
}

function validateSickbeard(data) {
	var promise = when.defer();
	var sbData = data.data.sickbeard;

	if(!_.isString(sbData.apiKey) || _.isEmpty(sbData.apiKey)) {
		var error = new Error('INVALID_CONFIG');
		error.reason = 'A Sick Beard api key is required to run this app.';
		return when.reject(error);
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

	log.debug('Testing Sick Beard\'s api key');
	sickbeard.ping().then(function() {
		log.debug('Successful ping to Sick Beard.');

		log.info('Validated Sick Beard configuration'.green);
		data.config.sickbeard = sickbeard;
		promise.resolve(data);

	}).otherwise(function(reason) {
		if(reason.message == 'DENIED' || reason.message == 'WRONG_SETTINGS') {
			promise.reject(reason.reason);
		}
	});

	var sickbeardCacheFolder = path.join(cachePath, 'sickbeard');
	var cacheFolderExists = fs.existsSync(sickbeardCacheFolder);
	log.debug('Does Sick Beard cache folder exist? ' + cacheFolderExists);

	if(!cacheFolderExists) {
		log.debug('Creating cache folder for Sick Beard.');
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

	log.debug('Getting plex token for myPlex.');
	plex.getMyPlexToken()

		.then(function() { log.debug('Sending a ping to the plex media server.'); })
		.then(plex.ping.bind(plex))

		.then(function() { log.debug('Checking to see if th tv section id is proper - ' + options.recentTVSection); })
		.then(function() {
			var err = new Error('WRONG_TV_SECTION_ID');
			err.reason = 'The TV section ID is not a tv section.';
			return vaidateSection(options.recentTVSection, 'show', err);
		})

		.then(function() { log.debug('Checking to see if th movie section id is proper - ' + options.recentMovieSection); })
		.then(function() {
			var err = new Error('WRONG_MOVIE_SECTION_ID');
			err.reason = 'The Movie section ID is not a movie section.';
			return vaidateSection(options.recentMovieSection, 'movie', err);
		})

		.then(function() {
			log.info('Validated Plex configuration'.green);
			data.config.plex = plex;
			promise.resolve(data);
		})
	.otherwise(promise.reject);

	var plexCacheFolder = path.join(cachePath, 'plex');
	var cacheFolderExists = fs.existsSync(plexCacheFolder);
	log.debug('Does Plex cache folder exist? ' + cacheFolderExists);

	if(!cacheFolderExists) {
		log.debug('Creating cache folder for Plex.');
		fs.mkdirSync(plexCacheFolder);
	}

	return promise.promise;
}

function validateWeather(data) {
	if(data.data.weather && _.isString(data.data.weather.apiKey)) {
		var weather = data.data.weather;

		if(!_.isString(weather.apiKey) || _.isEmpty(weather.apiKey)) {
			return when.reject(new Error('Forecast.io Api key is required.'));
		}

		if(!_.isString(weather.lat) || _.isEmpty(weather.lat)) {
			return when.reject(new Error('The weather module requires a latitude.'));
		}
		if(!_.isString(weather.long) || _.isEmpty(weather.long)) {
			return when.reject(new Error('The weather module requires a longitude.'));
		}

		data.config.weather = {
			enabled: true,
			apiKey: weather.apiKey,
			latitude: weather.lat,
			longitude: weather.long,
			useFahrenheit: (weather.useFahrenheit) ? true : false
		};

		log.info('Validated Forecast.io weather configuration');
	} else {
		data.config.weather = {
			enabled: false,
			apiKey: '',
			latitude: '',
			longitude: '',
			useFahrenheit: true
		};
		log.debug('No Forecase.io api key present. Weather module is disabled.');
	}

	return when.resolve(data);
}

exports = module.exports = Config;
