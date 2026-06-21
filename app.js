
let mindPoints = 0;
let completedActivities = 0;
let currentProfile = {};
let savedSteadyPlan = null;
let steadyBreathingRunning = false;

function showScreen(screenId){
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.classList.remove("leaving");
  });

  const next = document.getElementById(screenId);
  if(next){
    next.classList.add("active");
  }

  if(screenId === "journal" && typeof updateSmartPrompts === "function"){
    setTimeout(updateSmartPrompts, 120);
  }

  window.scrollTo({top:0, behavior:"smooth"});
}

function toggleImproveOptions(){
  const options = document.getElementById("improveOptions");
  if(options){
    options.classList.toggle("hidden");
  }
}

function getCheckedValues(){
  return Array.from(document.querySelectorAll('.multi input[type="checkbox"]:checked')).map(item => item.value);
}

function updateImproveButton(){
  const improvements = getCheckedValues();
  const button = document.querySelector(".dropdown-toggle");
  const chips = document.getElementById("selectedImprovements");

  if(button){
    if(improvements.length === 0){
      button.textContent = "Select improvement areas";
    } else if(improvements.length <= 2){
      button.textContent = improvements.join(", ");
    } else {
      button.textContent = improvements.length + " areas selected";
    }
  }

  if(chips){
    chips.innerHTML = improvements.length
      ? improvements.map(item => `<span>${item}</span>`).join("")
      : "No areas selected yet.";
  }
}

function determinePrimaryPath(improvements, challenge){
  const all = [...improvements, challenge].join(" ").toLowerCase();

  if(all.includes("panic") || all.includes("anxiety") || all.includes("racing thoughts")){
    return {
      name: "Calm & Anxiety",
      title: "Calm Foundations",
      daily: ["60-second breathing reset", "Grounding exercise", "Name one thing you can control today"]
    };
  }

  if(all.includes("overthinking") || all.includes("negative")){
    return {
      name: "Overthinking",
      title: "Mental Clarity",
      daily: ["Thought challenge", "Worry release journal", "One-minute mindful pause"]
    };
  }

  if(all.includes("confidence") || all.includes("social anxiety") || all.includes("low confidence") || all.includes("performance")){
    return {
      name: "Confidence",
      title: "Confidence Builder",
      daily: ["Small courage challenge", "Confidence script", "Post-action reflection"]
    };
  }

  if(all.includes("focus")){
    return {
      name: "Focus",
      title: "Focus Reset",
      daily: ["Distraction clear-out", "5-minute focus timer", "One-task commitment"]
    };
  }

  if(all.includes("stress") || all.includes("burnout") || all.includes("work stress")){
    return {
      name: "Stress & Burnout",
      title: "Stress Recovery",
      daily: ["Body tension scan", "Recovery break", "One boundary for today"]
    };
  }

  if(all.includes("motivation")){
    return {
      name: "Motivation",
      title: "Momentum Builder",
      daily: ["Tiny goal", "Win log", "One next step"]
    };
  }

  return {
    name: "Balanced Growth",
    title: "Steady Foundations",
    daily: ["Breathing reset", "Short reflection", "One steady action"]
  };
}

function determineMindType(improvements, challenge, hope){
  const all = [...improvements, challenge, hope].join(" ").toLowerCase();

  if(all.includes("racing thoughts") || all.includes("panic") || all.includes("stress")){
    return {
      name: "🌊 Storm Navigator",
      description: "You may feel pulled by pressure, racing thoughts, or emotional storms, but your goal is to become steadier under stress."
    };
  }

  if(all.includes("overthinking") || all.includes("negative")){
    return {
      name: "🧠 Deep Thinker",
      description: "Your mind works hard to understand and prepare, but SteadyMind will help you turn mental noise into clarity."
    };
  }

  if(all.includes("confidence") || all.includes("social anxiety")){
    return {
      name: "🦁 Quiet Leader",
      description: "You may doubt yourself at times, but there is courage there. SteadyMind will help you build it through small actions."
    };
  }

  if(all.includes("burnout") || all.includes("work stress")){
    return {
      name: "🔥 Burned-Out Achiever",
      description: "You keep pushing, but your mind and body need recovery. SteadyMind will help you rebuild energy and balance."
    };
  }

  if(all.includes("motivation") || all.includes("energized")){
    return {
      name: "🚀 Momentum Builder",
      description: "You want to move forward. SteadyMind will help you turn small wins into steady progress."
    };
  }

  return {
    name: "🌱 Steady Builder",
    description: "You are ready to grow with calm, consistency, and simple daily steps."
  };
}

