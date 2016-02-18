const dataSchema = {
	'appBindAddress': {
		default: '127.0.0.1',
		constraints: {
			message: 'Invalid bind address. IPv4 Address Only.',
			required: [true, 'The bind address is required.'],
			ipv4: true,
			maxSize: [16, 'bad']
		}
	},

	'appPortNumber': {
		default: 8024,
		constraints: {
			message: 'The port number is not valid. Max port number is 65535.',
			required: [true, 'The port number is required.'],
			integer: true,
			greaterThan: 0,
			lessThan: 65536,

			warning: {
				lessThan: 1025,
				greaterThan: 0
			}
		}
	},

	'appWebRoot': {
		default: '/'
	},

	'appLogHttpRequests': {
		default: true
	},

	'appCheckForUpdates': {
		default: true
	},

	'appAutoUpdate': {
		default: true
	},

	'appRequireLogin': {
		default: true
	},

	'appAdminEmail': {
		constraints: {
			message: 'You have entered an invalid email address.',
			required: [true, 'An email address is required.'],
			email: true
		}
	},

	'appAdminUsername': {
		constraints: {
			message: 'You have entered an invalid username',
			required: [true, 'A username is required.'],
			greaterThan: 2,
			lessThan: 26,
			notContain: ' '
		}
	},

	'appAdminPassword': {
		constraints: {
			message: 'You have entered a password that is too short.',
			required: [true, 'A password is required.'],
			greaterThan: 5
		}
	},

	'appAdminPasswordConfirm': {
		constraints: {
			message: 'The confrimation password must match the password.',
			equalsEl: '#appAdminPassword'
		}
	}
};

export default dataSchema;