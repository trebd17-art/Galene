/* Local-only exports and previewed JSON imports. No file contents leave the browser. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);let incoming=null,sequence=0;
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const text=x=>typeof x==='string'&&x.length<=100000;
  const integer=(x,min=0,max=100000000)=>Number.isInteger(x)&&x>=min&&x<=max;
  function require(valid){if(!valid)throw Error('The file contains unsupported or invalid backup data.');}
  function inspect(value,depth=0,counter={n:0}){
    require(depth<=24&&++counter.n<=300000);
    if(typeof value==='string')require(text(value));
    if(typeof value==='number')require(Number.isFinite(value));
    if(Array.isArray(value)){require(value.length<=30000);value.forEach(v=>inspect(v,depth+1,counter));}
    else if(object(value))for(const [key,v] of Object.entries(value)){require(!['__proto__','prototype','constructor'].includes(key));inspect(v,depth+1,counter);}
  }
  function plain(value){
    if(typeof value==='string')require(!/[<>]/.test(value));
    else if(Array.isArray(value))value.forEach(plain);
    else if(object(value))Object.values(value).forEach(plain);
  }
  function strings(value){require(Array.isArray(value)&&value.every(text));}
  function entries(list,mood){
    require(Array.isArray(list));list.forEach(e=>{
      require(object(e));
      const allowed=mood?['id','date','day','createdAt','mood','value','score','note','influences']:['id','type','date','createdAt','createdDay','updatedAt','mood','text','summary','responses','routineId','worrySessionId','sleepSessionId'];
      require(Object.keys(e).every(k=>allowed.includes(k)));
      for(const [k,v] of Object.entries(e)){
        if(k==='score')require(typeof v==='number'&&v>=1&&v<=10);
        else if(k==='influences')strings(v);
        else if(k==='responses'){require(Array.isArray(v));v.forEach(r=>require(object(r)&&Object.keys(r).every(k=>['prompt','answer'].includes(k))&&text(r.prompt)&&text(r.answer)));}
        else require(text(v));
      }
      require(mood?text(e.mood||e.value||''):text(e.text||e.summary||'')||Array.isArray(e.responses));
    });
  }
  function progress(data){
    require(object(data));plain(data);
    for(const [key,p] of Object.entries(data)){
      require(object(p));
      if(key==='learning'){strings(p.completed);require(p.completed.every(id=>steadierMindLessons.some(l=>l.id===id)));require(p.last===null||text(p.last));}
      if(key==='rewards'){
        strings(p.badges);require(Array.isArray(p.events));p.events.forEach(e=>require(object(e)&&text(e.id)&&text(e.type)&&text(e.day)&&/^\d{4}-\d{2}-\d{2}$/.test(e.day)&&text(e.at)&&integer(e.points)&&(!e.tool||text(e.tool))));
      }
      if(key.startsWith('simpleGame_')||key==='centeredPuzzle'){
        require(integer(p.unlocked,0,4)&&Array.isArray(p.completed)&&p.completed.every(n=>integer(n,0,4)));
        if(key==='centeredPuzzle')require(object(p.best));
        if(p.draft){const d=p.draft;require(object(d)&&integer(d.level,0,4)&&typeof d.won==='boolean');
          if(key==='simpleGame_meadow'){strings(d.cards);require(d.cards.length>=4&&d.cards.length<=12&&Array.isArray(d.matched)&&Array.isArray(d.revealed));require([...d.matched,...d.revealed].every(i=>integer(i,0,d.cards.length-1))&&integer(d.moves));}
          if(key==='simpleGame_detective')require(integer(d.index,0,d.level+3)&&typeof d.answered==='boolean'&&integer(d.correct,0,d.level+3)&&(d.won||d.index<d.level+3));
          if(key==='simpleGame_pond')require(Array.isArray(d.pattern)&&d.pattern.length===d.level+3&&Array.isArray(d.input)&&[...d.pattern,...d.input].every(n=>integer(n,0,3))&&typeof d.study==='boolean'&&d.input.length<=d.pattern.length);
          if(key==='simpleGame_garden')require(Array.isArray(d.chosen)&&d.chosen.every(n=>integer(n,0,6)));
          if(key==='centeredPuzzle'){strings(d.board);require(d.board.length===25&&d.board.every(t=>['S','E','.','F','R','G','#'].includes(t))&&Array.isArray(d.charges)&&d.charges.length===3&&d.charges.every(n=>integer(n,0,20))&&integer(d.moves));}
        }
      }
    }
  }
  function validate(data){
    inspect(data);require(object(data)&&data.version===1&&(!data.app||data.app==='SteadierMind')&&integer(data.xp)&&integer(data.completedActivities));
    entries(data.journalEntries,false);entries(data.moodHistory,true);progress(data.gameProgress);
    if(data.plan){require(object(data.plan));plain(data.plan);strings(data.plan.improvements);for(const field of ['time','userType','challenge','hope','improvementText','createdAt'])require(text(data.plan[field]));require(object(data.plan.path)&&text(data.plan.path.name)&&text(data.plan.path.title));strings(data.plan.path.daily);require(object(data.plan.mindType)&&text(data.plan.mindType.name)&&text(data.plan.mindType.description));strings(data.plan.supportingPaths);}
    if(data.selectedOptions){require(object(data.selectedOptions));plain(data.selectedOptions);for(const v of Object.values(data.selectedOptions))require(v===null||text(v));}
    if(data.starter){const s=data.starter;require(object(s)&&object(s.setup));plain(s.setup);require(integer(s.setup.step,0,2)&&[2,5,10].includes(s.setup.minutes)&&text(s.setup.profile)&&text(s.setup.feeling));strings(s.setup.goals);
      if(s.routine){const r=s.routine;require(object(r)&&text(r.id)&&integer(r.step,0,4)&&typeof r.finished==='boolean');for(const f of ['before','reflection','action','after'])require(text(r[f]));require(Array.isArray(r.skipped)&&r.skipped.every(n=>integer(n,0,4)));}
    }
    if(data.games){require(object(data.games));for(const field of ['centeredLevel','colorBalanceLevel','anchorLevel'])if(field in data.games)require(integer(data.games[field],1,100000));if(data.games.thoughtDifficulty)require(['easy','medium','hard'].includes(data.games.thoughtDifficulty));}
    if(data.achievements){require(Array.isArray(data.achievements));plain(data.achievements);}
    if(data.completedDates)strings(data.completedDates);
    // Keep only snapshot fields understood by this version.
    const clean={};for(const key of ['version','savedAt','xp','completedActivities','plan','selectedOptions','journalEntries','moodHistory','gameProgress','achievements','completedDates','games','starter'])if(key in data)clean[key]=data[key];
    return clean;
  }
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.exportSteadierMindData=function(){download(JSON.stringify({...getSteadierMindSnapshot(),app:'SteadierMind'},null,2),'application/json','steadiermind-backup.json');};
  window.exportJournalDocument=function(){
    const cards=steadierMindJournalEntries.map(e=>{
      let content=`<h2>${escape(e.date||'Saved entry')}</h2>`;
      if(e.mood)content+=`<p>Feeling: ${escape(e.mood)}</p>`;
      if(Array.isArray(e.responses))for(const r of e.responses)content+=`<h3>${escape(r.prompt)}</h3><p>${escape(r.answer)}</p>`;
      else content+=`<p>${escape(e.text||e.summary||'')}</p>`;return `<article>${content}</article>`;
    }).join('');
    download(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SteadierMind Journal</title><style>body{max-width:760px;margin:auto;padding:24px;font:16px/1.6 system-ui;color:#21414d}article{border-top:1px solid #ccc;padding:20px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}h3{font-size:15px;color:#466f69}@media print{article{break-inside:avoid}}</style><h1>SteadierMind Journal</h1><p>Private export · ${steadierMindJournalEntries.length} saved entries. Use your browser’s Print option to save as PDF.</p>${cards||'<p>No saved entries.</p>'}</html>`,'text/html','steadiermind-journal.html');
  };
  window.exportMoodCsv=function(){
    const cell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const rows=[['Date','Calm score (1–10)','Mood','Influences','Note'],...steadierMindMoodHistory.map(e=>[e.createdAt||e.date||e.day||'',e.score??'',e.mood||e.value||'',(e.influences||[]).join('; '),e.note||''])];
    download('\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8','steadiermind-moods.csv');
  };
  function identity(entry){const id=entry.id||entry.routineId||entry.worrySessionId||entry.sleepSessionId;if(id)return 'id:'+id;return 'legacy:'+JSON.stringify(Object.keys(entry).sort().map(k=>[k,entry[k]]));}
  function merge(current,list){const seen=new Set(current.map(identity)),result=[...current];let duplicates=0;for(const e of list){const id=identity(e);if(seen.has(id))duplicates++;else{seen.add(id);result.push(e);}}return {entries:result,duplicates,added:result.length-current.length};}
  function preview(){
    if(!incoming)return;
    const journal=merge(steadierMindJournalEntries,incoming.journalEntries),mood=merge(steadierMindMoodHistory,incoming.moodHistory);
    $('backupPreview').hidden=false;$('backupPreviewText').textContent=`Backup: ${incoming.journalEntries.length} journal entries, ${incoming.moodHistory.length} mood entries, ${incoming.xp} Mind Points. Merge adds ${journal.added} journals and ${mood.added} moods; ${journal.duplicates+mood.duplicates} matching entries are skipped. Current entries win when IDs match. Merge keeps your current points, setup, and progress. Full restore replaces your current entries and progress with the backup.`;
  }
  window.cancelBackupImport=function(){sequence++;incoming=null;$('backupFile').value='';$('backupPreview').hidden=true;$('backupPreviewText').textContent='';};
  window.readBackupFile=async function(){
    const token=++sequence;incoming=null;$('backupPreview').hidden=true;
    const file=$('backupFile').files[0];if(!file)return;
    try{require(file.size<=16*1024*1024);const data=validate(JSON.parse(await file.text()));if(token!==sequence)return;incoming=data;preview();$('transferStatus').textContent='File checked locally. Review the preview before importing.';}
    catch(error){if(token===sequence){$('transferStatus').textContent='This is not a supported SteadierMind JSON backup, or it is larger than 16 MB. Nothing was changed.';$('backupFile').value='';}}
  };
  window.applyBackupImport=function(mode){
    if(!incoming)return;
    preview();
    if(mode==='replace'&&!confirm('Replace all current SteadierMind entries, points, setup, and progress with this backup? Export your current data first.'))return;
    const snapshot=mode==='replace'?incoming:{...getSteadierMindSnapshot(),journalEntries:merge(steadierMindJournalEntries,incoming.journalEntries).entries,moodHistory:merge(steadierMindMoodHistory,incoming.moodHistory).entries};
    snapshot.savedAt=new Date().toISOString();
    if(mode==='replace')snapshot.journalRestore=true;
    const keys=[STEADIERMIND_STORAGE_KEY,'steadyMind.planBuilt','steadyMind.forceNewUser'],before=keys.map(key=>localStorage.getItem(key));
    window.steadierMindRestoring=true;
    try{
      localStorage.setItem(STEADIERMIND_STORAGE_KEY,JSON.stringify(snapshot));
      if(snapshot.plan){localStorage.setItem('steadyMind.planBuilt','true');localStorage.removeItem('steadyMind.forceNewUser');}
      else{localStorage.removeItem('steadyMind.planBuilt');localStorage.setItem('steadyMind.forceNewUser','true');}
    }catch(error){keys.forEach((key,i)=>{try{if(before[i]===null)localStorage.removeItem(key);else localStorage.setItem(key,before[i]);}catch(_){}});window.steadierMindRestoring=false;$('transferStatus').textContent='The import could not be saved. Nothing was intentionally replaced. Keep the page open and retry; browser storage may be full.';return;}
    incoming=null;location.reload();
  };
})();
