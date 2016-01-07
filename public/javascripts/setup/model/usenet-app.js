define(['backbone'], function (Backbone) {
	var ErrorModel = Backbone.Model.extend({
		defaults: {
			msg: ''
		}
	});

	return Backbone.Model.extend({
		defaults: {
			enabled: false,
			selected: false,
			host: '',
			port: null,
			webRoot: '/',
			apiKey: '',
			useSSL: false,
		},

		constructor: function () {
			this.errors = new Backbone.Collection([], {
				model: ErrorModel
			}),
			Backbone.Model.apply(this, arguments);
		},

		isEnabled: function () {
			return this.get('enabled');
		},

		isSelected: function () {
			return this.get('selected');
		},

		hasErrors: function () {
			return this.errors.size() > 0;
		}
	});
});