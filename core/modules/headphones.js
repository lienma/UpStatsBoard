var _ 		= require('lodash')
  , chalk 	= require('chalk')
  , path 	= require('path')
  , Promise	= require('bluebird');

var request = Promise.promisifyAll(require('request'));

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var log 	= require(paths.logger)('HEADPHONES');

function Headphones(config) {

	var protocol = config.useSSL ? 'https://' : 'http://';
	this.url = protocol + config.host + ':' + config.port;

	var webRoot = config.webRoot;
	this.url += ((webRoot.charAt(0) == '/') ? '' : '/') + webRoot;
	this.url += (webRoot.charAt(webRoot.length - 1) == '/') ? '' : '/';

	this.apiKey = config.apiKey;
}

Headphones.prototype.getPage = function(cmd) {
	var url = this.url + 'api?apikey=' + this.apiKey + '&cmd=' + cmd;
	log.debug('Calling Headpones page:', chalk.cyan(url));

	return new Promise(function(resolve, reject) {
		request.getAsync({ rejectUnauthorized: false, uri: url, json: true }).then(function(response) {
			var body = response.body;
			if(response.statusCode != 200 && response.statusCode != 401) {
				var errReturn = new Error('RETURN_NOT_200');
				errReturn.url = url;
				errReturn.body = body;
				reject(errReturn);
			} else if(body) {
				try {
					body = JSON.parse(body);
				} catch(err) {}

				if(body == 'Incorrect API key') {
					resolve({ wrongApiKey: true });
				} else if(body.error) {
					resolve({ apiError: true, errorMsg: body.error})
				} else {
					resolve(body);
				}
			} else {
				var errReturn = new Error('INVALID_BODY');
				errReturn.url = url;
				errReturn.body = body;
				reject(errReturn);
			}
		}).catch(function(error) {
			var errReturn = new Error('REQUEST_ERROR');
			errReturn.error = error;
			errReturn.url = url;
			reject(errReturn);
		});
	});
};

Headphones.prototype.ping = function() {
	return this.getPage('getVersion');
};

module.exports = Headphones;
