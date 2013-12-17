var request = require('request')
  , when   	= require('when');

function formatShow(show) {
	return {
		_id: show.tvdbid,
		airdate: show.airdate,
		airs: show.airs,
		ep_name: show.ep_name,
		ep_plot: show.ep_plot,
		episode: show.episode,
		network: show.network,
		season: show.season,
		show_name: show.show_name,
		weekday: show.weekday
	};
}

function SickBeard(sbConfig) {
	this.protocol 	= sbConfig.protocol;
	this.host		= sbConfig.host;
	this.port 		= sbConfig.port;
	this.webRoot 	= sbConfig.webRoot;
	this.url 		= sbConfig.url;
	this.apiKey 	= sbConfig.apiKey;
}

SickBeard.prototype.getBaseUrl = function() {
	return this.protocol + this.host + ':' + this.port + this.webRoot;
};

SickBeard.prototype.getPage = function(cmd, filters, callback) {

	if(typeof filters == 'function') {
		var callback = filters;
		filters = '';
	}

	var url = this.url + '/api/' + this.apiKey + '/?cmd=' + cmd + '&' + filters;

	request({
		uri: url,
		json: true,
		timeout: 10000
	}, function(err, res, body) {
		if(err) return callback(err);

		if(body && body.result == 'success') {
			callback(null, body.data);
		}
	});
};

SickBeard.prototype.getShowsStats = function(callback) {
	this.getPage('shows.stats', function(err, data) {
		if(err) return callback(err);


		callback(null, data);
	});
};

SickBeard.prototype.getPoster = function(showId, callback) {
	var url = this.url + '/api/' + this.apiKey + '/?cmd=show.getposter&tvdbid=' + showId;
	request({uri: url, timeout: 10000, encoding: null}, function(err, res, body) {
		if (!err && res.statusCode == 200) {
			callback(null, body);
		} else {
			callback(err);
		}
	});
};

SickBeard.prototype.getUpComingShows = function(callback) {
	this.getPage('future', 'sort=date&type=missed|today|soon|later', function(err, data) {
		if(err) return callback(err);

		var json = [];
		if(data.missed)
			for(var i = 0; i < data.missed.length; i++)
				json.push(formatShow(data.missed[i]));

		if(data.today)
			for(var i = 0; i < data.today.length; i++)
				json.push(formatShow(data.today[i]));

		if(data.soon)
			for(var i = 0; i < data.soon.length; i++)
				json.push(formatShow(data.soon[i]));

		if(data.later)
			for(var i = 0; i < data.later.length; i++)
				json.push(formatShow(data.later[i]));

//console.log(data.today);

		callback(null, json);
	});
};

SickBeard.prototype.ping = function() {
	var promise = when.defer();

	request({
		uri: this.url + '/api/' + this.apiKey + '/?cmd=sb.ping',
		json: true,
		timeout: 5000
	}, function(err, res, body) {
		if(err || !body) return promise.reject(new Error('Failed to ping sickbeard'));

		if(body.result == 'denied') {
			return promise.reject(new Error('Wrong api key for sickbeard'));
		}

		if(body.result == 'success') {
			promise.resolve(true);
		}
	});

	return promise.promise;
};

exports = module.exports = SickBeard;