function buildPlanAndSave(){
  const improvements = getCheckedValues();
  const challengeEl = document.getElementById("challenge");
  const timeEl = document.getElementById("timeCommitment");
  const hopeEl = document.getElementById("hope");
  const userTypeEl = document.getElementById("userType");

  if(!challengeEl || !timeEl || !hopeEl || !userTypeEl){
    alert("Something is missing in the assessment. Please refresh and try again.");
    return;
  }

  const challenge = challengeEl.value;
  const time = timeEl.value;
  const hope = hopeEl.value;
  const userType = userTypeEl.value;
  const improvementText = improvements.length ? improvements.join(", ") : "your steady mind";

  const path = determinePrimaryPath(improvements, challenge);
  const mindType = determineMindType(improvements, challenge, hope);
  const supportingPaths = improvements.filter(item => item !== path.name).slice(0, 3);

  savedSteadyPlan = {
    improvements,
    challenge,
    time,
    hope,
    userType,
    improvementText,
    path,
    mindType,
    supportingPaths,
    createdAt: new Date().toLocaleDateString()
  };

  currentProfile = savedSteadyPlan;

  renderSavedPlan();
  updatePlanStatus();
  showScreen("dashboard");
}

function renderSavedPlan(){
  if(!savedSteadyPlan){
    const profileCard = document.getElementById("profileCard");
    const mindTypeCard = document.getElementById("mindTypeCard");
    const pathCard = document.getElementById("pathCard");
    const dailyPlanCard = document.getElementById("dailyPlanCard");

    if(profileCard) profileCard.innerHTML = "Complete the assessment to create your personalized profile.";
    if(mindTypeCard) mindTypeCard.innerHTML = "Your mind type will appear here after your assessment.";
    if(pathCard) pathCard.innerHTML = "Your primary path will appear here after your assessment.";
    if(dailyPlanCard) dailyPlanCard.innerHTML = "Start with one small steady action today.";
    return;
  }

  const plan = savedSteadyPlan;

  document.getElementById("profileCard").innerHTML =
    `<strong>Your SteadyMind Profile</strong><br><br>
    • User type: ${plan.userType}<br>
    • Wants to improve: ${plan.improvementText}<br>
    • Biggest challenge: ${plan.challenge}<br>
    • Desired feeling: ${plan.hope}<br>
    • Time available: ${plan.time} per day<br>
    • Plan created: ${plan.createdAt}`;

  document.getElementById("mindTypeCard").innerHTML =
    `<strong>${plan.mindType.name}</strong><p>${plan.mindType.description}</p>`;

  document.getElementById("pathCard").innerHTML =
    `<strong>Primary Path: ${plan.path.title}</strong><br><br>
    Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>
    This path is designed to help you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;

  document.getElementById("dailyPlanCard").innerHTML =
    `<strong>Today's Focus: ${plan.path.name}</strong><br>
    Today's Goal: Take one small action that helps you steady your mind.<br><br>
    <strong>Your ${plan.time} routine:</strong>
    <ol>
      <li>${plan.path.daily[0]}</li>
      <li>${plan.path.daily[1]}</li>
      <li>${plan.path.daily[2]}</li>
    </ol>
    <strong>Progress:</strong> Day 1 of 30`;

  const weeklyCard = document.getElementById("weeklyCard");
  if(weeklyCard){
    weeklyCard.innerHTML =
      `<strong>This week, SteadyMind will track:</strong><br>
      • Anxiety and stress trends<br>
      • Confidence and focus growth<br>
      • Activities completed<br>
      • Mind Points earned<br><br>
      Your first goal: complete one steady activity today.`;
  }

  updateXP();
}

function continuePlan(){
  if(savedSteadyPlan){
    renderSavedPlan();
    showScreen("dashboard");
  } else {
    const status = document.getElementById("planStatus");
    if(status){
      status.innerHTML = "You have not built a plan yet. Tap <strong>Build My Plan</strong> to create one.";
    }
    showScreen("assessment");
  }
}

function updatePlanStatus(){
  const status = document.getElementById("planStatus");
  if(status && savedSteadyPlan){
    status.innerHTML = `Plan ready: <strong>${savedSteadyPlan.path.title}</strong> · ${savedSteadyPlan.time} per day`;
  }
}

function getLevelName(points){
  if(points >= 400) return "Level 5: SteadyMind Master";
  if(points >= 300) return "Level 4: Resilient Thinker";
  if(points >= 200) return "Level 3: Storm Navigator";
  if(points >= 100) return "Level 2: Steady Builder";
  return "Level 1: Calm Seeker";
}

function updateXP(){
  const fill = document.getElementById("xpFill");
  const xpText = document.getElementById("xpText");
  const levelName = document.getElementById("levelName");
  const activitiesText = document.getElementById("activitiesText");
  const streakText = document.getElementById("streakText");

  if(fill) fill.style.width = Math.min(mindPoints, 100) + "%";
  if(xpText) xpText.textContent = `${mindPoints} / 100 Mind Points`;
  if(levelName) levelName.textContent = getLevelName(mindPoints);
  if(activitiesText) activitiesText.textContent = completedActivities;
  if(streakText) streakText.textContent = completedActivities > 0 ? "1 day" : "0 days";
}

function completeActivity(){
  mindPoints += 5;
  completedActivities += 1;
  updateXP();
}

function startBreathing(){
  const box = document.getElementById("breathingBox");
  const circle = document.querySelector(".breathing-circle");
  const panel = document.querySelector(".breathing-panel");
  if(!box || !circle) return;

  if(steadyBreathingRunning) return;
  steadyBreathingRunning = true;

  if(panel) panel.classList.add("running");

  let timerEl = document.getElementById("breathingTimer");
  if(!timerEl){
    timerEl = document.createElement("div");
    timerEl.id = "breathingTimer";
    timerEl.className = "breathing-timer";
    circle.parentElement.appendChild(timerEl);
  }

  let completeEl = document.getElementById("breathingCompleteMessage");
  if(!completeEl){
    completeEl = document.createElement("div");
    completeEl.id = "breathingCompleteMessage";
    completeEl.className = "breathing-complete-message";
    circle.parentElement.appendChild(completeEl);
  }

  completeEl.innerHTML = "";

  const phases = [
    { text: "Breathe in slowly...", className: "inhale", seconds: 4 },
    { text: "Hold gently...", className: "hold", seconds: 4 },
    { text: "Breathe out fully...", className: "exhale", seconds: 6 },
    { text: "Rest...", className: "rest", seconds: 6 }
  ];

  let elapsed = 0;
  let phaseIndex = 0;
  let phaseElapsed = 0;
  const totalSeconds = 60;

  function applyPhase(){
    const phase = phases[phaseIndex];
    circle.classList.remove("inhale", "hold", "exhale", "rest", "calm-breathe");
    circle.classList.add(phase.className);
    box.textContent = phase.text;
  }

  applyPhase();
  timerEl.textContent = `${totalSeconds} seconds remaining`;

  const interval = setInterval(() => {
    elapsed += 1;
    phaseElapsed += 1;

    const remaining = Math.max(totalSeconds - elapsed, 0);
    timerEl.textContent = `${remaining} seconds remaining`;

    if(phaseElapsed >= phases[phaseIndex].seconds){
      phaseIndex = (phaseIndex + 1) % phases.length;
      phaseElapsed = 0;
      applyPhase();
    }

    if(elapsed >= totalSeconds){
      clearInterval(interval);
      circle.classList.remove("inhale", "hold", "exhale", "rest");
      circle.classList.add("rest");
      box.textContent = "60-second reset complete.";
      timerEl.textContent = "";
      completeEl.innerHTML = "Rest. You are safe in this moment.<br><strong>YOU are in control.</strong><br><br>+5 XP";
      if(panel) panel.classList.remove("running");
      steadyBreathingRunning = false;
      completeActivity();
    }
  }, 1000);
}

function setMoodChoice(mood, button){
  const moodSelect = document.getElementById("mood");
  if(moodSelect) moodSelect.value = mood;
  document.querySelectorAll(".emotion-btn").forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected");
}

function saveCheckIn(){
  const mood = document.getElementById("mood").value;
  const need = document.getElementById("need").value;
  const result = document.getElementById("checkinResult");

  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Check-in saved.</strong><br>Your mind feels <strong>${mood}</strong>. Today, focus on <strong>${need}</strong>.`;
  }

  completeActivity();
}

