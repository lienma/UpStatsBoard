import Backbone from 'backbone';
import ServerModel    from '../models/server';

class ServerCollection extends Backbone.Collection {
	get Model() { return ServerModel; }

	get hasLocalhost() {
		let hasLocal = false;
		this.each((server) => {
			if(server.get('remote') === false)
				hasLocal = true;
		});
		return hasLocal;
	}
}

export default ServerCollection;