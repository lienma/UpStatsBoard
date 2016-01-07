define([
	'setup/view/step-sub-base',
	'setup/model/usenet-app'
], function (SubStepBase, AppModel) {

	return SubStepBase({

		initialize: function (options) {

		},

		setDefaults: function () {

		},

		hasErrors: function () {
			return this.model.hasErrors();
		},

		render: function () {

			return this;
		}
	});
});