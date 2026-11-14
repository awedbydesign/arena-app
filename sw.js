const CACHE = 'arena-v42';
const CORE = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/arena-logo2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always fetch Firebase and CDN live
  if(url.includes('firebasedatabase.app') || url.includes('gstatic.com') ||
     url.includes('firebaseio.com') || url.includes('cdnjs.cloudflare.com') ||
     url.includes('api.open-meteo.com') || url.includes('unpkg.com') ||
     url.includes('supabase.co') || url.includes('jsdelivr.net')){
    return;
  }
  // The app page itself always bypasses the browser's HTTP cache, so a new
  // deploy reaches every phone on the next load instead of minutes/hours later
  const isPage = e.request.mode === 'navigate' || url.endsWith('/') || url.includes('index.html') || url.endsWith('sw.js');
  e.respondWith(
    fetch(e.request, isPage ? { cache: 'no-store' } : undefined).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
