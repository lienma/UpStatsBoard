import Backbone         from 'backbone';
import WizardCollection from '../collections/wizard';
import PaneBase         from './base-pane';
import WelcomeStepView  from './welcome';
import AppSettingsView  from './app-settings';
import UsenetView       from './usenet';
import PlexView         from './plex';
import StatsView        from './stats';

const Router = Backbone.Router.extend({});

const DefaultData = {
  'plex': {
    plexpy: {
      'plexPyHost': 'plex',
      'plexPyPort': 8181,
      'plexPyWebRoot': '/watch',
      'plexPyApiKey': 'aa'
    }
  },
  'stats': {
      'server': [{
          'label': 'GrizzlyBear',
          'remote': false,
          'drives': [{
            'label': 'Root',
            'location': '/'
          }]
      }]
    }
};

class AppView extends Backbone.View {
  get el() { return '#SetupWizard'; }

  initialize() {
    this.Router = new Router();

    this.Wizard = new WizardCollection();
    this.Wizard.Router = this.Router;

    this.listenTo(this.Wizard, 'add', (model) => model.pane = new PaneBase({ model: model, wizard: this }) );

    this.generateSteps();
    this.Wizard.setDefaults(DefaultData);

    this.renderAll();
    this.Wizard.openAt('stats/server');
  }

  generateSteps() {
    this.Wizard.add([
      { id: 'welcome', title: 'Welcome', body: WelcomeStepView },
      { id: 'app-settings', title: 'App Settings', body: AppSettingsView },
      { id: 'usenet', title: 'Usenet Apps', body: UsenetView },
      { id: 'plex', title: 'Plex Settings', body: PlexView },
      { id: 'stats', title: 'Stats Settings', body: StatsView }

    ]);
  }

  nextStep() {
    this.Wizard.nextStep();
  }

  previousStep() {
    this.Wizard.previousStep();
  }

  setCurrentTab(id) {
    this.Wizard.setCurrent(id);
  }

  renderAll() {
    let tabs = this.$('.wizard-tabs');
    let body = this.$('.panel-body');

    this.Wizard.each((model) => {
      model.pane.build(tabs, body);
    });
  }
}

export default AppView;