function playGame(game){
  const result = document.getElementById("gameResult");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `<strong>${game}</strong><br>Prototype activity complete. In the full app, this will become an interactive exercise. +5 XP`;
  }
  completeActivity();
}

function openLesson(topic){
  const lessons = {
    "Anxiety Basics":"Anxiety is your body's alarm system. The goal is not to fear the alarm, but to understand it and respond steadily.",
    "Overthinking":"Overthinking is often your mind trying to solve uncertainty. SteadyMind helps you separate useful planning from mental noise.",
    "Confidence":"Confidence grows after action. Small repeated courage steps build self-trust.",
    "Sleep":"Sleep improves when your body feels safe. Wind-down routines teach your nervous system to settle."
  };

  const lessonResult = document.getElementById("lessonResult");
  if(lessonResult){
    lessonResult.classList.remove("hidden");
    lessonResult.innerHTML = `<strong>${topic}</strong><br>${lessons[topic]}`;
  }

  const fill = document.getElementById("lessonProgressFill");
  if(fill){
    const current = parseInt(fill.dataset.progress || "0", 10);
    const next = Math.min(current + 25, 100);
    fill.dataset.progress = next;
    fill.style.width = next + "%";
  }

  const popup = document.getElementById("xpPopup");
  if(popup){
    popup.classList.remove("hidden");
    popup.style.animation = "none";
    void popup.offsetWidth;
    popup.style.animation = "xpPop 1.1s ease both";
    setTimeout(() => popup.classList.add("hidden"), 1100);
  }

  completeActivity();
}

