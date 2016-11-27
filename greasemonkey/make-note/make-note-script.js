---
---

(function() {

if ( window.cwmMakeNote || window.top !== window || document.location.pathname === '/greasemonkey/make-note/make-note-iframe.html' ) {
	return;
}

window.cwmMakeNoteLoad = true;
window.cwmMakeNoteDebug = {{ site.debug }};
var cwmMakeNoteWindow = {};
var getType = {};

// Shallow clone of window to blackbox loaded scripts like jQuery
for ( var thing in window ) {
	if ( window[thing] && getType.toString.call(window[thing]) === '[object Function]' ) {
		cwmMakeNoteWindow[thing] = (function(thing) {
			return function() {
				return window[thing].apply(window, arguments);
			};
		})(thing);
	} else {
		cwmMakeNoteWindow[thing] = window[thing];
	}
}

{% include js/make-note-shared.min.js %}

{% include js/make-note.min.js %}

/* in case a site defines define and define.amd, it breaks showdown */
;(function(window, define) {
	{% include js/vendor/jquery.js %}
	{% include js/vendor/showdown.js %}
	var showdown = cwmMakeNoteWindow.showdown;
	{% include js/showdown-checkbox.min.js %}
	{% include js/make-note-setup.min.js %}
}).call(cwmMakeNoteWindow, cwmMakeNoteWindow);

window.cwmMakeNote.load(window, cwmMakeNoteWindow.jQuery, cwmMakeNoteWindow.md, window.cwmMakeNote.debug);

window.cwmMakeNote.main();

})();