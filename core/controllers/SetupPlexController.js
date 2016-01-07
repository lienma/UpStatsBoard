var path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');


var Plex       = require(paths.modules + '/plex');


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

			plex.getLibraries().then(function(libraries) {
				res.json({ libraries: libraries });
			}).catch(res.json);
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

