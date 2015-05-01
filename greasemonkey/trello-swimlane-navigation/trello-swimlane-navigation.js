(function() {
	var $board;
	var $board_wrapper;
	var $board_canvas;
	var $lanes;
	var $content;
	var $list_cards;
	var $trello_swimlane_navigation_css;
	var scroll_bound = false;
	var $body = $('body');
	var hide;

	// Add menu styling
	var css = '<link rel="stylesheet" id="trello-swimlane-navigation-css"/>';
	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/trello-swimlane-navigation.css?2'});

	var get_id = function() {
		return document.location.pathname.split('/')[2];
	};

	$body
		.delegate('.lane-menu-toggle', 'click', function(e) {
			e.preventDefault();
			if ( $content.is('.lane-menu-hide') ) {
				$content.removeClass('lane-menu-hide');
				localStorage.removeItem('lane-menu-hide');
			} else {
				$content.addClass('lane-menu-hide');
				localStorage.setItem('lane-menu-hide', 1);
			}
		})
		;

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
			hide = localStorage.getItem('lane-menu-hide');
			if ( hide ) {
				$content.addClass('lane-menu-hide');
			}
			$board_wrapper = $('.board-wrapper');

			$('.js-show-extra-members').trigger('click');

			$lanes = $board.find('.list');
			$list_cards = $board.find('.list-card');
			$trello_swimlane_navigation_css = $('#trello-swimlane-navigation-css');

			// Make sure board stuff exists before continuing
			if ( !$trello_swimlane_navigation_css.length || ($trello_swimlane_navigation_css.css('content') != 'loaded' && $trello_swimlane_navigation_css.css('content') != '"loaded"') || !$content.length || !$board_wrapper.length || !$board_canvas.length || !$board.length || !$lanes.length || !$list_cards.length ) {
				setTimeout(show_menu, 500);
				return;
			}
			
			var $lane_menu = $('<menu/>')
				.addClass('lane-menu u-fancy-scrollbar')
				;

			var order = localStorage.getItem('order:' + get_id());
			var buttons = null;

			if ( order ) {
				order = JSON.parse(order);
				buttons = {};
			}

			$members = $('.board-widget-members');

			// For each lane, make a button and toss it in the menu
			$lanes.each(function() {
				var $this = $(this);
				var name = $this.find('.list-header-name').text();
				if ( !name ) return;

				// Try to match the names to the avatar and add it to the nav button
				var words = name.split(/[ \-]/);
				var first = words[0];

				var $img = $members.find('img[alt^="' + name + '"], img[alt^="' + name.toLowerCase() + '"], .member-initials[title^="' + name + '"], .member-initials[title^="' + name.toLowerCase() + '"]');

				if ( !$img.length ) {
					$img = $members.find('img[alt^="' + first + '"], img[alt^="' + first.toLowerCase() + '"], .member-initials[title^="' + first + '"], .member-initials[title^="' + first.toLowerCase() + '"]');
				}

				var $button = $('<button/>').html('<span class="lane-menu-name">' + name + '</span>');
				if ( $img.length ) $button.prepend($img.eq(0).clone());
				$button.data('target', $this);

				if ( order ) {
					buttons[name] = $button;
				} else {
					$lane_menu.append($button);
				}
			});

			// If order has been set place the buttons in that order and dump any new ones at the bottom
			if ( order ) {
				for ( var i = 0; i < order.length; i++ ) {
					var $button = buttons[order[i]];
					$lane_menu.append($button);
					buttons[order[i]] = '';
				}

				for ( var prop in buttons ) {
					if ( buttons.hasOwnProperty(prop) && buttons[prop] != '' ){
						$lane_menu.append(buttons[prop]);
					}
				}
			}

			// Add menu to content div
			var $lane_menu_wrapper = $('<div/>').addClass('lane-menu-wrapper');

			$lane_menu_wrapper
				.append('<a href="#" class="lane-menu-toggle dark-hover js-hide-sidebar" title="Show/hide swimlane navbar."><span class="icon-sm icon-forward lane-menu-open"></span><span class="icon-sm icon-forward lane-menu-closed"></span></a>')
				.append($lane_menu)
				;

			$content.prepend($lane_menu_wrapper);

			// Set up events on buttons to scroll to swim lanes
			$lane_menu
				.delegate('button', 'click', function(e) {
					e.preventDefault();
					var $this = $(this);
					var $list = $this.data('target');
					var scrollTo = $list.position().left + $board.scrollLeft();
					$board.animate({scrollLeft: scrollTo}, 'fast');
					localStorage.setItem('scrollToLeft', scrollTo);
				})
				.sortable({
					items: '> button',
					cancel: '',
					stop: function() {
						var $buttons = $lane_menu.find('button');
						var order = [];
						$buttons.each(function() {
							var $button = $(this);
							order.push($button.find('.lane-menu-name').text());
						});

						localStorage.setItem('order:' + get_id(), JSON.stringify(order));
					}
				})
				.disableSelection()
				;

			// Remember last scroll position
			if ( !scroll_bound ) {
				scroll_bound = true;
				var scrolling = false;
				$board.bind('scroll', function() {
					if ( scrolling ) return;
					scrolling = true;
					setTimeout(function() {
						localStorage.setItem('scrollToLeft', $board.scrollLeft());
						scrolling = false;
					}, 100);
				});

				// Scroll to last position
				var scrollToLeft = localStorage.getItem('scrollToLeft');
				if ( scrollToLeft ) $board.animate({scrollLeft: scrollToLeft}, 'fast');
			}

			////////////////////////////////////////////////////////////////////////////////////////
			// Filters ////////////////////////////////////////////////////////////////////////////
			//////////////////////////////////////////////////////////////////////////////////////

			// Show/hide cards
			var update_filters = function() {
				// Members
				var members_filtered = false;

				$('.list-card').removeClass('lane-menu-member-filters-show');

				for ( i in members ) {
					members_filtered = true;

					$('.list-card:has(img[title$="(' + i + ')"])')
						.addClass('lane-menu-member-filters-show')
						;
				}

				if ( members_filtered ) {
					$board.addClass('lane-menu-member-filters-filtered');
				} else {
					$board.removeClass('lane-menu-member-filters-filtered');
				}

				localStorage.setItem('filter_members:' + get_id(), JSON.stringify(members));

				// Lanes
				var lanes_filtered = false;

				$('.lane').removeClass('lane-menu-member-filters-hide');

				for ( i in lanes ) {
					lanes_filtered = true;
					break;
				}

				if ( lanes_filtered ) {
					$board.addClass('lane-menu-lane-filters-filtered');
				} else {
					$board.removeClass('lane-menu-lane-filters-filtered');
				}

				localStorage.setItem('filter_lanes:' + get_id(), JSON.stringify(lanes));
			};

			//////////////////
			// Members
			////////////////
			var $headline = $('<h2>').addClass('lane-menu-headline').html('Filters');
			var $members = $('.board-widget-members .member :first-child');
			var $member_filters = $('<div/>').addClass('lane-menu-member-filters');

			var members = localStorage.getItem('filter_members:' + get_id());
			if ( !members ) {
				members = {};
			} else {
				members = JSON.parse(members);
			}

			// Add members to filters
			$members.each(function() {
				var name = this.title.match(/\(([^\)]+)\)$/)[1];
				var $member = $('<div/>')
					.addClass('lane-menu-member-filters-member')
					.append($(this).clone().attr('class', ''))
					.data('name', name)
					;

				if ( members[name] ) {
					$member.addClass('lane-menu-member-filters-active');
				}

				$member_filters.append($member);
			});

			$lane_menu
				.append($headline, $member_filters)
				;

			// Filter delegates
			$member_filters
				.delegate('.lane-menu-member-filters-member', 'click', function() {
					var $this = $(this);
					var name = $this.data('name');

					if ( $this.is('.lane-menu-member-filters-active') ) {
						$this.removeClass('lane-menu-member-filters-active');
						delete members[name];
					} else {
						$this.addClass('lane-menu-member-filters-active');
						members[name] = true;
					}

					update_filters();
				})
				;

			///////////////////
			// Lanes
			/////////////////
			var $lanes = $('.list:not(.mod-add)');
			var $lane_filters = $('<div/>').addClass('lane-menu-lane-filters');

			var lanes = localStorage.getItem('filter_lanes:' + get_id());
			if ( !lanes ) {
				lanes = {};
			} else {
				lanes = JSON.parse(lanes);
			}

			// Add members to filters
			$lanes.each(function() {
				var $this = $(this);
				var id = 'lane' + (new Date()).getTime();
				$this.data('laneid', id);
				var name = $this.find('.list-header-name').text();

				var $lane = $('<div/>')
					.addClass('lane-menu-lane-filters-lane')
					.html(name)
					.data('lane', $this)
					;

				if ( lanes[name] ) {
					$lane.addClass('lane-menu-lane-filters-active');
					$this.addClass('lane-menu-member-filters-hide');
				}

				$lane_filters.append($lane);
			});

			$lane_menu
				.append($lane_filters)
				;

			// Filter delegates
			$lane_filters
				.delegate('.lane-menu-lane-filters-lane', 'click', function() {
					var $this = $(this);
					var $lane = $this.data('lane');
					var id = $lane.find('.list-header-name').text();

					if ( $this.is('.lane-menu-lane-filters-active') ) {
						$lane.removeClass('lane-menu-member-filters-hide');
						$this.removeClass('lane-menu-lane-filters-active');
						delete lanes[id];
					} else {
						$lane.addClass('lane-menu-member-filters-hide');
						$this.addClass('lane-menu-lane-filters-active');
						lanes[id] = true;
					}

					update_filters();
				})
				;

			//////////////////
			// First time
			////////////////
			update_filters();

			// Move board over so menu can stay on top
			var width = $lane_menu_wrapper.width();
			$content.css({
				'padding-left': width + 10
			});

			$lane_menu_wrapper.css({
				left: (width + 10) * -1
			});

			// Check to see if the board has been changed and start over if so
			var check_me = setInterval(function() {
				if ( !$lane_menu_wrapper.parent().length ) {
					$lane_menu_wrapper.remove();
					clearInterval(check_me);
					show_menu();
				}
			}, 500);
		})})(window.jQuery);
	};

	show_menu();
})();