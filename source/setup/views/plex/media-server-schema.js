
const schema = {
	'plexMediaServerHost': {
		constraints: {
			required: [true, 'The host address is required for the media server.']
		}
	},

	'plexMediaServerPortNumber': {
		default: 32400,
		constraints: {
			required: [true, 'The port number is required for the plex media server.'],
			portNumber: [true, 'Invalid port number for the plex media serer.']
		}
	},

	'plexMediaServerSSLEnable': {
		default: false
	},

	'plexDefaultMovie': {
		constraints: {
			required: [true, 'An id is required for the default movie library.'],
			integer: [true, 'Invalid id for default movie library.']
		}
	},

	'plexDefaultTVShow': {
		constraints: {
			required: [true, 'An id is required for the default tv show library.'],
			integer: [true, 'Invalid id for default movie library.']
		}
	},

	'plexDefaultMusic': {
		constraints: {
			integer: [true, 'Invalid id for default movie library.']
		}
	},

	'plexMediaServerUseBIF': {
		default: false
	}
};

 export default schema;