function updateSmartPrompts(){
  const improvements = currentProfile.improvements || getCheckedValues();
  const challenge = currentProfile.challenge || (document.getElementById("challenge") ? document.getElementById("challenge").value : "");
  const all = [...improvements, challenge].join(" ").toLowerCase();

  let title = "General SteadyMind Reflection";
  let prompts = [
    "What thought or feeling needs your attention today?",
    "What would a calmer version of you say about this situation?",
    "What is one steady step you can take next?"
  ];

  if(all.includes("overthinking") || all.includes("negative") || all.includes("racing thoughts")){
    title = "Smart Journal: Overthinker";
    prompts = [
      "What thought kept repeating today?",
      "How likely is your fear to actually happen?",
      "What would you tell a friend in this situation?"
    ];
  } else if(all.includes("burnout") || all.includes("work stress") || all.includes("stress")){
    title = "Smart Journal: Burned-Out Achiever";
    prompts = [
      "Did you rest today?",
      "What expectation are you putting on yourself?",
      "What can wait until tomorrow?"
    ];
  } else if(all.includes("confidence") || all.includes("social anxiety") || all.includes("low confidence") || all.includes("performance")){
    title = "Smart Journal: Confidence Builder";
    prompts = [
      "What did you do well today?",
      "What are you proud of?",
      "Where did you show courage?"
    ];
  }

  const card = document.getElementById("smartPromptCard");
  if(!card) return;

  card.innerHTML = `<strong>${title}</strong><br>These prompts are designed to match your current path.`;
  document.getElementById("smartPromptOneLabel").textContent = prompts[0];
  document.getElementById("smartPromptTwoLabel").textContent = prompts[1];
  document.getElementById("smartPromptThreeLabel").textContent = prompts[2];
}

