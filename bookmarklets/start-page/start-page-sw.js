this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v3').then(function(cache) {
      return cache.addAll([
        '/bookmarklets/start-page/start-page.html',
        '/bookmarklets/start-page/start-page-edit.html',
        '/bookmarklets/start-page/start-page-edit.js',
        '/bookmarklets/start-page/start-page-edit.css'
      ]);
    })
  );
});

this.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).catch(function() {
      return fetch(event.request);
    })
  );
});