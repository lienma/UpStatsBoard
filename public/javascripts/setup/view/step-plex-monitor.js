define([
	'setup/view/step-sub-base',
	'tmpl!setup/step-plex-monitor'
], function (SubStepBase, TmplViewBody) {
	return SubStepBase({
		initialize: function (options) {
			this.template = TmplViewBody;

			this.setTabIcon('plex-monitor');
		}
	});
});