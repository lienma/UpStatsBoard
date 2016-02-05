import BaseTab      from '../base-tab';
import ServerView   from './server';
import ServiceView  from './service';
import WeatherView  from './weather';

export default BaseTab({
	templateVars: { title: 'Statistic Settings' },

	SubTabs: [
		{ id: 'server', title: 'Server Stats', view: ServerView },
		{ id: 'service', title: 'Service Monitors', view: ServiceView },
		{ id: 'weather', title: 'Weather', view: WeatherView }
	]
});
