(function (window) {

	'use strict';

	/* private */

	
	/* public */

	function load() {
		var len = arguments.length;
		var index;
		var request;
		var args = [];

		for (index = 0; index < len; index += 1) {
			var arg = arguments[index];
			if (typeof arg === 'string' || typeof arg === 'function') {
				args.push(arg);
			} else {
				if ( arg.test() ) continue;
				args.push(arg.script);
				if ( typeof arg.callback != 'undefined' ) args.push(arg.callback);
			}
		}

		JcorsLoader.load.apply(null, args);
	}

	/* exports */

	window.cwmJsload = {load: load};

}(window));