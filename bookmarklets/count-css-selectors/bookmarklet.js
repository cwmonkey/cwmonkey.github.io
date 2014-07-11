(function countCSSRules() {
	var results = '',
		log = '';
	if (!document.styleSheets) {
		return;
	}
	for (var i = 0; i < document.styleSheets.length; i++) {
		countSheet(document.styleSheets[i]);
	}
	function countSheet(sheet) {
		var count = 0;
		var mqcount = 0;
		if (sheet && sheet.cssRules) {
			for (var j = 0, l = sheet.cssRules.length; j < l; j++) {
				if ( typeof sheet.cssRules[j].cssRules != 'undefined' ) {
					for (var k = 0, l2 = sheet.cssRules[j].cssRules.length; k < l2; k++) {
						if( !sheet.cssRules[j].cssRules[k].selectorText ) continue;
						mqcount += sheet.cssRules[j].cssRules[k].selectorText.split(',').length;
					}
				} else {
					if( !sheet.cssRules[j].selectorText ) continue;
					count += sheet.cssRules[j].selectorText.split(',').length;
				}
			}

			log += '\nFile: ' + (sheet.href ? sheet.href : 'inline <style> tag');
			log += '\nRules: ' + sheet.cssRules.length;
			log += '\nSelectors: ' + count;
			log += '\nMedia Query Selectors: ' + mqcount;
			log += '\nTotal Selectors: ' + (mqcount + count);
			log += '\n--------------------------';
			if (count+mqcount >= 4096) {
				results += '\n********************************\nWARNING:\n There are ' + (count+mqcount) + ' CSS rules in the stylesheet ' + sheet.href + ' - IE <= 9 will ignore the last ' + ((count+mqcount) - 4096) + ' rules!\n';
			}
		}
	}

	console.log(log);
	console.log(results);
})();
