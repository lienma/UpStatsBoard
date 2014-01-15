
exports.index = function(req, res) {
	res.render('index', {
		debugStopUpdating: (req.app.config.debugStopUpdating) ? 'true' : 'false',

		googleAnalytics: req.app.config.googleAnalytics,
		googleAnalyticsId: req.app.config.googleAnalyticsId,
		googleAnalyticsUrl: req.app.config.googleAnalyticsUrl,

		isMacOs: req.app.isMacOs,

		title: 'UpStats Board',

		weatherEnabled: (req.app.config.weather.enabled) ? 'true' : 'false',
		weatherLat: req.app.config.weather.latitude,
		weatherLocation: req.app.config.weather.latitude + ',' + req.app.config.weather.longitude,
		weatherLong: req.app.config.weather.longitude,

		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot,
	});
};

exports.install = function(req, res) {
	res.render('install', {
		title: 'Installing UpStats Board',
		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot
	});
};
