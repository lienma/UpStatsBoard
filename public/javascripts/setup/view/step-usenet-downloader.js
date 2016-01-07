define([
	'setup/view/step-usenet-base',
	'setup/view/step-usenet-app'
], function (UsenetBase, UsenetAppView) {

	return UsenetBase({
		apps: [UsenetAppView({
			id: 'sabnzbd',
			title: 'SABnzbd+',
			defaultPort: 8085,
			apiUiLocation: 'Settings > General'
		})]
	})
});
