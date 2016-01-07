define([
	'backbone',
	'setup/view/step-usenet-app-selector-item',
	'tmpl!setup/step-usenet-app-select'
], function (Backbone, ViewSelectItem, TmplAppSelect) {

	return Backbone.View.extend({

		_currentApp: false,

		initialize: function (options) {
			var self = this;

			this.apps = options.apps;
			this.parentPane = options.parentPane;
			this.title = options.title;

			this.apps.forEach(function (app) {

				self[app.id] = new ViewSelectItem({
					parentPane: self,
					id: app.id,
					location: [Config.setup.webRoot, 'step', self.parentPane.basePane.id(), self.parentPane.model.id, app.id].join('/'),
					title: app.title
				});
				self[app.id].app = app;
			});
		},

		selectApp: function (id) {
			var self = this, app = this[id];

			if(this._currentApp == app) {
				app.app.close(function () {
					app.toggleClass(false);
					self._currentApp = false;
				});
			} else {
				if(this._currentApp) {
					this._currentApp.app.close(function () {
						self._currentApp.toggleClass(false);

						app.toggleClass(true);
						self._currentApp = self[id];
						app.app.open();
					});
				} else {
					app.toggleClass(true);
					this._currentApp = this[id];
					app.app.open();
				}
			}
		},

		render: function () {
			var self = this;

			this.$el.html(TmplAppSelect({
				title: this.title
			}));

			this.apps.forEach(function (app) {
				self[app.id].render();
				self.$('.wizard-select-services').append(self[app.id].$el);
			});

			return this;
		}
	});
});