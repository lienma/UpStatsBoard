var _       = require('lodash')
  , chalk   = require('chalk')
  , fs      = require('fs')
  , moment  = require('moment')
  , path    = require('path');

var appRoot = path.resolve(__dirname, '../../')
  , paths   = require(appRoot + '/core/paths');
//var config 	= require(paths.app + '/config');

var isDevelopment = process.env.NODE_ENV == 'development';
var logsPath = process.env.DATA_PATH || paths.logs;

function Logger(module) {
	if(!(this instanceof Logger)) {
		return new Logger(module);
	}

	if(!fs.existsSync(paths.logs)) {
		fs.mkdirSync(paths.logs);
	}

	this.filePath = (process.env.DATA_PATH || paths.logs) + '/logs.log';
	this.errorPath = (process.env.DATA_PATH || paths.logs) + '/errors.log';
	this.module = module;

	var logExists = fs.existsSync(this.filePath);
	if(!logExists) {
		var err = fs.writeFileSync(this.filePath, '',  { mode: 0777 });
	}

	return this;
}

Logger.maxLogFiles = 5;

Logger.prototype.printObject = function(obj, baseTabs) {
	var tabs = '', tabCount = 0;
	while(tabCount < baseTabs) {
		tabs += '\t';
		tabCount += 1;
	}

	var printVars = [];
	for(var objVarible in obj) {
		if(obj.hasOwnProperty(objVarible)) {
			var objVar = (objVarible == 'password') ? '*********' : obj[objVarible];

			var strTypeOpen = strTypeClose = '';
			if(_.isString(objVar)) {
				strTypeOpen = strTypeClose = "'";
			}
			if(_.isArray(objVar)) {
				strTypeOpen = '[';
				strTypeClose = ']';
			}

			printVars.push(tabs + '\t"' + objVarible + '": ' + strTypeOpen + objVar + strTypeClose);
		}
	}

	return printVars.join(',\n');
};

Logger.prototype.setModule = function(module) {
	this.module = module.toUpperCase();

	return this;
};

function getMessage(messages, color) {
	for(var i = 0; i < messages.length; i++) {
		if(!(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/.test(messages[i]))) {
			messages[i] = chalk[(color) ? color : 'grey'].call(chalk, messages[i]);
		}
	}
	return Array.prototype.join.call(messages, ' ');
}
 
Logger.prototype.debug = function() {
	this.log('DEBUG', getMessage(arguments));
};

Logger.prototype.error = function(error, context, help) {

	var stack = error ? error.stack : null;

	if (!_.isString(error)) {
		if (_.isObject(error) && _.isString(error.message)) {
			error = error.message;
		} else {
			error = 'An unknown error occurred.';
		}
	}

	var msgs = [chalk.red('ERROR:', error), '\n'];
    if(context) {
        msgs.push(chalk.white(context), '\n');
    }

    if(help) {
        msgs.push(chalk.green(help));
    }
    msgs.push('\n');
    if(stack) {
        msgs.push(stack, '\n');
    }

	this.log('ERROR', getMessage(msgs));
};

Logger.prototype.fatal = function(error, context, help) {
	this.error(error, context, help);
	process.exit(0);
};

Logger.prototype.info = function() {
	this.log('INFO', getMessage(arguments));
};

Logger.prototype.warn = function() {
	this.log('WARN', getMessage(arguments));
};

Logger.prototype.log = function(level, message) {
	if(level == 'DEBUG' && !isDevelopment) {
		return;
	}

	var time = moment(), module = this.module;

	var totalSpaces = 8 - level.length;
	var spaces = '';
	while(spaces.length < totalSpaces) {
		spaces = spaces + ' ';
	}

	var levelColor;
	switch(level) {
		case 'INFO':
			levelColor = 'green';
			break;
		case 'DEBUG':
			levelColor = 'grey';
			break;
		case 'ERROR':
			levelColor = 'red';
			break;

	}

	function msg(msg) {
		var msgs = [chalk.cyan(time.format('YYYY-MM-DD HH:mm:SSS'))];
		msgs.push(chalk[levelColor].call(chalk, level), spaces);
		msgs.push(chalk.blue(module), chalk.cyan('::'), message);
		return Array.prototype.join.call(msgs, ' ');
	}

	if(isDevelopment) {
		console.log(msg(message));
	}

	if(level == 'ERROR') {
		message = 'An error has occured, please check the error.log file for more information.';
	}

	fs.appendFileSync(this.filePath, msg(message).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n');	

	rotateLogs(this);
};

function rotateLogs(log) {

	var stats = fs.statSync(log.filePath)
	  , fiveMB = 5 * 1024 * 1024;

	if(stats.size > fiveMB) {
		lastLogFile(log);
		for(var i = Logger.maxLogFiles - 1; i > 0; i--) {
			renameLogFile(log, i);
		}
		fs.renameSync(log.filePath, log.filePath + '.01');
	}
}

function renameLogFile(log, logNumber) {

	var filename =  log.filePath + '.' + ((logNumber < 10) ? '0' + logNumber : logNumber)
	  , newFilename = log.filePath + '.' + ((logNumber + 1 < 10) ? '0' + (logNumber + 1) : logNumber + 1);

	var exists = fs.existsSync(filename);
	if(exists) {
		fs.renameSync(filename, newFilename);
	}
}

function lastLogFile(log) {
	var filename = log.filePath + '.' + ((Logger.maxLogFiles < 10) ? '0' + Logger.maxLogFiles : Logger.maxLogFiles);
	var exists = fs.existsSync(filename);

	if(exists) {
		fs.unlinkSync(filename);
	}
}

exports = module.exports = Logger;
