---
---

window.cwmBaseUrl = "{{ site.protocol }}://{{ site.domain }}";
window.cwmBookmarkletUrl = window.cwmBaseUrl + "/bookmarklets/forum-update";

{% include js/cwm-jsload.min.js %}

(function (window) {
'use strict';

// Load scripts
cwmJsload.load(
	{
		script: window.cwmBaseUrl + '/bookmarklets/forum-update/forum-update.js',
		static: true,
		test: function() {
			return !!window.cwmForumUpdate;
		},
		callback: function() {
			console.log('forum-update');
		}
	},
	// Load script callback
	function() {
		if ( typeof window.cwmForumUpdate.main === 'undefined' ) {
			window.cwmForumUpdate.load(window, window.jQueryCwm || window.jQuery);
		}

		window.cwmForumUpdate.main();
	}
);

}(window));