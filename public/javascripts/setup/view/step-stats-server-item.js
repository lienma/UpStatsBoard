define(['backbone', 'tmpl!setup/stats-server-item', 'setup/view/step-stats-server-add'], function (Backbone, TmplView, ModalServerAdd) {
	return Backbone.View.extend({
		tagName: 'tr',

		events: {
			'click .btn-edit-server': 'clickEdit',
			'click .btn-delete-server': 'clickDelete'
		},

		initialize: function (options) {
			this.view = options.view;

			this.listenTo(this.model, 'change', this.render);
		},

		clickEdit: function (e) {
			e.preventDefault();

			new ModalServerAdd({ view: this.view, oldModel: this.model });
		},

		clickDelete: function (e) {
			e.preventDefault();

			var self = this;

			this.model.collection.remove(this.model);

			this.$('.btn-tooltip, .server-bandwidth-download, .server-bandwidth-upload').tooltip('destroy');
			self.remove();
		},

		render: function () {
			var self = this;

			this.$el.html(TmplView({
				label: this.model.get('label'),
				location: this.model.get('remote') ? this.model.get('host') + ':' + this.model.get('port') : 'localhost',
				remote: this.model.get('remote') ? 'Yes' : 'No',
				monitorCpu: this.model.get('monitorCpu') ? 'Yes' : 'No',
				monitorMemory: this.model.get('monitorMemory') ? 'Yes' : 'No',
				monitorBandwidth: this.model.get('monitorBandwidth') ? 'Yes' : 'No',
				drives: this.model.get('drives').length > 0 ? 'Yes' : 'No'
			}));

			function formatSpeed(key) {
				var speed = self.model.get(key);

				switch(self.model.get(key + 'Unit')) {
					case 0:
						return speed + ' KBit/s';
					case 1:
						return speed + ' MBit/s';
					case 2:
						return speed + ' GBit/s';
				}
			}

			if(this.model.get('maxUploadSpeed') != '') {
				this.$('.server-bandwidth-upload').css('display', '').tooltip({
					title: 'Max Upload Speed: ' + formatSpeed('maxUploadSpeed')
				});
			}

			if(this.model.get('maxDownloadSpeed') != '') {
				this.$('.server-bandwidth-download').css('display', '').tooltip({
					title: 'Max Download Speed: ' + formatSpeed('maxDownloadSpeed')
				});
			}

			this.$('.btn-tooltip').tooltip({ container: 'body' });
		}
	});
});
