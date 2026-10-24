/* Notifications only: deliberately do not cache private app screens or entries. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message = {};
  try { message = event.data?.json() || {}; } catch (_) {}
  event.waitUntil(self.registration.showNotification('SteadierMind', {
    body: typeof message.body === 'string' ? message.body : 'Your daily reminder is here.',
    icon: '/logo-picture.png', tag: 'steadiermind-daily', silent: true,
    data: {url: self.location.origin + '/app?reminder=daily'}
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin && ['/app','/index.html'].includes(new URL(client.url).pathname));
    if (existing) return existing.focus();
    return self.clients.openWindow(self.location.origin + '/app?reminder=daily');
  })());
});
