import Backbone      from 'backbone';
import numeral       from 'numeral';
import TmplDriveView from '../../../templates/row-drive-item.jade';
import DropdownView  from '../../dropdown';
import Validator     from '../../../utils/validator';

class DriveView extends Backbone.View {
	get tagName() { return 'tr' }
	get template() { return TmplDriveView }
	get events() {
		return {
			'click .btn-drive-delete': 'clickDelete',
			'click .btn-drive-test': 'clickTest'
		};
	}

	initialize() {
		this.driveLocationValid = true;

		this.totalSpace = new DropdownView([['KB', 'KiloBytes'], ['MB', 'MegaBytes'], ['GB', 'GigaBytes'], ['TB', 'TeraBytes'], ['PB', 'PetaBytes']], { size: 'sm' });

		this.validator = new Validator({ body: this.$el, displayFormValidation: true });

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
					func: [() => { return this.driveLocationValid }, 'The location is invalid or doesn\'t exist']
				}
			},

			'totalSpace': {
				el: '.drive-total-space',
				constraints: {
					number: [true, 'Invalid number.'],
				}
			}
		});

		this.listenTo(this.totalSpace, 'change', this.updateSpaceUnit);
		this.listenTo(this.validator, 'error', this.updateOnValidatorError);
		this.listenTo(this.validator, 'update', (id, value) => this.model.set(id, value) );
	}

	clickDelete(e) {
		e.preventDefault();
		this.deleteView();
	}

	clickTest(e) {
		e.preventDefault();

		this.$('.btn-drive-test').tooltip('hide');

		let postData = this.model.server.serverLogin;
		postData.location = this.model.get('location');

		$.ajax({
			url: Config.WebRoot + '/setup/server/drive',
			method: 'POST',
			data: postData
		}).done((data) => {
			if(data.error) {
				alert(data.msg); //eslint-disable-line no-alert
			} else {
				let msg = [
					'Used: ' + numeral(data.drive.used).format('0.0 b'),
					'Total: ' + numeral(data.drive.total).format('0.0 b'),
					'Precentage Used: ' + numeral(data.drive.used / data.drive.total).format('0%')
				];
				alert(msg.join('\n')); //eslint-disable-line no-alert
			}
		});
	}

	deleteView() {
		this.hide();
		this.model.collection.remove(this.model);
		this.totalSpace.detach();
		this.$('.btn-tooltip').tooltip('destroy')
		this.remove();
	}

	render() {
		this.$el.html(TmplDriveView({
			label: this.model.get('label'),
			location: this.model.get('location'),
			totalSpace: this.model.get('totalSpace') === 0 ? '' : this.model.get('totalSpace')
		}));

		this.totalSpace.set(this.model.get('totalSpaceUnit'));
		this.totalSpace.attach(this.$('.total-space'));

		this.$('.btn-tooltip').tooltip({ container: 'body' });
	}

	updateOnValidatorError(id, hasError, el, value, msg) {
		el.toggleClass('form-control-no-margin', hasError);
	}

	updateSpaceUnit(value) {
		this.model.set('totalSpaceUnit', value);
	}

	show() {
		this.$el.css('display', '');
	}

	hide() {
		this.$el.css('display', 'none');
	}
}

export default DriveView;