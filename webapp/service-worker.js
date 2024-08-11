var GHPATH = '/cookie-crumb/webapp';
var VERSION = '0.1';


var APP_PREFIX = 'cookie_crumb_';
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/static/favicon.ico`,
  `${GHPATH}/static/favicon.png`,
  `${GHPATH}/static/spin.apng`,
  `${GHPATH}/static/media.jpg`,
  `${GHPATH}/static/css/victormono.min.css`,
  `${GHPATH}/static/css/tailwind.min.css`,
  `${GHPATH}/static/css/main.min.css`,
  `${GHPATH}/static/js/jquery.min.js`,
  `${GHPATH}/static/js/nunjucks.min.js`,
  `${GHPATH}/static/js/clipboard.min.js`,
  `${GHPATH}/static/js/lazyload.min.js`,
  `${GHPATH}/static/js/main.min.js`,
]

var CACHE_NAME = APP_PREFIX + "_version_" + String(VERSION)
self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (request) {
      if (request) { 
        return request
      } else {       
        return fetch(e.request)
      }
    })
  )
})

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS)
    })
  )
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      var cacheWhitelist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX)
      })
      cacheWhitelist.push(CACHE_NAME);
      return Promise.all(keyList.map(function (key, i) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(keyList[i])
        }
      }))
    })
  )
})