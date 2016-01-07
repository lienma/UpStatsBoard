var path		= require('path');
var appRoot		= path.resolve(__dirname, '../');

var paths = module.exports = {
	app         : appRoot,

	cache       : path.join(appRoot, 'cache'),
	cfg_file    : path.join(appRoot, 'config.ini'),
	controllers : path.join(appRoot, 'core', 'controllers'),
	db_file     : path.join(appRoot, 'database', 'upsboard.db'), 
	core        : path.join(appRoot, 'core'),
	logs        : path.join(appRoot, 'logs'),
	logger      : path.join(appRoot, 'core', 'logger'),
	modules     : path.join(appRoot, 'core', 'modules'),
	public      : path.join(appRoot, 'public'),
	routes      : path.join(appRoot, 'core', 'routes'),
	util        : path.join(appRoot, 'core', 'util'),
	views       : path.join(appRoot, 'views')
};