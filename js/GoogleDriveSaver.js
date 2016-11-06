// Requires Promise
// //cdnjs.cloudflare.com/ajax/libs/es6-promise/4.0.5/es6-promise.auto.min.js

;(function() {

var loaded = false;
var called = false;
var src = 'https://apis.google.com/js/client.js?onload=';

var GoogleDriveSaverException = function(message) {
	this.message = message;
	this.name = 'GoogleDriveSaverException';
};

var GDS = function(id, debug) {
	var self = this;
	this.id = id;
	this.fileMetas = {};
	this.debug = debug || false;
	this.authChecked = false;
	this.triedLoad = false;
	this.scopes = ['https://www.googleapis.com/auth/drive.appfolder'];
	this.accessToken = null;

	this.debug && console.log('GDS');

	if ( !id ) {
		throw GoogleDriveSaverException('An Oauth 2.0 Client ID is required');
	}
};

GDS.prototype.log = function() {
	if ( this.debug ) {
		console.log.apply(console, arguments);
	}
};

GDS.prototype.load = function(filename) {
	this.debug && console.log('GDS.load');
	var self = this;
	var meta = this.fileMetas[filename];

	var prm = new Promise(function(resolve, reject) {
		self.loadScript()
			.then(function(data) {
				if ( self.authChecked === true ) {
					return Promise.resolve();
				} else {
					return self.checkAuth(true);
				}
			})
			.then(function() {
				if ( self.fileMetas[filename] ) {
					return Promise.resolve();
				} else {
					return self.getFileMeta(filename);
				}
			})
			.then(function() {
				return self.downloadFile(self.fileMetas[filename]);
			})
			.then(function(data) {
				resolve(data);
			})
			.catch(function(reason) {
				self.debug && console.log('GDS.load catch', reason);
				reject(reason);
			});
	});

	return prm;
};

GDS.prototype.handleClientLoaded = function() {
	this.debug && console.log('GDS.handleClientLoaded');

	if ( window.gapi && window.gapi.auth ) {
		loaded = true;
		load_script_prm_resolve(1);
	} else {
		load_script_prm_reject('no gapi');
		load_script_prm = null;
	}
};

var load_script_prm;
var load_script_prm_resolve;
var load_script_prm_reject;
GDS.prototype.loadScript = function() {
	this.debug && console.log('GDS.loadScript');

	if ( load_script_prm ) {
		this.debug && console.log('GDS.loadScript', 'script already has a promise');
		return load_script_prm;
	}

	var self = this;

	load_script_prm = new Promise(function(resolve, reject) {
		load_script_prm_resolve = resolve;
		load_script_prm_reject = reject;
		var fn_name = '__Saver_handleClientLoaded' + Date.now();
		var el = document.createElement('script');
		el.setAttribute('type', 'text/javascript');
		el.setAttribute('src', src + fn_name);
		window[fn_name] = function() {
			self.handleClientLoaded();
		};

		document.getElementsByTagName('head')[0].appendChild(el);
	});

	this.debug && console.log('GDS.loadScript', 'returning unresolved promise');
	return load_script_prm;
};

GDS.prototype.enable = function(immediate) {
	this.debug && console.log('GDS.enable');
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		self.loadScript()
			.then(function(data) {
				return self.checkAuth(immediate);
			})
			.then(function(data) {
				resolve(data);
			})
			.catch(function(reason) {
				self.debug && console.log('GDS.load catch', reason);
				reject(reason);
			});
	});

	return prm;
};

/**
 * Check if the current user has authorized the application.
 */
GDS.prototype.checkAuth = function(immediate) {
	this.debug && console.log('GDS.checkAuth');
	var self = this;
	immediate = immediate || false;

	var prm = new Promise(function(resolve, reject) {
		self.debug && console.log('gapi.auth.authorize', self.id, self.scopes, immediate);

		gapi.auth.authorize({
			'client_id': self.id,
			'scope': self.scopes,
			'immediate': immediate
		}, function( auth_result ) {
			self.debug && console.log('gapi.auth.authorize CB', auth_result);

			if ( auth_result && !auth_result.error ) {
				self.debug && console.log('gapi.auth.authorize CB', 'No error');
				loaded = true;
				self.authChecked = true;
				// Do I need to save this?
				self.accessToken = auth_result['access_token'];
				// Access token has been successfully retrieved, requests can be sent to the API.
				// localStorage.setItem('google_drive_save', 1);

				// We have a callback for refreshing the auth
				// TODO always call this?
				gapi.client.load('drive', 'v2', function(data) {
					self.debug && console.log('gapi.client.load CB', data);
					resolve(1);
					//self.getFile();
				});
			} else if ( !immediate ) {
				self.debug && console.log('gapi.auth.authorize CB', 'Error');
				// No access token could be retrieved
				reject('No access token found, user de-authorized app?');
			} else {
				self.debug && console.log('gapi.auth.authorize CB', 'Not sure');
				// TODO what is this case?
				//self.checkAuth(false);
				reject(auth_result.error);
			}
		});
	});

	return prm;
};

