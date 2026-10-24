import test from 'node:test';
import assert from 'node:assert/strict';
import { due, payload, tokenKey, validateSubscription, validatePreferences } from '../netlify/lib/reminders.mjs';
import { createRemindersHandler } from '../netlify/functions/reminders.mjs';
import { sendReminders } from '../netlify/functions/send-reminders.mjs';
const env={VAPID_PUBLIC_KEY:'public-key',VAPID_PRIVATE_KEY:'private-key',VAPID_SUBJECT:'mailto:example@example.com'};
const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/example',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}};
const preferences={time:'10:00',timezone:'America/New_York',discreet:true};
const deviceToken='a'.repeat(64);
function store() {
  const records=new Map(), versions=new Map();
  return {
    records,
    async get(key){return structuredClone(records.get(key)||null);},
    async getWithMetadata(key){return records.has(key)?{data:structuredClone(records.get(key)),etag:versions.get(key)}:null;},
    async setJSON(key,data,options={}){
      if(options.onlyIfMatch!==undefined && versions.get(key)!==options.onlyIfMatch)return {modified:false};
      records.set(key,structuredClone(data));versions.set(key,(versions.get(key)||0)+1);return {modified:true};
    },
    async delete(key){records.delete(key);versions.delete(key);},
    async *list(){yield {blobs:[...records.keys()].map(key=>({key}))};}
  };
}
function request(body,method='POST',origin='https://steadiermind.example') {
  return new Request('https://steadiermind.example/.netlify/functions/reminders',{method,headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
}
test('schedule respects local timezone, quarter-hour window, quiet hours, and last sent date',()=>{
  const record={...preferences,lastSentDay:null};
  assert.equal(due(record,new Date('2026-10-16T14:00:00Z')),'2026-10-16');
  assert.equal(due(record,new Date('2026-10-16T14:14:59Z')),'2026-10-16');
  assert.equal(due(record,new Date('2026-10-16T14:15:00Z')),null);
  assert.equal(due(record,new Date('2026-10-16T13:59:59Z')),null);
  assert.equal(due({...record,lastSentDay:'2026-10-16'},new Date('2026-10-16T14:01:00Z')),null);
  assert.equal(due({...record,time:'22:00'},new Date('2026-10-17T02:00:00Z')),null);
  assert.equal(due({...record,time:'07:00'},new Date('2026-10-16T11:00:00Z')),null);
  assert.equal(due({...record,timezone:'Asia/Kolkata'},new Date('2026-10-16T04:30:00Z')),'2026-10-16');
  assert.equal(due(record,new Date('2026-11-02T15:00:00Z')),'2026-11-02');
});
test('strict subscription and preference validation excludes internal or attacker endpoints',()=>{
  assert.deepEqual(validateSubscription(subscription),subscription);
  for(const endpoint of ['http://fcm.googleapis.com/x','https://127.0.0.1/x','https://fcm.googleapis.com.evil.test/x','https://evil.test/x','https://user@fcm.googleapis.com/x','https://fcm.googleapis.com:8443/x'])assert.throws(()=>validateSubscription({...subscription,endpoint}));
  assert.throws(()=>validateSubscription({...subscription,keys:{auth:'bad',p256dh:'bad'}}));
  assert.throws(()=>validatePreferences({...preferences,time:'10:07'}));
  assert.throws(()=>validatePreferences({...preferences,timezone:'invented/timezone'}));
  assert.throws(()=>validatePreferences({...preferences,discreet:'yes'}));
});
test('payloads contain no saved health content and discreet mode is generic',()=>{
  const value=payload({...preferences,journal:'PRIVATE',mood:'PRIVATE'},'2026-10-16');
  assert.equal(value.body,'Your daily reminder is here.');
  assert.ok(!JSON.stringify(value).includes('PRIVATE'));
  assert.notEqual(payload({...preferences,discreet:false},'2026-10-16').body,value.body);
});
test('subscription API needs same-origin token, strips extra data, preserves last-send, and deletes',async()=>{
  const memory=store(),handler=createRemindersHandler({storeFactory:()=>memory,env});
  const data={...preferences,subscription,token:deviceToken,journal:'PRIVATE'};
  assert.equal((await handler(request(data,'POST','https://evil.test'))).status,403);
  assert.equal((await handler(request({...data,token:'guess'}))).status,400);
  assert.equal((await handler(request(null))).status,400);
  assert.equal((await handler(request({...data,time:'22:00'}))).status,400);
  assert.equal((await handler(request(data))).status,200);
  const key=tokenKey(deviceToken),record=await memory.get(key);
  assert.equal(record.journal,undefined);assert.equal(record.token,undefined);
  await memory.setJSON(key,{...record,lastSentDay:'2026-10-16'});
  assert.equal((await handler(request({...data,time:'11:00'}))).status,200);
  assert.equal((await memory.get(key)).lastSentDay,'2026-10-16');
  assert.equal((await handler(request({token:deviceToken},'DELETE'))).status,200);
  assert.equal(await memory.get(key),null);
  const response=await handler(new Request('https://steadiermind.example/.netlify/functions/reminders'));
  assert.deepEqual(await response.json(),{ready:true,publicKey:'public-key'});
  const unavailable=createRemindersHandler({storeFactory:()=>memory,env:{}});
  assert.deepEqual(await (await unavailable(new Request('https://steadiermind.example/.netlify/functions/reminders'))).json(),{ready:false,publicKey:null});
});
test('sender claims atomically, avoids duplicates, expires invalid subscriptions, and skips opt-outs',async()=>{
  const memory=store(),record={...preferences,subscription,lastSentDay:null,updatedAt:'example'},now=new Date('2026-10-16T14:00:00Z');
  await memory.setJSON('active',record);
  let sent=0;
  const push={setVapidDetails(){},async sendNotification(sub,data,options){sent++;assert.equal(options.TTL,900);assert.equal(options.urgency,'low');assert.equal(JSON.parse(data).body,'Your daily reminder is here.');}};
  await Promise.all([sendReminders({storeFactory:()=>memory,push,env,now}),sendReminders({storeFactory:()=>memory,push,env,now})]);
  assert.equal(sent,1);
  await sendReminders({storeFactory:()=>memory,push,env,now});assert.equal(sent,1);
  await memory.setJSON('expired',record);
  await sendReminders({storeFactory:()=>memory,push:{setVapidDetails(){},async sendNotification(){throw {statusCode:410};}},env,now});
  assert.equal(await memory.get('expired'),null);
  await memory.delete('active');
  await sendReminders({storeFactory:()=>memory,push,env,now});assert.equal(sent,1);
});

test('service worker displays generic push safely and focuses the app on tap',async()=>{
  const {readFileSync}=await import('node:fs');
  const {runInNewContext}=await import('node:vm');
  const listeners={},shown=[];
  let focused=false,closed=false,opened=false;
  const self={
    location:{origin:'https://steadiermind.example'},
    addEventListener(type,handler){listeners[type]=handler;},
    registration:{async showNotification(title,options){shown.push({title,...options});}},
    clients:{async matchAll(){return [{url:'https://steadiermind.example/app?existing',async focus(){focused=true;}}];},async openWindow(){opened=true;}}
  };
  runInNewContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{self,URL});
  let task;
  listeners.push({data:{json(){return {title:'Untrusted',body:'One manageable step is enough.',url:'https://evil.test'};}},waitUntil(p){task=p;}});
  await task;
  assert.equal(shown[0].title,'SteadierMind');assert.equal(shown[0].silent,true);
  assert.equal(shown[0].data.url,'https://steadiermind.example/app?reminder=daily');
  listeners.notificationclick({notification:{close(){closed=true;},data:{url:'https://evil.test'}},waitUntil(p){task=p;}});
  await task;assert.ok(focused&&closed);assert.equal(opened,false);
  listeners.push({data:{json(){throw Error('Bad payload');}},waitUntil(p){task=p;}});await task;
  assert.equal(shown[1].body,'Your daily reminder is here.');
});