function saveJournal(){
  const mood = document.getElementById("journalMood").value;
  const feelingWords = document.getElementById("feelingWords").value.trim();
  const weighingMind = document.getElementById("weighingMind").value.trim();
  const controlToday = document.getElementById("controlToday").value.trim();
  const gratitudeItems = [
    document.getElementById("gratitudeOne").value.trim(),
    document.getElementById("gratitudeTwo").value.trim(),
    document.getElementById("gratitudeThree").value.trim()
  ].filter(Boolean);

  const hasEnough = feelingWords || weighingMind || controlToday || gratitudeItems.length;
  const result = document.getElementById("journalResult");
  if(!result) return;

  result.classList.remove("hidden");
  result.classList.remove("saved-pulse");
  void result.offsetWidth;
  result.classList.add("saved-pulse");

  if(!hasEnough){
    result.innerHTML = "Write at least one reflection before saving.";
    return;
  }

  mindPoints += 10;
  completedActivities += 1;
  updateXP();

  result.innerHTML =
    `<strong>Reflection saved.</strong><br>
    Today you felt <strong>${mood}</strong> and gave your thoughts a place to land.<br><br>
    Steady step: ${controlToday || "Choose one small action you can control today."}<br><br>
    +10 XP`;
}

document.addEventListener("DOMContentLoaded", () => {
  updateImproveButton();
  updatePlanStatus();

  if(document.getElementById("splash")){
    setTimeout(() => {
      showScreen("welcome");
    }, 3000);
  }
});

/* v15 functional games */
const thoughtSortQuestions=[
{text:"I am going to mess everything up.",answer:"assumption",explanation:"That is a prediction, not a proven fact."},
{text:"I practiced for 20 minutes today.",answer:"fact",explanation:"That is something observable that actually happened."},
{text:"Everyone will think I failed.",answer:"assumption",explanation:"That assumes you know what others will think."},
{text:"I felt nervous before speaking.",answer:"fact",explanation:"That is a real feeling you noticed."},
{text:"If I feel anxious, something bad must happen.",answer:"assumption",explanation:"Anxiety is a signal, not a guarantee."}
];
let thoughtGameIndex=0;
let thoughtGameScore=0;
let focusScore=0;

function showGame(gameId,button){
 document.querySelectorAll(".game-panel").forEach(panel=>{panel.classList.add("hidden");panel.classList.remove("active-game")});
 const game=document.getElementById(gameId);
 if(game){game.classList.remove("hidden");game.classList.add("active-game")}
 document.querySelectorAll(".game-tab").forEach(tab=>tab.classList.remove("active-game-tab"));
 if(button)button.classList.add("active-game-tab");
}

function completeGroundingGame(){
 const fields=[
  document.getElementById("groundingSee").value.trim(),
  document.getElementById("groundingFeel").value.trim(),
  document.getElementById("groundingHear").value.trim(),
  document.getElementById("groundingSmell").value.trim(),
  document.getElementById("groundingTaste").value.trim()
 ];
 const completed=fields.filter(Boolean).length;
 const result=document.getElementById("groundingResult");
 result.classList.remove("hidden");
 if(completed<3){result.innerHTML="Try to complete at least 3 sections before finishing.";return}
 mindPoints+=10;completedActivities+=1;updateXP();
 result.innerHTML="<strong>Grounding complete.</strong><br>You brought your mind back to the present moment.<br><br>+10 XP";
}

function answerThoughtSort(choice){
 const question=thoughtSortQuestions[thoughtGameIndex];
 const result=document.getElementById("thoughtSortResult");
 result.classList.remove("hidden");
 if(choice===question.answer){thoughtGameScore+=1;result.innerHTML="<strong>Correct.</strong><br>"+question.explanation}
 else{result.innerHTML="<strong>Good try.</strong><br>"+question.explanation}
 setTimeout(()=>{
  thoughtGameIndex+=1;
  if(thoughtGameIndex>=thoughtSortQuestions.length){
   mindPoints+=10;completedActivities+=1;updateXP();
   document.getElementById("thoughtPrompt").textContent="Game complete.";
   document.getElementById("thoughtIndex").textContent=thoughtSortQuestions.length;
   result.innerHTML="<strong>Thought Sort complete.</strong><br>Score: "+thoughtGameScore+" / "+thoughtSortQuestions.length+"<br><br>You practiced separating facts from assumptions. +10 XP";
   thoughtGameIndex=0;thoughtGameScore=0;return;
  }
  document.getElementById("thoughtPrompt").textContent=thoughtSortQuestions[thoughtGameIndex].text;
  document.getElementById("thoughtIndex").textContent=thoughtGameIndex+1;
  result.classList.add("hidden");
 },1400);
}

