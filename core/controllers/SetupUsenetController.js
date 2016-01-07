var path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');

module.exports = function SetupUsenetController (app) {

	return {
		'test': function (req, res) {
			var serviceName = req.params.app;

			switch(serviceName) {
				case 'sabnzbd':
					var ServiceClass = require(paths.modules + '/sabnzbd');
					break;
				//case 'nzbget':
				//	var ServiceClass = require(paths.modules + '/sickbeard');
				//	break;
				case 'sonarr':
					var ServiceClass = require(paths.modules + '/sonarr');
					break;
				//case 'sickbeard':
				//	var ServiceClass = require(paths.modules + '/sickbeard');
				//	break;
				case 'couchpotato':
					var ServiceClass = require(paths.modules + '/couchpotato');
					break;
				case 'headphones':
					var ServiceClass = require(paths.modules + '/headphones');
					break;
				//case 'plexpy':
				//	var ServiceClass = require(paths.modules + '/sickbeard');
				//	break;
				default:
					return res.json({ serviceNotFound: true });
			}

			var options = {
				host: req.body.host,
				port: parseInt(req.body.port),
				webRoot: req.body.webRoot,
				apiKey: req.body.apiKey,
				useSSL: (req.body.useSSL == 'true') ? true : false
			};
			var Service = new ServiceClass(options);

			Service.ping()
				.then(function(data) {
					if(data.wrongApiKey) {
						return res.json({ connection: false, wrongApiKey: true });
					}

					if(data.apiError) {
						return res.json({ connection: false, apiError: true, errorMsg: data.apiError });
					}

					return res.json({ connection: true });
				})
				.catch(function(error) {

					switch(error.message) {
						case 'RETURN_NOT_200':
							return res.json({ connection: false, pathNotFound: true });
						case 'REQUEST_ERROR':
							switch(error.error.code) {
								case 'ENOTFOUND':
									return res.json({ connection: false, hostNotFound: true });
								case 'ECONNREFUSED':
									return res.json({ connection: false, connectionRefused: true });
							}
					}

					return res.json({connection: false, failed: true});
				});
		}
	}
};

