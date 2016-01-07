define(['backbone', 'setup/view/page-base'], function(Backbone, ViewPageBase) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'Overview',
			page: '#setupOverview',
			title: 'Overview'
		});
	};
});
