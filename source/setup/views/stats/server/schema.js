import _ from 'underscore';
export default function ServerSchema(self) {

	var isRemote = () => { return self.model.get('remote'); };
	var isAuthentication = (type) => { return () => { return isRemote() && self.model.get('authentication') === type; }; };
	var isBandwidth = () => { return self.model.get('monitorBandwidth'); };

	return {
		'label': {
			el: '#addServerLabel',
			constraints: {
				required: [true, 'A unique server name is required.'],
				func: [(value) => (self.view.servers.where({ label: value }).length === 0 || _.isObject(self.oldModel)), 'The server name is already being used.'],
				lessThan: [41, 'Max length of the name can only be 40 characters.']
			}
		},

		'host': {
			el: '#addServerHost',
			preRequirement: isRemote,
			constraints: {
				required: [true, 'A host address is required.'],

				warning: {
					func: [self.hasWarning('host'), 'Host was not found. Please check the host address.']
				}
			}
		},

		'port': {
			el: '#addServerPortNumber',
			preRequirement: isRemote,
			constraints: {
				required: [true, 'A port number is required.'],
				portNumber: [true, 'The port number is invalid for the remote server.'],
				warning: {
					func: [self.hasWarning('port'), 'Connection was refused. Possibly wrong port number?']
				}
			}
		},

		'username': {
			el: '#addServerUsername',
			preRequirement: isRemote,
			constraints: {
				required: [true, 'A username is required.'],
				lessThan: [33, 'Max lenght of a username is 32 characters.']
			}
		},

		'password': {
			el: '#addServerPassword',
			preRequirement: isAuthentication('password'),
			constraints: {
				required: [true, 'A password is required.']
			}
		},

		'privateKey': {
			el: '#addServerPrivateKey',
			preRequirement: isAuthentication('privateKey'),
			constraints: {
				required: [true, 'A private key is requred.'],
				privateKey: [true, 'this is an invalid private key.']
			}
		},

		'passphrase': {
			el: '#addServerPassphrase',
			preRequirement: function () {
				return isAuthentication('privateKey')() && self.passphraseRequired;
			},
			constraints: {
				message: 'Passphrase is required with this Private Key.',
				func: function (value) {
					return value !== '';
				}
			}
		},

		'maxUploadSpeed': {
			el: '#addServerBandwidthMaxUpload',
			preRequirement: isBandwidth,
			constraints: {
				number: [true, 'This is an invalid number.']
			}
		},

		'maxDownloadSpeed': {
			el: '#addServerBandwidthMaxDownload',
			preRequirement: isBandwidth,
			constraints: {
				number: [true, 'This is an invalid number.']
			}
		},

		'vnstatPath': {
			el: '#addServerBandwidthVnstatPath',
			preRequirement: isBandwidth,
			constraints: {
				linuxPath: [true, 'This is an invalid linux path.']
			}
		},

		'vnstatDB': {
			el: '#addServerBandwidthVnstatDB',
			preRequirement: isBandwidth,
			constraints: {
				linuxPath: [true, 'This is an invalid linux path.']
			}
		},

		'vnstatInterface': {
			el: '#addServerBandwidthInterface',
			preRequirement: isBandwidth,
			constraints: {
				wordOnly: [true, 'This is an invalid interface name.']
			}
		}
	}
}