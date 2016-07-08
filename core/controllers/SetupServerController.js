var _          = require('lodash')
  , path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');

var Connect    = require(paths.modules + '/connect');


function formatConnectError(error) {
	var json = { error: true };
	if(error.msg) {
		json.message = error.msg;
	}

	switch(error.message) {
		case 'INVALID_PRIVATE_KEY':
			json.invalidPrivateKey = true;
			break;
		case 'PASSPHRASE_REQUIRED':
			json.passphraseRequired = true;
			break;
		case 'INVALID_PASSPHRASE':
			json.invalidPassphrase = true;
			break;
		case 'HOST_NOT_FOUND':
			json.hostNotFound = true;
			break;
		case 'CONNECTION_REFUSED':
			json.connectionRefused = true;
			break;
		case 'INVALID_USERNAME_OR_AUTHENTICATION':
			json.invalidUsernameOrAuthntication = true;
			break;
		case 'DRIVE_NOT_FOUND':
			json.driveNotFound = true;
			break;
	}

	return json;
}

module.exports = function SetupServerController (app) {

	return {
		'drive': function (req, res) {
			var data = { };
			_.each(['os', 'remote', 'host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'], function (key) {
				var value = req.body[key] ? req.body[key] : '';

				if(value === 'true') value = true;
				if(value === 'false') value = false;

				data[key] = value;
			});

			var connect = new Connect(data);

			var location = req.body.location;
			connect.drive(location).then(function (driveData) {
				res.json({ error: false, drive: driveData });
			}).catch(function (err) {
				connect.close();			
				res.json(formatConnectError(err));
			});
		},

		'test': function (req, res) {
			var data = { remote: true };
			_.each(['os', 'host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'], function (key) {
				data[key] = req.body[key] ? req.body[key] : '';
			});

			var connect = new Connect(data);

			connect.connect().then(function () {
				connect.close();
				res.json({ error: false, loginSuccessful: true });
			}).catch(function (err) {
				connect.close();

				res.json(formatConnectError(err));
			})
		}
	};
};

