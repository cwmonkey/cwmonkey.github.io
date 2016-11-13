(function() {

var $;
var debug = false;

window.cwmMakeNote.load = function(window, jQuery, d) {
	$ = jQuery;
	debug = d;
	window.cwmMakeNote.main = main;
};

  /////////////////////////////
 // Main
/////////////////////////////
var main = function() {
	var tpls = {};
	var app = new window.cwmMakeNoteApp($, debug);
	var width = 320;
	var width_key = '__make-note-width'

	try {
		width = parseInt(localStorage.getItem(width_key)) || width;
	} catch(e) {}

	app.attach();

	// Notes
	var save_note = function(id, note_export) {
		iframe.contentWindow.postMessage({
			type: 'save_note', id: id, note: note_export
		}, '*');
	};

	// messages
	var receive_message = function(event) {
		if ( typeof event.data !== 'string' ) {
			console.log('main', event.data);
		}

		if ( event.origin != document.location.protocol + '//{{ site.domain }}' ) {
			return;
		}

		if ( event.data.type === 'loaded' ) {
			$iframe
				.addClass('__make-note_loaded')
				.attr('scrolling', 'yes')
				;

			event.data.tpls.forEach(function(val) {
				tpls[val.name] = app.tpl(val.html);
			});
		} else if ( event.data.type === 'destroy' ) {
			$iframe.remove();
		} else if ( event.data.type === 'wider' ) {
			width += 20;
			$iframe.width(width);
			localStorage.setItem(width_key, width);
		} else if ( event.data.type === 'thinner' ) {
			width -= 20;
			if ( width < 100 ) {
				width = 100;
			}
			$iframe.width(width);
			localStorage.setItem(width_key, width);
		} else if ( event.data.type === 'open' ) {
			$iframe.addClass('__make-note_opened');
			$iframe[0].scrolling = 'auto';
			$iframe.attr({scrolling: 'auto'});
		} else if ( event.data.type === 'close' ) {
			$iframe.removeClass('__make-note_opened');
			$iframe[0].scrolling = 'no';
			$iframe.attr({scrolling: 'no'});
		} else if ( event.data.type === 'toWindow' ) {
			if ( cwmMakeNote.notes[event.data.id] ) {
				cwmMakeNote.notes[event.data.id].$el.remove();
				delete cwmMakeNote.notes[event.data.id];
			}

			event.data.note.id = event.data.id;
			var note = new window.cwmMakeNote.Note(event.data.note, tpls['note-tpl'], tpls['note-form-tpl'], save_note, iframe.contentWindow);
			note.$el.appendTo(document.body);
			cwmMakeNote.notes[event.data.id] = note;
		} else if ( event.data.type === 'toList' && cwmMakeNote.notes[event.data.id] ) {
			cwmMakeNote.notes[event.data.id].$el.remove();
			delete cwmMakeNote.notes[event.data.id];
		} else if ( event.data.type === 'delete' && cwmMakeNote.notes[event.data.id] ) {
			cwmMakeNote.notes[event.data.id].$el.remove();
			delete cwmMakeNote.notes[event.data.id];
		}
	};

	window.addEventListener('message', receive_message, false);

	// Add styling
	var $css = $('<link rel="stylesheet" id="__make-note-css"/>');
	$css.attr({href: '//{{ site.domain }}/css/make-note.css'});
	$css.appendTo(document.head);

	// Add iframe
	var $iframe = $('<iframe id="__make-note" scrolling="no" style="display: none; opacity: 0; width: ' + width + 'px"></iframe>');
	var iframe = $iframe[0];
	$iframe.attr({src: '//{{ site.domain }}/greasemonkey/make-note/make-note-iframe.html#' + document.location.href});

	$iframe.appendTo(document.body);

	// Fix iframe for iPhone
	setTimeout(function() {
		$iframe.addClass('__make-note_opened');
		$iframe[0].scrolling = 'auto';
		$iframe.attr({scrolling: 'auto'});

		setTimeout(function() {
			$iframe.removeClass('__make-note_opened');
			$iframe[0].scrolling = 'no';
			$iframe.attr({scrolling: 'no'});
		}, 0);
	}, 0);

	// Add History events
	(function(history){
		var trigger_event = function(name) {
			var event; // The custom event that will be created

			if ( document.createEvent ) {
				event = document.createEvent('HTMLEvents');
				event.initEvent(name, true, true);
			} else {
				event = document.createEventObject();
				event.eventType = name;
			}

			event.eventName = name;

			if ( document.createEvent ) {
				window.dispatchEvent(event);
			} else {
				window.fireEvent('on' + event.eventType, event);
			}
		};

		var saved = {};
		var fns = ['pushState', 'replaceState'];

		for ( var i = 0, l = fns.length, fn; i < l; i++ ) {
			fn = fns[i];
			saved[fn] = history[fn];
			history[fn] = (function(fn) {
				return function() {
					var ret = saved[fn].apply(history, arguments);
					trigger_event(fn.toLowerCase());
					return ret;
				};
			})(fn);
		}
	})(window.history);

	var handle_url_change = function() {
		iframe.contentWindow.postMessage({
			type: 'url_change', url: document.location.href
		}, '*');
	};

	// Monitor html5 history changes
	window.addEventListener('popstate', handle_url_change);
	window.addEventListener('pushstate', handle_url_change);
	window.addEventListener('replacestate', handle_url_change);


	// Mobile support
	// http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
	function touchHandler(event) {
		var touch = event.changedTouches[0];

		var simulatedEvent = document.createEvent('MouseEvent');
			simulatedEvent.initMouseEvent({
			touchstart: 'mousedown',
			touchmove: 'mousemove',
			touchend: 'mouseup'
		}[event.type], true, true, window, 1,
			touch.screenX, touch.screenY,
			touch.clientX, touch.clientY, false,
			false, false, false, 0, null);

		touch.target.dispatchEvent(simulatedEvent);
		event.preventDefault();
	}

	document.addEventListener('touchstart', touchHandler, true);
	document.addEventListener('touchmove', touchHandler, true);
	document.addEventListener('touchend', touchHandler, true);
	document.addEventListener('touchcancel', touchHandler, true);

	// resize/move
	var $window = $(window);
	var $body = $(document.body);

	var x_pos = 0;
	var y_pos = 0;
	var x_last = 0;
	var y_last = 0;
	var change_height;
	var change_width;
	var $moving;
	var moving;
	var moving_node;

	var x_rpos = 0;
	var y_rpos = 0;
	var x_rlast = 0;
	var y_rlast = 0;
	var $resizing;
	var resizing;
	var resizing_node;

	var vp_top;
	var vp_height;
	var n_height;
	var n_top;
	var vp_left;
	var vp_width;
	var n_width;
	var n_left;

	var constrain_move = function() {
		if ( y_last <= 0 ) y_last = 0;

		if ( !moving_node.absolute ) {
			vp_height = $window.height();
			n_height = $moving.outerHeight(true);

			if ( n_height > vp_height ) {
				$moving.css({height: vp_height});
				change_height = vp_height;
			}

			if ( y_last + n_height > vp_height ) {
				y_last = vp_height - n_height;
			}
		}

		if ( x_last <= 0 ) x_last = 0;

		if ( !moving_node.absolute ) {
			vp_width = $window.width();
			n_width = $moving.outerWidth(true);

			if ( n_width > vp_width ) {
				$moving.css({width: vp_width});
				change_width = vp_width;
			}

			if ( x_last + n_width > vp_width ) {
				x_last = vp_width - n_width;
			}
		}
	};

	var note_move = function(e) {
		y_last = e.clientY - y_pos;
		x_last = e.clientX - x_pos;

		constrain_move();

		moving.style.top = y_last + 'px';
		moving.style.left = x_last + 'px';
	};

	var note_resize = function(e) {
		y_rlast = e.clientY - y_rpos;

		if ( !resizing_node.absolute ) {
			vp_height = $window.height();
			n_top = parseInt($resizing.css('top'));

			if ( n_top + y_rlast > vp_height ) {
				y_rlast = vp_height - n_top;
			}
		}

		resizing.style.height = y_rlast + 'px';

		x_rlast = e.clientX - x_rpos;

		if ( !resizing_node.absolute ) {
			vp_width = $window.width();
			n_left = parseInt($resizing.css('left'));

			if ( n_left + x_rlast > vp_width ) {
				x_rlast = vp_width - n_left;
			}
		}

		resizing.style.width = x_rlast + 'px';
	};

	var note_end_move = function(e) {
		constrain_move();
		var note = moving_node;

		$window.unbind('mousemove', note_move);
		$body
			.removeClass('__make-note--moving')
			.unbind('mouseup mouseleave', note_end_move);

		if ( !note.editing ) {
			if ( x_last <= 0 ) {
				note.x = undefined;
				moving.style.left = '0';
			} else {
				note.x = x_last;
			}

			if ( y_last <= 0 ) {
				note.y = undefined;
				moving.style.top = '0';
			} else {
				note.y = y_last;
			}

			if ( change_width ) note.width = change_width;
			if ( change_height ) note.height = change_height;

			save_note(note.id, note.export());
		}
	};

	var note_end_resize = function() {
		var note = cwmMakeNote.get_node(resizing);

		$window.unbind('mousemove', note_resize);
		$body.unbind('mouseup mouseleave', note_end_resize);

		if ( !note.editing ) {
			if ( x_rlast <= 0 ) {
				note.width = undefined;
				moving.style.left = '0';
			} else {
				note.width = x_rlast;
			}

			if ( y_rlast <= 0 ) {
				note.height = undefined;
				moving.style.height = '0';
			} else {
				note.height = y_rlast;
			}

			save_note(note.id, note.export());
		}
	};

	// Events
	$(document)
		.delegate('.__make-note--note', 'focusin', function(e) {
			$(this).addClass('__make-note--focused');
		})
		.delegate('.__make-note--note', 'focusout', function(e) {
			$(this).removeClass('__make-note--focused');
		})
		.delegate('[data-type="mover"]', 'mousedown', function(e) {
			if ( event.which !== 1 ) {
				return;
			}

			moving_node = cwmMakeNote.get_node(this);
			$moving = moving_node.$el;
			moving = $moving[0];
			x_pos = e.clientX - moving.offsetLeft;
			y_pos = e.clientY - moving.offsetTop;
			change_height = undefined;

			$window.bind('mousemove', note_move);
			$body
				.addClass('__make-note--moving')
				.bind('mouseup mouseleave', note_end_move);
		})
		.delegate('[data-type="resize"]', 'mousedown', function(e) {
			if ( event.which !== 1 ) {
				return;
			}

			resizing_node = cwmMakeNote.get_node(this);
			$resizing = resizing_node.$el;
			resizing = $resizing[0];
			x_rpos = e.clientX - $resizing.outerWidth(true);
			y_rpos = e.clientY - $resizing.outerHeight(true);

			$window.bind('mousemove', note_resize);
			$body.bind('mouseup mouseleave', note_end_resize);
		})
		.delegate('[data-type="to-list"]', 'click', function() {
			cwmMakeNote.get_node(this).toList();
			cwmMakeNote.get_node(this).$el.remove();
		})
		;
};

})();