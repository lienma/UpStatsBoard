define(['backbone', 'tmpl!loading', 'tmpl!setup/plex-library-list', 'tmpl!setup/plex-library-item', 'bootstrap'], function(Backbone, TmplLoading, TmplPlexLibraryList, TmplPlexLibraryItem) {

	var ViewLibraryItem = Backbone.View.extend({
		tagName: 'li',

		events: {
			'click .modal-plex-library-select': 'clickSelect',
			'click .modal-plex-library-container': 'clickSelect'
		},

		initialize: function(options) {
			this.View = options.View;

			this.$el.html(TmplPlexLibraryItem(this.model.attributes));
		},

		clickSelect: function(e) {
			e.preventDefault();

			this.View.selectLibray(this.model.get('id'));
		}
	});

	return Backbone.View.extend({
		el: '#plexModalSelectLibrary',

		initialize: function(options) {
			this.View = options.View;

			this.body = this.$el.find('.modal-body');


			this.libraries = new Backbone.Collection();

		},

		open: function(type, field) {
			this.body.html(TmplLoading());
			$(this.$el).modal('show');

			this.selectField = field;

			var postData = this.View.getAjaxData();

			if(this.libraries.length == 0) {
				$.ajax({
					url: Config.WebRoot + '/setup/plex/libraries',
					method: 'POST',
					data: postData
				}).done(function(data) {
					this.libraries.add(data.libraries);
					this.showLibraries(type);
				}.bind(this));
			} else {
				this.showLibraries(type);
			}
		},

		showLibraries: function(type) {
			var libraries = this.libraries.where({ type: type });
			this.body.html(TmplPlexLibraryList());

			libraries.forEach(function(library) {
				var view = new ViewLibraryItem({ model: library, View: this });

				this.$('.modal-plex-libraries-list').append(view.$el);
			}.bind(this));
		},

		selectLibray: function(id) {
			$(this.$el).modal('hide');
			$('#' + this.selectField).val(id).trigger('setModel');
		}
	});
});