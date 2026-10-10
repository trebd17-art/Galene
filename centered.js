/* Five deterministic, untimed path puzzles; independent of the legacy board. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const levels = [
    {name:'A little clearing',map:['SF...','####.','####.','####.','####E'],charges:[2,0,0],target:1,guide:'Choose Breathing, then tap the mist to open your first path.',hint:'Clear the mist just beside the start.',lesson:'One small step can create room to move.'},
    {name:'Putting down roots',map:['S.R..','####.','####F','####.','####E'],charges:[1,1,0],target:2,guide:'Roots and mist need different tools. Follow the bend in the path.',hint:'Ground the roots on the top row, then breathe through the mist on the right.',lesson:'Different obstacles can call for different kinds of support.'},
    {name:'Another way across',map:['SF###','.####','G####','.####','..R.E'],charges:[1,1,1],target:2,guide:'The mist leads to a dead end. Look for a route down and around.',hint:'Bridge the gap on the left, then untangle the roots along the bottom.',lesson:'You can change your approach when a route does not help.'},
    {name:'Room to choose',map:['SFFR.','G###.','.###G','R###.','F...E'],charges:[1,1,1],target:3,guide:'Two routes lead to the lantern. Choose which tools to use along yours.',hint:'Either travel across the top and down the right, or down the left and across the bottom. One breath can clear neighboring mist.',lesson:'There can be more than one useful way forward.'},
    {name:'Through the quiet valley',map:['S.R##','##F##','##G..','##F#.','####E'],charges:[1,1,1],target:3,guide:'Bring all three tools together. Breathing reaches every mist tile next to the tile you choose.',hint:'Use Breathing on the gap in the middle: it clears the mist nearby. Then bridge that gap and ground the roots at the top.',lesson:'Small choices can work together to build a path.'}
  ];
  // The final valley has two separated mist tiles: breathing affects all mist
  // within two orthogonal steps, so selecting the central bend reaches both.
  let state = null, history = [], selected = 'breathing';
  const tools = ['breathing','grounding','reframe'];
  const labels = ['🌬 Breathing','🌿 Grounding','↔ Reframe'];
  const symbol = {S:'✦',E:'◉','.':'·',F:'≋',R:'♧',G:'↔','#':'◆'};
  const tileName = {S:'Start',E:'Lantern','.':'Open path',F:'Mist',R:'Roots',G:'Gap','#':'Stone'};
  function progress() { return steadierMindGameProgress.centeredPuzzle || {completed:[],best:{},unlocked:0}; }
  function neighbors(index) { const row=Math.floor(index/5),col=index%5; return [index-5,index+5,index-1,index+1].filter(i=>i>=0&&i<25&&Math.abs(Math.floor(i/5)-row)+Math.abs(i%5-col)===1); }
  function path() {
    const queue=[0],previous=new Map([[0,null]]);
    for(let n=0;n<queue.length;n++) {
      const index=queue[n];
      if(index===24) { const result=[]; let i=index; while(i!==null){result.unshift(i);i=previous.get(i);} return result; }
      neighbors(index).forEach(i=>{if(!previous.has(i)&&['S','E','.'].includes(state.board[i])){previous.set(i,index);queue.push(i);}});
    }
    return [];
  }
  function persistDraft() {
    const p=progress(); steadierMindGameProgress.centeredPuzzle={...p,draft:JSON.parse(JSON.stringify(state))};
    return saveSteadierMindData();
  }
  function render(message) {
    const level=levels[state.level],route=state.won?path():[];
    $('centeredPuzzleTitle').textContent=level.name;
    $('centeredPuzzleGuide').textContent=level.guide;
    $('centeredPuzzleStats').textContent=`Level ${state.level+1} of 5 · ${state.moves} move${state.moves===1?'':'s'} · Optional challenge: ${level.target} moves`;
    $('centeredPuzzleBoard').replaceChildren();
    state.board.forEach((tile,index)=>{
      const button=document.createElement('button');button.type='button';button.className=`puzzle-tile tile-${tile==='#'?'stone':tile}`;
      if(route.includes(index))button.classList.add('puzzle-path');
      button.textContent=symbol[tile];button.setAttribute('aria-label',`Row ${Math.floor(index/5)+1}, column ${index%5+1}: ${tileName[tile]}`);
      button.disabled=state.won;button.onclick=()=>move(index);$('centeredPuzzleBoard').append(button);
    });
    $('centeredPuzzleTools').replaceChildren();
    tools.forEach((tool,index)=>{const button=document.createElement('button');button.type='button';button.textContent=`${labels[index]} · ${state.charges[index]} left`;button.setAttribute('aria-pressed',String(tool===selected));button.disabled=state.won||!state.charges[index];button.onclick=()=>{selected=tool;render(`${labels[index]} selected. ${index===0?'Tap a mist tile or nearby tile to clear mist within two steps.':index===1?'Tap roots to untangle them.':'Tap a gap to build a bridge.'}`);};$('centeredPuzzleTools').append(button);});
    $('centeredPuzzleLevels').replaceChildren();
    levels.forEach((item,index)=>{const button=document.createElement('button');button.textContent=String(index+1);button.setAttribute('aria-label',`Level ${index+1}: ${item.name}`);button.setAttribute('aria-current',index===state.level?'step':'false');button.disabled=index>progress().unlocked;button.onclick=()=>load(index);$('centeredPuzzleLevels').append(button);});
    $('centeredPuzzleNext').hidden=!state.won;$('centeredPuzzleNext').textContent=state.level===4?'Play again':'Next level';
    if(message)$('centeredPuzzleMessage').textContent=message;
  }
  function load(index) {
    state={level:index,board:levels[index].map.join('').split(''),charges:[...levels[index].charges],moves:0,won:false};history=[];selected=tools[state.charges.findIndex(n=>n>0)];
    $('centeredPuzzleRetry').hidden=true;render('Choose a tool, then a tile. There is no timer.');persistDraft();
  }
  function move(index) {
    if(state.won)return;
    const toolIndex=tools.indexOf(selected);if(!state.charges[toolIndex])return;
    let targets=[];
    if(selected==='breathing'){
      // Manhattan radius two, independent of stone: mist clears around a tile.
      targets=state.board.map((tile,i)=>tile==='F'&&Math.abs(Math.floor(i/5)-Math.floor(index/5))+Math.abs(i%5-index%5)<=2?i:-1).filter(i=>i>=0);
    } else if(state.board[index]===(selected==='grounding'?'R':'G'))targets=[index];
    if(!targets.length){render('That tool has nothing to change here. Try a matching obstacle—no move was used.');return;}
    history.push(JSON.parse(JSON.stringify(state)));targets.forEach(i=>state.board[i]='.');state.charges[toolIndex]--;state.moves++;
    if(path().length){state.won=true;render(`Your path is connected! ${levels[state.level].lesson} ${state.moves<=levels[state.level].target?'Optional challenge complete.':''}`);saveCenteredPuzzleWin();}
    else {render('A little more space. Choose your next step, or undo and try another route.');if(!persistDraft())$('centeredPuzzleMessage').textContent+=' This move could not be saved; keep this page open.';}
  }
  window.saveCenteredPuzzleWin=function(){
    if(!state?.won)return;
    const before=steadierMindGameProgress.centeredPuzzle,points=mindPoints,count=completedActivities;
    const p=progress(),completed=[...p.completed],first=!completed.includes(state.level);
    if(first){completed.push(state.level);mindPoints+=15;completedActivities++;}
    steadierMindGameProgress.centeredPuzzle={...p,completed,best:{...p.best,[state.level]:Math.min(p.best[state.level]??Infinity,state.moves)},unlocked:Math.max(p.unlocked,Math.min(4,state.level+1)),draft:JSON.parse(JSON.stringify(state))};
    if(!saveSteadierMindData()){
      if(before)steadierMindGameProgress.centeredPuzzle=before;else delete steadierMindGameProgress.centeredPuzzle;
      mindPoints=points;completedActivities=count;$('centeredPuzzleRetry').hidden=false;$('centeredPuzzleNext').hidden=true;
      $('centeredPuzzleMessage').textContent='Your path is connected. Progress could not be saved. Retry saving to keep it.';return;
    }
    $('centeredPuzzleRetry').hidden=true;updateXP();render(`Your path is connected! ${levels[state.level].lesson} ${state.moves<=levels[state.level].target?'Optional challenge complete. ':''}${first?'+15 Mind Points.':'Replay complete—try another route or fewer moves.'}`);
  };
  window.openCenteredGame=function(){showScreen('centeredGame');const draft=progress().draft;if(draft&&Number.isInteger(draft.level)&&draft.level>=0&&draft.level<5&&draft.board?.length===25&&draft.charges?.length===3){state=JSON.parse(JSON.stringify(draft));history=[];selected=tools[state.charges.findIndex(n=>n>0)]||'breathing';render(state.won?'Your completed path is saved. Choose the next level or replay.':'Welcome back. Your path is waiting.');}else load(Math.min(progress().unlocked,4));};
  window.startCenteredGame=function(){if(!state)return openCenteredGame();load(state.level);};
  window.undoCenteredPuzzle=function(){if(state.won||!history.length)return;state=history.pop();render('Move undone. Try a different approach.');persistDraft();};
  window.hintCenteredPuzzle=function(){if(state)render(levels[state.level].hint);};
  window.nextCenteredPuzzle=function(){if(!state?.won||!$('centeredPuzzleRetry').hidden)return;load(state.level===4?0:state.level+1);};
  // Disable legacy completion and power handlers for this replacement board.
  window.useCenteredPower=function(){};window.checkCenteredLevelEndV27=function(){};
})();
