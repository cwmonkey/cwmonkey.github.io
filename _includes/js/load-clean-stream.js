(function (window) {
'use strict';

// Load scripts
cwmJsload.load(
	{
		script: '//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
		static: true,
		test: function() {
			var v1 = 1;
			var v2 = 7;
			var v3 = 2;
			var hasJquery = false;

			if ( typeof window.jQueryCwm != 'undefined' ) return true;

			if ( typeof window.jQuery != 'undefined' ) {
				var vs = window.jQuery.fn.jquery.split('.');
				if ( vs[0] > v1 ) return true;
				if ( vs[0] < v1 ) return false;

				if ( vs[1] > v2 ) return true;
				if ( vs[1] < v2 ) return false;

				if ( vs[2] >= v3 ) return true;

				return false;
			}

			return false;
		},
		callback: function() {
			window.jQueryCwm = jQuery.noConflict(true);
			var jQueryOriginal = jQuery || window.jQueryCwm;

			/*if ( typeof window.jQuery != 'undefined' ) console.log('Original jQuery: ', jQuery.fn.jquery);
			console.log('Second jQuery: ', window.jQueryCwm.fn.jquery);*/
		}
	},
	window.cwmBookmarkletUrl + '/clean-stream.js',
	// Load script callback
	function() {
		window.cwmCleanStream.main(window.jQueryCwm || window.jQuery);
	}
);

}(window));