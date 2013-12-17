
(function(App, $, _, Backbone) {

	var BottomBarModel = Backbone.Model.extend({
		idAttribute: 'selector',

		urlRoot: function(){
			return App.Config.WebRoot + '/stats/';
		}
	});

	var BottomBarView = Backbone.View.extend({
		el: 'div.bottom-display-bar',
		ul: null,
		initialize: function() {
			this.row = this.$('div.row');
			this.render();
		},

		render: function() {
			var base = this;

			var modules = [
				{'selector': 'cpu', 'title': 'CPU', class: 'col-md-3'},
				{'selector': 'memory', 'title': 'Memory', class: 'col-md-3'},
				{'selector': 'bandwidth', 'title': 'Bandwidth', class: 'col-md-3'},
				{'selector': 'space', 'title': 'Total Space', class: 'col-md-3'}
			];

			_.each(modules, function(module) {
				var model = new BottomBarModel(module);
				var view = new BottomBar[module.selector]({model: model});
				view.$el.addClass(module.class);
				base.row.append(view.render());
			});
		}
	});

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	var BottomBar = {
		'bandwidth': Backbone.View.extend({
			loading: true,

			template: _.template($('#tmpl-bottom-display-item').html()),

			initialize: function() {
				var base = this;
				this.$el.html(this.template(this.model.attributes));

				this.setupBar();
				this.setupModal();

				this.$el.click(function() {
					if(!base.loading) {
						base.modal.open();
					}
				});
			},

			setupBar: function() {
				this.detailDiv = this.$('.detail');
				this.progressBarDown = $('<div/>', {class: 'progress-bar'});
				this.progressBarUp = $('<div/>', {class: 'progress-bar progress-bar-warning'});

				var downloadDiv = $('<div/>', {title: 'Download', class: 'progress bandwidth pull-left'}).append(this.progressBarDown).tooltip();
				var uploadDiv = $('<div/>', {title: 'Upload', class: 'progress bandwidth pull-right'}).append(this.progressBarUp).tooltip();
				this.$('.progressDiv').append(downloadDiv).append(uploadDiv);
			},

			setupModal: function() {
				var base = this;
				function fieldBandwidth(body, field) {
					return function(model) {
						body.editField('.' + field + 'Download', formatBytes(model.get(field)[0]));
						body.editField('.' + field + 'Upload', formatBytes(model.get(field)[1]));
						body.editField('.' + field + 'Total', formatBytes(model.get(field)[2]));
					};
				}

				this.modal = new App.Modal.GraphMulti({
					el: $('#bandwidthMultiModal'),
					url: App.Config.WebRoot + '/stats/bandwidth',

					modelDefaults: {
						label: '',
						default: false,
						max: [0, 0],
						offline: false,

						dateSince: '',
			
						download: 0,
						upload: 0,
			
						total: [0, 0, 0],
						lastMonth: [0, 0, 0],
						thisMonth: [0, 0, 0],
						today: [0, 0, 0]
					},

					regularGraph: true,
					colors: App.Config.Bandwidth,

					tmplTabBody: $('#tmpl-modal-bandwidth').html(),

					graphFields: [{label: 'Download', field: 'download'}, {label: 'Upload', field: 'upload'}],


					initialize: function(collection) {
						var model = collection.getDefaultModel();
						model.on('change', base.updateBar, base);
						base.updateBar(model);
	
						base.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
						base.loading = false;
					},

					initializeBody: function(model) {
						var body = this.body(model.id);
						var alert = body.find('.alertBackground')
						  , divOffline = body.find('.current .offline')
						  , divOnline = body.find('.current .online');


						function offlineMsg(offline) {
							alert[(offline) ? 'show' : 'hide']();
							divOffline[(offline) ? 'show' : 'hide']();
							divOnline[(!offline) ? 'show' : 'hide']();
						}

						offlineMsg(model.get('offline'));
						model.on('change:offline', function(m) {
							offlineMsg(m.get('offline'));
						});

						['download', 'upload'].forEach(function(field) {
							body.editField('.current .' + field, model.get(field) + ' Mbps');
						});

						model.on('change:download change:upload', function(m) {
							body.editField('.current .download', m.get('download') + ' Mbps');
							body.editField('.current .upload', m.get('upload') + ' Mbps');
						}, this);

						['lastMonth', 'thisMonth', 'today', 'total'].forEach(function(field) {
							var editField = fieldBandwidth(body, field);
							editField(model);

							var change = 'change:' + field;
							model.on(change, editField, this);
						});
					},

					tooltipLabel: function(data) {
						return data.data + ' Mbps<br /><small>at %time%</small>';
					},

					yAxisFormatter: function(val, axis) {
						if(val == 0) {
							return '0 Mbps';
						}
						return val + ' Mbps';
					}
				});
			},

			updateBar: function(model) {
				var download = model.get('download')
				  , max = model.get('max')
				  , upload = model.get('upload');

				this.progressBarDown.css({width: Math.floor(download / max[0] * 100) + '%'});
				this.progressBarUp.css({width: Math.floor(upload / max[1] * 100) + '%'});
				this.detailDiv.html(download + ' Mbps / ' + upload + ' Mbps');
			},

			render: function() {
				return this.$el;
			}
		}),

		'cpu': Backbone.View.extend({
			//tagName: 'li',
			template: _.template($('#tmpl-bottom-display-item').html()),

			loading: true,
			modal: null,
			
			initialize: function() {
				var base = this;
				this.listenTo(this.model, 'change', this.update);
				this.$el.html(this.template(this.model.attributes));
				this.modal = new App.Modal.Graph($('#cpuModal'), ['Wait', 'System', 'User'], {
					colors: App.Config.CPU,
					initialize: function() {
						this.$('.progress-bar').tooltip();
					},
					yAxisFormatter: function(val, axis) {
						return val + '%';
					},
					update: function(model) {
						var cpuModel = model.get('cpu')
						  , loadAvgs = model.get('loadAvg')
						  , totalCPU = model.get('totalCPUs')
						  , cssNames = ['1min', '5min', '15min'];

						this.$('.cpuModel').html(cpuModel);

						for(var i = 0; i < cssNames.length; i++) {
							var load = Math.round(loadAvgs[i] * 100)
							  , percent = Math.round(loadAvgs[i] / totalCPU * 100);

							var percentColor = 'progress-bar-info';
							if(percent >= 75 && 90 > percent) {
								percentColor = 'progress-bar-warning';
							} else if(percent >= 90) {
								percentColor = 'progress-bar-danger';
							}

							var progressBar = this.$('dd.' + cssNames[i] + ' .progress-bar');
							progressBar.removeClass('progress-bar-info progress-bar-warning progress-bar-danger').addClass(percentColor);
							progressBar.css({width: percent + '%'});
							progressBar.attr('data-original-title', 'Load: ' + load + '%');
							this.$('dt.' + cssNames[i] + ' span').html(load + '%');
						}
					},
					tooltipLabel: function(data) {
						return data.data + '%<br /><small>at %time%</small>';
					}
				});

				this.$el.click(function() {
					if(!base.loading) {
						base.modal.open();
					}
				});

				this.detailDiv = this.$('.detail');
				this.progressBarWait = $('<div/>', {title: 'Wait', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
				this.progressBarSys = $('<div/>', {title: 'System', rel: 'tooltip', class: 'progress-bar'});
				this.progressBarUser = $('<div/>', {title: 'User', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

				var progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBarWait).append(this.progressBarSys).append(this.progressBarUser);
				this.$('.progressDiv').append(progressDiv);
				
				this.$('[rel=tooltip]').tooltip();

				this.fetch();
			},

			fetch: function() {
				var base = this;
				this.model.fetch({success: function() {
					if(!App.Config.StopUpdating) {
						base.fetch();
					}
				}});
			},

			update: function() {
				if(this.loading) {
					this.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
					this.loading = false;
				}

				var total = this.model.get('totalCPUs')
				  , sys = this.model.get('sys')
				  , user = this.model.get('user')
				  , wait = this.model.get('nice');	

				var totalPercent = Math.ceil((user + sys + wait));
				this.progressBarUser.css({width: Math.floor(user / total) + '%'}).attr('data-original-title', 'User: ' + user + '%');
				this.progressBarSys.css({width: Math.round(sys / total) + '%'}).attr('data-original-title', 'System: ' + sys + '%');
				this.progressBarWait.css({width: Math.floor(wait / total) + '%'}).attr('data-original-title', 'Wait: ' + wait + '%');
				this.detailDiv.html(Math.round(totalPercent) + '%');


				this.modal.update(this.model);
				this.modal.updateHistory(wait, sys, user);
			},

			render: function() {
				return this.$el;
			}
		}),

		'space': Backbone.View.extend({
			//tagName: 'li',
			template: _.template($('#tmpl-bottom-display-item').html()),
			initialize: function() {
				var base = this;

				this.listenTo(this.model, 'change', this.update);
				this.$el.html(this.template(this.model.attributes));
				this.detailDiv = this.$('.detail');

				this.progressBar = $('<div/>', {class: 'progress-bar'}).tooltip();
				var progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBar);
				this.$('.progressDiv').append(progressDiv);

				App.Disks.on('change', this.update, this);
				App.Disks.on('add', this.addDisk, this);
			},

			totalDisks: 0,
			addDisk: function(model, collection) {
				this.totalDisks += 1;

				if(collection.size() == this.totalDisks) {
					this.update();
				}
			},

			update: function() {
				var total = 0, used = 0;
				App.Disks.each(function(disk, i) {
					total += parseFloat(disk.get('total'));
					used += parseFloat(disk.get('used'));
				});

				var percent = Math.floor(used / total * 100);

				this.detailDiv.html(numeral(used).format('0.00 b') + ' / ' + numeral(total).format('0.00 b'));
				var loadColor = '';
				if(percent >= 75 && 90 > percent) {
					loadColor = 'progress-bar-warning';
				} else if(percent>= 90) {
					loadColor = 'progress-bar-danger';
				}
				this.progressBar.css({width: percent + '%'}).attr('data-original-title', percent + '% Full');
				this.progressBar.removeClass('progress-bar-warning progress-bar-danger').addClass(loadColor);
			},

			render: function() {
				return this.$el;
			}
		}),

		'memory': Backbone.View.extend({
			//tagName: 'li',
			template: _.template($('#tmpl-bottom-display-item').html()),

			history: [],
			loading: true,

			initialize: function() {
				var base = this;

				this.listenTo(this.model, 'change', this.update);
				this.$el.html(this.template(this.model.attributes));

				this.modal = new App.Modal.Graph($('#memoryModal'), ['Buffer', 'Cache', 'Used'], {
					colors: App.Config.Memory,
					update: function(model) {		
						this.$('span.buffer').html(numeral(model.get('buffer')).format('0.00 b'));
						this.$('span.cache').html(numeral(model.get('cache')).format('0.00 b'));
						this.$('span.used').html(numeral(model.get('used')).format('0.00 b'));
					},
					tooltipLabel: function(data) {
						var bytes = numeral(data.data).format('0.00 b');
						return bytes + '<br /><small>at %time%</small>';
					},
					yAxisFormatter: function(val, axis) {
						return numeral(val).format('0.00 b');
					}
				});

				this.$el.click(function() {
					if(!base.loading) {
						base.modal.open();
					}
				});

				this.detailDiv = this.$('.detail');
				this.progressBarBuffer = $('<div/>', {title: 'Buffer', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
				this.progressBarCache = $('<div/>', {title: 'Cache', rel: 'tooltip', class: 'progress-bar'});
				this.progressBarUsed = $('<div/>', {title: 'Used', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

				var progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBarBuffer).append(this.progressBarCache).append(this.progressBarUsed);
				this.$('.progressDiv').append(progressDiv);
				this.$('[rel=tooltip]').tooltip();

				this.model.fetch();
				setInterval(function() {
					if(!App.Config.StopUpdating) {
						base.model.fetch();
					}
				}, App.Config.UpdateDelay);
			},

			update: function() {
				if(this.loading) {
					this.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
					this.loading = false;
				}

				var total = this.model.get('total')
				  , buffer = this.model.get('buffer')
				  , cache = this.model.get('cache')
				  , used = this.model.get('used');

				var percent = 
				this.progressBarBuffer.css({width: Math.floor(buffer / total * 100) + '%'}).attr('data-original-title', 'Buffer: ' + numeral(buffer).format('0.00 b'));
				this.progressBarCache.css({width: Math.floor(cache / total * 100) + '%'}).attr('data-original-title', 'Cache: ' + numeral(cache).format('0.00 b'));
				this.progressBarUsed.css({width: Math.floor(used / total * 100) + '%'}).attr('data-original-title', 'Used: ' + numeral(used).format('0.00 b'));

				var sum = buffer + cache + used;
				this.detailDiv.html(numeral(sum).format('0.00 b') + ' / ' + numeral(total).format('0.00 b'));

				this.modal.update(this.model);
				this.modal.updateHistory(buffer, cache, used);
			},

			render: function() {
				return this.$el;
			}
		})
	};


	App.View.BottomBar = BottomBarView;
})(App, jQuery, _, Backbone);
