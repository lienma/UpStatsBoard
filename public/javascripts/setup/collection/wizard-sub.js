define(['backbone', 'setup/model/wizard-step'], function (Backbone, ModelWizardStep) {

	return Backbone.Collection.extend({
		model: ModelWizardStep,

		_current: null,
		_isLoading: false,

		activateCurrent: function (id) {
			var current = this.get(id);
			current.set('current', true);

			current.tab.$el.addClass('active');
			current.body.$el.addClass('in active');

			this._current = current;
		},

		setDefaults: function (defaults) {
			var self = this;
			_.each(defaults, function (fields, id) {

				var model = self.get(id);
				if(model) {
					model.body.setDefaults(fields);
				}
			});
		},

		render: function () {
			this.each(function (model) {
				model.tab.render();
				model.body.render();
			});
		},

		renderDefaults: function () {
			this.each(function (model) {
				model.body.renderDefaults()
			});
		},

		afterRender: function () {
			this.each(function (model) {
				if(_.isFunction(model.body.afterRender)) {
					model.body.afterRender();
				}
			});
		}
	});
});
