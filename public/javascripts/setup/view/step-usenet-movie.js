define([
	'setup/view/step-usenet-base',
	'setup/view/step-usenet-app'
], function (UsenetBase, UsenetAppView) {

	return UsenetBase({
		apps: [UsenetAppView({
			id: 'couchpotato',
			title: 'CouchPotato',
			defaultPort: 5050,
			apiUiLocation: 'settings page'
		})]
	})
});
