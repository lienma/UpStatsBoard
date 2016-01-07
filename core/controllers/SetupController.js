var path       = require('path')
  , request    = require('request');

var appRoot    = path.resolve(__dirname, '../../')
  , paths      = require(appRoot + '/core/paths');

module.exports = function SetupController (app) {

	return {
		'welcome': function (req, res) {
			res.render('setup/welcome', {
				title: 'Welcome to UpsBoard'
			});
		},

		'index': function (req, res) {
			res.render('setup/index', {
				host    : app.get('host'),
				port    : app.get('port'),
				seed    : app.get('seed'),
				title   : 'UpsBoard Setup Guide',
				uuid    : app.get('clientId'),
				webRoot : app.get('webRoot') == '/' ? '' : app.get('webRoot')
			});
		}
	}
};

