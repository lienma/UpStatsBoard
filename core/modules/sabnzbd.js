var _ 		= require('lodash')
  , chalk 	= require('chalk')
  , path 	= require('path')
  , Promise	= require('bluebird');

var request = Promise.promisifyAll(require('request'));

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var log 	= require(paths.logger)('SABNZBD');

function Sabnzbd(sabConfig) {

	var protocol = sabConfig.useSSL ? 'https://' : 'http://';
	this.url = protocol + sabConfig.host + ':' + sabConfig.port;

	var webRoot = sabConfig.webRoot;
	this.url += ((webRoot.charAt(0) == '/') ? '' : '/') + webRoot;
	this.url += (webRoot.charAt(webRoot.length - 1) == '/') ? '' : '/';

	this.apiKey = sabConfig.apiKey;
}

Sabnzbd.prototype.getPage = function(cmd, filters) {
	var params = '';
	if(filters) {
		_.each(filters, function(value, key) {
			params += '&' + key + '=' + value;
		});
	}

	var url = this.url + 'api?mode=' + cmd + params + '&output=json&apikey=' + this.apiKey;
	log.debug('Calling SABnzbd page:', chalk.cyan(url));
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

				if(body.error && body.error == 'API Key Incorrect') {
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

Sabnzbd.prototype.changeCategory = function(nzb_id, category) {
	return this.getPage('change_cat', { value: nzb_id, value2: category });
};

Sabnzbd.prototype.changePriority = function(nzb_id, priority) {
	var numVal = 0, priority = priority.toLowerCase();

	switch(priority) {
		case 'low':
			numVal =  -1;
			break;
		case 'high':
			numVal = 1;
			break;
		case 'force':
			numVal = 2;
			break;
	}

	var params = {value: nzb_id, value2: numVal};
	return this.getPage('priority', params);
};

Sabnzbd.prototype.changeProcessing = function(nzb_id, value) {
	var params = {value: nzb_id, value2: value};
	return this.getPage('change_opts', params);
};

Sabnzbd.prototype.changeScript = function(nzb_id, value) {
	var params = {value: nzb_id, value2: value};
	return this.getPage('change_script', params);
};

Sabnzbd.prototype.getHistory = function(start, limit) {
	return this.getPage('history', {
		start: start,
		limit: limit
	});
};

Sabnzbd.prototype.getQueue = function(start, limit) {
	return this.getPage('queue', {
		start: start,
		limit: limit
	});
};

Sabnzbd.prototype.pauseQueue = function() {
	return this.getPage('pause');
};

Sabnzbd.prototype.queue = function(name, nzb_id, value) {
	var params = {name: name, value: nzb_id};

	if(value) {
		if(name == 'priority') {
			var numVal = 0, priority = value.toLowerCase();
			switch(priority) {
				case 'low':
					numVal =  -1;
					break;
				case 'high':
					numVal = 1;
					break;
				case 'force':
					numVal = 2;
					break;
			}
			params.value2 = numVal;
		} else if(name == 'delete') {

			params.del_files = value;
		} else {
			params.value2 = value;
		}
	}

	return this.getPage('queue', params);
};

Sabnzbd.prototype.moveItem = function(nzb_id, position) {
	var params = {value: nzb_id, value2: position};

	return this.getPage('switch', params);
};

Sabnzbd.prototype.resumeQueue = function() {
	return this.getPage('resume');
};

Sabnzbd.prototype.deleteHistory = function(nzb_id, del_files) {
	var params = {name: 'delete', value: nzb_id, del_files: del_files};
	return this.getPage('history', params);
};


Sabnzbd.prototype.setSpeedLimit = function(speed) {
	if(!_.isNumber(speed) && speed != 0) {
		var err = new Error('INVALID_NUMBER');
		return when.reject(err);
	}

	return this.getPage('config', {'name': 'speedlimit', 'value': speed});
};

Sabnzbd.prototype.ping = function() {
	return this.getPage('qstatus');
};

module.exports = Sabnzbd;
