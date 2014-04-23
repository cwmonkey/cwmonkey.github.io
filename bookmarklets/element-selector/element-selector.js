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
	$selector.html(get_selector($this));
	$this.addClass('element-selector-hover');
};

var mouseout = function(e) {
	var $this = $(this);
	e.stopPropagation();
	$this.removeClass('element-selector-hover');
};

var click = function(e) {
	var $this = $(this);
	e.stopPropagation();
	e.preventDefault();
	$this.removeClass('element-selector-hover');
	undelegate();

	var $input = $('<input type="text"/>')
		.val(get_selector($this))
		.bind('blur', function() {
			$selector.empty().hide();
		});
	$selector.empty().append($input);
	$input.focus().select();
};

var mouseover_selector = function() {
	var $this = $(this);
	if ( $this.is('.element-selector-hovered') ) {
		$this.removeClass('element-selector-hovered');
	} else {
		$this.addClass('element-selector-hovered');
	}
};

var undelegate = function() {
	$body
		.undelegate(':not(#element-selector-selector)', 'mouseover', mouseover)
		.undelegate(':not(#element-selector-selector)', 'mouseout', mouseout)
		.undelegate(':not(#element-selector-selector)', 'click', click)
		.undelegate('#element-selector-selector', 'mouseover', mouseover_selector)
		;

	running = false;
};

var get_selector = function($this, buffer) {
	buffer = buffer || [];
	if ( $this.is('[id]') ) {
		return '#' + $this.attr('id') + ' ' + buffer.join(' ');
	}

	var classes = '';
	if ( $this[0].className ) {
		classes = '.' + $this[0].className.split(' ').join('.');
	}
	buffer.unshift($this[0].tagName + classes);

	var $parent = $this.parent();
	if ( !$parent.length || $parent[0].tagName == 'BODY' ) {
		return buffer.join(' ');
	}

	// Recursion
	return get_selector($parent, buffer);
}

var setup = function(jQuery) {
	$ = jQuery;

	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/element-selector.css?' + new Date().getTime()});

	$body = $('body');
	$selector = $('<div/>')
		.attr({id: 'element-selector-selector'})
		.appendTo($body);
};

var run = function() {
	running = true;

	$body
		.delegate(':not(#element-selector-selector)', 'mouseover', mouseover)
		.delegate(':not(#element-selector-selector)', 'mouseout', mouseout)
		.delegate(':not(#element-selector-selector)', 'click', click)
		.delegate('#element-selector-selector', 'mouseover', mouseover_selector)
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