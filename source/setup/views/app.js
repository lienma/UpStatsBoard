import Backbone         from 'backbone';
import WizardCollection from '../collections/wizard';
import PaneBase         from './base-pane';
import WelcomeStepView  from './welcome';
import AppSettingsView  from './app-settings';
import UsenetView       from './usenet';
import PlexView         from './plex';
import StatsView        from './stats';
import OverviewView     from './overview';

const Router = Backbone.Router.extend({});
const Steps = [
  ['welcome',  'Welcome',        WelcomeStepView],
  ['settings', 'App Settings',   AppSettingsView],
  ['usenet',   'Usenet Apps',    UsenetView],
  ['plex',     'Plex Settings',  PlexView],
  ['stats',    'Stats Settings', StatsView],
  ['overview', 'Overview',       OverviewView]
];

class AppView extends Backbone.View {
  get el() { return '#SetupWizard'; }

  initialize() {
    this.Router = new Router();

    this.AppData = new Backbone.Model();

    this.Wizard = new WizardCollection();
    this.Wizard.Router = this.Router;
    this.Wizard.AppData = this.AppData;

    this.listenTo(this.Wizard, 'add', (model) => model.pane = new PaneBase({ model: model, wizard: this, AppData: this.AppData }) );

    //this.listenTo(this.AppData, 'change', () => console.log('change', this.AppData.attributes));

    this.generateSteps();
  }

  generateSteps() {
    let steps = Steps.map((Step) => {
      return { id: Step[0], title: Step[1], body: Step[2] };
    });
    this.Wizard.add(steps);
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

  setData(defaultData) {
    this.Wizard.setDefaults(defaultData);
  }

  open(url) {
    this.Wizard.openAt(url);
  }

  render() {
    this.renderAll();
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
