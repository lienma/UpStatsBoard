define([
	'setup/view/step-sub-base',
	'tmpl!setup/step-stats-service',
	'setup/view/step-stats-service-add'
], function (SubStepBase, TmplViewBody, ModalServiceAdd) {
	return SubStepBase({
		template: TmplViewBody,

		events: {
			'click .btn-add-server': 'clickAdd'
		},

		initialize: function (options) {
			this.setTabIcon('services');

			//this.services = new CollectionServices();
		},

		clickAdd: function (e) {
			e.preventDefault();

			new ModalServiceAdd({ view: this });
		},

		render: function () {
			this.$el.html(this.template());

			new ModalServiceAdd({ view: this });
		}

	});
});