define([
	'backbone', 'numeral',
	'tmpl!setup/drive-item',
	'util/view/dropdown-inline',
	'util/validator'
], function (Backbone, numeral, TmplDriveView, ViewDropdown, ValidatorClass) {

	return Backbone.View.extend({
		tagName: 'tr',
		template: TmplDriveView,

		events: {
			'click .btn-drive-delete': 'clickDelete',
			'click .btn-drive-test': 'clickTest'
		},

		initialize: function (options) {
			var self = this;

			this.driveLocationValid = true;

			this.totalSpace = new ViewDropdown([['KB', 'KiloBytes'], ['MB', 'MegaBytes'], ['GB', 'GigaBytes'], ['TB', 'TeraBytes'], ['PB', 'PetaBytes']], { size: 'sm' });
			this.listenTo(this.totalSpace, 'change', this.updateSpaceUnit);

			this.validator = new ValidatorClass({ body: this.$el, displayFormValidation: true });

			this.validator.setDataSchema({
				'label': {
					el: '.drive-label',
					constraints: {
						required: [true, 'A label is required.'],
						lessThan: [33, 'The label is invalid. Must have 32 characters or less.']
					}
				},

				'location': {
					el: '.drive-location',
					constraints: {
						required: [true, 'A location is required.'],
						func: [function () {
							return self.driveLocationValid
						}, 'The location is invalid or doesn\'t exist']
					}
				},

				'totalSpace': {
					el: '.drive-total-space',
					constraints: {
						number: [true, 'Invalid number.'],
					}
				}
			});

			this.validator.on('error', function (id, hasError, el, value, msg) {
				el.toggleClass('form-control-no-margin', hasError);
			});

			this.validator.on('update', function (id, value) {
				self.model.set(id, value);
			});
		},

		clickDelete: function (e) {
			e.preventDefault();
			this.deleteView();
		},

		clickTest: function (e) {
			e.preventDefault();

			this.$('.btn-drive-test').tooltip('hide');

			var self = this;
			var postData = this.model.server.getServerLogin();
			postData.location = this.model.get('location');

			$.ajax({
				url: Config.WebRoot + '/setup/server/drive',
				method: 'POST',
				data: postData
			}).done(function (data) {
console.log('Data', data);
				if(data.error) {
					alert(data.msg);
				} else {
					var msg = [
						'Used: ' + numeral(data.drive.used).format('0.0 b'),
						'Total: ' + numeral(data.drive.total).format('0.0 b'),
						'Precentage Used: ' + numeral(data.drive.used / data.drive.total).format('0%')
					];
					alert(msg.join('\n'));
				}
			});
		},

		deleteView: function () {
			this.hide();
			this.model.collection.remove(this.model);
			this.totalSpace.detach();
			this.$('.btn-tooltip').tooltip('destroy')
			this.remove();
		},

		render: function () {
			this.$el.html(TmplDriveView({
				label: this.model.get('label'),
				location: this.model.get('location'),
				totalSpace: this.model.get('totalSpace') == 0 ? '' : this.model.get('totalSpace')
			}));

			this.totalSpace.set(this.model.get('totalSpaceUnit'));
			this.totalSpace.attach(this.$('.total-space'));

			this.$('.btn-tooltip').tooltip({ container: 'body' });
		},

		updateSpaceUnit: function (value) {
			this.model.set('totalSpaceUnit', value);
		},

		show: function () {
			this.$el.css('display', '');
		},

		hide: function () {
			this.$el.css('display', 'none');
		}
	});
});