/* Playful visual feedback; activity logic remains the owner of points. */
(function () {
  'use strict';
  let previous=Number(mindPoints)||0, achievement=null, returnFocus=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quiet=()=>document.body.classList.contains('sleep-mode') || ['breathingSession','groundingSession','sleepSession','welcome','auth'].includes(document.querySelector('.screen.active')?.id);
  function dismiss(){
    const dialog=document.getElementById('rewardCelebration');
    document.getElementById('pointsFeedback')?.remove();
    if(dialog){dialog.close();dialog.remove();}
    achievement=null;
    if(returnFocus?.isConnected&&!returnFocus.disabled&&returnFocus.matches('button,a,input,select,textarea,[tabindex]')&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});
    else document.querySelector('.screen.active button:not(:disabled):not([hidden])')?.focus({preventScroll:true});
    returnFocus=null;
  }
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
  function celebrate(label,points=0,milestone=null){
    if(quiet()||document.hidden)return;
    let dialog=document.getElementById('rewardCelebration');
    if(!dialog){
      returnFocus=document.activeElement;
      achievement={label,points:0,milestone:null};
      dialog=document.createElement('dialog');dialog.id='rewardCelebration';dialog.className='reward-celebration';
      dialog.setAttribute('aria-labelledby','rewardTitle');dialog.setAttribute('aria-describedby','rewardDescription');
      dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
      dialog.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();dialog.querySelector('#rewardContinue')?.focus();}});
      document.body.append(dialog);
    }
    achievement.label=label;achievement.points+=points;if(milestone)achievement.milestone=milestone;
    dialog.replaceChildren();
    const badge=document.createElement('div');badge.className='achievement-icon';badge.setAttribute('aria-hidden','true');badge.textContent=achievement.milestone?'🏅':'✓';
    const title=document.createElement('h2');title.id='rewardTitle';title.textContent='You did it!';
    const description=document.createElement('p');description.id='rewardDescription';description.textContent=achievement.label;
    dialog.append(badge,title,description);
    if(achievement.points){const earned=document.createElement('p');earned.className='achievement-points';earned.textContent=`+${achievement.points} Mind Points`;dialog.append(earned);}
    if(achievement.milestone){const milestoneText=document.createElement('p');milestoneText.className='achievement-milestone';milestoneText.textContent=achievement.milestone;dialog.append(milestoneText);}
    const proceed=document.createElement('button');proceed.type='button';proceed.id='rewardContinue';proceed.textContent='Continue';proceed.onclick=dismiss;dialog.append(proceed);
    particles(dialog,20,'reward-confetti');
    if(!dialog.open)dialog.showModal();
    proceed.focus({preventScroll:true});
  }
  const original=updateXP;
  window.updateXP=function(){
    const old=previous,result=original.apply(this,arguments),current=Number(mindPoints)||0,gain=current-old;
    previous=current;
    if(gain>0 && !window.steadierMindInitializing && document.readyState!=='loading' && !quiet() && !document.hidden){
      const milestone=getLevelName(old)!==getLevelName(current)?`${Math.floor(current/100)*100} Mind Points earned`:null;
      const badges=window.consumeRewardBadges?.()||[];
      if(milestone||badges.length||document.getElementById('rewardCelebration'))celebrate(badges.length?'A new badge earned!':milestone?'A new milestone reached!':achievement.label,gain,[...badges,milestone].filter(Boolean).join(' · ')||null);
      else {
        document.getElementById('pointsFeedback')?.remove();
        const toast=document.createElement('div');toast.id='pointsFeedback';toast.className='participation-toast';toast.setAttribute('role','status');toast.textContent=`Saved ✓ · +${gain} Mind Points`;
        document.body.append(toast);setTimeout(()=>toast.remove(),1800);
      }
    } else window.consumeRewardBadges?.();
    return result;
  };
  for(const name of ['saveSimpleGameWin','completeCalmFocusRound','finishGroundingGame']){
    const originalFinish=window[name];if(!originalFinish)continue;
    window[name]=function(){const before=completedActivities,points=mindPoints,result=originalFinish.apply(this,arguments);if(completedActivities>before){document.getElementById('pointsFeedback')?.remove();celebrate('Level complete!',document.getElementById('rewardCelebration')?0:mindPoints-points);}return result;};
  }
  const routineNext=starterRoutineNext;
  window.starterRoutineNext=function(){
    const before=getSteadierMindSnapshot().starter?.routine,wasFinished=before?.finished,points=mindPoints;
    const result=routineNext.apply(this,arguments),after=getSteadierMindSnapshot().starter?.routine;
    if(!wasFinished&&after?.finished&&after.skipped.filter(step=>step<4).length<4){
      try{const saved=JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY));if(saved?.starter?.routine?.id===after.id&&saved.starter.routine.finished){document.getElementById('pointsFeedback')?.remove();celebrate('Your routine is complete!',document.getElementById('rewardCelebration')?0:mindPoints-points);}}catch(_){}
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
