window.cwmPlaceImage = window.cwmPlaceImage || {};

window.cwmPlaceImage.load = function (window, $, undefined) {
	'use strict';

	var sections = [
		{
			name: 'Animals',
			places: [
				{
					name: 'Place Bear',
					site: 'placebear.com',
					template: 'http://placebear.com/{type}/{width}/{height}',
					options: {
						type: ['None', {text: 'grayscale', value: 'g'}]
					}
				},
				{
					name: 'Place Kitten',
					site: 'placekitten.com',
					template: 'http://placekitten.com/{type}/{width}/{height}',
					options: {
						type: ['None', {text: 'grayscale', value: 'g'}]
					}
				}
			]
		},
		{
			name: 'Famous',
			places: [
				/* {
					name: 'Fill Murray',
					site: 'fillmurray.com',
					template: 'http://fillmurray.com/{width}/{height}'
				}, */
				{
					name: 'Nice Nice jpg',
					site: 'nicenicejpg.com',
					template: 'http://nicenicejpg.com/{width}/{height}'
				},
				{
					name: 'Place Cage',
					site: 'placecage.com',
					template: 'http://placecage.com/{type}/{width}/{height}',
					options: {
						type: ['None', {text: 'grayscale', value: 'g'}, {text: 'CRAZY', value: 'c'}]
					}
				},
				{
					name: 'Place Cosby',
					site: 'placecosby.com',
					template: 'http://placecosby.com/{width}/{height}'
				},
				{
					name: 'Place Sheen',
					site: 'placesheen.com',
					template: 'http://placesheen.com/{width}/{height}'
				}
			]
		},
		{
			name: 'Food',
			places: [
				{
					name: 'Bacon Mockup',
					site: 'baconmockup.com',
					template: 'http://baconmockup.com/{width}/{height}'
				},
				{
					name: 'Lorem Pizza',
					site: 'lorempizza.com',
					template: 'http://lorempizza.com/{width}/{height}'
				}
			]
		},
		{
			name: 'Other',
			places: [
				{
					name: 'Lorem Pixel',
					site: 'lorempixel.com',
					template: 'http://lorempixel.com/{type}/{width}/{height}/{category}/{text}',
					options: {
						type: ['None', {text: 'grayscale', value: 'g'}],
						category: ['None', 'abstract', 'animals', 'business', 'cats', 'city', 'food', 'nightlife', 'fashion', 'people', 'nature', 'sports', 'technics', 'transport']
					}
				},
				{
					name: 'P-Hold',
					site: 'p-hold.com/',
					template: 'http://p-hold.com/{search}/{width}/{height}/{grey_blur}',
					options: {
						grey_blur: ['None', 'grey', 'blur']
					}
				}
			]
		},
		{
			name: 'Text',
			places: [
				{
					name: 'Dummy Image',
					site: 'dummyimage.com',
					template: 'http://dummyimage.com/{width}x{height}/{background}/{foreground}'
				},
				{
					name: 'FPO IMG',
					site: 'fpoimg.com',
					template: 'http://fpoimg.com/{width}x{height}?text={text}'
				},
				{
					name: 'Placehold.io',
					site: 'placehold.io',
					template: '{protocol}://placehold.io/{width}/{height}.{extension}?text={text}',
					options: {
						protocol: ['None', 'http', 'https'],
						extension: ['gif', 'jpeg', 'jpg', 'png', 'webp']
					}
				},
				{
					name: 'Place Hold It',
					site: 'placehold.it',
					template: 'http://placehold.it/{width}x{height}'
				}
			]
		}
	];

	var options = {
		width: {
			type: 'number',
			default: 100
		},
		height: {
			type: 'number',
			default: 100
		},
		text: {
			type: 'text',
			default: null
		},
		protocol: {
			type: 'select',
			default: 'https'
		},
		extension: {
			type: 'select',
			default: 'png'
		},
		background: {
			type: 'text',
			default: null
		},
		foreground: {
			type: 'text',
			default: null
		},
		type: {
			type: 'select',
			default: null
		},
		category: {
			type: 'select',
			default: null
		},
		search: {
			type: 'text',
			default: null
		},
		grey_blur: {
			type: 'select',
			default: null
		}
	};

	var defaults = {};

	var tpl =
	'<menu id="place-image-menu">\
		<form>\
			<fieldset class="place-image-set">\
				<legend id="place-image-config-head" class="place-image-head">Configuration</legend>\
				<div id="place-image-config">\
				</div>\
			</fieldset>\
			<fieldset class="place-image-set">\
				<legend id="place-image-options-head" class="place-image-head">Extra Options</legend>\
				<div id="place-image-options">\
				</div>\
			</fieldset>\
			<fieldset id="place-image-wh" class="place-image-set">\
				<legend class="place-image-head">Size</legend>\
				<label for="place-image-input-width" class="place-image-input">Width: <input type="number" value="100" id="place-image-input-width"></label>\
				<label for="place-image-input-height" class="place-image-input">Height: <input type="number" value="100" id="place-image-input-height"></label>\
			</fieldset>\
			<label id="place-image-result-label" for="place-image-result">\
				Image: <input type="text" id="place-image-result">\
				<button id="place-image-reload" title="Next Placeholder">&gt;</button>\
			</label>\
			<label id="place-image-buttons-label"><button id="place-image-update">&lt;- Update</button> <button id="place-image-close">Close</button></label>\
			<label id="place-image-img"></label>\
		</form>\
	</menu>';

	var css = '<link rel="stylesheet" id="place-image-css"/>';

	var $menu;
	var $css;
	var $image;
	var $update;
	var $config;
	var $options;
	var $img;
	var $body;
	var $last_input;

	var setup = function() {
		$body = $('body');

		$last_input = $('input[type="text"]:focus');

		$menu = $(tpl)
			.attr({tabIndex: '-1'})
			.hide()
			.appendTo('body')
			.focus();

		setTimeout(function() {
			$menu.show();
		}, 0);

		$image = $menu.find('#place-image-result');
		$update = $menu.find('#place-image-update');
		$config = $menu.find('#place-image-config');
		$options = $menu.find('#place-image-options');
		$img = $menu.find('#place-image-img');

		if ( !$last_input.length ) $update.hide();

		$css = $(css).appendTo('head');

		$css.attr({href: window.cwmBookmarkletUrl + '/place-image.css?' + new Date().getTime()});

		for ( var i in options ) {
			var $input = $menu.find('#place-image-input-' + i);
			if ( $input.length ) {
				$input.data({option_name: i});
				continue;
			}
			var $label = $('<label/>')
				.attr({
					for: 'place-image-input-' + i,
					id: 'place-image-input-' + i + '-label'
				})
				.addClass('place-image-input-label')
				.html(i + ': ');

			defaults[i] = options[i].default || null;
			options[i].value = $.jStorage.get('place-image-' + i) || options[i].default;
			switch (options[i].type) {
				case 'select':
					$input = $('<select/>').attr('id', 'place-image-input-' + i);
					break;
				default:
					$input = $('<input type="' + options[i].type + '"/>').attr('id', 'place-image-input-' + i);
					break;
			}

			$input
				.val(options[i].value)
				.data({option_name: i});

			$label
				.append($input)
				.appendTo($options);
		}

		var ii = 0;
		for ( var j = 0; j < sections.length; j++ ) {
			var places = sections[j].places;
			var $section = $('<fieldset/>')
				.addClass('place-image-section')
				.appendTo($config);
			var $legend = $('<legend/>')
				.appendTo($section);
			var $legend_label = $('<label/>')
				.html(' ' + sections[j].name)
				.appendTo($legend);
			var $legend_input = $('<input type="checkbox"/>')
				.prependTo($legend_label);
			for ( var i = 0; i < places.length; i++ ) {
				var place = places[i];
				var $label = $('<label/>')
					.html(' ' + place.name + ' ')
					.appendTo($section);
				var $input = $('<input type="checkbox"/>')
					.addClass('place-image-site')
					.attr({value: i})
					.data({
						site: place.site,
						i: ii
					})
					.prependTo($label);
				var $a = $('<a href="#"/>')
					.attr({href: 'http://' + place.site, target: '_blank'})
					.html('^')
					.appendTo($label);
				var val = $.jStorage.get('place-image-' + place.site);
				if ( val === null || val === true ) $input.prop({checked: true});
				ii++;
			}
		}

		var update_options = function() {
			$('.place-image-input-label').addClass('place-image-hide');

			cplaces = [];
			var $checks = $config.find('.place-image-site:checked');
			var places = [];
			for ( var i = 0; i < sections.length; i++ ) {
				for ( var j = 0; j < sections[i].places.length; j++ ) {
					places.push(sections[i].places[j]);
				}
			}

			if ( !$checks.length ) {
				$checks = $config.find('.place-image-site').eq(1);
			}

			for ( var i = 0; i < $checks.length; i++ ) {
				var $check = $checks.eq(i);
				cplaces.push(places[$check.data('i')]);
			}

			var props = {};

			var prop_find = /{([a-z\-_]+)}/g;
			for ( var i in cplaces ) {
				var cplace = cplaces[i];
				var match;
				while ( match = prop_find.exec(cplaces[i].template) ) {
					var prop = match[1];
					$('#place-image-input-' + prop + '-label').removeClass('place-image-hide');
					var option = options[prop];
					if ( typeof cplace.options == 'undefined' || cplace.options[prop] == 'undefined' ) continue;
					var place_options = cplace.options[prop];
					if ( option.type === 'select' ) {
						var $select = $('#place-image-input-' + prop);
						for ( var o in place_options ) {
							var place_option = place_options[o];
							var value = place_option.value || place_option;
							var $option = $select.find('#place-image-input-' + prop + '-' + value);
							var text = place_option.text || place_option;

							if ( !$option.length ) {
								$option = $('<option/>')
									.attr({value: value, id: 'place-image-input-' + prop + '-' + value})
									.html(text)
									.appendTo($select);

								if ( option.value == value ) {
									$option.prop('selected', true);
								}
							}
						}
					}
					props[match[1]] = match[1];
				}
			}
		};

		var update_image_TO;
		var image_index;
		var cplaces;
		var update_image = function(idx) {
			cplaces = [];
			var $checks = $config.find('.place-image-site:checked');
			var places = [];
			for ( var i = 0; i < sections.length; i++ ) {
				for ( var j = 0; j < sections[i].places.length; j++ ) {
					places.push(sections[i].places[j]);
				}
			}

			if ( !$checks.length ) {
				$checks = $config.find('.place-image-site').eq(1);
			}

			for ( var i = 0; i < $checks.length; i++ ) {
				var $check = $checks.eq(i);
				cplaces.push(places[$check.data('i')]);
			}
			if ( typeof idx != 'undefined' ) {
				idx++;
				if ( idx >= cplaces.length ) idx = 0;
				image_index = idx
			} else {
				image_index = Math.floor(Math.random() * cplaces.length);
			}

			var place = cplaces[image_index];
			var template = place.template;
			var url = template;
			var vars = {};
			var reg;

			for ( var i in options ) {
				var $input = $('#place-image-input-' + i);
				var val = $input.val();
				if ( place.options && place.options[i] ) {
					var found = false;
					for ( var o in place.options[i] ) {
						if ( val === (place.options[i][o].value || place.options[i][o]) ) {
							found = true;
							break;
						}
					}
					if ( !found ) val = null;
				}

				if ( val !== null && val !== 'None' && val !== '' ) {
					reg = new RegExp('\\{' + i + '\\}');
					url = url.replace(reg, val);
				} else {
					reg = new RegExp('(\\.|\\/|(\\?[a-z]+=)|x)?\\{' + i + '\\}\\:?');
					url = url.replace(reg, '');
					reg = new RegExp('\\{' + i + '\\}');
					url = url.replace(reg, '');
				}
			}

			$image.val(url);

			var $i = $('<img/>').attr({src: url});

			clearTimeout(update_image_TO);
			update_image_TO = setTimeout(function() {
				$img.empty().append($i);
			}, 100);
		};

		var changeTO;
		var update_image_delay = function() {
			clearTimeout(changeTO);
			changeTO = setTimeout(update_image, 100);
		};

		var update_sections = function() {
			var $sections = $menu.find('.place-image-section');
			for ( var i = 0; i < $sections.length; i++ ) {
				var $section = $sections.eq(i);
				var $legend_input = $section.find('legend input');
				var $unchecked = $section.find('.place-image-site:not(:checked)');
				var $checked = $section.find('.place-image-site:checked');

				if ( $unchecked.length && $checked.length ) {
					$legend_input.prop({checked: false, indeterminate: true});
				} else if ( $unchecked.length ) {
					$legend_input.prop({indeterminate: false, checked: false});
				} else {
					$legend_input.prop({indeterminate: false, checked: true});
				}
			}
		};

		$menu
			.delegate('.place-image-section legend input', 'click', function(e) {
				var $this = $(this);
				setTimeout(function() {
					var $section = $this.closest('.place-image-section');
					$section.find('.place-image-site').prop({checked: $this.is(':checked')}).change();
				}, 100);
			})
			.delegate('#place-image-wh input, #place-image-options input, #place-image-options select', 'keypress change', function(e) {
				var $this = $(this);
				setTimeout(function() {
					var option_name = $this.data('option_name');
					$.jStorage.set('place-image-' + option_name, $this.val());
					update_image_delay();
				}, 0);
			})
			.delegate('#place-image-update', 'click', function(e) {
				e.preventDefault();
				$last_input.val($image.val()).focus();
				$menu.hide();
				update_image();
			})
			.delegate('#place-image-reload', 'click', function(e) {
				e.preventDefault();
				update_image(image_index);
			})
			.delegate('#place-image-close', 'click', function(e) {
				e.preventDefault();
				$menu.hide();
				update_image();
			})
			.delegate('#place-image-result', 'focus click', function(e) {
				var $this = $(this);
				setTimeout(function() {
					$this.select();
				}, 0);
			})
			.delegate('#place-image-config-head', 'click', function() {
				if ( $menu.is('.place-image-config-open') ) {
					$menu.removeClass('place-image-config-open');
				} else {
					$menu.addClass('place-image-config-open');
				}
			})
			.delegate('#place-image-options-head', 'click', function() {
				if ( $menu.is('.place-image-options-open') ) {
					$menu.removeClass('place-image-options-open');
				} else {
					$menu.addClass('place-image-options-open');
				}
			})
			.delegate('#place-image-config .place-image-site', 'change', function(e) {
				var $this = $(this);
				setTimeout(function() {
					$.jStorage.set('place-image-' + $this.data('site'), $this.prop('checked'));
					update_sections();
					update_options();
					update_image_delay();
				}, 0);
			})
			;

		$body
			.delegate('input:not(#place-image-menu input)', 'focus', function(e) {
				$last_input = $(this);
				$update.show();
			})
			;

		update_options();
		update_image();
		update_sections();
	};

	// Main
	var main = function() {
		$menu = $('#place-image-menu');
		if ( !$menu.length ) {
			setup();
		} else {
			$menu.show();
		}
	};

	window.cwmPlaceImage = {
		main: main
	};
};