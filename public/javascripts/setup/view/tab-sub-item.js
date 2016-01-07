define([
	'backbone', 'bootstrap',

	'tmpl!setup/step-sub-tab-item'
], function (Backbone, bootstrap, TmplSubTabItem) {

	return Backbone.View.extend({
		tagName: 'li',

		_hasRendered: false,
		_tabIcon: '',
		apps: [],

		initialize: function (options) {
			this.model = options.model;
			this.basePane = options.basePane;
			this.parentPane = options.parentPane;

			this.listenTo(this.model.errors, 'update', this.updateTabForErrors);
		},

		setApps: function (apps) {
			var self = this;
			apps.forEach(function (app) {
				self.listenTo(app.model, 'change:enabled', self.updateTabAppIcon);
				self.listenTo(app.model.errors, 'update', self.updateTabForAppErrors);
			});

			this.apps = apps;
		},

		setIcon: function (icon) {
			this._tabIcon = icon;

			if(this._hasRendered) {
				this.$('.tab-app').addClass('icos-' + icon);
			}
		},

		removeIcon: function (icon) {
			this._tabIcon = '';

			if(this._hasRendered) {
				this.$('.tab-app').removeClass('icos-' + icon);
			}
		},

		hasErrors: function () {
			var hasErrors = false;

			if(this.apps.length > 0) {
				this.apps.forEach(function (app) {
					if(app.hasErrors()) {
						hasErrors = true;
					}
				});
			} else {
				hasErrors = this.model.hasErrors();
			}

			return hasErrors;
		},

		getErrors: function () {
			var errors = [];

			if(this.apps.length > 0) {
				this.apps.forEach(function (app) {
					app.model.errors.each(function (error) {
						errors.push(error.get('msg'))
					});
				});
			} else {
				this.model.errors.each(function (error) {
					errors.push(error.get('msg'))
				});
			}

			return errors;
		},

		hasTooltip: false,
		updateErrorsTooltip: function () {
			if(this.hasErrors()) {
				var msgs = ['<b>This app contains errors:</b><ul class="tooltip-errors-list">'];
				this.getErrors().forEach(function (msg) {
					msgs.push('<li>' + msg + '</li>');
				})
				msgs.push('</ul>');

				if(this.hasTooltip) {
					$(this.$el).attr('data-original-title', msgs.join(' '));
					$(this.$el).tooltip('fixTitle');
				} else {
					$(this.$el).tooltip({
						container: 'body',
						html: true,
						placement: 'bottom',
						title: msgs.join(' '),
						trigger: 'hover'
					});
				}

				this.hasTooltip = true;
			} else {
				this.hasTooltip = false;
				$(this.$el).tooltip('destroy');
			}
		},

		updateTabForErrors: function () {
			var hasErrors = this.hasErrors()
			  , link = this.$('a')
			  , icon = this.$('.tab-status');

			link.toggleClass('wizard-sub-tabs-error', hasErrors);
			icon.toggleClass('glyphicon-remove', hasErrors);

			link.toggleClass('wizard-sub-tabs-success', !hasErrors);
			icon.toggleClass('glyphicon-ok', !hasErrors);

			this.updateErrorsTooltip();
		},

		updateTabForAppErrors: function () {
			var hasErrors = this.hasErrors()
			  , isEnabled = this.model.body.isEnabled()
			  , link = this.$('a')
			  , icon = this.$('.tab-status');

			link.toggleClass('wizard-sub-tabs-error', hasErrors);
			icon.toggleClass('glyphicon-remove', hasErrors);

			link.toggleClass('wizard-sub-tabs-success', isEnabled && !hasErrors);
			icon.toggleClass('glyphicon-ok', isEnabled && !hasErrors);

			this.updateErrorsTooltip();
		},

		updateTabAppIcon: function (model) {
			var self = this;
			this.apps.forEach(function(app) {
				self.$('.tab-app').toggleClass('icos-' + model.id, model.isEnabled());
				
			});
			this.updateTabForErrors(model);
		},

		render: function () {
			var self = this;

			this._hasRendered = true;

			this.$el.prop('role', 'presentation');

			this.$el.html(TmplSubTabItem({
				location: Config.setup.webRoot + '/setup/' + this.basePane.id() + '/' + this.model.id,
				target: this.basePane.id() + '-' + this.model.id,
				title: this.model.get('title')
			}));

			this.$('a').on('show.bs.tab', function (e) {
				self.basePane._currentSubTab = self.model.id;
				self.basePane.wizard.Router.navigate(self.basePane.id() + '/' + self.model.id);
			});

			if(this._tabIcon != '') {
				this.$('.tab-app').addClass('icos-' + this._tabIcon);
			}

			return this;
		}
	});
});
