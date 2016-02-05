import SubTabView      from '../../base-sub-tab';
import TmplWeatherView from '../../../templates/view-stats-weather.jade';
import Notify          from '../../../utils/notify';

const DataSchema = {
	'forecastApiKey': {
		constraints: {
			required: [true, 'The Api Key is required.']
		}
	},

	'forecastLatitude': {
		constraints: {
			required: [true, 'A latitude is required.'],
			number: [true, 'Invalid latitude number was presented.'],
			minMax: [[-180, 180], 'Invalid latitude number was presented.']
		}
	},

	'forecastLongitude': {
		constraints: {
			required: [true, 'A longitude is required.'],
			number: [true, 'Invalid longitude number was presented.'],
			minMax: [[-180, 180], 'Invalid longitude number was presented.']
		}
	},

	'forecastDegree':{
		default: 'f'
	}
}

class WeatherView extends SubTabView {
	get template() { return TmplWeatherView; }
	get events() { return {
		'click .btn-get-location': 'clickGetLocation',
		'click .btn-switch'      : 'clickSwitch'
	} }

	initialize(options) {
		super.initialize(options);

		this.setTabIcon('weather');
		this.setDataSchema(DataSchema);
	}

	clickGetLocation(e) {
		e.preventDefault();

		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this.updateCurrentLocation.bind(this), this.errorCurrentLoction);
		} else {
			Notify.failed('Geolocation is not supported by this browser.');
		}
	}

	errorCurrentLoction(error) {
		let message = 'An unknown error occurred.';
		switch(error.code) {
			case error.PERMISSION_DENIED:
				message = 'User denied the request for Geolocation.';
				break;
			case error.POSITION_UNAVAILABLE:
				message = 'Location information is unavailable.';
				break;
			case error.TIMEOUT:
				message = 'The request to get user location timed out.';
				break;
		}
		Notify.failed(message);
	}

	updateCurrentLocation(position) {
		this.$('#forecastLatitude').val(position.coords.latitude);
		this.set('forecastLatitude', position.coords.latitude);

		this.$('#forecastLongitude').val(position.coords.longitude);
		this.set('forecastLongitude', position.coords.longitude);

		this.validator.validate(['forecastLatitude', 'forecastLongitude']);
	}

	clickSwitch(e) {
		e.preventDefault();

		let target = $(e.target)
		  , model = target.data('model')
		  , value = target.data('value');

		target.blur();

		this.setSwitchBtn(model, value)
		this.set(model, value);
	}

	setSwitchBtn(model, value) {
		this.$('button[data-model="' + model +'"].btn-switch').each(function () {
			if($(this).data('value') === value) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});
	}

	render() {
		super.render();

		this.setSwitchBtn('forecastDegree', this.get('forecastDegree'));
	}
}

export default WeatherView;