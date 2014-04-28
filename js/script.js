(function(window, $, undefined){

if (!SimpleHistory.supported) {
	return;
}

var $body = $('body');
var $main = $('#main');
var $title = $('title');
var has_transitionend = ('ontransitionend' in window);
var $div = $('<div/>');
var path;

var onunload = function() {
	$div.load(path + ' #main, title', function() {
		$main.html($div.find('#main').html());
		$title.html($div.find('title').html());

		if ( has_transitionend ) {
			$main
				.unbind('transitionend', onunload)
				.addClass('unloaded')
				.removeClass('loading')
				;

			setTimeout(function() {
				$main.removeClass('unloaded');
			}, 0);
		}
	});
};

var load_page = function(path) {
	if ( has_transitionend ) {
		$main.bind('transitionend', onunload)
		.addClass('loading')
		;
	} else {
		onunload();
	}
};

$body
	.delegate('a[href^="/"]', 'click', function(e) {
		if (event.metaKey || event.shiftKey || event.ctrlKey) {
			return;
		}

		event.preventDefault();
		path = $(event.target).attr("href");
		SimpleHistory.pushState(event.target.href);
	});

SimpleHistory.start(function(path) {
	load_page(path);
});

})(window, jQuery);
