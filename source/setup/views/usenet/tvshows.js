import Base from './base';

const Sonarr = {
	id: 'sonarr',
	title: 'Sonarr',
	defaultPort: 8989,
	apiUiLocation: 'Settings > General'
};

const SickBeard = {
	id: 'sickbeard',
	title: 'Sick Beard',
	defaultPort: 8081,
	apiUiLocation: 'Settings > General'
};

export default Base([Sonarr, SickBeard], 'Please Select TV Show App To Use');