;(function(window, undefined) {

var watches = [];
var ignoring = false;

window.addEventListener('storage', function(e) {
	console.log('STORAGE EVENT', e.url)

	if ( ignoring ) return;

	for ( var i = 0, l = watches.length, w; i < l; i++ ) {
		w = watches[i];

		if ( e.key === w.name ) {
			w.cb.apply(window, arguments);
		}
	}
});

var StorageWrapper = {};

StorageWrapper.get = StorageWrapper.getItem = function(name) {
	return localStorage.getItem(name);
};

StorageWrapper.set = StorageWrapper.setItem = function(name, value, ignore_update) {
	ignoring = !!ignore_update;
	var ret = localStorage.setItem(name, value);
	ignoring = false;

	if ( !ignore_update ) {
		StorageWrapper.trigger(name);
	}

	return ret;
};

StorageWrapper.remove = StorageWrapper.removeItem = function(name, ignore_update) {
	ignoring = !!ignore_update;
	var ret = localStorage.removeItem(name);
	ignoring = false;

	if ( !ignore_update ) {
		StorageWrapper.trigger(name);
	}

	return ret;
};

// Making fake events so current window can listen for storage changes
StorageWrapper.trigger = function(name) {
	var e = {key: name};

	for ( var i = 0, l = watches.length, w; i < l; i++ ) {
		w = watches[i];

		if ( e.key === w.name ) {
			w.cb.call(window, [e]);
		}
	}
};

StorageWrapper.watch = function(name, cb) {
	watches.push({name: name, cb: cb});

	return StorageWrapper; // chaining
};

StorageWrapper.unwatch = function(name, cb) {
	for ( var i = watches.length - 1, w; i >= 0; i-- ) {
		w = watches[i];

		if ( name === w.name && (cb === undefined || (cb !== undefined && cb === w.cb)) ) {
			watches.splice(i, 1);
		}
	}

	return StorageWrapper; // chaining
};

window.StorageWrapper = StorageWrapper;

})(window);