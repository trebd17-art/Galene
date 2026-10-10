/* Four accessible, untimed games with five levels and device-local progress. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const icons = ['🌻','🍃','🦋','🌷','🐝','🌱'];
  const cases = [
    {text:'I sent a message ten minutes ago.',answer:'Fact',why:'This describes something that happened.'},
    {text:'They will never reply to me.',answer:'Prediction',why:'A future outcome is not known yet.'},
    {text:'I can put my phone down and take a short break.',answer:'Next step',why:'This is a specific action you can choose.'},
    {text:'My meeting is scheduled for tomorrow.',answer:'Fact',why:'A scheduled date can be checked.'},
    {text:'Everyone will think my question is silly.',answer:'Prediction',why:'You do not yet know what other people will think.'},
    {text:'I can write down one question before the meeting.',answer:'Next step',why:'A small preparation step is within reach.'},
    {text:'I slept for six hours last night.',answer:'Fact',why:'This is a concrete observation.'}
  ];
  const detectiveLevels = [cases.slice(0,3),
    [
      {text:'The meeting starts at nine.',answer:'Fact',why:'You can check the scheduled time.'},
      {text:'I will get every answer wrong.',answer:'Prediction',why:'That forecasts an outcome before it happens.'},
      {text:'I can prepare one question.',answer:'Next step',why:'Preparation is an action you can take.'},
      {text:'I wrote two notes for the meeting.',answer:'Fact',why:'This describes completed work.'}
    ],
    [
      {text:'My friend canceled our plans today.',answer:'Fact',why:'The cancellation happened; the reason may still be unknown.'},
      {text:'They will never want to see me again.',answer:'Prediction',why:'One canceled plan does not tell you the future.'},
      {text:'I can ask whether another day works.',answer:'Next step',why:'This gives you a practical way to seek clarity.'},
      {text:'We last met on Saturday.',answer:'Fact',why:'This is a specific past event.'},
      {text:'Our next conversation will be awkward.',answer:'Prediction',why:'That conversation has not happened yet.'}
    ],
    [
      {text:'I missed my usual walk yesterday.',answer:'Fact',why:'This names one event, without judging the whole week.'},
      {text:'I will never keep a routine.',answer:'Prediction',why:'A missed day does not establish what will happen forever.'},
      {text:'I can try a five-minute walk today.',answer:'Next step',why:'A small action can be easier to begin.'},
      {text:'My walking shoes are by the door.',answer:'Fact',why:'You can observe where they are.'},
      {text:'A short walk will be pointless.',answer:'Prediction',why:'You are guessing its value before trying it.'},
      {text:'I can choose a comfortable route.',answer:'Next step',why:'That is a concrete choice within your control.'}
    ],
    [
      {text:'I have three items on my list.',answer:'Fact',why:'The number of items can be checked.'},
      {text:'I will disappoint everyone today.',answer:'Prediction',why:'You cannot know everyone’s future reaction.'},
      {text:'I can choose the smallest item first.',answer:'Next step',why:'Choosing one task helps make the plan manageable.'},
      {text:'I finished one task this morning.',answer:'Fact',why:'This acknowledges a specific action that happened.'},
      {text:'Tomorrow will be just as difficult.',answer:'Prediction',why:'Tomorrow has not unfolded yet.'},
      {text:'I can ask for help with one item.',answer:'Next step',why:'Asking for support is an action you can choose.'},
      {text:'There is a ten-minute break in my schedule.',answer:'Fact',why:'You can check that space in your schedule.'}
    ]
  ];
  const plans = [
    {budget:4,needs:['Task','Rest'],goal:'Make room for one task and one rest.'},
    {budget:5,needs:['Task','Connection'],goal:'Choose a task and a way to connect.'},
    {budget:6,needs:['Task','Rest','Connection'],goal:'Balance a task, rest, and connection.'},
    {budget:5,needs:['Rest','Rest','Connection'],goal:'Plan a lighter day: two rests and one connection.'},
    {budget:7,needs:['Task','Task','Rest','Connection'],goal:'Fit two small tasks, one rest, and one connection.'}
  ];
  const activities = [
    {name:'Water a plant',type:'Task',cost:1,icon:'🌱'},
    {name:'Tidy one corner',type:'Task',cost:2,icon:'🧺'},
    {name:'Start a big project',type:'Task',cost:4,icon:'📚'},
    {name:'Quiet pause',type:'Rest',cost:1,icon:'☁️'},
    {name:'Sit outside',type:'Rest',cost:2,icon:'🌤'},
    {name:'Send a kind message',type:'Connection',cost:1,icon:'💌'},
    {name:'Call a friend',type:'Connection',cost:3,icon:'☎️'}
  ];
  const games = {
    meadow:{name:'Memory Meadow',intro:'Turn over two cards to find a matching pair. Nothing is timed; you can explore at your own pace.',lesson:'When attention wanders, return to one small detail.'},
    detective:{name:'Thought Detective',intro:'Sort each sentence into a fact, a prediction, or a next step. Read the explanation, then choose Next.',lesson:'Separating observations from predictions can make a next step easier to see.'},
    pond:{name:'Pattern Pond',intro:'Study the row of pond creatures. Hide it when you are ready, then tap the creatures in the same order. You can look again anytime.',lesson:'Breaking a pattern into small groups can make it easier to remember.'},
    garden:{name:'Pocket Garden',intro:'Build a little daily plan using a limited number of space tokens. Match the goal without filling every moment.',lesson:'A manageable plan can leave room for rest and connection.'}
  };
  let key=null,state=null;
  const storeKey=()=>`simpleGame_${key}`;
  const progress=()=>steadierMindGameProgress[storeKey()] || {unlocked:0,completed:[],draft:null};
  function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
  function button(text,fn,cls){const e=element('button',text,cls);e.type='button';e.onclick=fn;return e;}
  function persist(){
    const p=progress();steadierMindGameProgress[storeKey()]={...p,draft:JSON.parse(JSON.stringify(state))};
    if(!saveSteadierMindData())$('simpleGameFeedback').textContent+=' This change could not be saved. Keep this page open to continue.';
  }
  function newLevel(level){
    const config=games[key];
    state={level,won:false,moves:0};
    if(key==='meadow'){
      const cards=icons.slice(0,level+2).flatMap(i=>[i,i]);
      for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
      state.cards=cards;state.matched=[];state.revealed=[];
    }
    if(key==='detective'){state.index=0;state.answered=false;state.correct=0;}
    if(key==='pond'){state.pattern=Array.from({length:level+3},(_,i)=>(i*2+level+Math.floor(i/2))%4);state.input=[];state.study=true;}
    if(key==='garden')state.chosen=[];
    render(config.intro);persist();
  }
  function render(message){
    const config=games[key],p=progress();
    $('simpleGameTitle').textContent=config.name;$('simpleGameIntro').textContent=config.intro;
    $('simpleGameProgress').textContent=`Level ${state.level+1} of 5`;
    $('simpleGameLevels').replaceChildren();
    for(let i=0;i<5;i++){const b=button(`${i+1}${p.completed.includes(i)?' ✓':''}`,()=>newLevel(i));b.disabled=i>p.unlocked;b.setAttribute('aria-label',`Level ${i+1}${p.completed.includes(i)?', completed':''}`);b.setAttribute('aria-current',i===state.level?'step':'false');$('simpleGameLevels').append(b);}
    const board=$('simpleGameBoard');board.replaceChildren();board.className=`simple-game-board game-${key}`;
    if(key==='meadow')renderMeadow(board);
    if(key==='detective')renderDetective(board);
    if(key==='pond')renderPond(board);
    if(key==='garden')renderGarden(board);
    $('simpleGameNext').hidden=!state.won;$('simpleGameNext').textContent=state.level===4?'Play again':'Next level';
    $('simpleGameRetry').hidden=true;
    if(message)$('simpleGameFeedback').textContent=message;
  }
  function renderMeadow(board){
    board.append(element('p',`${state.matched.length/2} of ${state.cards.length/2} pairs found · ${state.moves} turns`));
    const grid=element('div','','memory-grid');
    state.cards.forEach((icon,index)=>{
      const visible=state.matched.includes(index)||state.revealed.includes(index);
      const b=button(visible?icon:'✿',()=>{
        if(state.won||state.revealed.length===2||state.matched.includes(index)||state.revealed.includes(index))return;
        state.revealed.push(index);
        if(state.revealed.length===2){state.moves++;if(state.cards[state.revealed[0]]===state.cards[state.revealed[1]]){state.matched.push(...state.revealed);state.revealed=[];}}
        if(state.matched.length===state.cards.length){win();return;}
        render(state.revealed.length===2?'Different cards. Take a look, then choose Try another pair.':'Take your time finding a pair.');persist();
      });b.disabled=state.won||state.matched.includes(index);b.setAttribute('aria-label',`Card ${index+1}: ${visible?icon:'face down'}`);grid.append(b);
    });board.append(grid);
    if(state.revealed.length===2)board.append(button('Try another pair',()=>{state.revealed=[];render();persist();},'secondary'));
  }
  function renderDetective(board){
    if(state.won){board.append(element('p',`You explored ${state.level+3} sentences. ${state.correct} matched on the first try.`));return;}
    const current=detectiveLevels[state.level][state.index];board.append(element('p',`Sentence ${state.index+1} of ${state.level+3}`));board.append(element('p',current.text,'detective-card'));
    ['Fact','Prediction','Next step'].forEach(answer=>{const b=button(answer,()=>{
      if(state.answered||state.won)return;state.answered=true;if(answer===current.answer)state.correct++;
      render(`${answer===current.answer?'That fits.':'Consider “'+current.answer+'.”'} ${current.why}`);persist();
    });b.disabled=state.answered;board.append(b);});
    if(state.answered)board.append(button(state.index===state.level+2?'Finish level':'Next sentence',()=>{state.index++;state.answered=false;if(state.index>=state.level+3)win();else {render('What kind of sentence is this?');persist();}}));
  }
  const creatures=['🐸','🐟','🦆','🪷'];
  function renderPond(board){
    if(state.study){board.append(element('p','Study this pattern. You choose when to hide it.'));const row=element('div','','pond-pattern');state.pattern.forEach(n=>row.append(element('span',creatures[n])));board.append(row);
      board.append(button('Ready — hide the pattern',()=>{state.study=false;state.input=[];render('Tap the creatures in order.');persist();}));return;}
    board.append(element('p',`Remembered ${state.input.length} of ${state.pattern.length}`));
    const row=element('div','','pond-controls');creatures.forEach((icon,n)=>{const b=button(icon,()=>{
      if(state.won)return;
      if(n!==state.pattern[state.input.length]){state.input=[];render('Try again, or look at the pattern. There is no penalty.');persist();return;}
      state.input.push(n);if(state.input.length===state.pattern.length)win();else{render('Keep going at your own pace.');persist();}
    });b.disabled=state.won;b.setAttribute('aria-label',['Frog','Fish','Duck','Lotus'][n]);row.append(b);});board.append(row);
    if(!state.won)board.append(button('Look again',()=>{state.study=true;state.input=[];render();persist();},'secondary'));
  }
  function renderGarden(board){
    const plan=plans[state.level],used=state.chosen.reduce((sum,i)=>sum+activities[i].cost,0);
    board.append(element('p',plan.goal));board.append(element('p',`${used} of ${plan.budget} space tokens used. Each activity can be chosen once.`));
    activities.forEach((activity,index)=>{const picked=state.chosen.includes(index);const b=button(`${picked?'✓ ':''}${activity.icon} ${activity.name} · ${activity.type} · ${activity.cost}`,()=>{
      if(state.won)return;
      if(picked)state.chosen=state.chosen.filter(i=>i!==index);
      else if(used+activity.cost<=plan.budget)state.chosen.push(index);
      else{render('That would use too much space. Remove an activity or choose a smaller one.');return;}
      render('Your plan is taking shape. Choose Check my garden when ready.');persist();
    },picked?'garden-picked':'secondary');b.disabled=state.won;b.setAttribute('aria-pressed',String(picked));board.append(b);});
    if(!state.won)board.append(button('Check my garden',()=>{
      const types=state.chosen.map(i=>activities[i].type),remaining=[...types];
      const satisfied=plan.needs.every(type=>{const i=remaining.indexOf(type);if(i<0)return false;remaining.splice(i,1);return true;});
      if(satisfied)win();else render(`Almost there. Goal: ${plan.goal} You can change any choice.`);
    }));
  }
  function win(){state.won=true;render();saveSimpleGameWin();}
  window.saveSimpleGameWin=function(){
    if(!state?.won)return;
    const before=steadierMindGameProgress[storeKey()],p=progress(),points=mindPoints,count=completedActivities;
    const first=!p.completed.includes(state.level),completed=first?[...p.completed,state.level]:[...p.completed];
    if(first){mindPoints+=10;completedActivities++;}
    steadierMindGameProgress[storeKey()]={...p,completed,unlocked:Math.max(p.unlocked,Math.min(4,state.level+1)),draft:JSON.parse(JSON.stringify(state))};
    if(!saveSteadierMindData()){
      if(before)steadierMindGameProgress[storeKey()]=before;else delete steadierMindGameProgress[storeKey()];mindPoints=points;completedActivities=count;
      $('simpleGameFeedback').textContent='Level complete. Progress could not be saved. Retry to keep your progress.';$('simpleGameRetry').hidden=false;$('simpleGameNext').hidden=true;return;
    }
    updateXP();render(`Level complete! ${games[key].lesson} ${first?'+10 Mind Points.':'Replay complete.'}`);
  };
  window.openSimpleGame=function(game){
    if(!games[game])return;key=game;showScreen('simpleGame');const p=progress();
    if(p.draft&&Number.isInteger(p.draft.level)&&p.draft.level>=0&&p.draft.level<5){state=JSON.parse(JSON.stringify(p.draft));render(state.won?'Your completed level is saved. Choose Next level or play again.':key==='detective'&&state.answered?detectiveLevels[state.level][state.index].why:'Welcome back. Continue your level at your own pace.');}
    else newLevel(p.unlocked);
  };
  window.nextSimpleGame=function(){if(state?.won&&$('simpleGameRetry').hidden)newLevel(state.level===4?0:state.level+1);};
  window.restartSimpleGame=function(){if(state)newLevel(state.level);};
})();
