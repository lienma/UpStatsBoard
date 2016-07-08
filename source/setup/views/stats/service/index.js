import SubTabView        from '../../base-sub-tab';
import TmplServicesView  from '../../../templates/view-stats-services.jade';
import ServiceCollection from '../../../collections/service';
import ServiceModel      from '../../../models/service';
import ServiceModalView  from './modal';
import ServiceRowView    from './row';

class ServicesView extends SubTabView {
	get template() { return TmplServicesView; }
	get events() { return {
		'click .btn-add-service': 'clickAddService'
	}; }

	initialize(options) {
		super.initialize(options);

		this.setUpData = [];
		this.collection = new ServiceCollection();

		this.setTabIcon('services');
		this.listenTo(this.collection, 'update', this.updateTable);
		this.listenTo(this.collection, 'add', this.addRowToTable);

		this.listenTo(this.collection, 'update', () => this.set('services', JSON.stringify(this.collection)) );
	}

	addService() {
		this.modal = new ServiceModalView({ collection: this.collection });
	}

	addRowToTable(model) {
		let view = new ServiceRowView({ model: model, view: this });
		model.view = view;
		this.$('.services-table tbody').append(view.render().$el);
	}

	clickAddService(e) {
		e.preventDefault();
		this.addService();
	}

	render() {
		super.render();

		this.setUpData.forEach((service) => {
			this.collection.add(new ServiceModel(service));
		});

		if(this.collection.length !== 0) {
			this.$('.no-services-monitoring').hide();
		}
	}

	setDefaults(data) {
		this.setUpData = data;
	}

	updateTable() {
		let row = this.$('.no-services-monitoring');
		this.validate();
		if(this.collection.length === 0) {
			row.show();
		} else {
			if(!row.is(':hidden')) {
				row.hide();
			}
		}
	}

	validate() {
		const isValid = this.collection.length !== 0;
		this.toggleError('services', 'Require at least one service to monitor.', !isValid);
		this.model.tab.updateTabClass(isValid);
		return isValid;
	}
}

export default ServicesView;