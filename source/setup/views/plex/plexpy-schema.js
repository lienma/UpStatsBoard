
export default (self) => {
	return {
		'plexPyEnabled': {
			el: '.app-enable',
			default: false
		},

		'plexPyHost': {
			el: '.app-host',
			preRequirement: self.preRequired(),
			constraints: {
				required: [true, 'A host address is required.']
			}
		},

		'plexPyPort': {
			el: '.app-port',
			preRequirement: self.preRequired(),
			constraints: {
				message: 'Invalid port number.',
				required: [true, 'A port address is required.'],
				portNumber: true
			}
		},

		'plexPyWebRoot': {
			el: '.app-web-root'
		},

		'plexPyApiKey': {
			el: '.app-api-key',
			preRequirement: self.preRequired(),
			constraints: {
				message: 'A api key is required.',
				required: true
			}
		},

		'plexPyUseSSL': {
			el: '.app-use-ssl',
			default: false
		}
	}
};