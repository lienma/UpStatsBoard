var request = require('request')
  , xml2js 	= require('xml2js')
  , when   	= require('when')
  , os 		= require('os');

function Plex(plexConfig) {
	this.protocol 			= plexConfig.protocol;
	this.host 				= plexConfig.host;
	this.port 				= plexConfig.port;
	this.username 			= plexConfig.username;
	this.password 			= plexConfig.password;
	this.url 				= plexConfig.url;
	this.recentTVSection 	= plexConfig.recentTVSection;
	this.recentMovieSection = plexConfig.recentMovieSection;
}

Plex.prototype.getBaseUri = function() {
	return this.protocol + this.host + ':' + this.port;
};

Plex.prototype.getMyPlexToken = function() {
	var promise = when.defer()
	  , self = this;

	request.post('https://my.plexapp.com/users/sign_in.xml', {
		headers: { 'X-Plex-Client-Identifier': 'Status Board @ ' + os.hostname() }
	}, function(err, res, body) {
		if(err) return promise.reject(err);

		if(body.substr(0, 5) != '<?xml') { //>
			var err = new Error('Error gettin plex token; Response not xml format.');
			if(typeof body === 'string') {
				err.details = body
			}
			promise.reject(err);
		}

		var parser = new xml2js.Parser({ mergeAttrs: true });
		parser.parseString(body, function(err, data) {
			if(err) return promise.reject(err);

			if(data.errors) return promise.reject(new Error('Plex Error: ' + data.errors.error[0]));

			self.token = data.user.authenticationToken;
			promise.resolve();
		});
	}).auth(this.username, this.password);

	return promise.promise;
};

Plex.prototype.getPageNew = function(url, options) {
	var promise = when.defer();

	var urlOptions = '';
	if(typeof options === 'object') {
		for(x in options) {
			url += (url.indexOf('?') == -1) ? '?' : '&';
			url += x + '=' + options[x];
		}	
	}

	request({
		uri: this.url + url,
		headers: {
			'X-Plex-Token': this.token
		},
		encoding: null
	}, function(err, res, body) {
		if(err) {
			var errReject = new Error('REQUEST');
			errReject.detail = err;
			return promise.reject(errReject);
		}

		if(res.statusCode == 401) {
			var err = new Err('UNAUTHORIZED');
			return promise.reject(err);
		}

	});
	return promise.promise;
};

Plex.prototype.getPage = function(url, options, callback) {
	if(typeof options === 'function')
      var callback = options;

	var urlOptions = '';
	if(typeof options === 'object') {
		for(x in options) {
			url += (url.indexOf('?') == -1) ? '?' : '&';
			url += x + '=' + options[x];
		}	
	}

	request({
		uri: this.url + url,
		headers: {
			'X-Plex-Token': this.token
		},
		encoding: null
	}, function(err, res, body) {
		if(err) return callback(err);

		if(res.statusCode == 401) {
			return callback('UNAUTHORIZED');
		}
		callback(null, body);
	});
};

Plex.prototype.getXml = function(url, callback) {
	this.getPage(url, function(err, body) {
		if(err) return callback(err);

		body = (new String(body)).trim();
		if(body.substr(0, 5) != '<?xml') { //>
			var err = new Error('not xml');
			err.url = url;
			if(typeof body === 'string') {
				err.details = body
			}
			callback(err);
		}

		var parser = new xml2js.Parser({ mergeAttrs: true });
		parser.parseString(body, function(err, data) {
			if(err) return callback(err);

			callback(null, data);
		});
	});
};

Plex.prototype.getCurrentlyWatching = function(callback) {
	var url = '/status/sessions';
	this.getXml(url, function(err, data) {
		if(err) return callback(err);

		if(data.MediaContainer.size == 0) {
			return callback(null, []);
		}

		var json = [];
		var videos = data.MediaContainer.Video;
		videos.forEach(function(video) {
			json.push({
				sessionKey: video.sessionKey,
				art: video.art,
				title: video.title,
				titleSort: video.titleSort,
				thumb: video.thumb,
				tvShowTitle: video.grandparentTitle,
				tvShowThumb: video.grandparentThumb, 
				year: video.year,
				duration: video.duration,
				summary: video.summary,
				viewOffset: video.viewOffset,
				type: video.type,
				username: video.User[0].title,
				userAvatar: video.User[0].thumb,
				player: video.Player[0].title,
				playerPlatform: video.Player[0].platform,
				playingState: video.Player[0].state
			});
		});
		callback(null, json);
	});
};

