define([
	'backbone',
	'underscore',

	'setup/view/step-base',
	'tmpl!setup/step-usenet-extra-buttons',

	'setup/view/step-usenet-downloader',
	'setup/view/step-usenet-tvshow',
	'setup/view/step-usenet-movie',
	'setup/view/step-usenet-music',
	'setup/view/step-usenet-download-center'
], function (Backbone, _, StepBase, TmplExtraButtons, ViewDownloader, ViewTVShow, ViewMovie, ViewMusic, ViewDownloadCenter) {

	return StepBase({

		templateVars: {
			title: 'Supported Usenet Apps'
		},

		subTabsData: [
			{ id: 'downloader', title: 'Downloader App', view: ViewDownloader },
			{ id: 'tvshow', title: 'TV Show App', view: ViewTVShow },
			{ id: 'movie', title: 'Movie App', view: ViewMovie },
			{ id: 'music', title: 'Music App', view: ViewMusic },
			//{ id: 'download-center', title: 'Download Center', view: ViewDownloadCenter },
		],

		tmplExtraButtons: TmplExtraButtons,

		events: {
			'click .btn-app-test': 'clickTestConnection'
		},

		initialize: function () {
			var self = this;

			this.setCurrentSubTab('downloader');

			this.subTabs.each(function (tab) {
				if(!tab.body.apps) return;

				tab.body.apps.forEach(function (app) {
					self.listenTo(app.model, 'change:enabled', self.updateTestConnectionBtn);
					self.listenTo(app.model, 'change:selected', function (model) {
						if(model.isSelected()) {
							self.resetTestConnectionBtn();
						}
					});

					self.listenTo(app.model.errors, 'update', self.updateOnErrors);
				});
			});
		},

		hasApps: function () {
			return _.isFunction(this.currentTab().app);
		},

		updateOnErrors: function () {
			this.currentTab().model.errors.set(this.currentTab().app().model.errors.models);
		},

		clickTestConnection: function (e) {
			e.preventDefault();

			this.currentTab().app().clickTestConnection(this.$('.btn-app-test'), this.$('.btn-app-test-msg'));
		},

		updateTestConnectionBtn: function () {
			var isEnabled = (this.hasApps()) ? !this.currentTab().app().isEnabled() : false;
			this.$('.btn-app-test').prop('disabled', isEnabled);
		},

		setDefaults: function (data) {
			this.subTabs.each(function (tab) {
				tab.body.setDefaults(data);
			});
		},

		renderDefaults: function () {
			this.subTabs.each(function (tab) {
				tab.body.renderDefaults();
			});
		},

		resetNextStepBtn: function () {
			var app = this.currentTab();
			if(this.hasApps()) {
				app = app.app();
			}

			this.updateNextBtnForErrors(app.hasErrors());
		},

		resetTestConnectionBtn: function () {
			var tab = this.currentTab()
			  , btn = this.$('.btn-app-test')
			  , msg = this.$('.btn-app-test-msg')
			  , extras = this.$('.extra-buttons');

			btn.addClass('btn-info').removeClass('btn-danger btn-success');
			msg.removeClass('text-danger').text('');

			if(this.hasApps()) {
				var isVisible = extras.css('display') !== 'none';
				if(tab.hasMultipleApps()) {
					if(tab.app().isSelected()) {
						if(!isVisible) {
							extras.fadeIn();
						}
					} else {
						if(isVisible) {
							extras.fadeOut();
						}
					}
				} else {
					if(!isVisible) {
						extras.fadeIn();
					}
				}
			} else {
				if(isVisible) {
					extras.fadeOut();
				}
			}

			this.updateTestConnectionBtn();
		},

		render: function () {
			var self = this;
			this.subTabs.each(function (model) {
				model.tab.$('a').on('show.bs.tab', function (e) {
					self.resetNextStepBtn();
					self.resetTestConnectionBtn();
				});
			});
		}
	});
});
