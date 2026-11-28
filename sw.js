/*!
 * Liamvtrade — Service Worker & Offline Cache Controller v3.1
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const CACHE_NAME = 'liamvtrade-cache-v3.1';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './candles.js',
  './candles-adapter.js',
  './npattern.js',
  './methods.js',
  './npattern-bridge.js',
  './news.js',
  './price-feed.js',
  './app.js',
  './intelligence-upgrade.js',
  './calibration-fix.js',
  './ui-picker.js',
  './cloud-sync.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (
    url.hostname.includes('twelvedata.com') ||
    url.hostname.includes('cryptocompare.com') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('binance.com') ||
    url.hostname.includes('binance.vision') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('coinbase.com') ||
    url.hostname.includes('yahoo.com') ||
    url.hostname.includes('frankfurter.app') ||
    url.hostname.includes('goldprice.org') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('telegram.org')
  ) {
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./index.html');
      }
    })
  );
});
