import BaseTab         from '../base-tab';
import ServerView      from './server';

export default BaseTab({
	templateVars: { title: 'Statistic Settings' },

	SubTabs: [
		{ id: 'server', title: 'Server Stats', view: ServerView }
	]
});
