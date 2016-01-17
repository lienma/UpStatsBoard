import BaseTab         from '../base-tab';
import PlexTvView      from './plextv';
import MediaServerView from './media-server';
import PlexPyView      from './plexpy';

export default BaseTab({
	templateVars: { title: 'Plex Apps' },

	SubTabs: [
		{ id: 'plextv', title: 'Plex.tv Account', view: PlexTvView },
		{ id: 'media-server', title: 'Plex Media Server', view: MediaServerView },
		{ id: 'plexpy', title: 'PlexPy Settings', view: PlexPyView }
	]
});
