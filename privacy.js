/* Prevent legacy unload autosaves from restoring data after deletion. */
(function () {
  'use strict';
  let deleting=false;
  const save=saveSteadierMindData;
  window.saveSteadierMindData=function(){return deleting||window.steadierMindRestoring?false:save.apply(this,arguments);};
  window.clearSteadierMindData=async function(){
    if(!confirm('Delete all SteadierMind entries, setup, plans, and progress in this browser? Downloaded exports will remain. This cannot be undone.'))return;
    const status=document.getElementById('privacyDataStatus');
    deleting=true;
    try {
      await window.steadierMindJournalArchive?.clear();
      for(const storage of [localStorage,sessionStorage]){
        const keys=Array.from({length:storage.length},(_,i)=>storage.key(i));
        keys.filter(key=>/^(steadyMind|steadierMind)(?:[.]|Data$)/i.test(key)).forEach(key=>storage.removeItem(key));
      }
      // This non-personal flag tells the legacy home screen to offer setup.
      localStorage.setItem('steadyMind.forceNewUser','true');
    } catch(error){
      deleting=false;
      if(status)status.textContent='Deletion could not finish. Some data may remain. Please try again or clear this website’s storage in your browser settings.';
      return;
    }
    window.location.reload();
  };
  // Keep the legacy development reset button within the same deletion scope.
  window.resetSteadierMindData=window.clearSteadierMindData;
  window.resetSteadierMindAppDataHard=window.clearSteadierMindData;
})();