Plex.prototype.getImage = function(options, callback) {
	var location = options, imgOptions = {}, fileCacheName = '';

	var url 	= location
	  , imgSize = '';

	if(typeof options === 'object') {
		location = options.location;
		url = location;

		if(options.height || options.width) {
			imgOptions.height = options.height;
			imgOptions.width = options.width;
			url = '/photo/:/transcode?url=' + encodeURIComponent(this.getBaseUri() + location);
			imgSize = '.' + imgOptions.height + 'x' + imgOptions.width;
		}
	}

	if((location.indexOf('/library/metadata/') != 0)) return callback('Invalid Location');


	var fs = require('fs')
	  , moment = require('moment');

	var base = this
	  , hash = require('crypto').createHash('md5').update(location).digest("hex");

	var file = './cache/plex/' + hash + imgSize;

	function getImage() {
		base.getPage(url, imgOptions, function(err, image) {
			if(err) return callback(err);

			fs.writeFile(file, image, function(err) {});

			callback(null, image);
		});
	}

	fs.exists(file, function(exists) {
		if(exists) {
			fs.stat(file, function(err, stats) {
				if(err) return callback(err);
				var imgCreated = moment(stats.mtime);
				if(imgCreated.isBefore(imgCreated.subtract('days', 7))) {
					getImage();
				} else {
					fs.readFile(file, function(err, image) {
						if(err) return callback(err);
						callback(null, image);
					});
				}
			});
		} else {
			getImage();
		}
	});
};

Plex.prototype.getRecentlyAdded = function(sectionId, start, size, callback) {
	var testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		callback('Invalid Options');
	}

	var url = '/library/sections/' + sectionId + '/all?type=1&sort=addedAt:desc&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;
	this.getXml(url, function(err, data) {
		if(err) return callback(err);

		var videos = [];
		if(data.MediaContainer && data.MediaContainer.size > 0) {
			for(var i = 0; i < data.MediaContainer.Video.length; i++) {
				var video = data.MediaContainer.Video[i];
				videos.push({
					_id: video.ratingKey,
					movieTitle: video.title,
					movieSumary: video.summary,
					movieYear: video.year,
					movieThumbnail: video.thumb,
					movieCover: video.art,
					movieLength: video.duration,
					movieReleased: video.originallyAvailableAt,
					addedAt: video.addedAt,
					updatedAt: video.updatedAt,
					movieGenre: video.Genre,
					movieWriter: video.Writer,
					movieDirector: video.Director,
					movieCountry: video.Country,
					movieRole: video.Role
				});
			}
		}

		callback(null, videos);
	});
};

Plex.prototype.getRecentlyAired = function(sectionId, unwatched, start, size, callback) {
	var testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		callback('Invalid Options');
	}
	var urlUnwatched = (unwatched) ? '&unwatched=1' : '';
	var url ='/library/sections/' + sectionId + '/all?type=4' + urlUnwatched + '&sort=originallyAvailableAt:desc&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;
console.log(url);

	this.getXml(url, function(err, data) {
console.log(data);
		if(err) return callback(err);

		var videos = [];
		if(data.MediaContainer.size > 0) {

			for(var i = 0; i < data.MediaContainer.Video.length; i++) {
				var video = data.MediaContainer.Video[i];

				var watched = (video.viewCount) ? true : false;

				videos.push({
					_id: video.ratingKey,
					tvShowKey: video.grandparentRatingKey,
					seasonKey: video.parentRatingKey,
					tvShowTitle: video.grandparentTitle,
					epThumbnail: video.thumb,
					seasonThumbnail: video.parentThumb,
					tvShowThumbnail: video.grandparentThumb,
					epTitle: video.title,
					epNumber: video.index,
					epPlot: video.summary,
					epSeason: video.parentIndex,
					epAired: video.originallyAvailableAt,
					addedAt: video.addedAt,
					watched: watched
				});
			}
		}
		callback(null, videos);
	});
};

Plex.prototype.getSectionType = function(sectionId) {
	var promise = when.defer();

	var url = '/library/sections/' + sectionId + '/all?X-Plex-Container-Size=1&X-Plex-Container-Start=0';
	this.getXml(url, function(err, data) {
		if(err) return promise.reject(err)

		if(data.MediaContainer) {
			return promise.resolve(data.MediaContainer.viewGroup);
		}

		promise.reject(err);
	});

	return promise.promise;
};

Plex.prototype.ping = function() {
	var promise = when.defer();

	this.getXml('/status', function(err, data) {
		if(err) return promise.reject(err);

		if(data.MediaContainer) return promise.resolve();

		var err = new Error('WRONG_SETTINGS');
		err.reason = 'Something wrong with the Plex settings.';
		promise.reject(err);
	});

	return promise.promise;
};

exports = module.exports = Plex;
