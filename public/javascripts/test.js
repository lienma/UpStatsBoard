require.config({
	baseUrl:                 Config.WebRoot + '/javascripts',
	urlArgs:                 Config.Seed,

	paths: {
		//'socket.io': '/socket.io/socket.io',

		'jquery':            'libs/jquery/jquery-2.1.4',
		'jquery-ui':         'libs/jquery-ui/jquery-ui-custom-1.11.4',
		'underscore':        'libs/underscore/underscore-1.8.3',
		'backbone':          'libs/backbone/backbone-1.2.3',
		'bootstrap':         'libs/bootstrap/bootstrap-3.3.5',
		'moment':            'libs/moment/moment-with-locales-2.10.6',
		'numeral':           'libs/numeral/numeral-1.5.3',

		'async':             'libs/require/async-0.1.2',
		'text':              'libs/require/text-2.0.14',
		'tmpl':              'libs/require/tpl-0.0.2',

		'skycons':           'libs/skycons/skycon',

		'jquery.flot':       'libs/jquery.flot/jquery.flot',
		'jquery.flot.time':  'libs/jquery.flot/jquery.flot.time',
		'jquery.livestamp':  'libs/jquery.livestamp-1.1.2',
		'jquery.tablednd':   'libs/jquery.tablednd-0.0.7'
	},

	shim: {
		'jquery-ui': {
			deps: ['jquery'],
		},

		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},

		'bootstrap':{
			deps: ['jquery']
		},

		'underscore': {
			exports: '_'
		},

		'skycons': {
			exports: 'Skycons'
		},

		'jquery.flot': {
			deps: ['jquery'],
			exports: '$.plot'
        },

		'jquery.flot.time': {
			deps: ['jquery.flot']
        },

		'jquery.livestamp': {
			deps: ['jquery'],
			exports: '$.plot'
        },

		'jquery.tablednd': {
			deps: ['jquery']
		}
	},

	tpl: {
		extension: '.tmpl',
		path: Config.WebRoot + '/partials/'
	}
});


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
	var defaultData = {
		'app-settings': {
			appBindAddress: Config.setup.host,
			appPortNumber: Config.setup.port,
			appWebRoot: Config.setup.webRoot,
			appAdminEmail: 'me@matthewlien.net',
			appAdminUsername: 'lienmatthew',
			appAdminPassword: 'password',
			appAdminPasswordConfirm: 'password'
		},

		'usenet': {
			'sabnzbd': {
				host: 'usenet.mattsplex.tv',
				port: 443,
				webRoot: '/sabnzbd',
				apiKey: 'aa',
				useSSL: true
			},
			'sonarr': {
				host: 'usenet.mattsplex.tv',
				port: 443,
				webRoot: '/nzbdrone',
				apiKey: 'aa',
				useSSL: true
			},
			'couchpotato': {
				host: 'usenet.mattsplex.tv',
				port: 443,
				webRoot: '/couchpotato',
				apiKey: 'aa',
				useSSL: true
			}
		},

		'plex': {
			'media-server': {
				plexTvUsername: 'lienmatthew',
				plexTvPassword: 'password',
				plexMediaServerHost: 'plex',
				plexMediaServerSSLEnable: true
			}
		},

		'stats': {
			'server': [{
					'label': 'GrizzlyBear',
					'remote': false,
					'drives': [{
						'label': 'Root',
						'location': '/'
					}]
			}]
		}
	};

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
			this.Wizard.setDefaults(defaultData);

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