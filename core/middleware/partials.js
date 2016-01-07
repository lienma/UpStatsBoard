var fs				= require('fs')
  , path 			= require('path')
  , Promise			= require('bluebird')
  , url				= require('url');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

function Partials(req, res, next) {
	var path		= url.parse(req.url).pathname;

	if(path.match(/\.tmpl$/)) {
		var jadeFile = paths.views + '/partials' + path;
		jadeFile = jadeFile.replace('.tmpl', '.jade');

		fs.stat(jadeFile, function (error) {
			var exists = (error) ? false : true

			if(exists) {
				res.render(jadeFile, {
					//isLoggedIn: req.isAuthenticated(),
					//token: req.csrfToken(),
					webRoot: req.app.get('webRoot'),
				});
			} else {
				res.status(404).send('File not found');
			}
		});
	} else {
		res.status(404).send('File not found');
	}
}

module.exports = Partials;