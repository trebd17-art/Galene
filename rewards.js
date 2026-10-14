/* Participation records contain activity type/date only, never entry text or mood. */
(function(){
  'use strict';
  let context=null,pending=[];
  const sessions={};
  const dayKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const ledger=()=>steadierMindGameProgress.rewards || {events:[],badges:[]};
  const definitions=[
    ['reflection','First Reflection','Save your first daily reflection.'],
    ['checkins','Five Check-ins','Record five mood or daily check-ins.'],
    ['learning','Curious Mind','Complete all three lessons in a learning path.'],
    ['tools','Making Space','Complete three different calming tools.'],
    ['routine','A Steady Start','Finish a routine with at least one activity.']
  ];
  function earned(){
    const events=ledger().events,completed=steadierMindGameProgress.learning?.completed||[];
    const current=[
      steadierMindJournalEntries.some(e=>e.type==='dailyReflection')||events.some(e=>e.type==='reflection'),
      Math.max(steadierMindMoodHistory.length,events.filter(e=>e.type==='mood').length)+events.filter(e=>e.type==='checkin').length>=5,
      steadierMindLearningPaths.some(p=>steadierMindLessons.filter(l=>l.path===p.id).every(l=>completed.includes(l.id))),
      new Set(events.filter(e=>e.type==='tool').map(e=>e.tool)).size>=3,
      events.some(e=>e.type==='routine')
    ].map((yes,i)=>yes?definitions[i][0]:null).filter(Boolean);
    return [...new Set([...ledger().badges,...current])];
  }
  function inferred(){
    if(context)return context();
    const screen=document.querySelector('.screen.active')?.id;
    const tool={breathingSession:'breathing',groundingSession:'grounding',worrySession:'worry'}[screen];
    return {id:tool?sessions[tool]||crypto.randomUUID():crypto.randomUUID(),type:tool?'tool':'activity',tool};
  }
  const save=saveSteadierMindData;
  window.saveSteadierMindData=function(){
    const old=steadierMindGameProgress.rewards;
    let previous=null;try{previous=JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY)||'null');}catch(_){}
    const gain=Number(mindPoints)-Number(previous?.xp||0);
    let added=false;
    if(gain>0){
      const event=inferred(),p=ledger();
      if(!p.events.some(e=>e.id===event.id)){steadierMindGameProgress.rewards={...p,events:[...p.events,{...event,points:gain,at:new Date().toISOString(),day:dayKey(new Date())}]};added=true;}
    }
    const p=ledger(),badges=earned(),newBadges=badges.filter(id=>!p.badges.includes(id));
    steadierMindGameProgress.rewards={...p,badges};
    if(!save.apply(this,arguments)){if(old)steadierMindGameProgress.rewards=old;else delete steadierMindGameProgress.rewards;return false;}
    if(added)pending.push(...newBadges.map(id=>definitions.find(d=>d[0]===id)[1]));
    return true;
  };
  window.consumeRewardBadges=()=>{const result=[...new Set(pending)];pending=[];return result;};
  function withContext(name,make){const original=window[name];window[name]=function(){const before=context;context=make;try{return original.apply(this,arguments);}finally{context=before;}};}
  withContext('saveJournal',()=>({type:'reflection',id:steadierMindJournalEntries.at(-1)?.id||crypto.randomUUID()}));
  withContext('saveMoodEntry',()=>({type:'mood',id:steadierMindMoodHistory.at(-1)?.id||crypto.randomUUID()}));
  withContext('completeLearningLesson',()=>({type:'lesson',id:`lesson:${steadierMindGameProgress.learning?.last}`}));
  withContext('saveSimpleGameWin',()=>({type:'game',id:crypto.randomUUID()}));
  withContext('completeCalmFocusRound',()=>({type:'game',id:crypto.randomUUID()}));
  withContext('finishGroundingGame',()=>({type:'game',id:crypto.randomUUID()}));
  window.completeActivity=function(){
    const event=inferred();if(ledger().events.some(e=>e.id===event.id))return;
    const points=mindPoints,count=completedActivities;mindPoints+=5;completedActivities++;
    if(!saveSteadierMindData()){
      mindPoints=points;completedActivities=count;
      const message=document.getElementById('checkinResult');if(message&&document.querySelector('.screen.active')?.id==='checkin')message.textContent='Your check-in could not be saved. Please try again.';
      return;
    }
    updateXP();
  };
  const checkin=saveCheckIn;
  window.saveCheckIn=function(){
    const id=`checkin:${dayKey(new Date())}`;
    if(ledger().events.some(e=>e.id===id)){document.getElementById('checkinResult').textContent='Your daily check-in is already recorded today. Use Mood Tracker to save another check-in.';return;}
    const previous=context;context=()=>({type:'checkin',id});try{return checkin.apply(this,arguments);}finally{context=previous;}
  };
  for(const [name,tool] of [['openBreathingSession','breathing'],['openGroundingSession','grounding'],['openWorrySession','worry'],['openSleepSession','sleep']]){
    const original=window[name];window[name]=function(){sessions[tool]=crypto.randomUUID();return original.apply(this,arguments);};
  }
  const routineNext=starterRoutineNext;
  window.starterRoutineNext=function(){
    const before=getSteadierMindSnapshot().starter?.routine,wasFinished=before?.finished;
    const result=routineNext.apply(this,arguments),after=getSteadierMindSnapshot().starter?.routine;
    if(!wasFinished&&after?.finished&&after.skipped.filter(step=>step<4).length<4){
      let saved;try{saved=JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY));}catch(_){}
      const id=`routine:${after.id}`;
      if(saved?.starter?.routine?.finished&&!ledger().events.some(e=>e.id===id)){
        const points=mindPoints,count=completedActivities,previous=context;
        context=()=>({type:'routine',id});mindPoints+=10;completedActivities++;
        if(saveSteadierMindData())updateXP();else{mindPoints=points;completedActivities=count;}
        context=previous;
      }
    }
    return result;
  };
  // Rest has no points: completion can still count toward trying different tools.
  const sleepNext=nextSleepStep;
  window.nextSleepStep=function(){const result=sleepNext.apply(this,arguments),id=sessions.sleep;
    if(document.getElementById('sleepProgress').textContent==='Finished for tonight'&&id&&!ledger().events.some(e=>e.id===id)){
      const old=steadierMindGameProgress.rewards,p=ledger();steadierMindGameProgress.rewards={...p,events:[...p.events,{id,type:'tool',tool:'sleep',points:0,at:new Date().toISOString(),day:dayKey(new Date())}]};
      if(!saveSteadierMindData()){if(old)steadierMindGameProgress.rewards=old;else delete steadierMindGameProgress.rewards;}
    }return result;};
  window.getLevelName=points=>`${Math.floor(Math.max(0,points)/100)*100} Mind Points milestone`;
  window.renderRewardsPage=function(){
    const p=ledger(),start=new Date();start.setDate(start.getDate()-6);const earliest=dayKey(start),today=dayKey(new Date());
    const recent=p.events.filter(e=>e.day>=earliest&&e.day<=today),days=new Set(recent.map(e=>e.day)).size;
    const text=`${recent.length} activities across ${days} ${days===1?'day':'days'} in the last seven days`;
    for(const id of ['weeklyActivityCount','streakText']){const el=document.getElementById(id);if(el)el.textContent=text;}
    for(const id of ['rewardsXpText','xpText']){const el=document.getElementById(id);if(el)el.textContent=`${mindPoints} Mind Points earned`;}
    const next=(Math.floor(mindPoints/100)+1)*100;
    const title=document.getElementById('levelName');if(title)title.textContent=`Next milestone: ${next} Mind Points`;
    const fill=document.getElementById('xpFill');if(fill)fill.style.width=`${mindPoints%100}%`;
    document.getElementById('rewardsRemainingText').textContent=`${Math.max(0,next-mindPoints)} Mind Points to the next milestone. No points are lost for taking a break.`;
    const badges=document.getElementById('participationBadges');badges.replaceChildren();const completed=earned();
    for(const [id,name,description] of definitions){const card=document.createElement('div');card.className='card';const heading=document.createElement('strong');heading.textContent=`${completed.includes(id)?'✓':'○'} ${name}`;const detail=document.createElement('p');detail.textContent=description;card.append(heading,detail);badges.append(card);}
  };
  const update=updateXP;window.updateXP=function(){const result=update.apply(this,arguments);renderRewardsPage();return result;};
  const navigate=showScreen;window.showScreen=function(screen){const result=navigate.apply(this,arguments);if(screen==='rewards')renderRewardsPage();return result;};
  document.addEventListener('DOMContentLoaded',renderRewardsPage);
})();
