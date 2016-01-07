define(['backbone', 'setup/view/step-stats-server-drive'], function (Backbone, View) {
	return Backbone.Model.extend({
		defaults: {
			label: '',
			location: '',
			totalSpace: 0,
			totalSpaceUnit: 0
		},

		initialize: function () {

		},

		validate: function () {
			return this.View.validator.validate();
		},

		view: function () {
			this.View = new View({ model: this });
			this.View.render();
			return this.View.$el;
		}
	});
});