GDS.prototype.save = function(filename, data) {
	this.debug && console.log('GDS.save', filename, data);
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		if ( loaded === true && self.authChecked === true && self.fileMetas[filename] ) {
			return self.updateFile(self.fileMetas[filename], data);
		} else {
			// TODO: load etc?
			reject([filename, loaded, self.authChecked, self.fileMetas, self.fileMetas[filename]]);
		}
	});

	return prm;
};

GDS.prototype.updateFile = function(file_meta, data) {
	this.debug && console.log('GDS.updateFile', data);
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		data = data || '{}';
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var contentType = 'text/plain';
		var base64Data = btoa(data);
		var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(file_meta) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

		var request = gapi.client.request({
			'path': '/upload/drive/v2/files/' + file_meta.id,
			'method': 'PUT',
			'params': {
				uploadType: 'multipart',
				alt: 'json'
			},
			'headers': {
				'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody
		});

		request.execute(function(data) {
			self.debug && console.log('gapi.client.request CB', data);

			if ( !data || data.error ) {
				if ( data.error.code === 404 ) {
					alert('It looks like the game was taken over in a new window - to take the game back, please refresh');
				} else {
					self.authChecked = false;
					// TODO: Use the refresh token instead
					self.checkAuth(true)
						.then(function() {
							self.updateFile(data);
						})
						.catch(function() {
							// TODO: ???
							reject();
						});
				}
			} else {
				resolve();
			}
		});
	});

	return prm;
};

/**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 * @param {Function} callback Function to call when the request is complete.
 */
GDS.prototype.downloadFile = function(file) {
	this.debug && console.log('GDS downloadFile', file);
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		if ( file.downloadUrl ) {
			var accessToken = gapi.auth.getToken().access_token;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', file.downloadUrl);
			xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

			xhr.onload = function() {
				self.debug && console.log('GDS downloadFile', 'xhr.onload', xhr.responseText);

				resolve(xhr.responseText);
			};

			xhr.onerror = function() {
				reject();
			};

			xhr.send();
		} else {
			reject();
		}
	});

	return prm;
};

/**
 * Permanently delete a file, skipping the trash.
 *
 * @param {String} fileId ID of the file to delete.
 */
GDS.prototype.deleteFile = function(file_id) {
	this.debug && console.log('GoogleSaver deleteFile');
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		var request = gapi.client.drive.files.delete({
			'fileId': file_id
		});

		request.execute(function(resp) {
			resolve(resp);
		});
	});

	return prm;
};

GDS.prototype.getFileMeta = function(filename) {
	this.debug && console.log('GDS.getFileMeta', filename);
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		/**
		 * List all files contained in the Application Data folder.
		 *
		 * @param {Function} callback Function to call when the request is complete.
		 */
		function listFilesInApplicationDataFolder(callback) {
			var retrievePageOfFiles = function(request, result) {
				request.execute(function(resp) {
					result = result.concat(resp.items);
					var nextPageToken = resp.nextPageToken;

					if (nextPageToken) {
						request = gapi.client.drive.files.list({
							'pageToken': nextPageToken
						});

						retrievePageOfFiles(request, result);
					} else {
						self.debug && console.log('GDS retrievePageOfFiles CB', result);
						callback(result);
					}
				});
			};

			var initialRequest = gapi.client.drive.files.list({
				'q': '\'appfolder\' in parents'
			});

			retrievePageOfFiles(initialRequest, []);
		}

		listFilesInApplicationDataFolder(function(result) {
			self.debug && console.log('GDS listFilesInApplicationDataFolder CB', result);

			for ( var i = 0, l = result.length; i < l; i++ ) {
				var file = result[i];

				// Found save file
				if ( file.title === filename ) {
					self.fileMetas[filename] = file;

					resolve();

					if ( self.triedLoad ) {
						// TODO: We need to resolve the load promise with the file here
					}

					return;
				}
			}

			// No save file found, make a new one
			self.newSaveFile(filename)
				.then(function() {
					resolve();
				})
				.catch(function(reason) {
					reject(reason);
				});
		});
	});

	return prm;
};

GDS.prototype.newSaveFile = function(filename) {
	this.debug && console.log('GDS.newSaveFile');
	var self = this;

	var prm = new Promise(function(resolve, reject) {
		var boundary = '-------314159265358979323846264';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var contentType = 'text/plain';
		var metadata = {
			'title': filename,
			'mimeType': contentType,
			'parents': [{'id': 'appfolder'}]
		};

		var base64Data = btoa(btoa(JSON.stringify({})));
		var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;
		var request = gapi.client.request({
			'path': '/upload/drive/v2/files',
			'method': 'POST',
			'params': {
				uploadType: 'multipart'
			},
			'headers': {
				'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody
		});

		request.execute(function(arg) {
			self.debug && console.log('gapi.client.request CB', arg);
			self.fileMetas[filename] = arg;
			resolve();
		});
	});

	return prm;
};

window.GoogleDriveSaver = GDS;

})(window);