define(['backbone', 'underscore'], function(Backbone, _) {
	var DataModel = Backbone.Model.extend();
	var ErrorModel = Backbone.Model.extend({
		defaults: {
			msg: ''
		}
	});

	return Backbone.Model.extend({
		defaults: {
			body:            null,
			containsSubTabs: false,
			current:         false,
			disabled:        false,
			title:           '',
			success:         false,
		},

		initialize: function () {
			var self = this;

			this.data = new DataModel();
			this.errors = new Backbone.Collection([], {
				model: ErrorModel
			});

			this.listenTo(this.errors, 'update', function () {
				if(self.hasErrors()) {
					self.set('success', false);
				}
			});
		},

		isCurrent: function () {
			return this.get('current')
		},

		isDisabled: function () {
			return this.get('disabled')
		},

		isSuccessful: function () {
			return this.get('success');
		},

		hasError: function (id) {
			var error = this.errors.get(id);
			return !_.isUndefined(error);
		},

		hasErrors: function () {
			return this.errors.size() > 0;
		},

		setDefaults: function (data) {
			this.pane._body.setDefaults(data);
		}
	});
});
