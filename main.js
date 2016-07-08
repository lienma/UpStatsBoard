var chalk 			= require('chalk')
  , express 		= require('express')
  , path			= require('path');

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths');

var upsboard 		= require(paths.core)
  , database 		= require(paths.core + '/database')
  , log				= require(paths.logger)('MAIN_APP');

var app				= express();
    app.dir			= path.resolve(__dirname);

if(!upsboard.os || upsboard.os === 'windows') {
	console.log(chalk.red('UpsBoard only works on Linux operating system, and also Mac with limited features.'));
	console.log(chalk.red('Windows is currently unsupported at this time.'));
	process.exit(0);
}

app.set('seed', Math.floor(Math.random() * (process.pid - 1000) + 1000));

log.info('Starting', chalk.yellow('UpsBoard'), 'in', app.get('env'), 'environment.');
log.info('Operating system:', chalk.cyan(upsboard.os))

upsboard().then(function(upsServer) {
	app.use(upsServer.rootApp.get('webRoot'), upsServer.rootApp);

	upsServer.start(app).then(function() {
		var uri = 'http://' + upsServer.rootApp.get('host') + ':' + upsServer.rootApp.get('port') + upsServer.rootApp.get('webRoot');
		log.info(chalk.yellow('UpsBoard'), 'is running at',  chalk.cyan(uri));

		if(!database.isInstalled()) {
			var urlSetup = (upsServer.rootApp.get('webRoot') == '/' ? '' : '/') + 'setup';
			log.info(chalk.red('Please navigate to this address to complete setup of'), chalk.yellow('UpsBoard'));
			log.info(chalk.cyan(uri + urlSetup));
		}
	});
}).catch(function(error) {
	log.fatal(error, error.content, error.help)
});

