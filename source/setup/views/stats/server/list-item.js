import Backbone        from 'backbone';
import TmplServerItem  from '../../../templates/row-server-item.jade';
import ServerModalView from './modal';

class ServerItemView extends Backbone.View {
	get tagName() { return 'tr'; }
	get template() { return TmplServerItem; }
	get events() {
		return {
			'click .btn-edit-server': 'clickEdit',
			'click .btn-delete-server': 'clickDelete'
		}
	}

	initialize(options) {
		this.view = options.view;

		this.listenTo(this.model, 'change', this.render);
	}

	clickEdit(e) {
		e.preventDefault();

		new ServerModalView({ view: this.view, oldModel: this.model });
	}

	clickDelete(e) {
		e.preventDefault();
		this.model.collection.remove(this.model);
		this.$('.btn-tooltip, .server-bandwidth-download, .server-bandwidth-upload').tooltip('destroy');
		this.remove();
	}

	render() {

		this.$el.html(this.template({
			label: this.model.get('label'),
			location: this.model.get('remote') ? this.model.get('host') + ':' + this.model.get('port') : 'localhost',
			remote: this.model.get('remote') ? 'Yes' : 'No',
			monitorCpu: this.model.get('monitorCpu') ? 'Yes' : 'No',
			monitorMemory: this.model.get('monitorMemory') ? 'Yes' : 'No',
			monitorBandwidth: this.model.get('monitorBandwidth') ? 'Yes' : 'No',
			drives: this.model.get('drives').length > 0 ? 'Yes' : 'No'
		}));

		let formatSpeed = (key) => {
			let speed = this.model.get(key);

			switch(this.model.get(key + 'Unit')) {
				case 0:
					return speed + ' KBit/s';
				case 1:
					return speed + ' MBit/s';
				case 2:
					return speed + ' GBit/s';
			}
		}

		if(this.model.get('maxUploadSpeed') !== '') {
			this.$('.server-bandwidth-upload').css('display', '').tooltip({
				title: 'Max Upload Speed: ' + formatSpeed('maxUploadSpeed')
			});
		}

		if(this.model.get('maxDownloadSpeed') !== '') {
			this.$('.server-bandwidth-download').css('display', '').tooltip({
				title: 'Max Download Speed: ' + formatSpeed('maxDownloadSpeed')
			});
		}

		this.$('.btn-tooltip').tooltip({ container: 'body' });
	}
}

export default ServerItemView;