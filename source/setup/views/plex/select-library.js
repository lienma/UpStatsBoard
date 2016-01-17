import Backbone    from 'backbone';
import TmplModal   from '../../templates/modal-select-plex-library.jade';
import TmplList    from '../../templates/view-plex-library-list.jade';
import TmplLoading from '../../templates/view-loading.jade';
import TmplRow     from '../../templates/view-plex-library-item.jade';

class SelectLibraryItemView extends Backbone.View {
	get tagName() { return 'li'; }
	get events() {
		return {
			'click .modal-plex-library-select': 'clickSelect',
			'click .modal-plex-library-container': 'clickSelect'
		}
	}

	initialize(options) {
		this.view = options.view;
		this.$el.html(TmplRow(this.model.attributes));
	}

	clickSelect(e) {
		e.preventDefault();
		this.view.selectLibray(this.model.get('id'));
	}
}

class SelectLibraryView extends Backbone.View {
	initialize(options) {
		this.view = options.view;
		this.libraries = new Backbone.Collection();
	}

	open(type) {
		this.body.html(TmplLoading());
		this.modal.modal('show');

		let postData = {
			username: this.view.get('plexTvUsername'),
			password: this.view.get('plexTvPassword'),
			token: this.view.get('plexToken'),
			host: this.view.get('plexMediaServerHost'),
			port: this.view.get('plexMediaServerPortNumber'),
			useSSL: this.view.get('plexMediaServerSSLEnable')
		};

		$.ajax({
			url: Config.WebRoot + '/setup/plex/libraries',
			method: 'POST',
			data: postData
		}).done((data) => {
			let libraries = new Backbone.Collection();
			libraries.add(data.libraries);
			this.showLibraries(type, libraries.where({ type: type }));
		});
	}

	showLibraries(type, libraries) {
		this.body.html(TmplList());

		libraries.forEach((library) => {
			var view = new SelectLibraryItemView({ model: library, view: this });
			this.$('.modal-plex-libraries-list').append(view.$el);
		});
	}

	selectLibray(id) {
		this.modal.modal('hide');
		this.view.selectPlexLibrary(id);
	}

	render() {
		this.$el.html(TmplModal());

		this.modal = this.$('.modal');
		this.body = this.$('.modal-body');
	}

	renderTo(el) {
		this.render();
		el.append(this.$el);
	}
}

export default SelectLibraryView;
