// MAM Family Tracker — Service Worker
// Caches the app shell for offline use

const CACHE = 'mam-v1';
const ASSETS = [
  '/mam-tracker/',
  '/mam-tracker/index.html',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install: cache app shell
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll([
        '/mam-tracker/',
        '/mam-tracker/index.html'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', function(e){
  // Don't intercept Google Apps Script API calls
  if(e.request.url.includes('script.google.com')){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache successful GET requests for app assets
        if(e.request.method === 'GET' && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback for navigation
        if(e.request.mode === 'navigate'){
          return caches.match('/mam-tracker/index.html');
        }
      });
    })
  );
});
