(function() {
	var $board;
	var $board_wrapper;
	var $board_canvas;
	var $lanes;
	var $content;
		
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

			var css = '<link rel="stylesheet" id="trello-swimlane-navifation-css"/>';
			$css = $(css)
				.appendTo('head');

			$css.attr({href: window.cwmBookmarkletUrl + '/trello-swimlane-navifation.css?1'});

			if ( !$content.length || !$board.length || !$board_wrapper.length || !$lanes.length || !$board_canvas.length ) {
				setTimeout(show_menu, 500);
				return;
			}
			
			var $lane_menu = $('<menu/>').addClass('lane-menu');
			
			$lanes.each(function() {
				var $this = $(this);
				var name = $this.find('.list-header-name').text();
				var $button = $('<button/>').html(name);
				$button.data('target', $this);
			
				$lane_menu.append($button);
			});
			
			//$board.prepend($lane_menu);
			$content.prepend($lane_menu);
			
			$content.css('padding-left', $lane_menu.width());
			
			$lane_menu.delegate('button', 'click', function(e) {
				e.preventDefault();
				var $this = $(this);
				var $list = $this.data('target');
				var scrollTo = $list.position().left + $board.scrollLeft();
				$board.animate({scrollLeft: scrollTo}, 'fast');
				localStorage.setItem("scrollToLeft", scrollTo);
			});
			
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
		})})(window.jQuery);
	};
	
	show_menu();
})();