/*

Script loader for bookmarklets.

Loads scripts in order and/or at the same time.

Usage:
cwmJsload.load(
	// Loading via an object
	{
		script: 'path/to/script.js',
		static: true, // false = append date-time string (default), true = do not
		test: function() {
			// return true = script already loaded
		}
	},

	// Loading via a string:
	'path/to/script.js',

	// Loading via an array (scripts loaded asynchronously)
	[
		// more objects/strings/functions here
	],

	// Executing a function after scripts are loaded
	function() {
		// do stuff
	}
);

*/

// With help from Pablo Moretti, https://github.com/pablomoretti/jcors-loader

(function (window) {

	'use strict';

	/* private */

	var node_createElementScript = document.createElement('script');
	var node_elementScript = document.getElementsByTagName('script')[0];

	var step_defaults = {
		static: false
	};

	// Setup script loading buffer and run
	var jsLoad = function(queue) {
		this.buffer = [];
		this.total = null;
		this.count = null;

		for ( var i = 0; i < queue.length; i++ ) {
			var step = queue[i];

			if ( typeof step === 'string' ) {
				queue[i] = {script: step, static: step_defaults.static};
			} else if ( step.toString() === "[object Array]" ) {
				for ( var j = 0; j < step.length; j++ ) {
					var substep = step[j];
					if ( typeof substep === 'string' ) {
						queue[i][j] = {script: substep, static: step_defaults.static};
					}
				}
			} else {
				queue[i].static = queue[i].static || step_defaults.static;
			}

			this.buffer.push(queue[i]);
		}

		this.stepBuffer();
	};

	// Run next item in buffer
	jsLoad.prototype.stepBuffer = function() {
		if ( !this.buffer.length ) return;
		var step = this.buffer.shift();

		if ( typeof step === 'function' ) {
			step();
			this.stepBuffer();
		} else if ( step instanceof Array ) {
			this.total = step.length;
			this.count = 0;
			for ( var i = 0; i < step.length; i++ ) {
				var substep = step[i];
				if ( typeof substep.test === 'undefined' || !substep.test() ) {
					this.addScript(substep);
				} else {
					this.addDone();
				}
			}
		} else if ( typeof step.test === 'undefined' || !step.test() ) {
			this.addScript(step);
		} else {
			this.stepBuffer();
		}
	};

	// Add script to header
	jsLoad.prototype.addScript = function(step) {
		var scr = step.script;
		var script = node_createElementScript.cloneNode(true);
		var me = this;
		script.type = "text/javascript";
		script.async = true;
		script.src = scr + ((step.static)?'':'?' + new Date().getTime());
		script.onload = script.onreadystatechange = function () {
			if (!script.readyState || /loaded|complete/.test(script.readyState)) {
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				// Dereference the script
				script = undefined;
				// Load
				setTimeout(function() {
					if ( typeof step.callback != 'undefined' ) {
						step.callback();
					}

					me.addDone();
				}, 0);
			}
		};
		node_elementScript.parentNode.insertBefore(script, node_elementScript);
	};

	// Check for async loading completion and run next step in buffer
	jsLoad.prototype.addDone = function() {
		if ( this.total ) {
			this.count++;
			if ( this.total === this.count ) {
				this.total = null;
				this.count = null;
				this.stepBuffer();
			}
		} else {
			this.stepBuffer();
		}
	};

	/* public */
	// Public facing function to call jsLoad
	var load = function() {
		var queue = [];
		for ( var i = 0; i < arguments.length; i++ ) {
			queue.push(arguments[i]);
		}

		var loadobj = new jsLoad(queue);
	};

	/* exports */

	window.cwmJsload = {load: load};

}(window));