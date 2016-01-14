import Backbone         from 'backbone';
import WizardCollection from '../collections/wizard';
import PaneBase         from './base-pane';
import WelcomeStepView  from './step/welcome';
import AppSettingsView  from './step/app-settings';

const Router = Backbone.Router.extend({});

class AppView extends Backbone.View {
  get el() { return '#SetupWizard'; }

  initialize() {
    this.Router = new Router();

    this.Wizard = new WizardCollection();
    this.Wizard.Router = this.Router;

    this.listenTo(this.Wizard, 'add', (model) => {
        model.pane = new PaneBase({ model: model, wizard: this });
    });

    this.generateSteps();
    this.Wizard.setDefaults({});

    this.renderAll();
    this.Wizard.openAt('welcome');
  }

  generateSteps() {
    this.Wizard.add([
      { id: 'welcome', title: 'Welcome', body: WelcomeStepView },
      { id: 'app-settings', title: 'App Settings', body: AppSettingsView }
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
