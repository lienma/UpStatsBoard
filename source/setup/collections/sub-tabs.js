import _        from 'underscore';
import Backbone from 'backbone';
import ModelTab from '../models/tab';

class CollectionSubTabs extends Backbone.Collection {
	get model() { return ModelTab }

	initialize() {
		this._current = null;
		this._isLoading = false;
	}


	activateCurrent(id) {
		let current = this.get(id);
		current.set('current', true);

		current.tab.$el.addClass('active');
		current.body.$el.addClass('in active');

		this._current = current;
	}

	setDefaults(defaults) {
		_.each(defaults, (fields, id) => {
			let model = this.get(id);
			if(model) {
				model.body.setDefaults(fields);
			}
		});
	}

	render() {
		this.each((model) => model.render());
	}

	renderDefaults() {
		this.each((model) => model.body.renderDefaults());
	}

	afterRender() {
		this.each((model) => {
			if(_.isFunction(model.body.afterRender)) {
				model.body.afterRender();
			}
		});
	}

	validate() {
		this.each((model) => model.body.validate());
	}
}

export default CollectionSubTabs;