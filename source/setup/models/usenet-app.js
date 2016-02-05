import Backbone from 'backbone';

class ErrorModel extends Backbone.Model {
	get defaults() { return {
		msg: ''
	}; }
}

class AppModel extends Backbone.Model {
	get defaults() { return {
		enabled: false,
		selected: false,
		host: '',
		port: null,
		webRoot: '',
		apiKey: '',
		useSSL: false
	}; }

	constructor(options) {
		super(options);

		this.errors = new Backbone.Collection([], {
			model: ErrorModel
		})
	}

	get isEnabled() { return this.get('enabled'); }
	get isSelected() { return this.get('selected'); }
	get hasErrors() { return this.errors.size() > 0; }
}

export default AppModel;
