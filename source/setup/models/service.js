import Backbone from 'backbone';

const ErrorModel = Backbone.Model.extend({
	defaults: {
		msg: ''
	}
});

class ServiceModel extends Backbone.Model {
	get defaults() {
		return {
			'label'         : '',
			'host'          : '',
			'port'          : 80,
			'url'           : '',
			'loginRequired' : true,
			'timeout'       : 30
		}
	}

	initialize() {
		this.errors = new Backbone.Collection([], {
			model: ErrorModel
		});
	}

	get hasErrors() {
		return this.errors.length > 0;
	}
}

export default ServiceModel;
