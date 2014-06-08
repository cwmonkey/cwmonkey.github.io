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
			document.location = ('http:' + window.cwmBookmarkletUrl + '/start-page.html#href=' + encodeURIComponent(document.location.href) + '&title=' + encodeURIComponent(document.title) + '&thumb=' + encodeURIComponent(thumb) + '&icon=' + encodeURIComponent(favicon));
		};

		// http://stackoverflow.com/questions/18761404/how-to-scale-images-on-a-html5-canvas-with-better-interpolation
		var scale = function(destCanvas, destWidth, destHeight) {
			// var start = new Date().getTime();
			var scalingSteps = 0;
			var destCtx = destCanvas.getContext('2d');

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			canvas.width = destCanvas.width;
			canvas.height = destCanvas.height;

			ctx.putImageData(destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height), 0, 0);

			var curWidth = canvas.width;
			var curHeight = canvas.height;

			var lastWidth = canvas.width;
			var lastHeight = canvas.height;

			var end = false;
			var scale = 0.75;
			while ( end == false ) {
				scalingSteps += 1;
				curWidth *= scale;
				curHeight *= scale;

				if ( curWidth < destWidth ) {
					curWidth = destWidth;
					curHeight = destHeight;
					end = true;
				}

				ctx.drawImage(canvas, 0, 0, Math.round(lastWidth), Math.round(lastHeight), 0, 0, Math.round(curWidth), Math.round(curHeight));
				lastWidth = curWidth;
				lastHeight = curHeight;
			}

			destCanvas.width = destWidth;
			destCanvas.height = destHeight;
			destCtx.putImageData(ctx.getImageData(0, 0, destCanvas.width, destCanvas.height), 0, 0);
			// var endTime = new Date().getTime();
			//console.log("execution time: "+ ( endTime - start) + "ms. scale per frame: "+scale+ " scaling step count: "+scalingSteps);
		}

		html2canvas(document.body, {
			useCORS: true,
			onrendered: function(canvas) {
				var img = new Image();
				var ctx = canvas.getContext('2d');
				var canvasCopy = document.createElement('canvas');
				var copyContext = canvasCopy.getContext('2d');
				var ratio = 1;
				var maxWidth = 138;
				var maxHeight = 83;
				var maxRatio = maxWidth / maxHeight;
				var src;
				var wR;
				var hR;

				img.onload = function() {
					if ( img.width / img.height > maxRatio ) {
						wR =  maxWidth / maxHeight * img.height;
						hR = img.height;
					} else if ( img.width / img.height < maxRatio ) {
						wR = img.width;
						hR =  maxHeight / maxWidth * img.width;
					}

					canvasCopy.width = img.width;
					canvasCopy.height = img.height;
					copyContext.drawImage(img, 0, 0);

					//canvas.width = maxWidth;
					//canvas.height = maxHeight;
					canvas.width = wR;
					canvas.height = hR;
					//ctx.drawImage(canvasCopy, 0, 0, wR, hR, 0, 0, maxWidth, maxHeight);
					ctx.drawImage(canvasCopy, 0, 0, wR, hR, 0, 0, wR, hR);

					try {
						thumb = canvas.toDataURL('image/gif');
					} catch (e) {
						thumb = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					}

					check_forward();
				}

				img.onerror = function() {
					thumb = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					check_forward();
				};

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
			try {
				favicon = canvasCopy.toDataURL('image/gif');
			} catch (e) {
				favicon = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			}
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