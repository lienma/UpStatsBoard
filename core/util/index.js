var _ = require('lodash');


exports.normalizeControllerId = function normalizeControllerId (controllerId) {
	if (!_.isString(controllerId)) {
		return null;
	}
	controllerId = controllerId.replace(/(.+)Controller$/i, '$1');
	controllerId = controllerId.toLowerCase();
	return controllerId;
};
