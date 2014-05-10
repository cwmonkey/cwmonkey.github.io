(function(window, $, undefined){

var $body = $('body');

/* Nav dropdown */
$body
	.delegate('#secondary .item', 'mouseenter focusin', function() {
		var $this = $(this);
		$this.addClass('has_focus');
	})
	.delegate('#secondary .item', 'mouseleave focusout', function() {
		var $this = $(this);
		$this.removeClass('has_focus');
	})
	.delegate('#secondary .item', 'click', function() {
		var $this = $(this);
		$this.closest('.has_focus').removeClass('has_focus');
	})
	;
/* /Nav dropdown */

/* Faux ajax */
if (!SimpleHistory.supported) {
	return;
}

var $main = $('#main');
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
