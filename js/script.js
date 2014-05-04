(function(window, $, undefined){

var $body = $('body');

/* Nav dropdown */
if ( false ) {
$body
	.delegate('#secondary .item', 'mouseover focusin', function() {
		var $this = $(this);
		$this.addClass('has_focus');
	})
	.delegate('#secondary .item', 'mouseout focusout', function() {
		var $this = $(this);
		$this.removeClass('has_focus');
	})
	.delegate('#secondary .item', 'click', function() {
		var $this = $(this);
		$this
			.addClass('click')
			.removeClass('click')
			;
	})
	;
}
/* /Nav dropdown */

/* Faux ajax */
if (!SimpleHistory.supported) {
	return;
}

var $main = $('#main');
var $title = $('title');
var $div = $('<div/>');
var path;

/* addClassWait:
	returns a jQuery promise after adding a class which is resolved when animation is done */

// TODO: broswer prefixes
var has_transitionend = ('ontransitionend' in window);

$.fn.addClassWait = function(name) {
	var $el = this;
	var deferred = new $.Deferred();
	// TODO: broswer prefixes
	var duration = parseFloat($el.css('transition-duration'));

	if ( !has_transitionend || isNaN(duration) || !duration ) {
		this.addClass(name);
		deferred.resolve();
		return deferred;
	}

	var transitionender = function() {
		// TODO: broswer prefixes
		$el.unbind('transitionend', transitionender);
		deferred.resolve();
	};

	$el
		.bind('transitionend', transitionender)
		.addClass(name);

	return deferred;
}
/* /addClassWait */

/* jQuery.fn.load wrapper which returns a promise */
$.load =  function($el, path) {
	var deferred = new $.Deferred();

	$div.load(path, function() {
		deferred.resolve();
	});

	return deferred;
};

var load_page = function(path) {
	$.when(
		$.load($div, path + ' #main, title'),
		$main.addClassWait('loading')
	)
	.done(function() {
		$main.html($div.find('#main').html());
		$title.html($div.find('title').html());

		$main
			.addClass('unloaded')
			.removeClass('loading')
			$main.removeClass('unloaded');
			;

		// Analytics
		ga('send', 'pageview', path);
	});
};

$body
	.delegate('a[href^="/"]', 'click', function(event) {
		if (event.metaKey || event.shiftKey || event.ctrlKey) {
			return;
		}

		event.preventDefault();
		path = $(event.target).attr("href");

		SimpleHistory.pushState(event.target.href);
	})
	.delegate('#secondary .headline a', 'click', function(event) {
		event.preventDefault();

		if ( $body.is('.navopen') ) {
			$body.removeClass('navopen');
		} else {
			$body.addClass('navopen');
		}
	})
	.delegate('#secondary .list a', 'click', function(event) {
		$body.removeClass('navopen');
	})
	;

SimpleHistory.start(function(path) {
	load_page(path);
});
/* /Faux ajax */

})(window, jQuery);
