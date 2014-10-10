window.cwmElementStyles = window.cwmElementStyles || {};

window.cwmElementStyles.load = function (window, $, undefined) {
	'use strict';

	
	function css(a) {
		var sheets = document.styleSheets, o = {};
		var cssText = '';
		for (var i in sheets) {
			var rules = sheets[i].rules || sheets[i].cssRules;
			for (var r in rules) {
				if ( undefined !== rules[r].selectorText && rules[r].selectorText.match(/^\.[a-zA-Z0-9]+$/) && a.is(rules[r].selectorText) ) {
					cssText += "\n\t" + '/* ' + sheets[i].href + ' : ' + rules[r].selectorText + ' */' + "\n";
					cssText += "\t" + rules[r].style.cssText.split('; ').join(";\n\t") + "\n";
					//o = $.extend(o, css2json(rules[r].style) /*, css2json(a.attr('style')) */ );
				}
			}
		}
		//return o;

		if ( !cssText ) return;

		var el = a[0];
		var selector = '';
		if ( el.id ) {
			selector = el.tagName + '#' + el.id;
		} else if ( el.className ) {
			selector = el.tagName + '.' + el.className.split(' +').join('.');
		} else {
			selector = el.tagName;
		}


		return selector + '{' + "\n" + cssText + '}' + "\n";
	}

	function css2json(css) {
		var s = {};
		if (!css) return s;
		if (css instanceof CSSStyleDeclaration) {
			for (var i in css) {
				if ((css[i]).toLowerCase) {
					s[(css[i]).toLowerCase()] = (css[css[i]]);
				}
			}
		} else if (typeof css == "string") {
			css = css.split("; ");
			for (var i in css) {
				var l = css[i].split(": ");
				s[l[0].toLowerCase()] = (l[1]);
			}
		}
		return s;
	}

	this.main = function() {
		var $els = $('body, body *');
		var res = '';
		var ret = '';
		for ( var i = 0; i < $els.length; i++ ) {
			if ( !$els[i].className ) continue;
			ret = css($els.eq(i));
			console.log( ret );
			if ( undefined !== ret ) res += "\n" + ret;
		}

		console.log(res);
	};
};