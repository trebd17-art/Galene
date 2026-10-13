/* Small visual feedback; points remain owned by the existing activity logic. */
(function () {
  'use strict';
  let previous=Number(mindPoints)||0, timer=null;
  const original=updateXP;
  const quiet=()=>document.body.classList.contains('sleep-mode') || ['breathingSession','sleepSession','welcome','auth'].includes(document.querySelector('.screen.active')?.id);
  function dismiss(){clearTimeout(timer);document.getElementById('pointsFeedback')?.remove();}
  window.updateXP=function(){
    const result=original.apply(this,arguments),current=Number(mindPoints)||0,gain=current-previous;
    previous=current;
    if(gain>0 && document.readyState!=='loading' && !quiet()){
      dismiss();
      const bubble=document.createElement('div');bubble.id='pointsFeedback';bubble.className='points-feedback';
      bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');bubble.textContent=`+${gain} Mind Points ✨`;
      document.body.append(bubble);timer=setTimeout(dismiss,1600);
    }
    return result;
  };
  const navigate=showScreen;
  window.showScreen=function(){dismiss();return navigate.apply(this,arguments);};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)dismiss();});
})();
