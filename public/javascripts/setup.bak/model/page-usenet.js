define(['backbone'], function(Backbone) {
	var ErrorModel = Backbone.Model.extend({
		defaults: {
			msg: ''
		}
	});

	return Backbone.Model.extend({
		defaults: {
			enabled: false,
			host: '',
			port: null,
			webRoot: '/',
			apiKey: '',
			useSSL: false,
		},

		constructor: function() {
			this.errors = new Backbone.Collection([], {
				model: ErrorModel
			}),
			Backbone.Model.apply(this, arguments);
		},

		isEnabled: function() {
			return this.get('enabled');
		},

		addError: function(id, msg) {
			this.errors.add({id: id, msg: msg});
		},

		removeError: function(id) {
			this.errors.remove(id);
		}
	});
});