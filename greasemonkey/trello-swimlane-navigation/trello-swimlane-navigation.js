(function() {
	var $board;
	var $board_wrapper;
	var $board_canvas;
	var $lanes;
	var $content;
	var $list_cards;
	var $trello_swimlane_navigation_css;
	var scroll_bound = false;
		
	var css = '<link rel="stylesheet" id="trello-swimlane-navigation-css"/>';
	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/trello-swimlane-navigation.css?1'});

	var show_menu = function() {
		if ( typeof jQuery == 'undefined' ) {
			setTimeout(show_menu, 500);
			return;
		}
		(function($) { $(function() {
			$board = $('#board');
			$board_canvas = $('.board-canvas');
			$content = $('#content');
			$board_wrapper = $('.board-wrapper');
			$lanes = $board.find('.list');
			$list_cards = $board.find('.list-card');
			$trello_swimlane_navigation_css = $('#trello-swimlane-navigation-css');

			if ( !$trello_swimlane_navigation_css.length || $trello_swimlane_navigation_css.css('content') != 'loaded' || !$content.length || !$board_wrapper.length || !$board_canvas.length || !$board.length || !$lanes.length || !$list_cards.length ) {
				setTimeout(show_menu, 500);
				return;
			}
			
			var $lane_menu = $('<menu/>').addClass('lane-menu');
			
			$lanes.each(function() {
				var $this = $(this);
				var name = $this.find('.list-header-name').text();
				if ( !name ) return;
				var $button = $('<button/>').html(name);
				$button.data('target', $this);
			
				$lane_menu.append($button);
			});
			
			//$board.prepend($lane_menu);
			$content.prepend($lane_menu);
			
			var width = $lane_menu.width();

			$content.css({
				'padding-left': width + 10
			});
			
			$lane_menu.delegate('button', 'click', function(e) {
				e.preventDefault();
				var $this = $(this);
				var $list = $this.data('target');
				var scrollTo = $list.position().left + $board.scrollLeft();
				$board.animate({scrollLeft: scrollTo}, 'fast');
				localStorage.setItem("scrollToLeft", scrollTo);
			});

			if ( !scroll_bound ) {
				scroll_bound = true;
				var scrolling = false;
				$board.bind('scroll', function() {
					if ( scrolling ) return;
					scrolling = true;
					setTimeout(function() {
						localStorage.setItem("scrollToLeft", $board.scrollLeft());
						scrolling = false;
					}, 100);
				});

				var scrollToLeft = localStorage.getItem('scrollToLeft');
				if ( scrollToLeft ) $board.animate({scrollLeft: scrollToLeft}, 'fast');
			}

			var check_me = setInterval(function() {
				if ( !$lane_menu.parent().length ) {
					$lane_menu.remove();
					clearInterval(check_me);
					show_menu();
				}
			}, 500);
		})})(window.jQuery);
	};

	show_menu();
})();