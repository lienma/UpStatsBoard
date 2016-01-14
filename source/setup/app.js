import $ from 'jquery';
import AppView from './views/app';

window.$ = window.jQuery = $;

$(() => {
    let app = new AppView();
});
