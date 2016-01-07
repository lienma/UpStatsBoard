define([
	'underscore',
	'setup/view/step-sub-base',
	'setup/view/step-usenet-app-selector'
], function (_, SubStepBase, ViewAppSelector) {
	function UsenetBase(baseOptions) {
		var Apps = baseOptions.apps;

		var ViewOptions = {

			initialize: function (options) {
				var self = this;
				this._currentApp = Apps[0];

				this.addApps(Apps);

				Apps.forEach(function (app) {
					app.parentPane = self;
					self.listenTo(app.model.errors, 'update', self.updateErrorsModel);
					self.listenTo(app.model, 'change:selected', self.updateCurrent);
				});

				if(this.hasMultipleApps()) {
					this.appSelector = new ViewAppSelector({ apps: Apps, parentPane: this, title: baseOptions.title });
				}
			},

			app: function () {
				return this.getApp(this._currentApp.id);
			},

			getApp: function (id) {
				var self = this, getApp = false;

				Apps.forEach(function (app) {
					if(!_.isBoolean(getApp)) return;

					if(id == app.id) {
						getApp = app;
					}
				});
				return getApp;
			},

			isEnabled: function () {
				var isEnabled = false;

				Apps.forEach(function (app) {
					if(app.isEnabled()) {
						isEnabled = true;
					}
				});

				return isEnabled;
			},

			hasMultipleApps: function () {
				return Apps.length > 1;
			},

			setDefaults: function (defaults) {
				Apps.forEach(function (app) {

					if(defaults.hasOwnProperty(app.id)) {
						app.setDefaults(defaults[app.id]);
					}
				});
			},

			updateCurrent: function (model) {
				if(model.isSelected()) {
					this._currentApp = this.getApp(model.id);
				} else {
					this.parentPane.resetTestConnectionBtn();
				}
			},

			updateErrorsModel: function () {
				var hasErrorApp = false;
				Apps.forEach(function (app) {
					if(app.hasErrors()) {
						hasErrorApp = app;
					}
				});

				if(_.isObject(hasErrorApp)) {
					this.parentPane.addError(this.model.id, hasErrorApp.title + ' app has error(s).');
				} else {
					this.parentPane.removeError(this.model.id);
				}
			},

			render: function () {
				var self = this;

				if(this.hasMultipleApps()) {
					this.appSelector.render();
					this.$el.append(this.appSelector.$el);
				}

				Apps.forEach(function (app) {
					app.render();

					if(self.hasMultipleApps()) {
						app.$el.css('display', 'none');
					}

					self.$el.append(app.$el);
				});

				return this;
			},

			renderDefaults: function () {
				Apps.forEach(function (app) {
					app.renderDefaults();
				});
			},

			validate: function () {
				return this.app().validate();
			}
		};

		_.extend(ViewOptions, baseOptions);
		return SubStepBase(ViewOptions);
	}

	return UsenetBase;
});