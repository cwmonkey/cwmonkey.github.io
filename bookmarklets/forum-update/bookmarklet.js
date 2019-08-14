---
---

window.cwmBaseUrl = "//{{ site.domain }}";
window.cwmBookmarkletUrl = window.cwmBaseUrl + "/bookmarklets/forum-update";

{% include js/cwm-jsload.min.js %}

(function (window) {
'use strict';

// Load scripts
cwmJsload.load(
	[{
		script: '//ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js',
		static: true,
		test: function() {
			var v1 = 1;
			var v2 = 8;
			var v3 = 1;
			var hasJquery = false;

			if ( typeof window.jQueryCwm !== 'undefined' ) return true;

			if ( typeof window.jQuery !== 'undefined' ) {
				var vs = window.jQuery.fn.jquery.split('.');
				if ( vs[0] > v1 ) return true;
				if ( vs[0] < v1 ) return false;

				if ( vs[1] > v2 ) return true;
				if ( vs[1] < v2 ) return false;

				if ( (vs[2] || 0) >= v3 ) return true;

				return false;
			}

			return false;
		},
		callback: function() {
			window.jQueryCwm = jQuery.noConflict(true);
			var jQueryOriginal = jQuery || window.jQueryCwm;
		}
	},
	{
		script: window.cwmBaseUrl + '/js/vendor/jQuery.scrollTo/2.1.2/jquery.scrollTo.js',
		static: true,
		test: function() {
			return !!jQuery.fn.scrollTo;
		},
		callback: function() {
			if ( window.jQueryCwm && !window.jQueryCwm.fn.scrollTo ) {
				window.jQueryCwm.fn.scrollTo = window.jQuery.fn.scrollTo;
			}
		}
	}],
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