function tapFocusCircle(){
 focusScore+=1;
 document.getElementById("focusScore").textContent=focusScore;
 const circle=document.getElementById("focusCircle");
 const area=document.getElementById("focusPlayArea");
 const maxX=area.clientWidth-circle.clientWidth-12;
 const maxY=area.clientHeight-circle.clientHeight-12;
 circle.style.left=Math.max(12,Math.random()*maxX)+"px";
 circle.style.top=Math.max(12,Math.random()*maxY)+"px";
 if(focusScore>=5){
  const result=document.getElementById("focusResult");
  result.classList.remove("hidden");
  result.innerHTML="<strong>Calm Focus complete.</strong><br>You practiced slow attention and steady movement. +10 XP";
  mindPoints+=10;completedActivities+=1;updateXP();
  focusScore=0;
  setTimeout(()=>{document.getElementById("focusScore").textContent=0},800);
 }
}


/* v16 gentle sound system - uses Web Audio, no audio files needed */
let soundEnabled = true;
let audioCtx = null;
let ambientNodes = [];
let currentAmbient = "none";

function getAudioCtx(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }
  return audioCtx;
}

function toggleSoundSetting(){
  const toggle = document.getElementById("soundToggle");
  soundEnabled = toggle ? toggle.checked : true;
  if(!soundEnabled) stopAmbient();
}

function setAmbientChoice(){
  const select = document.getElementById("ambientSelect");
  if(select){
    currentAmbient = select.value;
    if(currentAmbient === "none") stopAmbient();
    else playAmbient(currentAmbient);
  }
}

function playTone(freq=440, duration=.18, type="sine", volume=.035, startOffset=0){
  if(!soundEnabled) return;
  const ctx = getAudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startOffset + .035);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + startOffset);
  oscillator.stop(ctx.currentTime + startOffset + duration + .02);
}

function buttonTapSound(){ playTone(360, .09, "sine", .018); }
function xpSound(){
  playTone(523.25, .12, "sine", .03, 0);
  playTone(659.25, .16, "sine", .026, .08);
  playTone(783.99, .20, "sine", .024, .17);
}
function successSound(){
  playTone(440, .14, "triangle", .028, 0);
  playTone(660, .20, "triangle", .024, .12);
}
function inhaleSound(){
  if(!soundEnabled) return;
  const ctx = getAudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(260, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(390, ctx.currentTime + 3.8);
  gain.gain.setValueAtTime(.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.028, ctx.currentTime + .4);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 4);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 4.05);
}
function holdSound(){ playTone(392, 3.7, "sine", .012); }
function exhaleSound(){
  if(!soundEnabled) return;
  const ctx = getAudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(392, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(220, ctx.currentTime + 5.8);
  gain.gain.setValueAtTime(.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.025, ctx.currentTime + .4);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 6);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 6.05);
}

function createNoiseBuffer(ctx){
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){ data[i] = Math.random()*2-1; }
  return buffer;
}
function stopAmbient(){
  ambientNodes.forEach(node => {
    try { if(node.stop) node.stop(); } catch(e){}
    try { if(node.disconnect) node.disconnect(); } catch(e){}
  });
  ambientNodes = [];
  currentAmbient = "none";
  const select = document.getElementById("ambientSelect");
  if(select) select.value = "none";
}
function playAmbient(type){
  if(!soundEnabled) return;
  stopAmbient();
  currentAmbient = type;
  const select = document.getElementById("ambientSelect");
  if(select) select.value = type;
  const ctx = getAudioCtx();
  const master = ctx.createGain();
  master.gain.value = .035;
  master.connect(ctx.destination);
  ambientNodes.push(master);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  if(type === "rain"){
    filter.type = "highpass"; filter.frequency.value = 900; gain.gain.value = .08;
  } else if(type === "ocean"){
    filter.type = "lowpass"; filter.frequency.value = 650; gain.gain.value = .07;
  } else {
    filter.type = "bandpass"; filter.frequency.value = 1800; gain.gain.value = .025;
  }

  noise.connect(filter); filter.connect(gain); gain.connect(master); noise.start();
  ambientNodes.push(noise, filter, gain);
}

