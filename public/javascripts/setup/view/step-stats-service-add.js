define([
	'backbone', 'bootstrap',
	'tmpl!setup/modal-add-service'
], function (Backbone, bootstrap, TmplModalBody) {

	return Backbone.View.extend({

		events: {

		},

		initialize: function (options) {
			this.isAddMode = true;
			this.view = options.view;


			this.setupListenEvents();
			this.render();
		},

		destoryModal: function () {

		},

		setupListenEvents: function () {
			this.listenTo(this.$el, 'hidden.bs.modal', this.destoryModal);
		},

		render: function () {
			this.$el.html(TmplModalBody({
				btnText: (this.isAddMode) ? 'Add Service' : 'Update Service'
			}))

			this.view.$el.append(this.$el);

			$(this.$('.modal')).modal({
				backdrop: 'static'
			});
		}
	});
});