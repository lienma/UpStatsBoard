var chalk 			= require('chalk')
  , Client 			= require('ssh2').Client
  , EventEmitter 	= require('events').EventEmitter
  , path			= require('path')
  , Process			= require('child_process')
  , Promise 		= require('bluebird')
  , Socket			= require('net').Socket
  , StringDecoder 	= require('string_decoder').StringDecoder
  , util 			= require('util');

var appRoot 		= path.resolve(__dirname, '../')
  , paths 			= require(appRoot + '/paths');

var log				= require(paths.logger)('CONNECT');

function Connection (options) {
	var self = this;
	this.remote = (options.remote == 'true') ? true : false;
	this.events = new EventEmitter();

	if(this.remote) {
		this.host = options.host;
		this.port = options.port;
		this.username = options.username;
		this.authentication = options.authentication;
		this.password = options.password ? options.password : '';
		this.privateKey = options.privateKey ? options.privateKey : '';
		this.passphrase = options.passphrase ? options.passphrase : '';

		this._isConnected = false;
	}
}

Connection.prototype.close = function () {
	if(this.remote === true && this.client) {
		this.client.end();
	}
};

Connection.prototype.command = function (cmd) {
	var self = this;

	return new Promise(function (resolve, reject) {
		self.connect().then(function () {
			var exec = (self.remote === true) ? self.client : Process;

			log.debug('Command:', chalk.cyan(cmd));
			exec.exec(cmd, function (err, stream) {
				if(err) {
					return reject(err);
				}

				if(typeof stream === 'string') {
					resolve(stream);
				} else {
					var decoder = new StringDecoder('utf8'), resStr = '';

					stream.on('data', function(data, extended) {
						 resStr += decoder.write(data);
					});
					stream.on('end', function() {
						resolve(resStr);
					});
				}
			});
		});
	});
};

Connection.prototype.connect = function () {
	var self = this;
	return new Promise(function (resolve, reject) {
		function rejectError(key, msg) {
			log.debug(chalk.red('Failed to connect to'), chalk.cyan(self.host +':' + self.port) + chalk.red('. Failed with this error ' + key));
			var err = new Error(key);
			err.msg = msg;
			reject(err);
		}

		if(self.remote === true) {
			if(self._isConnected === true) {
				resolve();
			} else {
				log.debug('Connecting to', chalk.cyan(self.host +':' + self.port), 'as user', chalk.cyan(self.username), 'authentication type is', chalk.cyan(self.authentication));

				var client = new Client(), socket = new Socket(), resolved = false;
				socket.setTimeout(10000, function() {
					if(resolved) return;
					rejectError('CONNECTION_TIMEOUT');
					socket.destroy();
				});
				socket.setNoDelay(true);
				socket.setMaxListeners(0);

				socket.on('error', function (err) {
					switch(err.code) {
						case 'ENOTFOUND':
							return rejectError('HOST_NOT_FOUND', 'Host was not found. Please check the host address.');
						case 'ECONNREFUSED':
							return rejectError('CONNECTION_REFUSED', 'Connection was refused. Possibly a wrong port number?');
						default:
							return rejectError(err);
					}
				});

				socket.on('connect', function () {
					var connectData = { username: self.username, sock: socket};
					switch(self.authentication) {
						case 'password':
							connectData.password = self.password;
							break;
						case 'privateKey':
							connectData.privateKey = self.privateKey;
							if(self.passphrase !== '') {
								connectData.passphrase = self.passphrase;
							}
							break;
					}

					try {
						client.connect(connectData);
					} catch (err) {
						switch(err.message) {
							case 'Invalid username':
								return rejectError('INVALID_USERNAME', 'Ther username is not present.');
							case 'error:0606508A:digital envelope routines:EVP_DecryptFinal_ex:data not multiple of block length':
								return rejectError('INVALID_PRIVATE_KEY', 'The private key is malformed or invalid.');
							case 'Encrypted private key detected, but no passphrase given':
								return rejectError('PASSPHRASE_REQUIRED', 'Encrypted private key detected, but no passphrase given.');
							case 'Malformed private key (expected sequence). Bad passphrase?':
								return rejectError('INVALID_PASSPHRASE', 'The passphrase failed to decrypt the private key.');
							default:
								return rejectError(err);
						}
					}

					client.on('ready', function () {
						self.isConnected = true;
						self.client = client;
						resolved = true;
						resolve();

						log.debug(chalk.green('Connection was made to'), chalk.cyan(self.host +':' + self.port), chalk.green('was successful!'));
					});

					client.on('end', function () {
						self.isConnected = false;
						socket.destroy();
					});

					client.on('error', function (err) {
						if(err.message == 'All configured authentication methods failed') {
							rejectError('INVALID_USERNAME_OR_AUTHENTICATION', 'Authentication has failed. Either the username or authentication method is invalid.');
						}
						reject(err);
						socket.destroy();
					});
				});

				socket.connect(self.port, self.host);
			}
		} else {
			resolve();
		}
	});
};

Connection.prototype.drive = function (location) {
	var self = this;

	log.debug('Retrieving drive information at location:', chalk.cyan(location));
	return new Promise(function (resolve, reject) {
		df().then(function (driveData) {
console.log('driveData', driveData);
			if(isNaN(driveData.used)) {

			} else {
				return resolve(driveData);
			}
		}).catch(function (err) {
			console.log(chalk.red(err), err);
			if(err.message.indexOf('No such file or directory') > -1) {
				log.debug(chalk.red('Failed to retrieve drive information.'), chalk.red('Location'), chalk.cyan(location), chalk.red('was not found.'));
				var errReject = new Error('DRIVE_NOT_FOUND');
				errReject.msg = 'Drive (' + location + ') was not found.';
				reject(errReject);
			}
		});
	});

	function df() {
		return self.command('df --block-size=1024 ' + location).then(function (response) {
			var lines = response.split('\n');
			var str_drive_info = lines[1].replace( /[\s\n\r]+/g,' ');
			var drive_info = str_drive_info.split(' ');

			return {
				used: parseInt(drive_info[2]) * 1024,
				total: parseInt(drive_info[1]) * 1024
			};
		});
	}
};

module.exports = Connection;