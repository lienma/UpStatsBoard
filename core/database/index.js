var chalk			= require('chalk')
  , fs				= require('fs')
  , path 			= require('path')
  , Promise			= require('bluebird');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

var log 			= require(paths.logger)('DATABASE');

function Database() {
	this.dbPath = appRoot;

	this._isInstalled = false;
}

Database.prototype.isInstalled = function () {
	return this._isInstalled;
};

Database.prototype.load = function (dbFilePath) {
	var self = this;

	self.dbPath = process.env.DATA_PATH || dbFilePath || self.dbPath;
	var dbFile = self.dbPath + '/upsboard.db';

	log.debug('Checking if database file exists as location:', chalk.cyan(dbFile));

	return new Promise(function (resolve, reject) {
		fs.stat(dbFile, function (error) {
			var exists = (error) ? false : true
			  , pendingConfig;

			if(exists) {
				log.debug('Database file exists.');
				self._isInstalled = true;


			} else {
				log.info('Database was not found. Looks like', chalk.yellow('UpsBoard'), 'needs to be installed. Launching Setup Guide.');
				resolve();
			}
		});
	});
}

module.exports = new Database();