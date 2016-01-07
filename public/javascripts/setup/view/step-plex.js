define([
	'setup/view/step-base',
	'setup/view/step-plex-media-server',
	'setup/view/step-plex-monitor'
], function (StepBase, ViewMediaServer, ViewMonitor) {

	return StepBase({
		templateVars: {
			title: 'Plex Apps'
		},

		subTabsData: [
			{ id: 'media-server', title: 'Plex Media Server', view: ViewMediaServer },
			{ id: 'monitor', title: 'Plex User Monitor', view: ViewMonitor }
		]
	});
});