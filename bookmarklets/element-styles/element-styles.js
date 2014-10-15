window.cwmElementStyles = window.cwmElementStyles || {};

window.cwmElementStyles.load = function (window, $, undefined) {
	'use strict';

	var rules = {};
	var rules_done = {};

	/*var set_rules = function() {
		var rule;
		var sheets = document.styleSheets;
		for (var i in sheets) {
			var rs = sheets[i].rules || sheets[i].cssRules;
			for (var r in rs) {
				if (
					undefined !== rs[r].selectorText
				) {
					if ( rs[r].selectorText === '*' || rs[r].selectorText.match(/\:/) || rs[r].selectorText.match(/^[a-zA-Z]+$/) ) {
						console.log( rs[r].selectorText + "{\n" + rs[r].style.cssText + "\n}" );
						continue;
					}

					rule = {
						cssText: "\t" + rs[r].style.cssText.split('; ').join(";\n\t") + "\n",
						element: rs[r].selectorText.match(/ [a-zA-Z]+$/),
						done: false
						//comment: "\n\t" + '/* ' + sheets[i].href + ' : ' + rules[r].selectorText + ' *\/' + "\n"
					};

					rules[rs[r].selectorText] = rule;
				}
			}
		}
	}

	function css($a) {
		var cssText = '';
		var selector;

		for (var r in rules) {
			if ( $a.is(r) ) {
				cssText += /*rules[r].comment +* / rules[r].cssText;
			}
		}

		if ( !cssText ) return;

		if ( $a[0].id ) {
			selector = '#' + $a[0].id;
		} else if ( $a[0].className ) {
			selector = $a[0].tagName + '.' + $a[0].className.split(/\s+/).join('.');
		} else {
			selector = $a[0].tagName;
		}

		return selector + '{' + "\n" + cssText + '}' + "\n";
	}

	this.main = function() {
		var $els = $('body, body *');
		var ret;
		var res = '';
		set_rules();

		for ( var i = 0; i < $els.length; i++ ) {
			ret = css($els.eq(i));
			console.log( ret );
			if ( undefined !== ret ) res += "\n" + ret;
		}

		console.log(res);
	} */

	// Short
	var set_rules = function() {
		var rule;
		var sheets = document.styleSheets;
		for (var i in sheets) {
			var rs = sheets[i].rules || sheets[i].cssRules;
			for (var r in rs) {
				if (
					undefined !== rs[r].selectorText
					&& rs[r].selectorText.match(/^\.[a-zA-Z0-9]+$/)
					&& rs[r].style.cssText.match(/!important/)
				) {
					rule = {
						classCheck: new RegExp('\\b' + rs[r].selectorText.substring(1) + '\\b'),
						//selectorText: rules[r].selectorText,
						//href: sheets[i].href,
						cssText: "\t" + rs[r].style.cssText.split('; ').join(";\n\t") + "\n",
						comment: ''
						//comment: "\n\t" + '/* ' + sheets[i].href + ' : ' + rules[r].selectorText + ' *\/' + "\n"
					};

					rules[rs[r].selectorText] = rule;
				}
			}
		}
	}

	function css(a) {
		var sheets = document.styleSheets;
		var cssText = '';
		var classCheck;

		for (var r in rules) {
			if (
				a.className.match(rules[r].classCheck)
			) {
				cssText += rules[r].comment + rules[r].cssText;
			}
		}

		if ( !cssText ) return;

		var el = a;
		var selector = '';
		selector = el.tagName + '.' + el.className.split(/\s+/).join('.');
		if ( rules_done[selector] === true ) return;
		rules_done[selector] = true;

		return selector + '{' + "\n" + cssText + '}' + "\n";
	}

	this.main = function() {
		var $els = $('body[class], body *[class]');
		var res = '';
		var ret = '';
		set_rules();
		for ( var i = 0; i < $els.length; i++ ) {
			if ( !$els[i].className ) continue;
			ret = css($els[i]);
			console.log( ret );
			if ( undefined !== ret ) res += "\n" + ret;
		}

		console.log(res);
	};
};