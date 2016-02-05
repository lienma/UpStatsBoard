export default {
	'enabled': {
		el: '.app-enable',
		default: false
	},

	'host': {
		el: '.app-host',
		constraints: {
			required: [true, 'A host address is required.']
		}
	},

	'port': {
		el: '.app-port',
		constraints: {
			message: 'Invalid port number.',
			required: [true, 'A port address is required.'],
			portNumber: true
		}
	},

	'webRoot': {
		el: '.app-web-root'
	},

	'apiKey': {
		el: '.app-api-key',
		constraints: {
			message: 'A api key is required.',
			required: true
		}
	},

	'useSSL': {
		el: '.app-use-ssl',
		default: false
	}
};
