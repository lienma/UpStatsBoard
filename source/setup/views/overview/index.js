import _            from 'underscore';
import BaseTab      from '../base-tab';
import OverviewTmpl from '../../templates/view-overview.jade';
import ViewPassword from './password';

export default BaseTab({
	template: OverviewTmpl,
	passwordFields: {},

	usenetApps: ['sabnzbd', 'sonarr', 'sickbeard', 'couchpotato', 'headphones'],

	initialize() {
		this.usenetApps.forEach((key) => {
			this.listenTo(this.AppData, `change:usenet.${key}.enabled`, this._updateUsenetApp(key));
		});
	},

	_buildPasswordField: function (field) {
		const view = new ViewPassword({ field: field, AppData: this.AppData });

		this.passwordFields[field] = view;

		view.render();
		return view.$el;
	},

	_buildEnabledField: function (value) {
		//const icon = $('<i />').addClass('glyphicon ' + (value ? 'glyphicon-ok' : 'glyphicon-remove'))
		const text = $('<i />').text(value ? 'Enabled' : 'Disabled').addClass('small');
		return $('<span />').append(text);
	},

	_buildFieldValue: function (app) {
		let get = (key) => {
			return this.AppData.get(key);
		};

		let protocol, host, port, webRoot;

		switch(app) {
			case 'couchpotato':
			case 'headphones':
			case 'sabnzbd':
			case 'sickbeard':
			case 'sonarr':
				const usenet = `usenet.${app}`;
				protocol = get(`${usenet}.useSSL`) ? 'https' : 'http';
				host = get(`${usenet}.host`);
				port = get(`${usenet}.port`) === 80 ? '' : ':' + get(`${usenet}.port`);
				webRoot = get(`${usenet}.webRoot`) === '' ? '/' : get(`${usenet}.webRoot`);
				return `${protocol}://${host}${port}${webRoot}`;

			case 'plexpy':
				protocol = get('plexPyUseSSL') ? 'https' : 'http';
				host = get(`plexPyHost`);
				port = get(`plexPyPort`) === 80 ? '' : ':' + get(`plexPyPort`);
				webRoot = get(`plexPyWebRoot`) === '' ? '/' : get(`plexPyWebRoot`);
				return `${protocol}://${host}${port}${webRoot}`;
		}
	},

	_buildLinkField: function (text, link) {
		return $('<a />').attr('href', link).text(text).click(() => {
			const win = window.open(link, '_blank');
			win.focus()
		});
	},

	_updateUsenetApp: function (key) {
		return () => {
			this.$(`.overview-usenet-${key}`).toggleClass('hide', !this.AppData.get(`usenet.${key}.enabled`));
		}
	},

	_updateField: function (element, field) {
		return () => {
console.log(this.AppData);
			let value = this.AppData.get(field);
//console.log('field', field, value)

			if(field === 'func') {
				value = this._buildFieldValue(element.data('app'));
			}

			if(value === '' && element.data('empty') !== '') {
				value = element.data('empty');
			}

			switch(element.data('type')) {
				case 'apiKey':
				case 'email':
				case 'number':
					element.html('<i>' + value + '</i>');
					break;
				case 'text':
					element.text(value);
					break;
				case 'enabled':
					element.html(this._buildEnabledField(value));
					break;
				case 'password':
					this.passwordFields[field].update();
					break;
				case 'link':
					element.html(this._buildLinkField(value, value));
					break;
				case 'degree':
					if(value === 'f') {
						value = 'Fahrenheit (&#x2109;)';
					} else {
						value = 'Celsius (&#x2103;)';
					}
					element.html(value);
			}
		}
	},

	render: function () {
		const self = this;

		this.$el.html(this.template());

		const dataFields = this.$('[data-field]');
		dataFields.each(function () {
			const element = $(this);
			const field = element.data('field');
			let value = self.AppData.get(field);
			let type = element.data('type');

			self.listenTo(self.AppData, 'change:' + field, self._updateField(element, field));

			if(type === 'password') {
				element.html(self._buildPasswordField(field));
			}

			self._updateField(element, field)();
		});

		this.usenetApps.forEach((key) => {
			this._updateUsenetApp(key)();
		});
	}
});