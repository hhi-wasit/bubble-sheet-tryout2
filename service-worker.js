const C='examflow-v1',F=['./','index.html','manifest.json','js/core.js','js/app.js','lib/jspdf.umd.min.js','lib/xlsx.full.min.js','icons/i192.png','icons/i512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
