define(['backbone', 'tmpl!setup/stats-server-table', 'setup/view/step-stats-server-item'], function (Backbone, TmplTableBody, ViewServerItem) {
	return Backbone.View.extend({

		initialize: function (options) {
			this.view = options.view;
			this.servers = options.servers;

			this.listenTo(this.servers, 'add', this.addServer);
			this.listenTo(this.servers, 'update', this.updateNoServersLabel);
		},

		addServer: function (model) {
			model.view = new ViewServerItem({ model: model, view: this.view });
			model.view.render();
			this.$('table tbody').append(model.view.$el);
		},

		updateNoServersLabel: function () {
			var view = this.$('.no-servers-added');

			if(this.servers.length > 0) {
				view.css('display', 'none');
			} else {
				view.css('display', '');
			}
		},

		render: function () {
			this.$el.html(TmplTableBody());
		}
	});
});	