(function (window) {
'use strict';

// Load scripts
cwmJsload.load(
	{
		script: window.cwmBookmarkletUrl + '/a.php',
		test: function() {
			return ( window.a === true );
		},
		callback: function() {
			console.log('a loaded');
		}
	},
	{
		script: window.cwmBookmarkletUrl + '/c.php',
		test: function() {
			return ( window.c === true );
		},
		callback: function() {
			console.log('c loaded');
		}
	},
	// Load script callback
	function() {
		cwmJsload.load(
			{
				script: window.cwmBookmarkletUrl + '/a2.php',
				test: function() {
					return ( window.a === true );
				},
				callback: function() {
					console.log('a2 loaded');
				}
			},
			// Load script callback
			function() {
				console.log('a|a2 and b loaded');
				cwmJsload.load(
					{
						script: window.cwmBookmarkletUrl + '/b.php',
						test: function() {
							return ( window.b === true );
						},
						callback: function() {
							console.log('b loaded');
						}
					}
				);

				// d should load first
				cwmJsload.load(
					{
						script: window.cwmBookmarkletUrl + '/d.php',
						test: function() {
							return ( window.d === true );
						},
						callback: function() {
							console.log('d loaded');
						}
					}
				);
			}
		);
	}
);

}(window));