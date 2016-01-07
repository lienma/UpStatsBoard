define([
	'setup/view/step-sub-base',
	'tmpl!setup/step-stats-server',
	'setup/collection/server',
	'setup/view/step-stats-server-list',
	'setup/view/step-stats-server-add',
	'setup/model/server'
], function (SubStepBase, TmplViewBody, CollectionServer, ViewServerList, ModalServerAdd, ModelServer) {
	return SubStepBase({
		setUpData: [],
		template: TmplViewBody,

		events: {
			'click .btn-add-server': 'clickAddServer'
		},

		initialize: function (options) {
			this.setTabIcon('servers');

			this.servers = new CollectionServer();

			this.viewServers = new ViewServerList({ servers: this.servers, view: this });

			this.listenTo(this.servers, 'update', this.updateServersSuccess);

		},

		clickAddServer: function (e) {
			e.preventDefault();

			new ModalServerAdd({ view: this });
		},

		updateServersSuccess: function () {
			if(this.servers.length > 0) {
				this.removeError('servers');
			} else {
				this.addError('servers', 'Requires you to monitor CPU, Memory, and one drive.');
			}

			this.validate();
		},

		render: function () {
			var self = this;

			this.viewServers.render();
			this.$el.html(this.template());

			this.$('.server-list-body').append(this.viewServers.$el);

			this.setUpData.forEach(function (server) {
				var model = new ModelServer(_.omit(server, 'drives'));

				if(server.drives) {
					server.drives.forEach(function (drive) {
						model.drives.add(drive);
					});
				}

				self.servers.add(model);
			});
		},

		setDefaults: function (data) {
			this.setUpData = data;
		},

		validate: function () {
			var hasCpu = false, hasMemory = false, hasDrives = false;

			this.servers.each(function (server) {
				if(server.hasCpu()) hasCpu = true;
				if(server.hasMemory()) hasMemory = true
				if(server.hasDrives()) hasDrives = true;
			});

			this.$('.servers-drives').toggleClass('has-no-cpu', !hasCpu);
			this.toggleError('cpu', 'Require at least one server to be monitoring CPU.', !hasCpu);

			this.$('.servers-drives').toggleClass('has-no-memory', !hasMemory);
			this.toggleError('memory', 'Require at least one server to be monitoring Memory.', !hasMemory);

			this.$('.servers-drives').toggleClass('has-no-drives', !hasDrives);
			this.toggleError('drives', 'Require at least one drive to be monitoring.', !hasDrives);

			return hasDrives && hasMemory && hasCpu;
		}
	});
});
