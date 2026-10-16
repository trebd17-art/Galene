/* Open journal storage before legacy startup saves can run. */
(async function(){
  const status=document.getElementById('bootStatus'),phone=document.querySelector('.phone');
  const ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
  try{
    window.steadierMindInitializing=true;
    await steadierMindJournalArchive.initialize();await ready;
    const scripts=['app.js','starter.js?v=20261016-routine-home','breathing.js?v=20261016-first-impressions','grounding.js','worry.js?v=20261016-first-impressions','sleep.js','reflection.js','mood.js','games.js','centered.js','new-games.js','education-content.js','education-sources.js','education.js?v=20261016-first-impressions','privacy.js?v=20261016-push-reminders','rewards.js','feedback.js','data-transfer.js','journal-history.js','reminders.js?v=20261016-push-reminders'];
    for(const src of scripts)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('App files could not load. Check the connection and retry.'));document.body.append(script);});
    document.dispatchEvent(new Event('DOMContentLoaded'));window.steadierMindInitializing=false;phone.hidden=false;status.hidden=true;
    document.getElementById('journalStorageStatus').textContent=steadierMindJournalArchive.pending?'Journal archive update is pending; a local recovery copy is retained. Export a backup or retry saving.':steadierMindJournalArchive.available?'Journal entries use IndexedDB in this browser. Keep backups; browser storage is not a guaranteed archive.':'IndexedDB is unavailable. Journal entries are using local storage in this browser; keep backups.';
  }catch(error){status.textContent=error.message+' ';const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();status.append(retry);}
})();
