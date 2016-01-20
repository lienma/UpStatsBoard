import ViewSubTab from '../base-sub-tab';
import Template   from '../../templates/view-plex-plextv.jade';
import Notify     from '../../utils/notify';

const DataSchema = {
	'plexTvUsername': {
		constraints: {
			required: [true, 'A plex.tv username is required.']
		}
	},
	'plexTvPassword': {
		constraints: {
			required: [true, 'A plex.tv password is required.']
		}
	}
};

class PlexPyView extends ViewSubTab {
	get template() { return Template; }
	get events() {
		return {
			'click .btn-plex-tv-authenication': 'clickAccountAuthenication'
		}
	}

	initialize(options) {
		super.initialize(options);

		this.setTabIcon('plex');
		this.setDataSchema(DataSchema);

		this.listenToData('change:plexTvUsername', this.updateTestPlexAccountBtn);
		this.listenToData('change:plexTvPassword', this.updateTestPlexAccountBtn);
	}

	clickAccountAuthenication(e) {
		e.preventDefault();

		let btn = $(e.target).removeClass('btn-success btn-danger').addClass('btn-default');
		let msg = this.$('.btn-plex-tv-authenication-msg').text('').removeClass('text-success text-danger');
		let btnAndFields = this.$('.btn-plex-tv-authenication, .plex-tv-account');

		if(this.validator.validate('plexTvUsername') && this.validator.validate('plexTvPassword')) {
			btnAndFields.prop('disabled', true);

			$.ajax({
				url: Config.WebRoot + '/setup/plex/auth',
				method: 'POST',
				data: { username: this.get('plexTvUsername'), password: this.get('plexTvPassword') }
			}).done((data) => {
				btnAndFields.prop('disabled', false);

				if(data.error) {
					btn.addClass('btn-danger').removeClass('btn-default');
					msg.text(data.error).addClass('text-danger');
					Notify.failed('Failed: ' + data.error);
				} else if(data.token) {
					btn.addClass('btn-success').removeClass('btn-default');
					msg.text('Successfully authenicated!').addClass('text-success');
					Notify.success('Successfully authenicated with Plex.tv!');

					this.set('plexToken', data.token);
				}
			});
		}
	}

	updateTestPlexAccountBtn() {
		let disabled = (this.get('plexTvUsername') === '' || this.get('plexTvPassword') === '');
		this.$('.btn-plex-tv-authenication').prop('disabled', disabled);
	}

	render() {
		super.render();
		this.updateTestPlexAccountBtn();
	}
}

export default PlexPyView;