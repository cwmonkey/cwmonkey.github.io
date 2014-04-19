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
			if ( typeof arg === 'string' ) {
				args.push(arg);
			} else if ( typeof arg === 'function' ) {
				args.push((function(callback) {
					return function() {
						setTimeout(function() {
							callback();
						}, 0);
					}
				})(arg));
			} else {
				if ( arg.test() ) {
					if ( typeof arg.callback != 'undefined' ) {
						args.push((function(callback) {
							return function() {
								setTimeout(function() {
									callback();
								}, 0);
							}
						})(arg.callback));
					}
					continue;
				}

				args.push(arg.script);

				if ( typeof arg.callback != 'undefined' ) {
					args.push((function(callback) {
						return function() {
							setTimeout(function() {
								callback();
							}, 0);
						}
					})(arg.callback));
				}
			}
		}

		JcorsLoader.load.apply(null, args);
	}

	/* exports */

	window.cwmJsload = {load: load};

}(window));