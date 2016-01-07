define([
	'setup/view/step-base',
	'setup/view/step-stats-server',
	'setup/view/step-stats-service'
], function (StepBase, ViewServer, ViewService) {

	return StepBase({
		templateVars: {
			title: 'Statistic Settings'
		},

		subTabsData: [
			{ id: 'server', title: 'Server Stats', view: ViewServer },
			{ id: 'service', title: 'Service Monitors', view: ViewService }
		]
	});
});
