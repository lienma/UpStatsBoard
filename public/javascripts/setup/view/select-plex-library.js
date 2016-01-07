define([
	'backbone',
	'bootstrap',
	'tmpl!setup/modal-select-plex-library',
	'tmpl!loading',
	'tmpl!setup/plex-library-list',
	'tmpl!setup/plex-library-item'
], function (Backbone, bootstrap, TmplSelectLibraryModal, TmplLoading, TmplPlexLibraryList, TmplPlexLibraryItem) {

	var ViewLibraryItem = Backbone.View.extend({
		tagName: 'li',

		events: {
			'click .modal-plex-library-select': 'clickSelect',
			'click .modal-plex-library-container': 'clickSelect'
		},

		initialize: function(options) {
			this.view = options.view;

			this.$el.html(TmplPlexLibraryItem(this.model.attributes));
		},

		clickSelect: function(e) {
			e.preventDefault();

			this.view.selectLibray(this.model.get('id'));
		}
	});

	return Backbone.View.extend({

		initialize: function (options) {
			this.view = options.view;

			this.libraries = new Backbone.Collection();
		},

		render: function () {
			this.$el.html(TmplSelectLibraryModal());

			this.modal = this.$('.modal');
			this.body = this.$('.modal-body');
		},

		open: function (type) {
			var self = this;

			this.body.html(TmplLoading());
			this.modal.modal('show');

			if(this.libraries.length == 0) {
				var postData = {
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
				}).done(function (data) {
					self.libraries.add(data.libraries);
					self.showLibraries(type);
				});
			} else {
				this.showLibraries(type);
			}
		},

		showLibraries: function (type) {
			var self = this;
			var libraries = this.libraries.where({ type: type });
			this.body.html(TmplPlexLibraryList());

			libraries.forEach(function (library) {
				var view = new ViewLibraryItem({ model: library, view: self });

				self.$('.modal-plex-libraries-list').append(view.$el);
			});
		},

		selectLibray: function (id) {
			this.modal.modal('hide');

			this.view.selectPlexLibrary(id);
		}
	});
});