(function(window, $, undefined){

$('html').removeClass('no-js').addClass('js');

var $body = $('body');

/* Nav dropdown */
var nav_focus_TO;
var nav_unfocus_TO;
$body
	.delegate('#secondary .item', 'mouseenter focusin', function() {
		var $this = $(this);
		clearTimeout(nav_focus_TO);
		nav_focus_TO = setTimeout(function() {
			$this
				.removeClass('has_no_focus')
				.addClass('has_focus');
		}, 0);
	})
	.delegate('#secondary .item', 'mouseleave focusout', function() {
		var $this = $(this);
		clearTimeout(nav_unfocus_TO);
		nav_unfocus_TO = setTimeout(function() {
			$this
				.removeClass('has_focus')
				.addClass('has_no_focus');
		}, 0);
	})
	.delegate('#secondary .item', 'click', function() {
		var $this = $(this);
		$this.closest('.has_focus')
			.removeClass('has_focus')
			.addClass('has_no_focus');
	})
	;
/* /Nav dropdown */

/* Faux ajax */
if (!SimpleHistory.supported) {
	return;
}

var $main = $('#main').attr('tabIndex', '-1');
var $title = $('title');
var $div = $('<div/>');
var path;

var load_page = function(path) {
	$.when(
		$.load($div, path + ' #main, title'),
		$.addClassWait($main, 'loading')
	)
	.done(function() {
		$main.html($div.find('#main').html());
		$title.html($div.find('title').html());

		$main
			.addClass('unloaded')
			.removeClass('loading')
			.removeClass('unloaded')
			.focus()
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
