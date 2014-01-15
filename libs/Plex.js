var request = require('request')
  , crypto 	= require('crypto')
  , xml2js 	= require('xml2js')
  , when   	= require('when')
  , os 		= require('os')
  , pjson 	= require('./../package.json');

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
	  , self = this
	  , headers = { 		
		'X-Plex-Platform': os.type(),
		'X-Plex-Platform-Version': os.release(),
		'X-Plex-Device': 'UpStats Board (' + os.type() + ')',
		'X-Plex-Product': 'UpStats Board',
		'X-Plex-Version': pjson.version,
		'X-Plex-Client-Identifier': 'UpStats Board @ ' + os.hostname() 
	};

	request.post('https://my.plexapp.com/users/sign_in.xml', { headers: headers }, function(err, res, body) {
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

Plex.prototype.getPage = function(url, options) {
	var self = this
	  , promise = when.defer()
	  , tokenCount = 0;

	var urlOptions = '';
	if(typeof options === 'object') {
		for(x in options) {
			url += (url.indexOf('?') == -1) ? '?' : '&';
			url += x + '=' + options[x];
		}	
	}

	var resOptions = {
		uri: this.url + url,
		headers: { 'X-Plex-Token': this.token },
		encoding: null
	};

	function callback(err, res, body) {
		if(err) {
			var errReject = new Error('REQUEST');
			errReject.detail = err;
			return promise.reject(errReject);
		}

		if(res.statusCode == 401) {
			if(tokenCount == 1) {
				var err = new Error('UNAUTHORIZED');
				err.reason = 'Plex token bad?';
				return promise.reject(err);
			} else {
				self.getMyPlexToken().then(function() {
					tokenCount += 1;
					request(resOptions, callback);

				}).otherwise(function(reason) {
					var err = new Error('UNAUTHORIZED');
					err.reason = reason;
					return promise.reject(err);
				});
			}
		}

		if(res.statusCode == 404) {
			var err = new Error('404_FILE_NOT_FOUND');
			err.reason = '404 - ' + resOptions.uri;
			return promise.reject(err);
		}

		promise.resolve(body);
	}

	request(resOptions, callback);
	return promise.promise;
};

Plex.prototype.getXml = function(url) {
	var promise = when.defer();

	this.getPage(url).then(function(body) {
		body = (body.toString('utf-8')).trim();

		if(body.substr(0, 5) != '<?xml') { //>
			var err = new Error('NOT_XML');
			err.url = url;
			if(typeof body === 'string') {
				err.details = body
			}
			promise.reject(err);
		}

		return when.resolve(body);
	}).then(function(body) {

		var parser = new xml2js.Parser({ mergeAttrs: true });
		parser.parseString(body, function(err, data) {
			if(err) {
				var errParse = new Error('PARSE_ERROR');
				errParse.err = err;
				return callback(errParse);
			}

			promise.resolve(data);
		});
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getCurrentlyWatching = function() {
	var promise = when.defer();

	var url = '/status/sessions';
	this.getXml(url).then(function(data) {
		if(data.MediaContainer && data.MediaContainer.size == 0) {
			return promise.resolve([]);
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
		promise.resolve(json);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getImage = function(options) {
	var promise = when.defer()
	  , location = options
	  , imgOptions = {}
	  , fileCacheName = '';

	var url 	= location
	  , imgSize = '';

	if(typeof options === 'object') {
		location = options.location;
		url = location;

		if(options.height || options.width) {
			imgOptions.height = options.height;
			imgOptions.width = options.width;
			url = '/photo/:/transcode?url=' + encodeURIComponent('http://127.1:'+ this.port + location);
			imgSize = '.' + imgOptions.height + 'x' + imgOptions.width;
		}
	}

	if((location.indexOf('/library/metadata/') != 0)) {
		var err = new Error('INVALID_LOCATION');
		err.detail = 'Invalid image location for plex';

		return promise.reject('Invalid Location');
	}


	var fs = require('fs')
	  , moment = require('moment');

	var self = this
	  , hash = require('crypto').createHash('md5').update(location).digest("hex");

	var file = './cache/plex/' + hash + imgSize;

	function getImage(dontWriteImage) {
		self.getPage(url, imgOptions).then(function(image) {
			if(!dontWriteImage) {
				fs.writeFile(file, image, function(err) {

				});
			}

			promise.resolve(image);
		}).otherwise(promise.reject);
	}

	fs.exists(file, function(exists) {
		if(exists) {
			fs.stat(file, function(err, stats) {
				if(err)	return getImage(true);


				var imgCreated = moment(stats.mtime);
				if(imgCreated.isBefore(imgCreated.subtract('days', 7))) {
					getImage();
				} else {
					fs.readFile(file, function(err, image) {
						if(err) return getImage(true);

						promise.resolve(image);
					});
				}
			});
		} else {
			getImage();
		}
	});

	return promise.promise;
};

Plex.prototype.getRecentlyAdded = function(sectionId, start, size) {
	var promise = when.defer()
	  , testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		var err = new Error('INVALID_OPTIONS');
		err.detail = 'Invalid options for getting recently added items';
		return promise.reject(err);
	}

	var url = '/library/sections/' + sectionId + '/all?type=1&sort=addedAt:desc&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;
	this.getXml(url).then(function(data) {
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

		return promise.resolve(videos);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getRecentlyAired = function(sectionId, unwatched, start, size) {
	var promise = when.defer()
	  , testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		var err = new Error('INVALID_OPTIONS');
		err.detail = 'Invalid options for getting recently aired items';
		return promise.reject(err);
	}

	var urlUnwatched = (unwatched) ? '&unwatched=1' : '';
	var url ='/library/sections/' + sectionId + '/all?type=4' + urlUnwatched + '&sort=originallyAvailableAt:desc&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;

	this.getXml(url).then(function(data) {
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
		promise.resolve(videos);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getSectionType = function(sectionId) {
	var promise = when.defer();

	var url = '/library/sections/' + sectionId + '/all?X-Plex-Container-Size=1&X-Plex-Container-Start=0';
	this.getXml(url).then(function(data) {
		if(err) return promise.reject(err)

		if(data.MediaContainer) {
			return promise.resolve(data.MediaContainer.viewGroup);
		}

		var err = new Error();
		promise.reject(err);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.ping = function() {
	var promise = when.defer();

	this.getXml('/status').then(function(data) {
		if(err) return promise.reject(err);

		if(data.MediaContainer) return promise.resolve();

		var err = new Error('WRONG_SETTINGS');
		err.reason = 'Something wrong with the Plex settings.';
		promise.reject(err);
	}).otherwise(promise.reject);

	return promise.promise;
};

exports = module.exports = Plex;
