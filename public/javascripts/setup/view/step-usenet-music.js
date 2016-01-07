define([
	'setup/view/step-usenet-base',
	'setup/view/step-usenet-app'
], function (UsenetBase, UsenetAppView) {

	return UsenetBase({
		apps: [UsenetAppView({
			id: 'headphones',
			title: 'Headphones',
			defaultPort: 8181,
			apiUiLocation: 'settings page'
		})]
	})
});
