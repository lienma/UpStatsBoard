import $       from 'jquery';
import AppView from './views/app';

window.$ = window.jQuery = $;

$(() => {
    let app = new AppView();

    app.setData({
    	'settings': {
            'appBindAddress': '127.0.0.1',
            'appPortNumber': 18024,
    		'appRequireLogin': false,

    		'appAdminEmail': 'no-reply@upsboard.xyz',
    		'appAdminUsername': 'lienmatthew',
    		'appAdminPassword': 'password',
    		'appAdminPasswordConfirm': 'password'
    	},
    	'usenet': {
    		'sabnzbd': {
    			'enabled': true,
    			'host': 'usenet.server',
    			'port': 10001,
    			'apiKey': 'aa-sabnzbd',
    			'useSSL': true,
                'webRoot': '/sabnzbd'
    		},

    		'sonarr': {
    			'enabled': true,
    			'host': 'usenet.server',
    			'port': 10002,
    			'apiKey': 'aa-sonarr',
    			'useSSL': true,
                'webRoot': '/sonarr'
    		},

            'couchpotato': {
                'enabled': true,
                'host': 'usenet.server',
                'port': 10003,
                'apiKey': 'aa-couchpotato',
                'useSSL': true,
                'webRoot': '/couchpotato'
            },
            'headphones': {
                'enabled': true,
                'host': 'usenet.server',
                'port': 10004,
                'apiKey': 'aa-headphones',
                'useSSL': true,
                'webRoot': '/headphones'
            },
    	},
    	'plex': {
    		'plextv': {
    			'plexTvUsername': 'lienmatthew',
    			'plexTvPassword': 'password'
    		},
    		'media-server': {
    			'plexMediaServerHost': 'plex',
    			'plexMediaServerSSLEnable': true,
    			'plexDefaultMovie': 7,
    			'plexDefaultTVShow': 6
    		},
			'plexpy': {
				'plexPyEnabled': true,
				'plexPyHost': 'plex',
				'plexPyPort': 8181,
				'plexPyWebRoot': '/watch',
				'plexPyApiKey': 'aa',
				'plexPyUseSSL': true
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
			}],
			'service': [{
				'label': 'Plex',
				'host': 'plex',
				'port': 32400,
				'url': 'https://mattsplex.tv/'
			}],
			'weather': {
				'forecastApiKey': 'aa',
				'forecastLatitude': '40.392422100000005',
				'forecastLongitude': '-105.0721463',
				'forecastDegree': 'f'
			}
		}
    });

    app.render();
    app.open('settings');
});
