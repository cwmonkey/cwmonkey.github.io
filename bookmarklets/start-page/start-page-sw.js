var CACHE_NAME = 'my-site-cache-v5';
var urlsToCache = [
  '/bookmarklets/start-page/start-page.html'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache' + CACHE_NAME);
        return cache.addAll(urlsToCache).then(function() {
          console.log('All resources have been fetched and cached.');
        });
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});