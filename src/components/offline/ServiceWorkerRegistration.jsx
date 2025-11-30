import { useEffect } from "react";

const SW_CODE = `
const CACHE_NAME = 'sublinx-v2.2';
const STATIC_CACHE = 'sublinx-static-v2.2';
const DYNAMIC_CACHE = 'sublinx-dynamic-v2.2';
const IMAGE_CACHE = 'sublinx-images-v2.2';
const API_CACHE = 'sublinx-api-v2.2';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !name.startsWith('sublinx-') || (name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // Images: Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(request).then((networkResponse) => {
            if (networkResponse?.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#1f2937"/></svg>', 
              { headers: { 'Content-Type': 'image/svg+xml' } });
          });
        });
      })
    );
    return;
  }

  // API: Network First with Aggressive Cache
  if (url.pathname.startsWith('/api/')) {
    const isStaticAPI = url.pathname.includes('/entities/User') || 
                        url.pathname.includes('/entities/Venue') ||
                        url.pathname.includes('/auth/me');
    
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (request.method === 'GET' && networkResponse.status === 200) {
            const cacheName = isStaticAPI ? API_CACHE : DYNAMIC_CACHE;
            caches.open(cacheName).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ error: 'Offline', cached: false }), 
              { status: 503, headers: { 'Content-Type': 'application/json' } });
          });
        })
    );
    return;
  }

  // Other: Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(request).then((networkResponse) => {
        if (networkResponse?.status === 200) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw new Error('Network error');
      });
    })
  );
});
`;

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Create blob with service worker code
      const blob = new Blob([SW_CODE], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 New Service Worker version found');

            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ New version available! Reload to update.');
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Cleanup on unmount
      return () => {
        URL.revokeObjectURL(swUrl);
      };
    }
  }, []);

  return null;
}