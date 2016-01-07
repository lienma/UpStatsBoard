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
