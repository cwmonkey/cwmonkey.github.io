---
---

(function() {

if ( window.cwmMakeNoteLoad || window.top !== window || document.location.pathname === '/greasemonkey/make-note/make-note-iframe.html' ) {
	return;
}

window.cwmMakeNoteLoad = true;
window.cwmMakeNoteDebug = {{ debug }};

{% include js/make-note-shared.min.js %}

{% include js/make-note.min.js %}

{% include js/cwm-jsload.min.js %}

{% include js/make-note-load.min.js %}

})();