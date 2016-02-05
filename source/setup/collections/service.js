import Backbone from 'backbone';
import ServiceModel from '../models/service';

class ServiceCollection extends Backbone.Collection {
	get model() { return ServiceModel; }
}

export default ServiceCollection;