import _               from 'underscore';
import Backbone        from 'backbone';
import DriveCollection from '../collections/drive';

const ErrorModel = Backbone.Model.extend({
	defaults: {
		msg: ''
	}
});

class ServerModel extends Backbone.Model {
	get defaults() {
		return {
			'label': '',
			'os': 'linux',
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
		}
	}

	initialize() {
		this.errors = new Backbone.Collection([], {
			model: ErrorModel
		});

		this.drives = new DriveCollection();


		this.drives.on('update', () => this.set('drives', this.drives.toJSON()) );
		this.drives.on('change', () => this.set('drives', this.drives.toJSON()) );
	}

	get hasErrors() {
		return this.errors.length > 0;
	}

	get hasBandwidth() {
		return this.get('monitorBandwidth');
	}

	get hasCpu() {
		return this.get('monitorCpu');
	}

	get hasDrives() {
		return this.drives.length > 0;
	}

	get hasMemory() {
		return this.get('monitorMemory');
	}

	get serverLogin() {
		return _.pick(this.attributes, 'os', 'remote', 'host', 'port', 'username', 'authentication', 'password', 'privateKey', 'passphrase');
	}
}

export default ServerModel;