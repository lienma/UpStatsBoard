var _                = require('lodash')
  , express          = require('express')
  , path             = require('path')

var appRoot          = path.resolve(__dirname, '../')
  , paths            = require(appRoot + '/core/paths');

var database         = require(paths.core + '/database')
  , util             = require(paths.core + '/util');

var routes           = require('./routes');
var availableMethods = ['all', 'delete', 'get', 'post', 'put'];

var controllers      = require('include-all')({
	dirname          : paths.controllers,
	filter           :  /(.+Controller)\.js$/
});

function setupRoutes (upsboardApp) {
	var router = express.Router();

	if(database.isInstalled()) {
		_.forEach(_.omit(routes, 'setup'), __parseKey(router));
	} else {
		routes = _.pick(routes, 'setup');
		routes.index = 'SetupController.welcome';
		_.forEach(routes, __parseKey(router));
	}
	upsboardApp.use(router);


	function __parseKey (router) {
		return function (controller, key) {
			var method = 'all';
			if(_.contains(key, ' ')) {
				var originalKey = key;
				var index = originalKey.indexOf(' ');
				key = originalKey.substr(index + 1);
				method = originalKey.substr(0, index);
				method.toLowerCase();

				if(!_.contains(availableMethods, method)) {
					throw Error('The method(' + method + ') is not available.');
				}
			}

			if(key == 'index') {
				key = '/';
			} else {
				key = '/' + key;
			}


			if(!_.isString(controller)) {
				var subRouter = express.Router();
				_.forEach(controller, __parseKey(subRouter));
				router.use(key, subRouter);
			} else {
				router.route(key)[method](__buildController(controller))
			}
		}
	}


	function __buildController (target) {
		var parsedTarget = target.match(/^([^.]+)\.?([^.]*)?$/);
		var controllerId = parsedTarget[1];
		var actionId = _.isString(parsedTarget[2]) ? parsedTarget[2] : 'index';

		var controller = controllers[controllerId];
		if(!_.isFunction(controller)) {
			throw Error('Controller (' + controllerId + ') was not found.')
		}

		var action = controller(upsboardApp)[actionId];
		if(!_.isObject(action)) {
			throw Error('Controller (' + controllerId + ') did not have action function (' + actionId + ')');
		}

		return action;
	}
}

module.exports = setupRoutes;