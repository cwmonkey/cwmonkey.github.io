(function() {
	var $board;
	var $board_wrapper;
	var $board_canvas;
	var $lanes;
	var $content;
	var $list_cards;
	var $trello_swimlane_navigation_css;
	var scroll_bound = false;

	// Add menu styling
	var css = '<link rel="stylesheet" id="trello-swimlane-navigation-css"/>';
	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/trello-swimlane-navigation.css?1'});

	var show_menu = function() {
		// Make sure jQuery is loaded before continuing
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

			// Make sure board stuff exists before continuing
			if ( !$trello_swimlane_navigation_css.length || $trello_swimlane_navigation_css.css('content') != 'loaded' || !$content.length || !$board_wrapper.length || !$board_canvas.length || !$board.length || !$lanes.length || !$list_cards.length ) {
				setTimeout(show_menu, 500);
				return;
			}
			
			var $lane_menu = $('<menu/>').addClass('lane-menu');
			
			// For each lane, make a button and toss it in the menu
			$lanes.each(function() {
				var $this = $(this);
				var name = $this.find('.list-header-name').text();
				if ( !name ) return;
				var $button = $('<button/>').html(name);
				$button.data('target', $this);
			
				$lane_menu.append($button);
			});
			
			// Add menu to content div
			$content.prepend($lane_menu);

			// Move board over so menu can stay on top
			var width = $lane_menu.width();
			$content.css({
				'padding-left': width + 10
			});

			// Set up events on buttons to scroll to swim lanes
			$lane_menu.delegate('button', 'click', function(e) {
				e.preventDefault();
				var $this = $(this);
				var $list = $this.data('target');
				var scrollTo = $list.position().left + $board.scrollLeft();
				$board.animate({scrollLeft: scrollTo}, 'fast');
				localStorage.setItem("scrollToLeft", scrollTo);
			});

			// Remember last scroll position
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

				// Scroll to last position
				var scrollToLeft = localStorage.getItem('scrollToLeft');
				if ( scrollToLeft ) $board.animate({scrollLeft: scrollToLeft}, 'fast');
			}

			// Check to see if the board has been changed and start over if so
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