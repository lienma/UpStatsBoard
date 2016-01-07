define(['backbone', 'setup/collection/wizard'], function(Backbone, WizardCollection) {

	return Backbone.Model.extend({
		defaults: {
			currentStep: 0
		},

		initialize: function() {
			this.steps = new WizardCollection();
		}
	});
});