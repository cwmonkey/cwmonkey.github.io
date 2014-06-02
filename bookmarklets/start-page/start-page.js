window.cwmStartPage = window.cwmStartPage || {};

window.cwmStartPage.load = function (window, $, undefined) {
	'use strict';

	var setup = function() {
	};

	var thumb = null;
	var favicon = null;

	// Main
	var main = function() {
		var check_forward = function() {
			if ( !thumb || !favicon ) return;
			document.location = (window.cwmBookmarkletUrl + '/start-page.html#href=' + encodeURIComponent(document.location.href) + '&title=' + encodeURIComponent(document.title) + '&thumb=' + encodeURIComponent(thumb) + '&icon=' + favicon);
		};

		html2canvas(document.body, {
			onrendered: function(canvas) {
				var img = new Image();
				var ctx = canvas.getContext('2d');
				var canvasCopy = document.createElement('canvas');
				var copyContext = canvasCopy.getContext('2d');
				var ratio = 1;
				var maxWidth = 138;
				var maxHeight = 83;
				var src;

				img.onload = function() {
					if ( img.width > maxWidth ) {
						ratio = maxWidth / img.width;
					} else if ( img.height > maxHeight ) {
						ratio = maxHeight / img.height;
					}

					canvasCopy.width = img.width;
					canvasCopy.height = img.height;
					copyContext.drawImage(img, 0, 0);

					canvas.width = maxWidth;
					canvas.height = maxHeight;
					ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height - 300, 0, 0, maxWidth, maxHeight);
					thumb = canvas.toDataURL('image/gif');
					check_forward();
				}

				img.src = canvas.toDataURL('image/gif');
			}
		});

		var img = new Image();
		var canvasCopy = document.createElement('canvas');
		var copyContext = canvasCopy.getContext('2d');
		var src;

		img.onload = function() {
			canvasCopy.width = 16;
			canvasCopy.height = 16;
			copyContext.drawImage(img, 0, 0, 16, 16);
			favicon = canvasCopy.toDataURL('image/gif');
			check_forward();
		}

		img.onerror = function() {
			var favicon = "";
			var links = document.getElementsByTagName('link');
			for ( var i=0; i<links.length; i++ ) {
				var link = links[i];
				var rel = '"' + link.getAttribute("rel") + '"';
				var regexp = /(\"icon )|( icon\")|(\"icon\")|( icon )/i;

				if ( rel.search(regexp) != -1 ) {
					favicon = link.getAttribute("href");
				}
			}

			img.onerror = function() {
				favicon = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			};

			img.src = favicon;
		}

		img.src = '/favicon.ico';
	};

	window.cwmStartPage = {
		main: main
	};

	setup();
};