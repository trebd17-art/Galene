/* IndexedDB journal archive with a synchronous recovery log for legacy save callers. */
(function(){
  'use strict';
  const key='steadyMind.v1.data';let db=null,base=new Map(),timer=null,halted=false,working=false;
  const writer=crypto.randomUUID();
  const day=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function validDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return day(date)===value?value:'';}
  function entryDay(e){
    if(validDay(e.createdDay))return e.createdDay;
    if(e.createdAt){const date=new Date(e.createdAt);if(!Number.isNaN(date.getTime()))return day(date);}
    const iso=validDay((e.date||'').slice(0,10));if(iso)return iso;
    // Preserve ambiguous locale dates rather than silently assigning the wrong day.
    const match=(e.date||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D|$)/);
    if(match){let a=+match[1],b=+match[2];if(a>12&&b<=12)[a,b]=[b,a];else if(b<=12)return '';return validDay(`${match[3]}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`);}
    return '';
  }
  function records(entries){const result=new Map(),counts=new Map();for(const entry of entries){let id=entry.id||entry.routineId||entry.worrySessionId||entry.sleepSessionId||JSON.stringify(entry),n=counts.get(id)||0;counts.set(id,n+1);const key=String(id)+'#'+n;result.set(key,{key,entry:JSON.parse(JSON.stringify(entry)),createdDay:entryDay(entry),order:result.size});}return result;}
  function transaction(ops,clear=false){return new Promise((resolve,reject)=>{const tx=db.transaction('entries','readwrite'),store=tx.objectStore('entries');if(clear)store.clear();for(const op of ops){if(op.remove)store.delete(op.key);else store.put(op);}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Journal storage failed'));tx.onerror=()=>{};});}
  const readAll=()=>new Promise((resolve,reject)=>{const tx=db.transaction('entries','readonly'),request=tx.objectStore('entries').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  function status(message){const target=document.getElementById('journalStorageStatus');if(target)target.textContent=message;}
  async function flush(){
    if(!db||halted||working)return;working=true;
    try{
      const snapshot=JSON.parse(localStorage.getItem(key)||'null');
      if(snapshot?.journalStorage!=='indexeddb-v1')return;
      const ops=snapshot.journalPending||[],stamp=snapshot.journalRevision;if(!ops.length)return;
      await transaction(ops);
      if(snapshot.journalWriter===writer)for(const op of ops){if(op.remove)base.delete(op.key);else base.set(op.key,op);}
      const latest=JSON.parse(localStorage.getItem(key)||'null');
      if(latest?.journalStorage==='indexeddb-v1'&&latest.journalRevision===stamp){latest.journalPending=[];localStorage.setItem(key,JSON.stringify(latest));status('Journal archive is saved in this browser. Keep downloaded backups for long-term recovery.');}
    }catch(error){status('Journal archive update is pending. A browser-local recovery copy is retained. Keep this page open, export a backup, or retry saving.');}
    finally{working=false;try{const latest=JSON.parse(localStorage.getItem(key)||'null');if(!halted&&latest?.journalPending?.length)timer=setTimeout(flush,2000);}catch(_){status('Recovery storage is unavailable. Keep this page open and export a backup.');}}
  }
  async function initialize(){
    const raw=localStorage.getItem(key),snapshot=raw?JSON.parse(raw):null;
    try{
      db=await new Promise((resolve,reject)=>{const request=indexedDB.open('SteadierMindJournal',1);request.onupgradeneeded=()=>{const store=request.result.createObjectStore('entries',{keyPath:'key'});store.createIndex('createdDay','createdDay');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Close other SteadierMind tabs and retry.'));});
      let recovered=null,pendingFailed=false;
      if(snapshot?.journalStorage==='indexeddb-v1'){
        base=new Map((await readAll()).map(r=>[r.key,r]));
        const pending=snapshot.journalPending||[];recovered=new Map(base);for(const op of pending){if(op.remove)recovered.delete(op.key);else recovered.set(op.key,op);}
        try{await transaction(pending);base=recovered;}catch(error){pendingFailed=true;api.pending=true;}
      }else{
        base=snapshot?.journalRestore?new Map():new Map((await readAll()).map(r=>[r.key,r]));
        for(const [key,r] of records(snapshot?.journalEntries||[]))base.set(key,r);
        await transaction([...base.values()],Boolean(snapshot?.journalRestore));
      }
      api.initialEntries=[...(recovered||base).values()].sort((a,b)=>(a.order||0)-(b.order||0)).map(r=>JSON.parse(JSON.stringify(r.entry)));
      if(snapshot&&!pendingFailed){snapshot.journalEntries=[];snapshot.journalStorage='indexeddb-v1';snapshot.journalPending=[];snapshot.journalRevision=0;delete snapshot.journalRestore;localStorage.setItem(key,JSON.stringify(snapshot));}
      api.available=true;
    }catch(error){
      if(snapshot?.journalStorage==='indexeddb-v1')throw Error('Your journal archive cannot be opened. Nothing has been replaced. Enable browser storage or close other tabs, then retry.');
      db=null;api.available=false;api.initialEntries=snapshot?.journalEntries||[];
    }
  }
  function save(snapshot){
    if(halted)return false;
    if(!db){localStorage.setItem(key,JSON.stringify(snapshot));return true;}
    const next=records(snapshot.journalEntries),ops=[];
    for(const [id,r] of next)if(JSON.stringify(base.get(id))!==JSON.stringify(r))ops.push(r);
    const prior=JSON.parse(localStorage.getItem(key)||'null'),known=new Set(base.keys());
    if(prior?.journalWriter===writer)for(const op of prior.journalPending||[])known.add(op.key);
    for(const id of known)if(!next.has(id))ops.push({key:id,remove:true});
    localStorage.setItem(key,JSON.stringify({...snapshot,journalEntries:[],journalStorage:'indexeddb-v1',journalPending:ops,journalRevision:crypto.randomUUID(),journalWriter:writer}));
    clearTimeout(timer);timer=setTimeout(flush,30);return true;
  }
  async function entriesForDay(date){
    if(!db)return api.initialEntries.filter(e=>entryDay(e)===date);
    const list=await new Promise((resolve,reject)=>{const request=db.transaction('entries','readonly').objectStore('entries').index('createdDay').getAll(date);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const selected=new Map(list.map(r=>[r.key,r])),snapshot=JSON.parse(localStorage.getItem(key)||'null');
    for(const op of snapshot?.journalPending||[]){selected.delete(op.key);if(!op.remove&&op.createdDay===date)selected.set(op.key,op);}
    return [...selected.values()].sort((a,b)=>(a.order||0)-(b.order||0)).map(r=>r.entry);
  }
  async function clear(){halted=true;clearTimeout(timer);if(db){try{await transaction([],true);base.clear();}catch(error){halted=false;throw error;}}}
  const api=window.steadierMindJournalArchive={initialize,save,clear,flush,entriesForDay,entryDay,day,initialEntries:[],available:false};
})();
