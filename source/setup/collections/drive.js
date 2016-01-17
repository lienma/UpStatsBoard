import Backbone   from 'backbone';
import DriveModel from '../models/drive';

class DriveCollection extends Backbone.Collection {
	get model() { return DriveModel; }

	validate() {
		let errorCount = 0;
		this.each((model) => errorCount += model.validate() ? 0 : 1);
		return errorCount === 0;
	}
}

export default DriveCollection;