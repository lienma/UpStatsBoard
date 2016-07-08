import _                from 'underscore';
import SubTabView       from '../../base-sub-tab';
import TmplServerView   from '../../../templates/view-stats-server.jade';
import ServerCollection from '../../../collections/server';
import ServerModalView  from './modal';
import ServerModel      from '../../../models/server';
import ServerListView   from './list';

class ServerView extends SubTabView {
	get template() { return TmplServerView; }
	get events() { return { 'click .btn-add-server': 'clickAddServer' }; }

	initialize(options) {
		super.initialize(options);

		this.setTabIcon('servers');

		this.setUpData = [];
		this.servers = new ServerCollection();

		this.viewServers = new ServerListView({ servers: this.servers, view: this });

		this.listenTo(this.servers, 'update', this.updateServersSuccess);

		this.listenTo(this.servers, 'update', () => this.set('servers', JSON.stringify(this.servers)) );
	}

	clickAddServer(e) {
		e.preventDefault();

		new ServerModalView({ view: this });
	}

	updateServersSuccess() {
		if(this.servers.length > 0) {
			this.removeError('servers');
		} else {
			this.addError('servers', 'Requires you to monitor CPU, Memory, and one drive.');
		}

		this.validate();
	}

	render() {
		this.viewServers.render();
		this.$el.html(this.template());

		this.$('.server-list-body').append(this.viewServers.$el);

		this.setUpData.forEach((server) => {
			var model = new ServerModel(_.omit(server, 'drives'));

			if(server.drives) {
				server.drives.forEach((drive) => {
					model.drives.add(drive);
				});
			}

			this.servers.add(model);
		});
	}

	setDefaults(data) {
		this.setUpData = data;
	}

	validate(validateOnly = false) {
		let hasCpu = false, hasMemory = false, hasDrives = false;

		this.servers.each((server) => {
			if(server.hasCpu) hasCpu = true;
			if(server.hasMemory) hasMemory = true
			if(server.hasDrives) hasDrives = true;
		});

		if(!validateOnly) {
			this.$('.servers-drives').toggleClass('has-no-cpu', !hasCpu);
			this.toggleError('cpu', 'Require at least one server to be monitoring CPU.', !hasCpu);

			this.$('.servers-drives').toggleClass('has-no-memory', !hasMemory);
			this.toggleError('memory', 'Require at least one server to be monitoring Memory.', !hasMemory);

			this.$('.servers-drives').toggleClass('has-no-drives', !hasDrives);
			this.toggleError('drives', 'Require at least one drive to be monitoring.', !hasDrives);
		}

		if(this.servers.length > 0) {
			this.model.tab.updateTabClass(hasDrives && hasMemory && hasCpu);
		}
		
		return hasDrives && hasMemory && hasCpu;
	}
}

export default ServerView;