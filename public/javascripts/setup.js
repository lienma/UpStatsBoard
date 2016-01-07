define([
	'backbone',
	'setup/collection/wizard',
	'setup/view/pane-base',
	'setup/view/step-welcome',
	'setup/view/step-app-settings',
	'setup/view/step-usenet',
	'setup/view/step-plex',
	'setup/view/step-stats',
], function (
	Backbone,
	WizardCollection,
	PaneBase,
	WelcomeStepView,
	AppSettingsView,
	UsenetView,
	PlexView,
	StatsView
) {
	return Backbone.View.extend({
		el: '#SetupWizard',

		initialize: function () {
			//Backbone.history.start({pushState: true, root: Config.WebRoot + '/setup/'})

			var Router = Backbone.Router.extend({});

			this.Router = new Router();

			this.Wizard = new WizardCollection();
			this.Wizard.Router = this.Router;

			this.listenTo(this.Wizard, 'add', function (model) {
				model.pane = new PaneBase({ model: model, wizard: this });
			}, this);

			this.generateSteps();
			this.Wizard.setDefaults({}});

			this.renderAll();
			this.Wizard.openAt('stats/service');
		},

		generateSteps: function () {
			this.Wizard.add([
				{ id: 'welcome', title: 'Welcome', body: WelcomeStepView },
				{ id: 'app-settings', title: 'App Settings', body: AppSettingsView },
				{ id: 'usenet', title: 'Usenet Apps', body: UsenetView },
				{ id: 'plex', title: 'Plex Settings', body: PlexView },
				{ id: 'stats', title: 'Stats Settings', body: StatsView }
			]);
		},

		nextStep: function () {
			this.Wizard.nextStep();
		},

		previousStep: function () {
			this.Wizard.previousStep();
		},

		setCurrentTab: function (id) {
			this.Wizard.setCurrent(id);
		},

		renderAll: function () {
			var self = this;
			this.Wizard.each(function (model) {
				model.pane.build(self.$('.wizard-tabs'), self.$('.panel-body'));
			});
		}
	});
});