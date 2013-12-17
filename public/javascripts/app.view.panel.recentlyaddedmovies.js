!(function(App, $, _, Backbone) {
	var RecentlyAddedMoviesModel = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var RecentlyAddedMoviesCollection = Backbone.Collection.extend({
		model: RecentlyAddedMoviesModel,
		url: App.Config.WebRoot + '/api/plex/recentlyAddedMovies'
	});

	var RecentlyAddedMoviesView = Backbone.View.extend({
		el: 'div.panel.recentlyAddedMoviesPanel',

		initialize: function() {
			this.collection = new RecentlyAddedMoviesCollection();
			this.collection.on('add', this.addMovie, this);

			var base = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.collection.fetch();
			}, App.Config.UpdateDelayLong);

			this.slideCounter = 0;
		},


		addMovie: function(movie) {
			this.slideCounter += 1;

			var img = $('<img />', {'src': App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(movie.get('movieThumbnail')) + '&width=300&height=500'})
			  , caption = $('<div />', {class: 'carousel-caption'}).html('<h3>' + movie.get('movieTitle') + ' <span>(' + movie.get('movieYear') + ')</span></h3>');

			movie.itemEl = $('<div />', {class: 'item' + ((this.slideCounter == 1) ? ' active' : '')}).append(img).append(caption);
			this.$('.carousel-inner').append(movie.itemEl);

			if(this.slideCounter == this.collection.size()) {
				this.startSlideshow();
			}
		},

		startSlideshow: function() {
			this.$('.carousel').carousel();
		}
	});


	App.View.Panel.RecentlyAddedMovies = RecentlyAddedMoviesView;
})(App, jQuery, _, Backbone);
