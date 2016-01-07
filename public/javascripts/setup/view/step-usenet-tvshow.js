define([
	'setup/view/step-usenet-base',
	'setup/view/step-usenet-app'
], function (UsenetBase, UsenetAppView) {
	return UsenetBase({
		title: 'Please Select TV Show App To Use',
		apps: [
			UsenetAppView({
				id: 'sonarr',
				title: 'Sonarr',
				defaultPort: 8989,
				apiUiLocation: 'Settings > General'
			}),
			UsenetAppView({
				id: 'sickbeard',
				title: 'Sick Beard',
				defaultPort: 8081,
				apiUiLocation: 'Settings > General'
			})
		]
	})
});
