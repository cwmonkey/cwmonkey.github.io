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

;(function(window) {
	{% include js/vendor/jquery.js %}
	{% include js/vendor/marked.js %}
	cwmMakeNoteWindow.marked = marked;
})(cwmMakeNoteWindow);

window.cwmMakeNote.load(window, cwmMakeNoteWindow.jQuery, cwmMakeNoteWindow.marked, window.cwmMakeNote.debug);

window.cwmMakeNote.main();

})();