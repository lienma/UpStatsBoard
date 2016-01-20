import NotifyBar from 'jqnotifybar';

let defaultClass = $.notifyBar;

function failed(msg) {
	$.notifyBar({
		cssClass: 'notify-error',
		html: msg
	});
}

function info(msg) {
	$.notifyBar({
		cssClass: 'notify-info',
		html: msg,
		close: true,
		closeOnClick: false
	});
}

function success(msg) {
	$.notifyBar({
		cssClass: 'notify-success',
		html: msg
	});
}

function successConnection() {
	success('Connection was successfully made!');
}

export default { failed, info, success, successConnection };