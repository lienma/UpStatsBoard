
module.exports = {
	// Home Routes
	'index'       : 'HomeController.index',
	'post index'  : 'HomeController.index',

	// Setup Routes
	'setup': {
		'index'              : 'SetupController.index',
		'plex': {
			'post auth'      : 'SetupPlexController.auth',
			'post libraries' : 'SetupPlexController.libraries',
			'post test'      : 'SetupPlexController.test'
		},
		'server': {
			'post drive'     : 'SetupServerController.drive',
			'post test'      : 'SetupServerController.test'
		},
		'usenet': {
			'post test/:app' : 'SetupUsenetController.test'
		}
	}
};
