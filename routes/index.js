
exports.index = function(req, res) {
	res.render('index', {
		debugStopUpdating: (req.app.config.debugStopUpdating) ? 'true' : 'false',
		title: 'UpStats Board',
		weatherEnabled: (req.app.config.weather.enabled) ? 'true' : 'false',
		weatherLat: req.app.config.weather.lat,
		weatherLong: req.app.config.weather.long,
		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot,
	});
};

exports.install = function(req, res) {
	res.render('install', {
		title: 'Installing UpStats Board',
		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot
	});
};
