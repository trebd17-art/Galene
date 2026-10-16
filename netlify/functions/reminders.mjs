import { getStore } from '@netlify/blobs';
import { validToken, tokenKey, validatePreferences, validateSubscription } from '../lib/reminders.mjs';
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store'}});
export function createRemindersHandler({storeFactory = getStore, env = process.env} = {}) {
return async function (request) {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const ready = !!(publicKey && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
  if (request.method === 'GET') return json({ ready, publicKey: ready ? publicKey : null });
  if (!['POST','DELETE'].includes(request.method)) return json({error:'Method not allowed.'},405);
  if (request.headers.get('origin') !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Request not allowed.'},403);
  if (Number(request.headers.get('content-length') || 0) > 8192) return json({error:'Request too large.'},413);
  const raw = await request.text();
  if (raw.length > 8192) return json({error:'Request too large.'},413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({error:'Invalid request.'},400); }
  if (!body || !validToken(body.token)) return json({error:'Invalid reminder token.'},400);
  const key = tokenKey(body.token);
  try {
    const store = storeFactory({name:'daily-reminders', consistency:'strong'});
    if (request.method === 'DELETE') { await store.delete(key); return json({ok:true}); }
    if (!ready) return json({error:'Daily reminders are not available yet.'},503);
    let preferences, subscription;
    try {
      preferences = validatePreferences(body);
      const hour = Number(preferences.time.split(':')[0]);
      if (hour < 8 || hour >= 21) throw Error('Choose a time between 8:00 AM and 8:45 PM.');
      subscription = validateSubscription(body.subscription);
    } catch(error) { return json({error:error.message},400); }
    const old = await store.get(key, {type:'json'});
    await store.setJSON(key, {...preferences, subscription, lastSentDay: old?.lastSentDay || null, updatedAt: new Date().toISOString()});
    return json({ok:true});
  } catch { return json({error:'Reminders could not be saved. Please try again later.'},503); }
};
}
export default createRemindersHandler();
export const config = { rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
