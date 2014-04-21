// With help from Pablo Moretti, https://github.com/pablomoretti/jcors-loader

(function (window) {

	'use strict';

	/* private */

	var node_createElementScript = document.createElement('script');
	var node_elementScript = document.getElementsByTagName('script')[0];

	var jsLoad = function(queue) {
		this.buffer = [];
		this.total = null;
		this.count = null;

		for ( var i = 0; i < queue.length; i++ ) {
			var step = queue[i];

			if ( typeof step == 'string' ) {
				step = {script: step};
			} else if ( toString.call(step) === "[object Array]" ) {
				for ( var j = 0; j < step.length; j++ ) {
					var substep = step[i];
					if ( typeof substep == 'string' ) {
						step[i] = {script: substep};
					}
				}
			}

			this.buffer.push(step);
		}

		this.stepBuffer();
	};

	jsLoad.prototype.stepBuffer = function() {
		if ( !this.buffer.length ) return;
		var step = this.buffer.shift();

		if ( typeof step == 'function' ) {
			step();
			this.stepBuffer();
		} else if ( toString.call(step) === "[object Array]" ) {
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

	jsLoad.prototype.addScript = function(step) {
		var scr = step.script;
		var script = node_createElementScript.cloneNode(true);
		var me = this;
		script.type = "text/javascript";
		script.async = true;
		script.src = scr + '?' + new Date().getTime();
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