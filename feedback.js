/* Playful visual feedback; activity logic remains the owner of points. */
(function () {
  'use strict';
  let previous=Number(mindPoints)||0, timer=null, celebrationTimer=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quiet=()=>document.body.classList.contains('sleep-mode') || ['breathingSession','groundingSession','sleepSession','welcome','auth'].includes(document.querySelector('.screen.active')?.id);
  function dismiss(){clearTimeout(timer);clearTimeout(celebrationTimer);document.getElementById('pointsFeedback')?.remove();document.getElementById('rewardCelebration')?.remove();}
  function particles(parent,count,kind){
    if(reduced())return;
    for(let i=0;i<count;i++){
      const piece=document.createElement('span');piece.className=`reward-particle ${kind}`;piece.setAttribute('aria-hidden','true');
      piece.textContent=kind==='reward-spark'?'✦':'';
      const angle=(i/count)*Math.PI*2;
      piece.style.setProperty('--dx',`${Math.cos(angle)*(42+(i%3)*14)}px`);
      piece.style.setProperty('--dy',`${Math.sin(angle)*55-35}px`);
      piece.style.setProperty('--turn',`${(i%2?1:-1)*150}deg`);
      piece.style.setProperty('--piece-color',['#e8ba57','#80c6ad','#9cb7e7','#df9caa'][i%4]);parent.append(piece);
    }
  }
  function celebrate(label,badge=false){
    if(quiet()||document.hidden)return;
    clearTimeout(celebrationTimer);document.getElementById('rewardCelebration')?.remove();
    const celebration=document.createElement('div');celebration.id='rewardCelebration';celebration.className='reward-celebration';
    const message=document.createElement('div');message.className='reward-badge';message.setAttribute('role','status');message.textContent=`${badge?'🏅':'✓'} ${label}`;
    celebration.append(message);particles(celebration,20,'reward-confetti');document.body.append(celebration);
    celebrationTimer=setTimeout(()=>celebration.remove(),1600);
  }
  const original=updateXP;
  window.updateXP=function(){
    const old=previous,result=original.apply(this,arguments),current=Number(mindPoints)||0,gain=current-old;
    previous=current;
    if(gain>0 && document.readyState!=='loading' && !quiet() && !document.hidden){
      dismiss();
      const bubble=document.createElement('div');bubble.id='pointsFeedback';bubble.className='points-feedback';
      const text=document.createElement('span');text.setAttribute('role','status');text.setAttribute('aria-live','polite');text.textContent=`+${gain} Mind Points ✨`;
      bubble.append(text);particles(bubble,8,'reward-spark');document.body.append(bubble);timer=setTimeout(dismiss,1600);
      if(getLevelName(old)!==getLevelName(current))celebrate(getLevelName(current),true);
    }
    return result;
  };
  for(const name of ['saveSimpleGameWin','completeCalmFocusRound','finishGroundingGame']){
    const originalFinish=window[name];if(!originalFinish)continue;
    window[name]=function(){const before=completedActivities,result=originalFinish.apply(this,arguments);if(completedActivities>before&&!document.getElementById('rewardCelebration'))celebrate('Level complete!');return result;};
  }
  const routineNext=starterRoutineNext;
  window.starterRoutineNext=function(){
    const before=getSteadierMindSnapshot().starter?.routine,wasFinished=before?.finished;
    const result=routineNext.apply(this,arguments),after=getSteadierMindSnapshot().starter?.routine;
    if(!wasFinished&&after?.finished&&after.skipped.filter(step=>step<4).length<4){
      try{const saved=JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY));if(saved?.starter?.routine?.id===after.id&&saved.starter.routine.finished)celebrate('Your routine is complete!');}catch(_){}
    }
    return result;
  };
  // Start pointer feedback before navigation/rerender; keyboard clicks work too.
  function bounceButton(event){
    const button=event.target.closest?.('button');
    if(!button||button.disabled||quiet()||reduced()||button.closest('#breathingSession,#groundingSession,#sleepSession'))return;
    button.getAnimations().forEach(animation=>{if(animation.id==='button-reward-bounce')animation.cancel();});
    const bounce=button.animate([{transform:'scale(.94)'},{transform:'scale(1.045)',offset:.55},{transform:'scale(.985)',offset:.8},{transform:'scale(1)'}],{duration:320,easing:'ease-out'});bounce.id='button-reward-bounce';
  }
  document.addEventListener('pointerdown',bounceButton);
  document.addEventListener('click',event=>{if(event.detail===0)bounceButton(event);});
  const navigate=showScreen;window.showScreen=function(){dismiss();return navigate.apply(this,arguments);};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)dismiss();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{
    document.querySelectorAll('.reward-particle').forEach(piece=>piece.remove());
    document.querySelectorAll('button').forEach(button=>button.getAnimations().filter(animation=>animation.id==='button-reward-bounce').forEach(animation=>animation.cancel()));
  });
})();
