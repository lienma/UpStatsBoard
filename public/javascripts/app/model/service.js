define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({
		defaults: {
			label: '',
			host: '',
			port: 0,
			url: '',
			requireLogin: false,
			warningTime: 0
		}
	});
});