/*!
	floatLabels.js v1.0 - 2014-08-23
	A jQuery (and Zepto) form "float label" plugin.
	(c) 2014 Gerald Burns <geraldb@gmail.com> 
	license: https://github.com/cwmonkey/floatLabels.js/blob/master/LICENSE.md
*/

(function($, undefined) {
'use strict';

var defaults = {
	// Wrapper class, otherwise .parent() will be used
	wrapper: null,
	// input selector
	input: 'input, textarea',
	// class to be added to inputs with values
	filledClass: 'filled',
	// Removes placeholder from inputs
	removePlaceholder: true,
	// Prepend for added classes
	prepend: 'js-float-labels-',
	// Filter out inputs which would get messed up by floating labels, add your own if this list gets out of date
	filter: '[type="submit"], [type="hidden"], [type="image"], [type="button"], [type="image"], [type="date"]'
};

// Adds a filled class to an input's wrapper
var update_input = function(input, settings, add_parent_class) {
	add_parent_class = add_parent_class || false;

	var $input = $(input);
	if ( $input.is(settings.filter) ) {
		return;
	}

	var $wrapper = (settings.wrapper) ? $input.closest(settings.wrapper) : $input.parent();

	if ( !$wrapper.length ) {
		return;
	}

	// Compensate for no labels
	var $label = $wrapper.find('label');
	if ( !$label.length ) {
		// Compensate for no id
		var id = input.id || $input.attr('id', settings.prepend + 'input-' + (new Date()).getTime()).attr('id');
		$label = $('<label/>')
			.html(input.placeholder || input.name)
			.attr('for', id)
			;
		$wrapper.prepend($label);
	}

	if ( settings.removePlaceholder ) {
		$input.attr({placeholder: ''});
	}

	setTimeout(function() {
		if ( $input.val() !== '' ) {
			$wrapper.addClass(settings.filledClass);
		} else {
			$wrapper.removeClass(settings.filledClass);
		}
	}, 0);

	if ( add_parent_class ) {
		$wrapper.addClass(settings.prepend + 'wrapper');
	}
};

// delegated inputs
var delegates = [];

// plugin
$.fn.floatLabels = function(params) {
	var settings = $.extend({}, defaults, params);
	var $this = $(this);

	var fn = function() {
		update_input(this, settings);
	};

	var key = $this.selector + '|' + settings.input;

	// Don't double up on events
	if ( delegates[key] !== undefined ) {
		$this.undelegate(settings.input, 'focus change keydown blur', delegates[key]);
	}

	delegates[key] = fn;

	$this
		// Note: if the input's value is updated with js a change event must be triggered (.change())
		.delegate(settings.input, 'focus change keydown blur', fn)
		;

	var $inputs = ( settings.wrapper ) ? $this.find(settings.wrapper).find(settings.input) : $this.find(settings.input);

	$inputs.each(function() {
		update_input(this, settings, true);
	})
	;

	return $this;
};

})(window.jQuery || window.Zepto || window.$);