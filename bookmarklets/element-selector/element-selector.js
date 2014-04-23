(function (window) {
'use strict';

var $;
var $css;
var $body;
var $selector;
var css = '<link rel="stylesheet" id="place-image-css"/>';

var mouseover = function(e) {
	var $this = $(this);
	e.stopPropagation();
	$selector.empty();
	$selector
		.append($('<p/>').html(get_selector($this)))
		.append($('<p/>').html(get_selector_by_class($this)))
		;
	$this.addClass('element-selector-hover');
};

var mouseout = function(e) {
	var $this = $(this);
	e.stopPropagation();
	$this.removeClass('element-selector-hover');
};

var get_selector = function($this, buffer) {
	buffer = buffer || [];

	var id = '';
	if ( $this.is('[id]') ) {
		id = '#' + $this.attr('id');
	}

	var classes = '';
	if ( $this[0].className ) {
		classes = '.' + $this[0].className.split(' ').join('.');
	}
	buffer.unshift($this[0].tagName + id + classes);

	var $parent = $this.parent();
	if ( !$parent.length || $parent[0].tagName == 'HTML' ) {
		return buffer.join(' > ');
	}

	// Recursion
	return get_selector($parent, buffer);
}

var get_selector_by_id = function($this, buffer) {
	buffer = buffer || [];
	if ( $this.is('[id]') ) {
		return '#' + $this.attr('id') + (buffer.length?' > ' + buffer.join(' > '):'');
	}

	var classes = '';
	if ( $this[0].className ) {
		classes = '.' + $this[0].className.split(' ').join('.');
	}
	buffer.unshift($this[0].tagName + classes);

	var $parent = $this.parent();
	if ( !$parent.length || $parent[0].tagName == 'BODY' ) {
		return buffer.join(' > ');
	}

	// Recursion
	return get_selector_by_id($parent, buffer);
}

var get_selector_by_class = function($this, buffer, level) {
	level = level || 0;

	buffer = buffer || [];
	if ( $this.is('a') && level === 0 ) {
		buffer.push('a');
		level++;
		// Recursion
		return get_selector_by_class($this.parent(), buffer, level);
	} else if ( $this[0].className && level !== 0 ) {
		return '.' + $this[0].className.split(' ').join('.') + (buffer.length?' ' + buffer.join(' '):'');
	}

	var classes = '';
	if ( $this[0].className ) {
		classes = '.' + $this[0].className.split(' ').join('.');
		buffer.unshift(classes);
	} else if ( level === 0 ) {
		buffer.unshift($this[0].tagName);
	}

	var $parent = $this.parent();
	if ( !$parent.length || $parent[0].tagName == 'BODY' ) {
		return buffer.join(' ');
	}

	level++;
	// Recursion
	return get_selector_by_class($parent, buffer, level);
}

var guesses = {
	get_selector: get_selector,
	//by_id: get_selector_by_id,
	by_class: get_selector_by_class
};

var click = function(e) {
	var $this = $(this);
	e.stopPropagation();
	e.preventDefault();
	$this.removeClass('element-selector-hover');
	stop();

	$selector.empty();

	for ( var g in guesses ) {
		var guess = guesses[g];
		var $input = $('<input type="text"/>')
			.val(guess($this))
			;

		$selector.append($('<p/>').append($input));
		//$input.focus().select();
	}

	setTimeout(function() {
		$selector.find('input[type="text"]')
			.focus()
			.select()
			.bind('click focus', function() {
				var $this = $(this);
				setTimeout(function() {
					$this.select();
				}, 0);
			})
			;
	}, 0);

	$selector.append($('<p/>').append($('<button/>').html('Close').bind('click', function(e) {
		e.preventDefault();
		end();
	})));
};

var body_click = function(e) {
	var $this = $(this);
	e.stopPropagation();
	stop();
	end();
}

var mouseover_selector = function() {
	var $this = $(this);
	if ( $this.is('.element-selector-hovered') ) {
		$this.removeClass('element-selector-hovered');
	} else {
		$this.addClass('element-selector-hovered');
	}
};

var stop = function() {
	$body
		.undelegate(':not(#element-selector-selector)', 'mouseover', mouseover)
		.undelegate(':not(#element-selector-selector)', 'mouseout', mouseout)
		.undelegate(':not(#element-selector-selector)', 'click', click)
		.undelegate('#element-selector-selector', 'mouseover', mouseover_selector)
		//.undelegate('body', 'click', body_click)
		;

	running = false;
};

var end = function() {
	$selector.empty().hide();
};

var setup = function(jQuery) {
	$ = jQuery;

	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/element-selector.css?' + new Date().getTime()});

	$body = $('html');
	$selector = $('<menu/>')
		.attr({id: 'element-selector-selector'})
		.appendTo($body)
		.bind('focusout', function() {
			//end();
		})
		;
};

var run = function() {
	running = true;

	$body
		.delegate(':not(#element-selector-selector)', 'mouseover', mouseover)
		.delegate(':not(#element-selector-selector)', 'mouseout', mouseout)
		.delegate(':not(#element-selector-selector)', 'click', click)
		.delegate('#element-selector-selector', 'mouseover', mouseover_selector)
		//.delegate('body', 'click', body_click)
		;

	$selector.show();
};

var running = false;

// Main
var main = function(jQuery) {
	if ( running ) return;
	if ( typeof $ == 'undefined' ) setup(jQuery);
	run();
};

window.cwmElementSelector = {
	main: main
};

}(window));