(function (window) {
'use strict';

var sections = [
	{
		name: 'Animals',
		places: [
			{
				name: 'Place Bear',
				site: 'placebear.com',
				template: 'http://placebear.com/{type}/{width}/{height}',
				type: {text: 'grayscale', value: 'g'}
			},
			{
				name: 'Place Kitten',
				site: 'placekitten.com',
				template: 'http://placekitten.com/{type}/{width}/{height}',
				type: {text: 'grayscale', value: 'g'}
			}
		]
	},
	{
		name: 'Famous',
		places: [
			{
				name: 'Fill Murray',
				site: 'fillmurray.com',
				template: 'http://fillmurray.com/{width}/{height}'
			},
			{
				name: 'Nice Nice jpg',
				site: 'nicenicejpg.com',
				template: 'http://nicenicejpg.com/{width}/{height}'
			},
			{
				name: 'Place Cage',
				site: 'placecage.com',
				template: 'http://placecage.com/{type}/{width}/{height}',
				type: [{text: 'grayscale', value: 'g'}, {text: 'CRAZY', value: 'c'}]
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
				type: {text: 'grayscale', value: 'g'},
				category: ['abstract', 'animals', 'business', 'cats', 'city', 'food', 'nightlife', 'fashion', 'people', 'nature', 'sports', 'technics', 'transport']
			},
			{
				name: 'P-Hold',
				site: 'p-hold.com/',
				template: 'http://p-hold.com/{search}/{width}/{height}/{gray_blur}'
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
				name: 'Place Hold It',
				site: 'placehold.it',
				template: 'http://placehold.it/{width}x{height}'
			}
		]
	}
];

var defaults = {
	width: null,
	height: null,
	text: null,
	background: null,
	foreground: null,
	type: null,
	category: null,
	search: null,
	gray_blur: null
};

var tpl =
'<menu id="place-image-menu">\
	<form>\
		<label id="place-image-config-head" for="">Configuration</label>\
		<label id="place-image-config">\
\
		</label>\
		<label for="place-image-width" class="place-image-input">Width: <input type="number" value="100" id="place-image-width"></label>\
		<label for="place-image-height" class="place-image-input">Height: <input type="number" value="100" id="place-image-height"></label>\
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
var $width;
var $height;
var $update;
var $config;
var $img;
var $body;
var $last_input;
var $;

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
	$width = $menu.find('#place-image-width');
	$height = $menu.find('#place-image-height');
	$update = $menu.find('#place-image-update');
	$config = $menu.find('#place-image-config');
	$img = $menu.find('#place-image-img');

	if ( !$last_input.length ) $update.hide();

	var width = $.jStorage.get('place-image-width');
	var height = $.jStorage.get('place-image-height');

	if ( width ) $width.val(width);
	if ( height ) $height.val(height);

	$css = $(css).appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/place-image.css?' + new Date().getTime()});

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
					i: i
				})
				.prependTo($label);
			var $a = $('<a href="#"/>')
				.attr({href: 'http://' + place.site, target: '_blank'})
				.html('^')
				.appendTo($label);
			var val = $.jStorage.get('place-image-' + place.site);
			if ( val === null || val === true ) $input.prop({checked: true});
		}
	}

	var update_image_TO;
	var image_index;
	var update_image = function(idx) {
		var cplaces = [];
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
		var vars = $.extend({}, defaults, {
			width: parseInt($width.val()),
			height: parseInt($height.val())
		});
		var reg;

		for ( var attr in vars ) {
			var val = vars[attr];
			if ( val !== null ) {
				reg = new RegExp('\\{' + attr + '\\}');
				url = url.replace(reg, val);
			} else {
				reg = new RegExp('(\\/|(\\?[a-z]+=)|x)\\{' + attr + '\\}');
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
			}, 0);
		})
		.delegate('.place-image-input input', 'keypress change', function(e) {
			setTimeout(function() {
				update_image();
			}, 0);
		})
		.delegate('#place-image-width', 'keypress change', function(e) {
			setTimeout(function() {
				$.jStorage.set('place-image-width', $width.val());
			}, 0);
		})
		.delegate('#place-image-height', 'keypress change', function(e) {
			setTimeout(function() {
				$.jStorage.set('place-image-height', $height.val());
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
		.delegate('#place-image-config .place-image-site', 'change', function(e) {
			var $this = $(this);
			setTimeout(function() {
				$.jStorage.set('place-image-' + $this.data('site'), $this.prop('checked'));
				update_sections();
				update_image();
			}, 0);
		})
		;

	$body
		.delegate('input:not(#place-image-menu input)', 'focus', function(e) {
			$last_input = $(this);
			$update.show();
		})
		;

	update_image();
	update_sections();
};

// Main
var main = function(jQuery) {
	$ = jQuery;
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

}(window));