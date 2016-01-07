var chalk 			= require('chalk')
  , express 		= require('express')
  , path			= require('path')
  , os				= require('os');

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths');

var upsboard 		= require(paths.core)
  , database 		= require(paths.core + '/database')
  , log				= require(paths.logger)('MAIN_APP');

var app				= express();
    app.dir			= path.resolve(__dirname);

app.set('seed', Math.floor(Math.random() * (process.pid - 1000) + 1000));

if(os.type() == 'Windows_NT') {
	console.fatal('UpsBoard only works on Linux operating system, and also Mac with limited features.');
	process.exit(0);
}

log.info('Starting', chalk.yellow('UpsBoard'), 'in', app.get('env'), 'environment.');

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

