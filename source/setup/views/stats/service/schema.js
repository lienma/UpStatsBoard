import _ from 'underscore';
export default function ServiceSchema(view) {
	return  {
		'label': {
			'el': '#addServiceLabel',
			'constraints': {
				'required': [true, 'A unique service name is required.'],
				'func': [(value) => (view.collection.where({ label: value }).length === 0 || view.isEditMode), 'The service name is already being used.'],
				'lessThan': [41, 'Max length of the name can only be 40 characters.']
			}
		},

		'host': {
			'el': '#addServiceHost',
			'constraints': {
				required: [true, 'A host address is required.']
			}
		},

		'port': {
			'el': '#addServicePortNumber',
			'constraints': {
				required: [true, 'A port number is required.'],
				portNumber: [true, 'The port number is invalid for the remote server.']
			}
		},

		'url': {
			'el': '#addServiceUrl'
		},

		'timeout': {
			'el': '#addServiceTimeout',
			'default': 30,
			'constraints': {
				'message': 'Invalid timeout number.',
				'integer': true,
				'greaterThan': -1
			}
		}
	};
}