define(['backbone', 'setup/model/drive'], function (Backbone, ModelDrive) {

	return Backbone.Collection.extend({
		model: ModelDrive,

		validate: function () {
			var errorCount = 0;
			this.each(function (model) {
				errorCount += model.validate() ? 0 : 1;
			});

			return errorCount == 0;
		}
	});
});