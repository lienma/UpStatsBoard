define(['backbone', 'setup/model/server'], function (Backbone, ModelServer) {

	return Backbone.Collection.extend({
		model: ModelServer,

		hasLocalhost: function () {
			var hasLocal = false;

			this.each(function (server) {
				if(server.get('remote') === false) hasLocal = true;
			});

			return hasLocal;
		}
	});
});