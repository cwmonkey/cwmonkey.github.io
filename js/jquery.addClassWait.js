/* jQuery.addClassWait:
	returns a jQuery promise after adding a class which is resolved when animation is done
*/

(function(window, $, undefined) {

// TODO: broswer prefixes
var has_transitionend = ('TransitionEvent' in window);

$.addClassWait = function($el, name) {
	var deferred = new $.Deferred();
	var duration = parseFloat($el.css('transition-duration'));

	if ( !has_transitionend || isNaN(duration) || !duration ) {
		$el.addClass(name);
		deferred.resolve();
		return deferred;
	}

	var transitionender = function() {
		// TODO: broswer prefixes
		$el.unbind('transitionend', transitionender);
		deferred.resolve();
	};

	$el
		// TODO: broswer prefixes
		.bind('transitionend', transitionender)
		.addClass(name);

	return deferred;
}

})(window, jQuery);