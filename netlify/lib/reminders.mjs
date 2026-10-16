import { createHash } from 'node:crypto';
export const messages = [
  'A small pause, if you need one.',
  'One manageable step is enough.',
  'Take a moment to notice your surroundings.',
  'If it feels comfortable, let your breathing settle.',
  'You can take this moment at your own pace.',
  'Make a little space for yourself today.'
];
export const tokenKey = token => createHash('sha256').update(token).digest('hex');
export function validToken(token) { return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token); }
export function validatePreferences(input) {
  const { time, timezone, discreet } = input;
  if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time || '') || typeof discreet !== 'boolean') throw Error('Choose a valid reminder time.');
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch { throw Error('Choose a valid timezone.'); }
  if (typeof timezone !== 'string' || timezone.length > 100) throw Error('Choose a valid timezone.');
  return { time, timezone, discreet };
}
export function validateSubscription(input) {
  const { endpoint, keys } = input || {};
  let url;
  try { url = new URL(endpoint); } catch { throw Error('Invalid notification subscription.'); }
  // Never allow the sender to request arbitrary URLs or internal network addresses.
  const hosts = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
  const allowed = hosts.includes(url.hostname) || url.hostname.endsWith('.notify.windows.com');
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || !allowed || endpoint.length > 2048) throw Error('Unsupported notification provider.');
  if (!keys || !/^[\w-]{87}$/.test(keys.p256dh || '') || !/^[\w-]{22}$/.test(keys.auth || '')) throw Error('Invalid subscription keys.');
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
export function localMoment(now, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour)*60+Number(parts.minute), hour: Number(parts.hour) };
}
export function due(record, now) {
  const local = localMoment(now, record.timezone);
  const [hour, minute] = record.time.split(':').map(Number);
  const delta = local.minute - (hour*60+minute);
  // Daytime choices enforce quiet hours, and expire missed reminders rather than queueing them.
  return local.hour >= 8 && local.hour < 21 && delta >= 0 && delta < 15 && record.lastSentDay !== local.day ? local.day : null;
}
export function payload(record, day) {
  const n = [...day].reduce((sum,c)=>sum+c.charCodeAt(0),0) % messages.length;
  return { title: 'SteadierMind', body: record.discreet ? 'Your daily reminder is here.' : messages[n], tag: 'steadiermind-daily', url: '/' };
}
