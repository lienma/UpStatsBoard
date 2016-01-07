var _    	= require('lodash')
  , chalk 	= require('chalk')
  , os		= require('os')
  , path	= require('path')
  , Promise	= require('bluebird')
  , request = require('request')
  , xml2js	= require('xml2js');

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var log 	= require(paths.logger)('PLEX');
var project = require(appRoot + '/package.json');

//Promise.promisifyAll(xml2js);

function Plex(config) {
	this.host = config.host;
	this.port = config.port;
	this.useSSL = config.useSSL;

	this.url = ((this.useSSL) ? 'https://' : 'http://') + this.host + ':' + this.port;

	this.username = config.username;
	this.password = config.password;
	this.clientId = config.clientId;

	if(config.token) {
		this.token = config.token;
		this.gettingToken = false;
	} else {
		this.gettingToken = Plex.getToken(config.username, config.password, config.clientId).then(function(token) {
			this.token = token;
			this.gettingToken = false;
		}.bind(this));
	}

	this.parser = new xml2js.Parser({ mergeAttrs: true });
}

Plex.prototype.page = function(page) {
	var self = this;

	if(this.gettingToken) {
		return this.gettingToken.then(function() { 
			return self.page(page);
		}).catch(function(error) {
			return {
				error: true,
				wrongCredentials: true
			};
		});
	}

	var url = this.url + '/' + page;
	var headers = {
		'X-Plex-Client-Identifier': this.clientId,
		'X-Plex-Product': project.name,
		'X-Plex-Device-Name': project.name,
		'X-Plex-Version': project.version,
		'X-Plex-Platform': 'Node.js',
		'X-Plex-Platform-Version': process.version,
		'X-Plex-Device': os.type(),
		'X-Plex-Token': this.token
	};

	log.info('Calling page:', chalk.cyan(url));

	return new Promise(function(resolve) {
		request.get(url, { headers: headers, rejectUnauthorized: false }, function(error, response, body) {
			if(error) {
console.log(error);
				var errorJSON = { error: true, code: error.code, url: url };
				switch(error.code) {
					case 'ENOTFOUND':
						errorJSON.hostNotFound = true;
					case 'ECONNREFUSED':
						errorJSON.connectionRefused = true;
				}
				return resolve(errorJSON);
			} else if(!response || (response.statusCode != 200 && response.statusCode != 401)) {
				return resolve({ error: true, code: 'RETURN_NOT_200', statusCode: response.statusCode, pathNotFound: true, url: url, body: body });
			} else if(response.statusCode == 401) {
				return resolve({ error: true, unauthorized: true, url: url, body: body });
			} else if(response.statusCode == 200 && body) {
				body = (body.toString('utf-8')).trim();
				if(body.substr(0, 5) != '<?xml') {
					return resolve({ error: true, code: 'INVALID_RESPONSE', invalidResponse: true, url: url, body: body });
				}

				self.parser.parseString(body, function(error, data) {
					if(error) {
						return resolve({ error: true, code: 'PARSE_ERROR', parseError: true, url: url, body: body });
					}

					resolve(data);
				});
			} else {
				return resolve({ error: true, code: 'INVALID_BODY', invalidBody: true, url: url, body: body });
			}
		}.bind(this));
	});
};

Plex.prototype.getLibraries = function(type) {
	return this.page('library/sections').then(function(data) {
		var libraries = [];
		if(data.MediaContainer) {
			var directory = data.MediaContainer.Directory;

			directory.forEach(function(library) {
				var g = new Get(library);

				var libraryType = g.get('type');
				if(type === undefined || libraryType == type) {
					var obj = g.all(['allowSync', 'art', 'composite', 'filters', 'refreshing', 'thumb', 'type', 'title', 'agent', 'scanner', 'language', 'uuid', 'updatedAt', 'createdAt']);
					obj.id = g.get('key');

					obj.location = [];
					library.Location.forEach(function(location) {

						obj.location.push({
							id: get(location, 'id'),
							path: get(location, 'path')
						});
					});

					libraries.push(obj);
				}
			});
			return libraries;
		} else {
			return libraries;
		}
	});
};

Plex.prototype.ping = function() {

	return this.page('status/sessions');
};

Plex.getToken = function(username, password, uuid) {
	var headers = {
		'X-Plex-Client-Identifier': uuid,
		'X-Plex-Product': project.name,
		'X-Plex-Device-Name': project.name,
		'X-Plex-Version': project.version,
		'X-Plex-Platform': 'Node.js',
		'X-Plex-Platform-Version': process.version,
		'X-Plex-Device': os.type()
	};

	log.info('Getting token from Plex.tv');
	log.debug('Header being sent to Plex.tv:', JSON.stringify(headers));


	return new Promise(function(resolve, reject) {
		request.post('https://plex.tv/users/sign_in.json', {
			headers: headers,
			json: true
		}, function(error, response, body) {
			if(error) {
				log.error('Failed to retrieve plex token:', error.error.code)
				return reject(error);
			}

			if(body.user && body.user.authentication_token) {
				log.info('Plex token was successfully retrieved.');
				return resolve(body.user.authentication_token);
			}

			if(body.error) {
				log.info('Failed to retrieve plex token:', chalk.red(body.error));
				var err = new Error('PLEX');
				err.error = body.error;
				return reject(err);
			}

			return reject(new Error('INVALID_BODY'));
		}).auth(username, password, false);
	});
};

module.exports = Plex;

function Get(obj) {

	this.get = function(key) {
		return get(obj, key);
	}

	this.all = function(keys) {
		var obj = { };
		keys.forEach(function(key) {
			obj[key] = this.get(key);
		}.bind(this));

		return obj
	}
}

function get(obj, key) {

	if(obj[key]) {
		var value;
		if(_.isArray(obj[key])) {
			value = obj[key][0];
		} else {
			value = obj[key];
		}


		if(!_.isNaN(parseInt(value))) {
			value = parseInt(value);
		}

		return value;
	}

	return '';
}
