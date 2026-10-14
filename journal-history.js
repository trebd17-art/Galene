(function(){
  let limit=20,cache=null,sequence=0;
  window.journalHistorySelection=function(entries){
    const date=document.getElementById('journalDate').value;
    const selected=(cache&&cache.date===date?cache.entries:entries.filter(e=>!date||steadierMindJournalArchive.entryDay(e)===date)).slice().reverse();
    const unknown=entries.filter(e=>!steadierMindJournalArchive.entryDay(e)).length;
    document.getElementById('journalHistoryCount').textContent=`${selected.length} entries${date?' for '+date:''}. Showing up to ${limit}.${unknown?' '+unknown+' older entries have an uncertain original date and appear under All dates.':''}`;
    document.getElementById('journalShowMore').hidden=selected.length<=limit;
    return selected.slice(0,limit);
  };
  const render=renderSavedJournalEntries;
  window.renderSavedJournalEntries=function(){
    const token=++sequence,date=document.getElementById('journalDate').value;cache=null;render();
    if(date&&steadierMindJournalArchive.available)steadierMindJournalArchive.entriesForDay(date).then(entries=>{if(token===sequence){cache={date,entries};render();}}).catch(()=>{});
  };
  window.filterJournalHistory=function(){limit=20;renderSavedJournalEntries();};
  window.clearJournalDate=function(){document.getElementById('journalDate').value='';filterJournalHistory();};
  window.journalAnniversary=function(){const now=new Date(),year=now.getFullYear()-1,month=now.getMonth(),date=new Date(year,month,Math.min(now.getDate(),new Date(year,month+1,0).getDate()));document.getElementById('journalDate').value=steadierMindJournalArchive.day(date);filterJournalHistory();};
  window.journalDaysAgo=function(){const date=new Date();date.setDate(date.getDate()-365);document.getElementById('journalDate').value=steadierMindJournalArchive.day(date);filterJournalHistory();};
  window.setJournalOriginalDay=function(entry,date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    const id=entry.id||entry.routineId||entry.worrySessionId||entry.sleepSessionId;
    const current=steadierMindJournalEntries.find(e=>e===entry||(id&&(e.id||e.routineId||e.worrySessionId||e.sleepSessionId)===id)||JSON.stringify(e)===JSON.stringify(entry));if(!current)return;
    const previous=current.createdDay;current.createdDay=date;
    if(!saveSteadierMindData()){if(previous===undefined)delete current.createdDay;else current.createdDay=previous;document.getElementById('journalHistoryCount').textContent='The date could not be saved. Please try again.';return;}
    renderSavedJournalEntries();
  };
  document.addEventListener('DOMContentLoaded',()=>journalHistorySelection(steadierMindJournalEntries));
  window.showMoreJournalEntries=function(){limit+=20;renderSavedJournalEntries();};
})();
