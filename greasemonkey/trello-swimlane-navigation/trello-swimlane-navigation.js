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

	// Complete a promise when a selector exists
	var exists = function(selector, wait) {
		var promise = new $.Deferred();

		var check = function() {
			if ( $(selector).length ) {
				promise.resolve();
			} else {
				setTimeout(check, wait || 100);
			}
		};

		setTimeout(check, wait || 100);

		return promise;
	};

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
			
			var $lane_menu = $('<div/>')
				.addClass('lane-menu u-fancy-scrollbar')
				;

			var $lane_nav = $('<menu/>')
				.addClass('lane-menu-nav')
				.appendTo($lane_menu)
				;

			var $lane_headline = $('<h2/>')
				.addClass('lane-menu-headline')
				.html('Navigation')
				.appendTo($lane_nav)
				;

			var hide_lane_nav_menu = function() {
				$lane_nav.addClass('lane-menu-hidden');
				localStorage.setItem('hide_lane_nav:' + get_id(), 1);
			};

			var $lane_hide = $('<button/>')
				.html('(Hide)')
				.addClass('lane-menu-hide')
				.bind('click', hide_lane_nav_menu)
				.appendTo($lane_headline)
				;

			var $lane_show = $('<button/>')
				.html('(Show)')
				.addClass('lane-menu-show')
				.bind('click', function() {
					$lane_nav.removeClass('lane-menu-hidden');
					localStorage.removeItem('hide_lane_nav:' + get_id());
				})
				.appendTo($lane_headline)
				;

			var hide_lane_nav = localStorage.getItem('hide_lane_nav:' + get_id());

			if ( hide_lane_nav ) {
				hide_lane_nav_menu();
			}

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

				var $button = $('<button/>').addClass('lane-menu-nav-item').html('<span class="lane-menu-name">' + name + '</span>');
				if ( $img.length ) $button.prepend($img.eq(0).clone());
				$button.data('target', $this);

				if ( order ) {
					buttons[name] = $button;
				} else {
					$lane_nav.append($button);
				}
			});

			// If order has been set place the buttons in that order and dump any new ones at the bottom
			if ( order ) {
				for ( var i = 0; i < order.length; i++ ) {
					var $button = buttons[order[i]];
					$lane_nav.append($button);
					buttons[order[i]] = '';
				}

				for ( var prop in buttons ) {
					if ( buttons.hasOwnProperty(prop) && buttons[prop] != '' ){
						$lane_nav.append(buttons[prop]);
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
			$lane_nav
				.delegate('.lane-menu-nav-item', 'click', function(e) {
					e.preventDefault();
					var $this = $(this);
					var $list = $this.data('target');
					var scrollTo = $list.position().left + $board.scrollLeft();
					$board.animate({scrollLeft: scrollTo}, 'fast');
					localStorage.setItem('scrollToLeft', scrollTo);
				})
				.sortable({
					items: '> .lane-menu-nav-item',
					cancel: '',
					stop: function() {
						var $buttons = $lane_menu.find('.lane-menu-nav-item');
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

					$('.list-card:has([title$="(' + i + ')"])')
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

				// Labels
				var labels_filtered = false;

				$('.list-card').removeClass('lane-menu-label-filters-show');

				for ( i in labels ) {
					labels_filtered = true;

					$('.list-card:has([title="' + i + '"])')
						.addClass('lane-menu-label-filters-show')
						;
				}

				if ( labels_filtered ) {
					$board.addClass('lane-menu-label-filters-filtered');
				} else {
					$board.removeClass('lane-menu-label-filters-filtered');
				}

				localStorage.setItem('filter_labels:' + get_id(), JSON.stringify(labels));
			};

			/*var $headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Filters')
				.appendTo($lane_menu)
				;

			var $clear_filters = $('<button>(Clear All Filters)</button>').bind('click', function() {
				members = {};
				lanes = {};
				labels = {};
				$('.lane-menu-member-filters-member').removeClass('lane-menu-member-filters-active');
				$('.lane-menu-lane-filters-lane').removeClass('lane-menu-lane-filters-active');
				$('.list:not(.mod-add)').removeClass('lane-menu-member-filters-hide');
				$('.lane-menu-label-filters-label').removeClass('lane-menu-label-filters-active');

				update_filters();
			})
			.appendTo($headline);*/

			//////////////////
			// Members
			////////////////
			var $members = $('.board-widget-members .member :first-child');
			var $member_filters = $('<menu/>')
				.addClass('lane-menu-member-filters')
				.appendTo($lane_menu)
				;

			var $members_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Member Filters')
				.appendTo($member_filters)
				;

			var $members_clear_filters = $('<button>(Clear)</button>').bind('click', function() {
				members = {};
				$('.lane-menu-member-filters-member').removeClass('lane-menu-member-filters-active');
				$('.list:not(.mod-add)').removeClass('lane-menu-member-filters-hide');

				update_filters();
			})
			.appendTo($members_headline);

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
			var $lane_filters = $('<menu/>')
				.addClass('lane-menu-lane-filters')
				.appendTo($lane_menu)
				;

			var $lanes_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Lane Filters')
				.appendTo($lane_filters)
				;

			var $lanes_clear_filters = $('<button>(Clear)</button>').bind('click', function() {
				lanes = {};
				$('.lane-menu-lane-filters-lane').removeClass('lane-menu-lane-filters-active');

				update_filters();
			})
			.appendTo($lanes_headline);

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
			// Labels
			////////////////
			$label_filters = $('<menu/>')
				.addClass('lane-menu-label-filters')
				.insertBefore($lane_filters)
				;

			var $labels_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Label Filters')
				.appendTo($label_filters)
				;

			var $labels_filters = $('<button>(Clear)</button>').bind('click', function() {
				labels = {};
				$('.lane-menu-label-filters-label').removeClass('lane-menu-label-filters-active');

				update_filters();
			})
			.appendTo($labels_headline);

			var labels = localStorage.getItem('filter_labels:' + get_id());
			if ( !labels ) {
				labels = {};
			} else {
				labels = JSON.parse(labels);
			}

			var do_label_filters = function() {
				// Filter delegates
				$label_filters
					.delegate('.lane-menu-label-filters-label', 'click', function() {
						var $this = $(this);
						var name = $this.text().replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

						if ( $this.is('.lane-menu-label-filters-active') ) {
							$this.removeClass('lane-menu-label-filters-active');
							delete labels[name];
						} else {
							$this.addClass('lane-menu-label-filters-active');
							labels[name] = true;
						}

						update_filters();
					})
					;
			};

			$.when(exists('.edit-labels-pop-over .card-label', 1000)).then(function() {
				var $card_labels = $('.js-labels-list .card-label');

				$card_labels.each(function() {
					var $label = $(this).clone().addClass('lane-menu-label-filters-label');
					// var idlabel = $label.data('idlabel');
					var name = $label.text().replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
					if ( labels[name] ) {
						$label.addClass('lane-menu-label-filters-active');
					}
					$label.find('*').detach();
					$label_filters.append($label);
				});

				$('.js-pop-widget-view').click();

				do_label_filters();

				first_time();
			});

			$('.js-open-labels').click();

			//////////////////
			// First time
			////////////////

			var first_time = function() {
				var update_filters_timeout;
				$board.bind('DOMNodeInserted DOMNodeRemoved', function(e) {
					if ( e.target.className.match(/js-member-on-card-menu/) || e.target.className.match(/list-card/) ) {
						clearTimeout(update_filters_timeout);
						update_filters_timeout = setTimeout(update_filters, 1000);
					}
				})
				;

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

				update_filters();
			}
		})})(window.jQuery);
	};

	show_menu();
})();