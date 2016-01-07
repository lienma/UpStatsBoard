define(['backbone', 'setup/view/page-base', 'setup/view/page/weather'], function(Backbone, ViewPageBase, ViewWeather) {

	return function(wizard) {
		return ViewPageBase(wizard, {
			id: 'stats',
			page: '#setupStats',
			title: 'Stats Settings',

			hasSubTabs: true,

			events: {
				'click .wizard-sub-tabs a': 'clickTab',
			},

			initialize: function() {
				this.weather = new ViewWeather({ el: this.$('#statsWeather') });

			},

			clickTab: function(e) {
				e.preventDefault();
				$(this).tab('show');
			},
		});
	};
});
