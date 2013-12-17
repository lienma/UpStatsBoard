var SickBeard = require('../libs/SickBeard');
var api = {
	plex: {
		currentlyWatching: function(req, res) {
			var plex = req.app.config.plex;
			plex.getCurrentlyWatching(function(err, videos) {
				var json = [];
				if(err) {
// Log the err
				} else {
					videos.forEach(function(video) {
						json.push({
							_id: video.sessionKey,
							art: video.art,
							title: video.title,
							titleSort: video.titleSort,
							thumb: video.thumb,
							tvShowTitle: video.tvShowTitle,
							tvShowThumb: video.tvShowThumb,
							year: video.year,
							duration: video.duration,
							summary: video.summary,
							type: video.type,
						});
					});
				}
				res.json(json);
			});
		},
		poster: function(req, res) {
			var plex = req.app.config.plex;
			plex.getImage({
				location: req.param('location'),
				width: req.param('width'),
				height: req.param('height')
			}, function(err, image) {
				res.type('jpeg');
				res.send(image);
			});
		},
		recentlyAddedMovies: function(req, res) {
			var plex = req.app.config.plex;
			plex.getRecentlyAdded(plex.recentMovieSection, 0, 20, function(err, videos) {
				res.json(videos);
			});
		},
		recentlyAired: function(req, res) {
			var plex = req.app.config.plex;
			var unwatched = (req.param('unwatched') == 'true') ? true : false;

			plex.getRecentlyAired(plex.recentTVSection, unwatched, 0, 20, function(err, videos) {
				res.json(videos);
			});
		}
	},

	sickbeard: {
		poster: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getPoster(req.param('showId'), function(err, image) {
				res.type('jpeg');
				res.send(image);
			});
		},
		upcoming: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getUpComingShows(function(err, shows) {
				res.json(shows);
			});
		},
		showsStats: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getShowsStats(function(err, stats) {
				if(err) {
					res.json({});
				} else {
					var json = {
						percentComplete: Math.round(stats.ep_downloaded / stats.ep_total * 10000) / 100,
						showsActive: stats.shows_active,
						showsTotal: stats.shows_total
					};
					res.json(json);
				}
			});
		}
	}
};

exports = module.exports = api;
