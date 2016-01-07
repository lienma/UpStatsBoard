define(['backbone'], function(Backbone) {
	var ErrorModel = Backbone.Model.extend({
		defaults: {
			msg: ''
		}
	});

	return Backbone.Model.extend({
		defaults: {
			selector: '',
			title: '',
			page: '',

			hasOpened: false,

			current: false,
			error: false,
			success: false,
			warning: false
		},

		constructor: function() {
			this.errors = new Backbone.Collection([], {
				model: ErrorModel
			}),
			Backbone.Model.apply(this, arguments);

			this.listenTo(this.errors, 'update', function() {
				this.set('success', !this.hasErrors());
			}.bind(this));
		},

		page: function() {
			return $(this.get('page'));
		},

		isCurrent: function() {
			return this.get('current');
		},

		isSuccess: function() {
			return this.get('success');
		},

		setCurrent: function() {
			this.set('current', !this.get('current'));
		},

		hasError: function(id) {
			var error = this.errors.get(id);
			return !_.isUndefined(error);
		},

		hasErrors: function() {
			return this.errors.size() > 0;
		}
	});
});