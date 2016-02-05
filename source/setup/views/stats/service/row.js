import Backbone          from 'backbone';
import ServiceRowTmpl    from '../../../templates/row-service-item.jade';
import ServiceModalView  from './modal';

class ServiceRowView extends Backbone.View {
	get tagName() { return 'tr'; }
	get template() { return ServiceRowTmpl; }

	get events() { return {
		'click .btn-delete-service': 'clickDelete',
		'click .btn-edit-service': 'clickEdit'
	}; }

	initialize(options) {
		this.view = options.view;

		this.listenTo(this.model, 'change', this.render);
	}

	clickDelete(e) {
		e.preventDefault();

		this.remove();
		this.model.collection.remove(this.model);
	}

	clickEdit(e) {
		e.preventDefault();

		new ServiceModalView({ model: this.model, collection: this.view.collection });
	}

	render() {
		this.$el.html(this.template({
			label: this.model.get('label'),
			address: this.model.get('host') + ':' + this.model.get('port'),
			url: this.model.get('url'),
			timeout: parseInt(this.model.get('timeout')) === 0 ? 'No' : this.model.get('timeout')
		}));

		if(this.model.get('loginRequired') && this.model.get('url') !== '') {
			this.$('.service-login-required').removeClass('hide');
		}

		this.$('.btn-tooltip').tooltip({ container: 'body' });

		return this;
	}
}

export default ServiceRowView;