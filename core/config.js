var _ 				= require('lodash')
  , bcrypt 			= require('bcrypt-nodejs')
  , chalk 			= require('chalk')
  , fs				= require('fs')
  , ini 			= require('ini')
  , path 			= require('path')
  , Promise			= require('bluebird')
  , uuid 			= require('node-uuid');

Promise.promisifyAll(fs);

var appRoot 		= path.resolve(__dirname, '../')
  , paths 			= require(appRoot + '/core/paths');

var log 			= require(paths.logger)('CONFIG');

function Config() {
	this.configPath = appRoot;
	this._config = {};
}

Config.prototype.init = function (rawConfig) {
	var self = this;

	self.set(rawConfig);

	return self._config;
};

Config.prototype.set = function (config) {
	this._config = config;

	_.extend(this, this._config);
};

Config.prototype.get = function () {
    return this._config;
};

Config.prototype.load = function (configFilePath) {
	var self = this;

	self.configPath = process.env.DATA_PATH || configFilePath || self.configPath;
	var configFile = self.configPath + '/config.ini';

	log.debug('Checking if the config file exists as location:', chalk.cyan(configFile));

	return new Promise(function (resolve, reject) {
		fs.stat(configFile, function (error) {
			var exists = (error) ? false : true
			  , pendingConfig;

			if(exists) {
				log.debug('Config file exists. Opening and reading app configurations.');
				pendingConfig = self.readFile();
			} else {
				log.debug('Config file does not exists. Creating one with default values.');
				pendingConfig = self.writeFile();
			}

			pendingConfig.then(function(config) {
				resolve(self.init(config));
			}).catch(reject);
		});
	});
};

Config.prototype.readFile = function() {
	var configFile = this.configPath + '/config.ini';
	return fs.readFileAsync(configFile, 'utf-8').then(ini.parse);
};

Config.prototype.writeFile = function() {
	var config = {
		server: {
			host: 'localhost',
			port: 8424,
			webRoot: '/'
		},
		misc: {
			logHttpRequests: true,
			mode: 'normal',
			salt: bcrypt.genSaltSync(10),
			clientId: uuid.v4()
		}
	};

	var configFile = this.configPath + '/config.ini';
	return fs.writeFileAsync(configPath, ini.stringify(config)).then(function() {
		return config;
	});
};

module.exports = new Config();