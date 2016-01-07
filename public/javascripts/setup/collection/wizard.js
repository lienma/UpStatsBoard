define(['backbone', 'setup/model/wizard-step'], function (Backbone, ModelWizardStep) {

	return Backbone.Collection.extend({
		model: ModelWizardStep,

		_current: null,
		_isLoading: false,

		initialize: function () {

		},

		indexOf: function (id) {
			var indexOf = -1;
			this.forEach(function (model, index) {
				if(model.id == id) {
					indexOf = index;
				}
			});
			return indexOf;
		},

		openAt: function (location) {
			var loc = location.split('/');

			this.setCurrent(loc[0], (loc.length > 1) ? loc[1] : '');
		},

		nextStep: function () {
			var pos = this.indexOf(this._current.id);
			var nextModel = this.at(pos + 1);

			if(nextModel) {
				this.setCurrent(nextModel.id);
			}
		},

		previousStep: function () {
			var pos = this.indexOf(this._current.id);
			var previousModel = this.at(pos - 1);

			if(previousModel) {
				this.setCurrent(previousModel.id);
			}
		},

		setCurrent: function (id, subId) {
			if(this._isLoading) return;

			var self = this
			  , newCurrent = this.get(id)
			  , prevCurrent = this._current;

			subId = (subId) ? subId : '';

			function open() {
				newCurrent.pane.open(subId, function () { self.enableBtns(); self._current = newCurrent; });
			}

			this.disableBtns();
			if(prevCurrent) {
				prevCurrent.pane.close(open);
			} else {
				open(subId);
			}
		},

		setDefaults: function (defaults) {
			var self = this;
			_.each(defaults, function (fields, id) {

				var stepModel = self.get(id);
				if(stepModel) {
					stepModel.setDefaults(fields);
				}
			});
		},

		enableBtns: function () {
			this._isLoading = false;
			this.forEach(function (model) {
				model.pane._tab.enableBtn();
			});
		},

		disableBtns: function () {
			this._isLoading = true;
			this.forEach(function (model) {
				model.pane._tab.disableBtn();
			});
		},
	});
});