/* Wrap existing functions with gentle sounds */
const _showScreen = showScreen;
showScreen = function(screenId){ buttonTapSound(); _showScreen(screenId); };

const _completeActivity = completeActivity;
completeActivity = function(){ _completeActivity(); xpSound(); };

if(typeof buildPlanAndSave === "function"){
  const _buildPlanAndSave = buildPlanAndSave;
  buildPlanAndSave = function(){ _buildPlanAndSave(); successSound(); };
}

if(typeof saveJournal === "function"){
  const _saveJournal = saveJournal;
  saveJournal = function(){ _saveJournal(); successSound(); };
}

if(typeof saveCheckIn === "function"){
  const _saveCheckIn = saveCheckIn;
  saveCheckIn = function(){ _saveCheckIn(); successSound(); };
}

/* Override breathing function with sound cues */
startBreathing = function(){
  const box = document.getElementById("breathingBox");
  const circle = document.querySelector(".breathing-circle");
  const panel = document.querySelector(".breathing-panel");
  if(!box || !circle) return;
  if(steadyBreathingRunning) return;
  steadyBreathingRunning = true;
  if(panel) panel.classList.add("running");

  let timerEl = document.getElementById("breathingTimer");
  if(!timerEl){
    timerEl = document.createElement("div");
    timerEl.id = "breathingTimer";
    timerEl.className = "breathing-timer";
    circle.parentElement.appendChild(timerEl);
  }

  let completeEl = document.getElementById("breathingCompleteMessage");
  if(!completeEl){
    completeEl = document.createElement("div");
    completeEl.id = "breathingCompleteMessage";
    completeEl.className = "breathing-complete-message";
    circle.parentElement.appendChild(completeEl);
  }
  completeEl.innerHTML = "";

  const phases = [
    { text:"Breathe in slowly...", className:"inhale", seconds:4, sound:inhaleSound },
    { text:"Hold gently...", className:"hold", seconds:4, sound:holdSound },
    { text:"Breathe out fully...", className:"exhale", seconds:6, sound:exhaleSound },
    { text:"Rest...", className:"rest", seconds:6, sound:null }
  ];

  let elapsed=0, phaseIndex=0, phaseElapsed=0;
  const totalSeconds=60;

  function applyPhase(){
    const phase = phases[phaseIndex];
    circle.classList.remove("inhale","hold","exhale","rest","calm-breathe");
    circle.classList.add(phase.className);
    box.textContent = phase.text;
    if(phase.sound) phase.sound();
  }

  applyPhase();
  timerEl.textContent = `${totalSeconds} seconds remaining`;

  const interval = setInterval(() => {
    elapsed++; phaseElapsed++;
    const remaining = Math.max(totalSeconds-elapsed,0);
    timerEl.textContent = `${remaining} seconds remaining`;

    if(phaseElapsed >= phases[phaseIndex].seconds){
      phaseIndex = (phaseIndex+1) % phases.length;
      phaseElapsed = 0;
      applyPhase();
    }

    if(elapsed >= totalSeconds){
      clearInterval(interval);
      circle.classList.remove("inhale","hold","exhale","rest");
      circle.classList.add("rest");
      box.textContent = "60-second reset complete.";
      timerEl.textContent = "";
      completeEl.innerHTML = "Rest. You are safe in this moment.<br><strong>YOU are in control.</strong><br><br>+5 XP";
      if(panel) panel.classList.remove("running");
      steadyBreathingRunning = false;
      completeActivity();
      successSound();
    }
  },1000);
};
