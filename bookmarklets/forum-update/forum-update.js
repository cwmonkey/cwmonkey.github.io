window.cwmForumUpdate = window.cwmForumUpdate || {};

(function(window, undefined) { // global namespace protection
	if ( window.forumUpdate_running != undefined ) {
		window.forumUpdate_running();
		return;
	}

	// ganked from http://feather.elektrum.org/book/src.html
	var scripts = document.getElementsByTagName('script');
	var myScript = scripts[ scripts.length - 1 ];
	var queryString = myScript.src.replace(/^[^\?]+\??/,'');
	var params = parseQuery( queryString );

	function parseQuery ( query ) {
		var Params = new Object ();
		if ( ! query ) return Params; // return empty object
		var Pairs = query.split(/[;&]/);
		for ( var i = 0; i < Pairs.length; i++ ) {
			var KeyVal = Pairs[i].split('=');
			if ( ! KeyVal || KeyVal.length != 2 ) continue;
			var key = unescape( KeyVal[0] );
			var val = unescape( KeyVal[1] );
			val = val.replace(/\+/g, ' ');
			Params[key] = val;
		}
		return Params;
	}

	var includecss = function(url, date) {
		var link = document.createElement('link');
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = url + ((date != undefined)?'?' + new Date().getTime():'');

		document.body.appendChild(link);
	}

	window.show_post_rate = 1000;
	window.min_post_age = 0;

	window.cwmForumUpdate = {
		load: function() {
			includecss(window.cwmBaseUrl + '/bookmarklets/forum-update/forum-update.css?2');
			window.cwmForumUpdate.main = window.cwmForumUpdate.app;
		},
		app: function() {
			// Check to see if jQuery has loaded
			var current_url = params['ref'];

			// Main program:
			var max_posts = 200;
			var check_rate = 5000;
			var next_check_rate = 5000;
			var scroll_speed = 200;
			var post_parent_selector = '#thread';
			var post_selector = '.post';
			var next_page_selector = '.pages.bottom a[title="Next page"]';
			var posts = [];
			var links_in_new = true;
			var reply_selector = '.postbuttons a';
			var reply_form_selector = 'form[action="newreply.php"]';
			var title = document.title;
			var blurred = false;
			var blur_count = 0;
			//var append_prepend = 'append';

			var $parent = $(post_parent_selector);
			var $posts = $parent.find(post_selector);
			var page_post_count = $posts.length;
			var $next_page = $(next_page_selector);
			var $window = $(window);
			var $body = $('body');
			var $document = $(document);

			$body.addClass('fuadded');

			var suspend = false;
			var show_post_interval;
			var get_posts_to;

			var allstop = false;
			window.forumUpdate_running = function() {
				allstop = !allstop;
				if ( allstop ) {
//console.log('stopping all');
					clearTimeout(get_posts_to);
					//clearInterval(show_post_interval);
					clearTimeout(show_post_interval);
				} else {
					//show_post_interval = setInterval(show_post, window.show_post_rate);
					show_post_interval = setTimeout(show_post, window.show_post_rate);
					get_posts();
				}
			};

			var clean_ajax = function(data) {
				data = data.replace(/<script/gi, '<noscript').replace(/<\/script/gi, '</noscript').replace(/<((link)|(meta))/gi, '<br').replace(/<iframe/gi, '<xiframe').replace(/<\/iframe/gi, '</xiframe');
				return data;
			}

			$body
				.delegate(reply_selector, 'click', function(e) {
					e.preventDefault();

					$.ajax(this.href, {

					})
					.done(function(data) {
						data = clean_ajax(data);
						var $div = $('<div/>').html(data);
						delete data;
						var $form = $div.find(reply_form_selector);
						$form.find('*:not(input, select, textarea):not(:has(input, select, textarea))').remove();
						$form.addClass('fureply');
						$parent.append($form);

						$form.bind('submit', function(e) {
							e.preventDefault();
							$.post($form.attr('action'), $form.serialize());
							$form.hide();
							//show_post();
						});
					});
				})
				.delegate('.fustar', 'click', function(e) {
					e.preventDefault();
					var $this = $(this);
					var $post = $this.closest(post_selector);
					if ( $post.is('.fustarred') ) {
						$post.removeClass('fustarred');
					} else {
						$post.addClass('fustarred');
					}
				})
				;

			var get_posts = function() {
				current_url = current_url.split('#')[0];

//console.log('get_posts');
				$.ajax(current_url, {

				})
				.done(function(data) {
					data = clean_ajax(data);
					var $div = $('<div/>').html(data);
					delete data;
					var rate = check_rate;

					$posts = $div.find(post_parent_selector).find(post_selector);

					if ( $posts.length > page_post_count ) {
						var $new_posts = $posts.slice(page_post_count);
						var found = 0;

						for ( var i = 0; i < $new_posts.length; i++ ) {
							var post = $new_posts[i];
							var $post = $(post);
							$post.addClass('fupost');
							$post.fuurl = current_url;
							posts.push($post);
							found++;

							//.postdate Jul 5, 2016 01:01
						}

						rate = next_check_rate;
//console.log('get_posts got ' + found + ' posts');
					}

					$next_page = $div.find(next_page_selector);

					if ( $next_page.length ) {
						page_post_count = 0;
						current_url = $next_page.attr('href');
						get_posts_to = setTimeout(get_posts, next_check_rate);
					} else {
						page_post_count = $posts.length;
						get_posts_to = setTimeout(get_posts, rate);
					}

					$div.remove();
				})
				.fail(function() {
					get_posts_to = setTimeout(get_posts, rate);
				});
			};

			var show_post = function() {
//console.log('show_post')
				show_post_interval = setTimeout(show_post, window.show_post_rate);
				if ( !posts.length ) return;

				var $posts = $parent.find(post_selector);
				if ( $posts.length >= max_posts ) {
					for ( i = 0; i <= $posts.length - max_posts; i++ ) {
						var scrollTop = $window.scrollTop();
						var $post = $posts.eq(i);
						var height = $post.outerHeight(true);
						if ( !$post.is('.fustarred') ) {
							$post.remove();
						}
						check_scroll = false;
						$window.scrollTop(scrollTop - height);
						check_scroll = true;
					}
				}

				var $post = posts[0]; //.shift();

				// Post date
				var $postdate = $post.find('.postdate').clone();

				console.log('new post');

				setTimeout(function() {
					$postdate.find('a').remove();
					postdate = new Date(new Date($postdate.text().trim()) - (1000*60*60*7));
					var ago = new Date() - postdate;

					$post.find('.author').prepend($('<span>' + (ago/1000) + ' </span>'));
					$post.find('a').attr('target', '_blank');
					// / Post date

					var $star = $('<a href="#">&#9733;</a>').addClass('fustar');
					$post.append($star);

					$post.addClass('funew');
					if ( $post.text().indexOf('WrasslorMonkey') !== -1 ) {
						$post.find('.postbody').addClass('userquoted');
					}

					$parent.append($post);

					if ( blurred ) {
						blur_count++;
						document.title = '(' + blur_count + ') ' + title;
					}

					if ( !suspend ) {
						check_scroll = false;

						//$window.scrollTo($post, scroll_speed, {axis: 'y', onAfter: function() {
						$('html, body').stop().animate({scrollTop:$post.last().offset().top}, scroll_speed, function() {
							check_scroll = true;
						});
					}

					if ( document.location.href != $post.fuurl ) history.pushState(null, null, $post.fuurl);

					setTimeout(function() {
						$post.removeClass('funew');
					}, 0);



var a = $("td.postbody a");
a = a.not("td.postbody:has(img[title=':nws:']) a").not(".postbody:has(img[title=':nms:']) a");
a = a.not("td.bbc-spoiler a");
a.each(function() {
		if (!/^http/.test($(this).text())) {
				return
		}
		var e = $(this).attr("href").match(/^(?:https|http):\/\/(?:mobile\.)?twitter.com\/[0-9a-zA-Z_]+\/(?:status|statuses)\/([0-9]+)/);
		if (e == null) {
				return
		}
		var j = e[1];
		var h = this;
		$.ajax({
				url: "https://api.twitter.com/1/statuses/oembed.json?id=" + j,
				dataType: "jsonp",
				success: function(l) {
						h = $(h).wrap("<div class='tweet'>").parent();
						$(h).html(l.html)
				}
		});
});



				}, window.min_post_age || 0);

				posts.shift();
			};

			if ( $next_page.length ) {
				current_url = $next_page.attr('href');
				page_post_count = 0;
			}

			var check_scroll = true;
			$window
				.bind('scroll', function() {
					if ( !check_scroll ) return;
					check_scroll = false;

					if ( $window.scrollTop() >= $document.height() - $window.height() ) {
						suspend = false;
//console.log('restarting');
					} else {
						suspend = true;
//console.log('suspending');
					}

					check_scroll = true;
				})
				.bind('blur', function() {
					blurred = true;
					var $posts = $parent.find(post_selector);
					$posts.removeClass('fulast');
					$posts.last().addClass('fulast');
				})
				.bind('focus', function() {
					blurred = false;
					blur_count = 0;
					document.title = title;
				})
				;

			//show_post_interval = setInterval(show_post, window.show_post_rate);
			show_post_interval = setTimeout(show_post, window.show_post_rate);

			if ( links_in_new ) {
				$body
					.delegate('a', 'mouseover focus', function() {
						this.target = 'comment_window';
					});
			}

			$posts.each(function() {
				var $post = $(this).addClass('fupost');
				var $star = $('<a href="#">&#9733;</a>').addClass('fustar');
				$post.append($star);
			});

			get_posts();
		}
	};
})(window); // end namespace protection