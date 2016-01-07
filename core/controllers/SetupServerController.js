var _          = require('lodash')
  , path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');

var Connect    = require(paths.util + '/connect');

module.exports = function SetupServerController (app) {

	return {
		'drive': function (req, res) {
			var data = { };
			_.each(['remote', 'host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'], function (key) {
				data[key] = req.body[key] ? req.body[key] : '';
			});

			var connect = new Connect(data);

			var location = req.body.location;
			connect.drive(location).then(function (driveData) {
				res.json({ error: false, drive: driveData });
			}).catch(function (err) {
				connect.close();
console.log('catch', err.message)
				var json = { error: true };
				if(err.msg) {
					json.message = err.msg;
				}

				switch(err.message) {
					case 'DRIVE_NOT_FOUND':
						json.driveNotFound = true;
						break;
				}

				res.json(json);
			});
		},

		'test': function (req, res) {
			var data = { remote: true };
			_.each(['host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase'], function (key) {
				data[key] = req.body[key] ? req.body[key] : '';
			});

			var connect = new Connect(data);

			connect.connect().then(function () {
				connect.close();
				res.json({ error: false, loginSuccessful: true });
			}).catch(function (err) {
				connect.close();

				var json = { error: true };
				if(err.msg) {
					json.message = err.msg;
				}

				switch(err.message) {
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

				}

				res.json(json);
			})
		}
	};
};

