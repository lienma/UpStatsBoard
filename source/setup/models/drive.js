import Backbone from 'backbone';
import DriveView from '../views/stats/server/drive';


class DriveModel extends Backbone.Model {
	get defaults() {
		return {
			label: '',
			location: '',
			totalSpace: 0,
			totalSpaceUnit: 0
		};
	}

	initialize() {

	}

	validate() {
		return this.View.validator.validate();
	}

	view(modalView) {
		this.View = new DriveView({ modal: modalView, model: this });
		this.View.render();
		return this.View.$el;
	}
}

export default DriveModel;