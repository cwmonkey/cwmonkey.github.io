;(function(undefined) {

var store = window.StorageWrapper;
var debug = window.cwmMakeNoteDebug;
var cwmMakeNote = window.cwmMakeNote;
var $document = $(document);
var url = document.createElement('a');

url.href = document.location.hash.substring(1);

  /////////////////////////////
 // Blacklist
/////////////////////////////

var blacklist_name = '__make-note-blacklist';
var blacklist;

var load_blacklist = function() {
	try {
		var blacklist_str = store.get(blacklist_name) || '{}';
		blacklist = JSON.parse(blacklist_str);
	} catch(e) {
		blacklist = {};
	}
};

var is_url_blacklisted = function(url) {
	for ( var key in blacklist ) {
		if ( blacklist.hasOwnProperty(key) ) {
			var b = blacklist[key];

			if ( b.m && cwmMakeNote.fauxMatch(b.m, url) ) {
				return true;
			}
		}
	}

	return false;
};

load_blacklist();

if ( is_url_blacklisted(url.href) ) {
	window.parent.postMessage({
		type: 'destroy'
	}, '*');

	return;
}

  /////////////////////////////
 // GDSaver
/////////////////////////////

var GDSaver = function(name, limit) {
	this.name = name;
	this.limit = limit || 30 * 1000;
	this.lastSavedName = '__GDSaver_' + notes_name + '_last_saved';
	this.savingName = '__GDSaver_' + notes_name + '_saving';
};

GDSaver.prototype.save = function() {
	debug && console.log('GDSaver.save', this.name);
	var self = this;

	if ( store.get(gd_auth_name) ) {
		debug && console.log('GDSaver.save', this.name, 'trying to save to google drive');
		var gd_last_saved = parseInt(store.get(self.lastSavedName));
		var gd_saving = parseInt(store.get(self.savingName));

		// Seeif we are already saving
		if ( !gd_saving ) {
			// Make sure we don't spam
			if ( !gd_last_saved || (Date.now() - gd_last_saved > self.limit) ) {
				store.set(self.savingName, 1);

				gd.save(notes_name, store.get(notes_name))
					.then(function() {
						debug && console.log('GDSaver.save', self.name, 'then');
						store.remove(self.savingName);
						store.set(self.lastSavedName, Date.now());
					})
					.catch(function(reason) {
						debug && console.log('GDSaver.save', self.name, 'catch', reason);
					});
			} else {
				// try again later
				setTimeout(self.save, Date.now() - gd_last_saved - self.limit);
			}
		}
	}
};

  /////////////////////////////
 // Google Drive Loader
/////////////////////////////

var GDLoader = function(name, limit, cb) {
	debug && console.log('GDLoader', name, limit, cb);
	var self = this;

	this.name = name;
	this.limit = limit;
	this.cb = cb;
	this.lastLoadName = '__GDLoader_' + name + '_last_loaded';
	this.loadingName = '__GDLoader_' + name + '_loading';
	this.loadingStartedName = '__GDLoader_' + name + '_loading_started';
	// In case loading gets stuck or the browser is closed while loading, etc
	this.loadingStartedTimeout = 60 * 1000;
	this.timeout = null;
};

GDLoader.prototype.setTimeout = function() {
	debug && console.log('GDLoader.setTimeout', this.name);
	var self = this;

	if ( !this.limit ) {
		return;
	}

	this.clearTimeout();
	this.timeout = setTimeout(function() {
		self.tryLoad();
	}, this.limit + 100);
};

GDLoader.prototype.clearTimeout = function() {
	debug && console.log('GDLoader.clearTimeout', this.name);
	clearTimeout(this.timeout);
};

GDLoader.prototype.tryLoad = function() {
	debug && console.log('GDLoader.tryLoad', this.name);
	var last_load = parseInt(store.get(this.lastLoadName));
	var loading = parseInt(store.get(this.loadingName));

	if ( loading ) {
		var loading_started = parseInt(store.get(this.loadingStartedName));

		if ( !loading_started || Date.now() - loading_started > this.loadingStartedTimeout ) {
			loading = false;
		}
	}

	if (
		!loading &&
		(!last_load || (last_load && Date.now() - last_load > this.limit) )
	) {
		return this.load();
	} else {
		return Promise.reject('GDLoader.tryLoad', this.name, loading, last_load, (last_load && Date.now() - last_load > this.limit));
	}
};

GDLoader.prototype.load = function() {
	debug && console.log('GDLoader.load', this.name);
	var self = this;

	store.set(this.loadingName, 1);

	return gd.load(this.name)
		.then(function(data) {
			debug && console.log('GDLoader.load then', self.name, data);
			var ldata = store.get(self.name);

			if ( self.cb && ldata !== data ) {
				self.cb(data);
			}

			if ( data !== store.get(self.name) ) {
				gdsaver_notes.save();
			}

			store.set(this.lastLoadName, Date.now());
			self.setTimeout();
			store.remove(this.loadingName);
		})
		.catch(function(reason) {
			debug && console.log('GDLoader.load catch', self.name, reason);
			self.setTimeout();
		});
};

  /////////////////////////////
 // Messaging
/////////////////////////////

var receive_message = function(event) {
	if ( typeof event.data !== 'string' ) { // don't log google drive stuff
		debug && console.log('iframe', event.data);
	}

	if ( event.data.type === 'save_note' ) {
		var onote = cwmMakeNote.notes[event.data.id];
		var note = event.data.note;
		var save_note = [];

		// convert short attrs to long attrs
		for ( var i = 0, l = onote.attrs.length, a; i < l; i++ ) {
			a = onote.attrs[i];
			save_note.push({
				name: a.p,
				value: note[a.s] || undefined
			});
		}

		onote.save(save_note, url.href);
	} else if ( event.data.type === 'url_change' ) {
		url.href = event.data.url;

		add_filter_urls();
		filter_select_change();

		for ( var key in cwmMakeNote.notes ) {
			if ( cwmMakeNote.notes.hasOwnProperty(key) ) {
				var note = cwmMakeNote.notes[key];

				if ( note.out && !note.matches(url.href) ) {
					window.parent.postMessage({
						type: 'delete',
						id: note.id
					}, '*');
				} else if ( note.out && note.matches(url.href) ) {
					note.toWindow();
				}
			}
		}
	} else if ( event.data.type === 'toList' && cwmMakeNote.notes[event.data.id] ) {
		cwmMakeNote.notes[event.data.id].$el.removeClass('to-window');
	} else if ( event.data.type === 'delete' && cwmMakeNote.notes[event.data.id] ) {
		cwmMakeNote.notes[event.data.id].$el.remove();
		delete cwmMakeNote.notes[event.data.id];
	}
};

window.addEventListener('message', receive_message, false);

  /////////////////////////////
 // App
/////////////////////////////

var $wrapper = $('#wrapper');
var $view = $('[data-type="view"]');
var $body = $(document.body);
var app = new window.cwmMakeNoteApp($, true);

app.attach();

$view
	.bind('click', function() {
		$view.hide();
		window.parent.postMessage({type: 'open'}, '*');
		$wrapper.removeClass('unloaded').addClass('loaded');
	})
	;

// Events
$document
	.delegate('[data-type="to-window"]', 'click', function() {
		cwmMakeNote.get_node(this).toWindow();
		cwmMakeNote.get_node(this).$el.addClass('to-window');
	})
	.delegate('[data-type="to-list"]', 'click', function() {
		cwmMakeNote.get_node(this).toList();
		cwmMakeNote.get_node(this).$el.removeClass('to-window');
	})
	.delegate('[data-type="collapse"]', 'click', function() {
		window.parent.postMessage({type: 'close'}, '*');
		$wrapper.removeClass('loaded');
		$view.show();
	})
	.delegate('[data-type="add-form"] form', 'submit', function(event) {
		event.preventDefault();
		var $this = $(this);
		var values = $this.serializeObject();

		if ( !values.title && !values.body ) {
			return;
		}

		var note = add_note(values);
	})
	;

  /////////////////////////////
 // Google Drive Object
/////////////////////////////

var gd = new window.GoogleDriveSaver('935193854133-41ob34a66acj58iuemb9ra42ic5i9uar.apps.googleusercontent.com', true);

  /////////////////////////////
 // Blacklist Manipulation
/////////////////////////////

var $blacklist_form = $('[data-type="blacklist-form"]');
var $blacklist_list = $('[data-type="blacklist"]')

var gdsaver_blacklist = new GDSaver(blacklist_name);

var blacklist_item_tpl_html = $('[data-type="blacklist-item-tpl"]').html();
var blacklist_item_tpl = app.tpl(blacklist_item_tpl_html);
var blacklist_data_name = '__make-note-blacklist-id';

var add_blacklist_item = function(id, item) {
	var $el = $(blacklist_item_tpl(item));
	$el.data(blacklist_data_name, id);
	$blacklist_list.append($el);
};

var save_blacklist = function() {
	store.set(blacklist_name, JSON.stringify(blacklist), true);
	gdsaver_blacklist.save();
};

var save_blacklist_item = function(el) {
	var $el = $(el);
	var val = $el.val();
	var id = $el.data(blacklist_data_name);
	blacklist[id].m = val;
	blacklist[id].u = Date.now().toString(36);
	save_blacklist();
};

$blacklist_form.bind('submit', function(e) {
	e.preventDefault();

	var $name = $(this).find('[name="match"]');
	var match = $name.val();
	$name.val('');

	if ( match ) {
		var id = Date.now().toString(36);
		blacklist[id] = {m: match, u: Date.now().toString(36)};
		save_blacklist();
		add_blacklist_item(id, blacklist[id]);
	}
});

$document
	.delegate('[data-type="blacklist-delete"]', 'click', function() {
		var $item = $(this).closest('[data-type="blacklist-item"]');

		if ( confirm('Really delete?') ) {
			var id = $item.data(blacklist_data_name);
			delete blacklist[id].m;
			blacklist[id].u = Date.now().toString(36);
			save_blacklist();
			$item.remove();
		}
	})
	.delegate('[data-type="blacklist-item"] input', 'blur', function() {
		save_blacklist_item(this);
	})
	.delegate('[data-type="blacklist-item"] input', 'keydown', function(e) {
		if ( e.which === 13 ) {
			save_blacklist_item(this);
		}
	});

//var blacklist_loader = new GDLoader(blacklist_name, 5 * 60 * 1000, function(data) {
var blacklist_loader = new GDLoader(blacklist_name, null, function(data) {
	debug && console.log('blacklist_loader cb', data);
	// Merge and turn off thing if blacklisted
});

for ( var key in blacklist ) {
	if ( blacklist.hasOwnProperty(key) ) {
		var b = blacklist[key];
		if ( b.m ) {
			add_blacklist_item(key, b);
		}
	}
}

  /////////////////////////////
 // Google Drive Auth Buttons
/////////////////////////////

var gd_auth_name = '__make-note-gdauth';

var $gdenable = $('[data-type="gdenable"]');
var $gdauthorize = $('[data-type="gdauthorize"]');
var $gddisable = $('[data-type="gddisable"]');
var $gdsync = $('[data-type="gdsync"]');

var update_gauth = function() {
	debug && console.log('update_gauth');
	var value = store.get(gd_auth_name);

	if ( value ) {
		$gdenable.hide();
		$gdauthorize.hide();
		$gddisable.show();
		$gdsync.show();
	} else {
		$gdenable.show();
		$gdauthorize.hide();
		$gddisable.hide();
		$gdsync.hide();
	}
};

$gdauthorize.bind('click', function() {
	$gdauthorize.hide();

	gd.enable(false)
		.then(function() {
			store.set(gd_auth_name, 1);
			notes_loader.tryLoad();
		})
		.catch(function(err) {
			store.set(gd_auth_name, 1);
			store.set(gd_auth_name, 0);
		});
});


$gdenable.bind('click', function() {
	$gdenable.hide();

	gd.loadScript()
		.then(function() {
			$gdauthorize.show();
		})
		.catch(function() {
			// Try again?
		});
});

$gddisable.bind('click', function() {
	store.remove(gd_auth_name);
	notes_loader.clearTimeout();
});

$gdsync.bind('click', function() {
	notes_loader.tryLoad()
		.then(function(data) {
		})
		.catch(function(reason) {
			debug && console.log('$gdsync click notes_loader catch', reason);
		});

	blacklist_loader.tryLoad()
		.then(function(data) {
		})
		.catch(function(reason) {
			debug && console.log('$gdsync click blacklist_loader catch', reason);
		});
});

store.watch(gd_auth_name, update_gauth);

update_gauth();

  /////////////////////////////
 // Note Manipulation
/////////////////////////////

var note_form_tpl_html = $('[data-type="note-form-tpl"]').html();
var note_form_tpl = app.tpl(note_form_tpl_html);

var $notes = $('[data-type="notes"]');
var $add_form = $(note_form_tpl({date: Date.now()}));

$add_form
	.appendTo('[data-type="add-form"]')
	.find('[name="match"]').val(url.href)
	;

  /////////////////////////////
 // Notes
/////////////////////////////

var note_tpl_html = $('[data-type="note-tpl"]').html();
var note_tpl = app.tpl(note_tpl_html);

window.parent.postMessage({
	type: 'loaded',
	tpls: [
		{name: 'note-tpl', html: note_tpl_html},
		{name: 'note-form-tpl', html: note_form_tpl_html}
	]
}, '*');

var notes_name = '__make-note-notes';
var notes = {};
var gdsaver_notes = new GDSaver(notes_name);

var matches = 0;
var add_note = function(values) {
	var note = new cwmMakeNote.Note(values, note_tpl, note_form_tpl, save_note, window.parent);

	cwmMakeNote.notes[note.id] = note;
	note.$el.appendTo($notes);

	$add_form[0].reset();

	$add_form.find('[name="match"]').val(url.href);

	if ( note.matches(document.location.href) ) {
		matches++;
		$('[data-type="view"]').html(matches);

		if ( note.out ) {
			note.toWindow();
		}
	} else {
		note.$el.hide();
	}

	return note;
};

var save_note = function(id, note_export) {
	debug && console.log('save_note', id, note_export);
	var snotes;

	try {
		snotes = store.get(notes_name) || '{}';
		snotes = JSON.parse(snotes);
	} catch(e) {
		snotes = {};
	}

	if ( note_export === undefined ) {
		delete snotes[id];
	} else {
		snotes[id] = note_export;
	}

	store.set(notes_name, JSON.stringify(snotes), true);
	gdsaver_notes.save();
};

var sync = function(data, local) {
	debug && console.log('sync', data);
	var gd_notes;
	var changed = false;

	try {
		gd_notes = JSON.parse(data || '{}');
	} catch(e) {
		gd_notes = {};
	}

	// Sync notes
	for ( var key in gd_notes ) {
		if ( gd_notes.hasOwnProperty(key) ) {
			var gd_note = gd_notes[key];
			gd_note.id = key;
			var note = cwmMakeNote.notes[key];

			// Note exists already
			if ( note ) {
				var updated = parseInt(gd_note.u, 36);

				// Update?
				if ( updated && !note.updated || updated > parseInt(note.updated, 36) ) {
					var save_note = [];

					// convert short attrs to long attrs
					for ( var i = 0, l = note.attrs.length, a; i < l; i++ ) {
						a = note.attrs[i];
						save_note.push({
							name: a.p,
							value: gd_note[a.s] || undefined
						});
					}

					note.save(save_note, url.href, true);
					changed = true;
				}
			// Note doesn't exist, add it
			} else {
				add_note(gd_note);
				changed = true;
			}
		}
	}

	if ( changed && !local ) {
		store.set(notes_name, JSON.stringify(notes), true);
	}
	debug && console.log('sync end');
};

//var notes_loader = new GDLoader(notes_name, 5 * 60 * 1000, sync);
var notes_loader = new GDLoader(notes_name, null, sync);
store.watch(notes_name, function() {
	sync(store.get(notes_name), true);
});

// Load notes
try {
	notes = store.get(notes_name) || '{}';
	notes = JSON.parse(notes);
} catch(e) {
	notes = {};
}

var note;

for ( var key in notes ) {
	if ( notes.hasOwnProperty(key) ) {
		if ( !notes[key].d ) {
			notes[key].id = key;
			note = add_note(notes[key]);
		}
	}
}

  /////////////////////////////
 // Filter Dropdown
/////////////////////////////

var $filter_select = $('[data-type="filter"] select');
var $filter_urls = $('[data-type="filter-urls"]');

var add_filter_urls = function() {
	$filter_urls.empty();
	var urls = {};
	var key;

	for ( key in cwmMakeNote.notes ) {
		if ( cwmMakeNote.notes.hasOwnProperty(key) ) {
			var note = cwmMakeNote.notes[key];
			urls[note.match] = 1;
		}
	}

	for ( key in urls ) {
		if ( urls.hasOwnProperty(key) ) {
			$('<option/>')
				.html(key)
				.appendTo($filter_urls)
				;
		}
	}
};

var filter_select_change = function() {
	var val = $filter_select.val();

	for ( var key in cwmMakeNote.notes ) {
		if ( cwmMakeNote.notes.hasOwnProperty(key) ) {
			var note = cwmMakeNote.notes[key];
			if ( val === 'all' || (val === 'url' && note.matches(url.href)) || val === note.match ) {
				note.$el.show();
			} else {
				note.$el.hide();
			}
		}
	}
};

add_filter_urls();

$filter_select.bind('change keyup', filter_select_change);

})();