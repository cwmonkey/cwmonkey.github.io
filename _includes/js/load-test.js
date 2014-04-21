(function (window) {
'use strict';

// Load scripts
cwmJsload.load(
	// Load elements in an array at the same time.
	[
		{
			script: window.cwmBookmarkletUrl + '/a.php', // 3 second delay
			test: function() {
				return ( window.a === true );
			},
			callback: function() {
				console.log('a loaded');
			}
		},
		{
			script: window.cwmBookmarkletUrl + '/c.php', // 2 second delay
			test: function() {
				return ( window.c === true );
			},
			callback: function() {
				console.log('c loaded');
			}
		},
	],
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
		console.log('a|a2 and c loaded');
	},
	{
		script: window.cwmBookmarkletUrl + '/b.php',
		test: function() {
			return ( window.b === true );
		},
		callback: function() {
			console.log('b loaded');
		}
	},
	{
		script: window.cwmBookmarkletUrl + '/d.php',
		test: function() {
			return ( window.d === true );
		},
		callback: function() {
			console.log('d loaded');
		}
	},
	// Load script callback
	function() {
		console.log('all scripts loaded');
	}
);

}(window));