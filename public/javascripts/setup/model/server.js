define(['backbone', 'setup/collection/drives'], function (Backbone, CollectionDrive) {
	var ErrorModel = Backbone.Model.extend({
		defaults: {
			msg: ''
		}
	});

	return Backbone.Model.extend({
		defaults: {
			'label': '',
			'remote': false,
			'host': '',
			'port': '',
			'username': '',
			'authentication': 'password',
			'password': '',
			'privateKey': '',
			'passphrase': '',
			'monitorCpu': true,
			'monitorMemory': true,
			'monitorBandwidth': true,
			'maxUploadSpeed': '',
			'maxUploadSpeedUnit': 0,
			'maxDownloadSpeed': '',
			'maxDownloadSpeedUnit': 0,
			'vnstatPath': '',
			'vnstatDB': '',
			'vnstatInterface': '',
			'drives': []
		},

		initialize: function () {
			var self = this;

			this.errors = new Backbone.Collection([], {
				model: ErrorModel
			});

			this.drives = new CollectionDrive();


			this.drives.on('update', function () {
				self.set('drives', self.drives.toJSON());
			});

			this.drives.on('change', function () {
				self.set('drives', self.drives.toJSON());
			});
		},

		hasErrors: function () {
			return this.errors.length > 0;
		},

		hasBandwidth: function () {
			return	this.get('monitorBandwidth');
		},

		hasCpu: function () {
			return this.get('monitorCpu');
		},

		hasDrives: function () {
			return this.drives.length > 0;
		},

		hasMemory: function () {
			return this.get('monitorMemory');
		},

		getServerLogin: function () {
			return _.pick(this.attributes, 'remote', 'host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase');
		}
	});
});
