import _           from 'underscore';
import Backbone    from 'backbone';
import ModelWizard from '../models/wizard'

class Collection extends Backbone.Collection {
	get model() { return ModelWizard; }

	initialize() {
		this._current = null;
		this._isLoading = false;
	}

	modelAt(id) {
		let indexOf = -1;
		this.forEach((model, index) => {
			if(model.id === id) {
				indexOf = index;
			}
		});
		return indexOf;
	}

	openAt(location) {
		let loc = location.split('/');

		this.setCurrent(loc[0], (loc.length > 1) ? loc[1] : '');
	}

	nextStep() {
		let pos = this.modelAt(this._current.id);
		let nextModel = this.at(pos + 1);

		if(nextModel) {
			this.setCurrent(nextModel.id);
		}
	}

	previousStep() {
		let pos = this.modelAt(this._current.id);
		let previousModel = this.at(pos - 1);

		if(previousModel) {
			this.setCurrent(previousModel.id);
		}
	}

	setCurrent(id, subId = '') {
		if(this._isLoading) return;

		let newCurrent = this.get(id);
		let prevCurrent = this._current;

		let open = () => {
			newCurrent.pane.open(subId, () => {
				this.enableBtns();
				this._current = newCurrent;
			});
		}

		this.disableBtns();
		if(prevCurrent) {
			prevCurrent.pane.close(open);
		} else {
			open();
		}
	}

	setDefaults(defaults) {
		_.each(defaults, (fields, id) => {
			let stepModel = this.get(id);
			if(stepModel) {
				stepModel.setDefaults(fields);
			}
		});
	}

	enableBtns() {
		this._isLoading = false;
		this.forEach((model) => {
			model.pane._tab.enableBtn();
		});
	}

	disableBtns() {
		this._isLoading = true;
		this.forEach((model) => {
			model.pane._tab.disableBtn();
		});
	}
}

export default Collection;
