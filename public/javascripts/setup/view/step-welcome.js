define([
	'backbone',

	'setup/view/step-base',

	'tmpl!setup/step-welcome'
], function (Backbone, StepBase, TmplWelcome) {

	return StepBase({
		template: TmplWelcome,

		events: {
			'click .btn-accept-next': 'clickAction'
		},

		clickAction: function (e) {
			e.preventDefault();
			this.pane.set('success', true);
			this.removeError('declinedTOS');
			this.nextStep();
		},

		validate: function () {
			if(!this.isSuccessful()) {
				this.addError('declinedTOS', 'You must accept the terms of service.');
				return false;
			}
			return true;
		}
	});
});
