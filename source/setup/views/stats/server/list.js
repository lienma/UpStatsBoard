import Backbone       from 'backbone';
import ServerItemView from './list-item';
import TmplServerList from '../../../templates/list-server.jade';


class ServerListView extends Backbone.View {
	get template() { return TmplServerList; }

	initialize(options) {
		this.view = options.view;
		this.servers = options.servers;

		this.listenTo(this.servers, 'add', this.addServer);
		this.listenTo(this.servers, 'update', this.updateNoServersLabel);
	}

	addServer(model) {
		model.view = new ServerItemView({ model: model, view: this.view });
		model.view.render();
		this.$('table tbody').append(model.view.$el);
	}

	updateNoServersLabel() {
		let view = this.$('.no-servers-added');

		if(this.servers.length > 0) {
			view.css('display', 'none');
		} else {
			view.css('display', '');
		}
	}

	render() {
		this.$el.html(this.template());
	}
}

export default ServerListView;