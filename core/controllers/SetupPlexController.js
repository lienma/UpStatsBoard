var path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');


var Plex       = require(paths.modules + '/plex')
  , PlexPy     = require(paths.modules + '/plexpy');


module.exports = function SetupPlexController (app) {

	return {
		'auth': function (req, res) {
			var username = req.body.username
			  , password = req.body.password;

			Plex.getToken(username, password, app.get('clientId')).then(function(token) {
				res.json({ token: token });
			}).catch(function(error) {
				if(error.message == 'PLEX') {
					return res.json({ error: error.error });
				}
			});
		},

		'libraries': function (req, res) {
			var plex = new Plex({
				host: req.body.host,
				port: req.body.port,
				useSSL: req.body.useSSL,

				username: req.body.username,
				password: req.body.password,

				clientId: app.get('clientId')
			});

			plex.getLibraries().then(function (libraries) {
				res.json({ libraries: libraries });
			}).catch(res.json);
		},

		'plexpy': function (req, res) {
			var plexPy = new PlexPy({
				host    : req.body.host,
				port    : parseInt(req.body.port),
				webRoot : req.body.webRoot,
				apiKey  : req.body.apiKey,
				useSSL  : (req.body.useSSL == 'true') ? true : false
			});


			plexPy.ping()
				.then(function (data) {
console.log('data', data)
					if(data.wrongApiKey) {
						return res.json({ connection: false, wrongApiKey: true });
					}

					if(data.apiError) {
						return res.json({ connection: false, apiError: true, errorMsg: data.apiError });
					}

					return res.json({ connection: true });
				})
				.catch(function (error) {
console.log(error);
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
		},

		'test': function (req, res) {
			var plex = new Plex({
				host: req.body.host,
				port: req.body.port,
				useSSL: req.body.useSSL,

				username: req.body.username,
				password: req.body.password,

				clientId: app.get('clientId')
			});

			plex.ping().then(function (data) {
				if(data.error) {
					data.connection = false;
					res.json(data);
				}
				if(data.MediaContainer) {
					res.json({ connection: true });
				}
			});
		}
	}
};

