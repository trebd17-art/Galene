import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { due, payload, validateSubscription } from '../lib/reminders.mjs';
export async function sendReminders({storeFactory = getStore, push = webpush, env = process.env, now = new Date()} = {}) {
  const {VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY} = env;
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  push.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
  const store = storeFactory({name:'daily-reminders',consistency:'strong'});
  for await (const page of store.list({paginate:true})) {
    for (let offset=0; offset<page.blobs.length; offset+=10) {
      await Promise.all(page.blobs.slice(offset,offset+10).map(async ({key})=>{
        try {
          const {data:record,etag} = await store.getWithMetadata(key,{type:'json'});
          if (!record) return;
          const day = due(record, now);
          if (!day) return;
          validateSubscription(record.subscription);
          // Claim this day's send atomically so overlapping scheduled invocations cannot duplicate it.
          const claim = await store.setJSON(key,{...record,lastSentDay:day},{onlyIfMatch:etag});
          if (!claim.modified) return;
          // Re-read so an opt-out or preferences update wins before dispatch wherever possible.
          const current = await store.get(key,{type:'json'});
          if (!current || current.updatedAt !== record.updatedAt) return;
          try { await push.sendNotification(record.subscription,JSON.stringify(payload(record,day)),{TTL:900,urgency:'low',timeout:10000}); }
          catch(error) { if ([404,410].includes(error.statusCode)) await store.delete(key); }
        } catch { /* Do not log subscription endpoints or keys. Other recipients can still receive theirs. */ }
      }));
    }
  }
}

export default async function () { await sendReminders(); return new Response(null,{status:204}); }
