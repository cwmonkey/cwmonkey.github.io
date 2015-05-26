(function() {
	var $window = $(window);
	var $board;
	var $board_wrapper;
	var $board_canvas;
	var $lanes;
	var $content;
	var $list_cards;
	var $trello_swimlane_navigation_css;
	var scroll_bound = false;
	var $body;
	var hide;

	// Add menu styling
	var css = '<link rel="stylesheet" id="trello-swimlane-navigation-css"/>';
	$css = $(css)
		.appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/trello-swimlane-navigation.css?2'});

	var get_id = function() {
		var parts = document.location.pathname.split('/');

		if ( parts[1] != 'b' ) {
			return null;
		}

		return parts[2];
	};

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

		(function($) {$(function() {
			////////////////////
			// Tooltip plugin
			///////////////////

			if ( !$.fn.tooltip ) {
/*

Add accessible tooltips.

Example: $('[title]').tooltip();

TODO:
  Allow for delegates other than body.
  Add previous selectors to a single delegate bind.
  Param class/id names.
  Find highest zIndex?

*/

;(function($, undefined) {

var $body = $('body');
var $window = $(window);
var id_name = 'tooltip';
var class_name = 'tooltip';
var show_class = 'tooltipShown';

var $tooltip = $('<span/>')
  .addClass(class_name)
  .attr('id', id_name)
  .css({
    position: 'absolute'
  })
  ;

var $tooltip_text = $('<span/>')
	.addClass(class_name + '-text')
	.appendTo($tooltip)
	;

var $tooltip_arrow = $('<span/>')
	.addClass(class_name + '-arrow')
	.appendTo($tooltip)
	;

var adjust_timeout;
var show_tooltip = function() {
  var $this = $(this);
  var title = $this.data('title') || this.title;

  if ( !title ) {
    return;
  }

  clearTimeout(hide_timeout);

  $tooltip_text.html(title);

  $this
    .data('title', title)
    .attr({
      'title': '',
      'aria-describedby': id_name
    })
    ;

  $tooltip
  	.css({
  		left: '',
  		width: ''
  	});

  var offset = $this.offset();
  var this_width = $this.outerWidth();
  var this_height = $this.outerHeight();

  $tooltip
    .appendTo($body);

  var tooltip_width = $tooltip.outerWidth();
  $tooltip.css('width', tooltip_width);

	var left = offset.left + this_width / 2 - tooltip_width / 2;
	if ( left < 0 ) {
		$tooltip_arrow.css('left', left);
		left = 0;
	} else {
		$tooltip_arrow.css('left', 0);
	}

  $tooltip
    .css({
      left: left,
      top: offset.top + this_height
    })
    .addClass(show_class)
    ;


  if ( left + $tooltip.outerWidth() > $window.width() ) {
  	var off = (left + $tooltip.outerWidth()) - $window.width();
  	$tooltip.css('left', left - off);
  	$tooltip_arrow.css('left', off);
  }
};

var hide_timeout;
var hide_tooltip = function() {
  var $this = $(this);
  clearTimeout(hide_timeout);
  hide_timeout = setTimeout(function() {
    $this.attr('aria-describedby', '');
    $tooltip.removeClass(show_class);
  }, 10);
};

// Plugin
$.fn.tooltip = function() {
  var selector = this.selector;
  var init = function() {
    var ignore_next = false;
    $body
      /*.delegate(selector, 'mouseenter focus', show_tooltip)
      .delegate(selector, 'mouseleave blur click mousedown mouseup', hide_tooltip)*/
      .bind('mousemove', function(e) {
      	if ( ignore_next ) {
      		ignore_next = false;
      		return;
      	}

      	var $closest = $(e.target).closest(selector);
      	if ( !$closest.length ) {
      		hide_tooltip();
      	} else {
      		show_tooltip.call($closest[0]);
      	}
      })
      .bind('mousedown mouseup', function() {
      	ignore_next = true;
      	hide_tooltip();
      })
      ;
  };

  // In case this was called before the end of the document
  if ( !$body.length ) {
    $(function() {
      init();
    });
  } else {
    init();
  }

  return this;
};

})(window.jQuery);

				$('.member-avatar, .member-initials, .lane-menu-member-filters-member [title]').tooltip();
			}

			////////////////////
			// Trello Stuff
			//////////////////
			$body = $('body');
			$board = $('#board');
			$board_canvas = $('.board-canvas');
			$content = $('#content');
			hide = localStorage.getItem('lane-menu-hide');
			if ( hide ) {
				$content.addClass('lane-menu-hide');
			}
			$board_wrapper = $('.board-wrapper');

			$lanes = $board.find('.list');
			$list_cards = $board.find('.list-card');
			$trello_swimlane_navigation_css = $('#trello-swimlane-navigation-css');

			// Make sure board stuff exists before continuing
			if ( !$trello_swimlane_navigation_css.length || ($trello_swimlane_navigation_css.css('content') != 'loaded' && $trello_swimlane_navigation_css.css('content') != '"loaded"' && $trello_swimlane_navigation_css.css('content') != "'loaded'") || !$content.length || !$board_wrapper.length || !$board_canvas.length || !$board.length || !$lanes.length || !$list_cards.length || !get_id() ) {
				setTimeout(show_menu, 500);
				return;
			}

			$('.js-show-extra-members').trigger('click');

			var $lane_menu = $('<div/>')
				.addClass('lane-menu u-fancy-scrollbar')
				;

			// Move board over so menu can stay on top
			var adjust_board = function() {
				var width = $lane_menu_wrapper.width();
				$content.css({
					'padding-left': width + 10
				});

				$lane_menu_wrapper.css({
					left: (width + 10) * -1
				});
			};

			// Show/hide menus
			var show_hide_menu = function($menu) {
				var hide_key = $menu.data('hide-key');
				var hide = localStorage.getItem(hide_key + ':' + get_id());
				var $headline = $menu.find('.lane-menu-headline').eq(0);
				var text = $headline.text();
				$headline.html('');

				var $hide = $('<button/>')
					.html('- ' + text)
					.attr('title', 'Hide')
					.addClass('lane-menu-hide')
					.prependTo($headline)
					;

				var $show = $('<button/>')
					.html('+ ' + text)
					.attr('title', 'Show')
					.addClass('lane-menu-show')
					.prependTo($headline)
					;

				if ( hide ) {
					$menu.addClass('lane-menu-hidden');
				}
			};

			$lane_menu
				.delegate('.lane-menu-show', 'click', function() {
					var $menu = $(this).closest('menu');
					var hide_key = $menu.data('hide-key');

					$menu.removeClass('lane-menu-hidden');
					localStorage.removeItem(hide_key + ':' + get_id());
					adjust_board();
				})
				.delegate('.lane-menu-hide', 'click', function() {
					var $menu = $(this).closest('menu');
					var hide_key = $menu.data('hide-key');

					$menu.addClass('lane-menu-hidden');
					localStorage.setItem(hide_key + ':' + get_id(), 1);
					adjust_board();
				})
				;

			/////////////////////////////
			// Lane Nav ----------------
			///////////////////////////
			var $lane_nav = $('<menu/>')
				.addClass('lane-menu-nav')
				.data('hide-key', 'hide_lane_nav')
				.appendTo($lane_menu)
				;

			var $lane_headline = $('<h2/>')
				.addClass('lane-menu-headline')
				.html('Navigation')
				.appendTo($lane_nav)
				;

			show_hide_menu($lane_nav);

			var $lane_nav_content = $('<div/>')
				.addClass('lane-menu-content')
				.appendTo($lane_nav)
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

				var $button = $('<button/>').addClass('lane-menu-nav-item').html('<span class="lane-menu-name">' + name + '</span>');
				if ( $img.length ) $button.prepend($img.eq(0).clone());
				$button.data('target', $this);

				if ( order ) {
					buttons[name] = $button;
				} else {
					$lane_nav_content.append($button);
				}
			});

			// If order has been set place the buttons in that order and dump any new ones at the bottom
			if ( order ) {
				for ( var i = 0; i < order.length; i++ ) {
					var $button = buttons[order[i]];
					$lane_nav_content.append($button);
					buttons[order[i]] = '';
				}

				for ( var prop in buttons ) {
					if ( buttons.hasOwnProperty(prop) && buttons[prop] != '' ){
						$lane_nav_content.append(buttons[prop]);
					}
				}
			}

			// Add menu to content div
			var $lane_menu_wrapper = $('<div/>').addClass('lane-menu-wrapper');

			$lane_menu_wrapper
				.append($lane_menu)
				;

			var $toggle = $('<a href="#" class="lane-menu-toggle dark-hover js-hide-sidebar" title="Show/hide swimlane navbar."><span class="icon-sm icon-forward lane-menu-open"></span><span class="icon-sm icon-forward lane-menu-closed"></span></a>')
				.bind('click', function(e) {
					e.preventDefault();
					if ( $content.is('.lane-menu-hide') ) {
						$content.removeClass('lane-menu-hide');
						localStorage.removeItem('lane-menu-hide');
					} else {
						$content.addClass('lane-menu-hide');
						localStorage.setItem('lane-menu-hide', 1);
					}
				})
				.prependTo($lane_menu_wrapper)
				;

			$content.prepend($lane_menu_wrapper);

			// Set up events on buttons to scroll to swim lanes
			$lane_nav_content
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
				var cards_filtered = false;

				// Members
				var members_filtered = false;

				$('.list-card').removeClass('lane-menu-member-filters-show');

				for ( i in members ) {
					members_filtered = true;
					cards_filtered = true;

					$('.list-card:has([title$="(' + i + ')"])')
						.addClass('lane-menu-member-filters-show')
						;
				}

				$('.list-card:has(.list-card-members:empty)').addClass('lane-menu-member-no-members');
				$('.list-card:not(:has(.list-card-members:empty))').removeClass('lane-menu-member-no-members');

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
					cards_filtered = true;

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

				// Any cards
				if ( cards_filtered ) {
					$body.addClass('lane-menu-cards-filtered');
				} else {
					$body.removeClass('lane-menu-cards-filtered');
				}
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

			////////////////////////////
			// Members ----------------
			//////////////////////////
			var $members = $('.board-widget-members .member :first-child');
			var $member_filters = $('<menu/>')
				.addClass('lane-menu-member-filters')
				.data('hide-key', 'hide_member_filters')
				.appendTo($lane_menu)
				;

			// Header
			var $members_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Member Filters')
				.appendTo($member_filters)
				;

			show_hide_menu($member_filters);

			// More
			var $member_filters_content = $('<div/>')
				.addClass('lane-menu-content')
				.appendTo($member_filters)
				;

			var $members_clear_filters = $('<button>(Clear)</button>').bind('click', function() {
				members = {};
				$('.lane-menu-member-filters-member').removeClass('lane-menu-member-filters-active');
				$('.list:not(.mod-add)').removeClass('lane-menu-member-filters-hide');

				update_filters();
			})
			.appendTo($member_filters_content);

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

				$member_filters_content.append($member);
			});

			// Filter delegates
			$member_filters_content
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
				.data('hide-key', 'hide_lane_filters')
				.appendTo($lane_menu)
				;

			var $lanes_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Lane Filters')
				.appendTo($lane_filters)
				;

			show_hide_menu($lane_filters);

			var $lane_filters_content = $('<div/>')
				.addClass('lane-menu-content')
				.appendTo($lane_filters)
				;

			var $lanes_clear_filters = $('<button>(Clear)</button>').bind('click', function() {
				lanes = {};
				$('.lane-menu-lane-filters-lane').removeClass('lane-menu-lane-filters-active');

				update_filters();
			})
			.appendTo($lane_filters_content);

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

				$lane_filters_content.append($lane);
			});

			// Filter delegates
			$lane_filters_content
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
				.data('hide-key', 'hide_label_filters')
				.insertBefore($lane_filters)
				;

			var $labels_headline = $('<h2>')
				.addClass('lane-menu-headline')
				.html('Label Filters')
				.appendTo($label_filters)
				;

			show_hide_menu($label_filters);

			var $label_filters_content = $('<div/>')
				.addClass('lane-menu-content')
				.appendTo($label_filters)
				;

			var $labels_filters = $('<button>(Clear)</button>').bind('click', function() {
				labels = {};
				$('.lane-menu-label-filters-label').removeClass('lane-menu-label-filters-active');

				update_filters();
			})
			.appendTo($label_filters_content);

			var labels = localStorage.getItem('filter_labels:' + get_id());
			if ( !labels ) {
				labels = {};
			} else {
				labels = JSON.parse(labels);
			}

			var do_label_filters = function() {
				// Filter delegates
				$label_filters_content
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

			// Attempt to populate label filters
			$('.js-open-labels').click();

			var $edit_labels_pop_over;

			var do_labels = function() {
				$edit_labels_pop_over.bind('DOMNodeInserted', try_do_labels);

				var $card_labels = $('.js-labels-list .card-label');

				$card_labels.each(function() {
					var $label = $(this).clone().addClass('lane-menu-label-filters-label');
					// var idlabel = $label.data('idlabel');
					var name = $label.text().replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
					if ( labels[name] ) {
						$label.addClass('lane-menu-label-filters-active');
					}
					$label.find('*').detach();
					$label_filters_content.append($label);
				});

				$('.js-pop-widget-view').click();

				do_label_filters();

				first_time();
			}

			// Some timeout jankyness since labels seem to be loaded async
			var do_labels_timeout;
			var delay = 5000;
			var try_do_labels = function() {
				clearTimeout(do_labels_timeout);
				do_labels_timeout = setTimeout(do_labels, delay);
				delay = 100;
			};

			try_do_labels();

			$edit_labels_pop_over = $('.edit-labels-pop-over').bind('DOMNodeInserted', try_do_labels);

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

				adjust_board();

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