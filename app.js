
let mindPoints = 0;
let completedActivities = 0;
let currentProfile = {};
let savedSteadyPlan = null;
let steadyBreathingRunning = false;
let steadyBreathingInterval = null;

function showScreen(screenId){
  const activeScreen = document.querySelector(".screen.active");
  if(activeScreen && activeScreen.id === "tools" && screenId !== "tools"){
    stopBreathingExercise();
  }

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


function stopBreathingExercise(){
  const box = document.getElementById("breathingBox");
  const circle = document.querySelector(".breathing-circle");
  const panel = document.querySelector(".breathing-panel");
  const timerEl = document.getElementById("breathingTimer");
  const completeEl = document.getElementById("breathingCompleteMessage");

  if(steadyBreathingInterval){
    clearInterval(steadyBreathingInterval);
    steadyBreathingInterval = null;
  }

  steadyBreathingRunning = false;

  if(circle){
    circle.classList.remove("inhale", "hold", "exhale", "rest", "calm-breathe");
  }

  if(panel){
    panel.classList.remove("running");
  }

  if(box){
    box.textContent = "Breathe with SteadyMind";
  }

  if(timerEl){
    timerEl.textContent = "";
  }

  if(completeEl){
    completeEl.innerHTML = "";
  }

  stopAmbient();
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

  if(steadyBreathingRunning){
    stopBreathingExercise();
    return;
  }

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

  steadyBreathingInterval = setInterval(() => {
    elapsed++;
    phaseElapsed++;

    const remaining = Math.max(totalSeconds-elapsed,0);
    timerEl.textContent = `${remaining} seconds remaining`;

    if(phaseElapsed >= phases[phaseIndex].seconds){
      phaseIndex = (phaseIndex+1) % phases.length;
      phaseElapsed = 0;
      applyPhase();
    }

    if(elapsed >= totalSeconds){
      clearInterval(steadyBreathingInterval);
      steadyBreathingInterval = null;
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


/* v18 soundscape visual layer */
function setSoundscapeVisual(type){
  const visual = document.getElementById("soundscapeVisual");
  if(!visual) return;

  visual.className = "soundscape-visual";

  if(type === "rain"){
    visual.classList.add("active", "rain");
  } else if(type === "ocean"){
    visual.classList.add("active", "ocean");
  } else if(type === "forest"){
    visual.classList.add("active", "forest");
    visual.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";
  } else {
    visual.innerHTML = "";
  }
}

/* Wrap ambient controls so sound and visual always match */
const _v18PlayAmbient = playAmbient;
playAmbient = function(type){
  _v18PlayAmbient(type);
  setSoundscapeVisual(type);
};

const _v18StopAmbient = stopAmbient;
stopAmbient = function(){
  _v18StopAmbient();
  setSoundscapeVisual("none");
};

/* Make leaving Emergency Tool stop audio and visuals */
const _v18ShowScreen = showScreen;
showScreen = function(screenId){
  const activeScreen = document.querySelector(".screen.active");
  if(activeScreen && activeScreen.id === "tools" && screenId !== "tools"){
    if(typeof stopBreathingExercise === "function") stopBreathingExercise();
    stopAmbient();
  }
  _v18ShowScreen(screenId);
};


/* v19 launch-ready calming tools and mood tracker */
let moodEntries = [];

function safeSuccessSound(){
  try {
    if(typeof successSound === "function") successSound();
  } catch(e){}
}

function startGroundingTool(){
  const result = document.getElementById("toolResult");
  if(!result) return;

  result.classList.remove("hidden");
  result.innerHTML = `
    <strong>Grounding Exercise</strong>
    <p>Use your senses to return to the present moment.</p>
    <div class="tool-step"><h3>5 things you can see</h3><textarea id="toolSee" placeholder="Example: lamp, chair, window..."></textarea></div>
    <div class="tool-step"><h3>4 things you can feel</h3><textarea id="toolFeel" placeholder="Example: shirt, floor, phone..."></textarea></div>
    <div class="tool-step"><h3>3 things you can hear</h3><textarea id="toolHear" placeholder="Example: fan, traffic, birds..."></textarea></div>
    <div class="tool-step"><h3>2 things you can smell</h3><textarea id="toolSmell" placeholder="Example: coffee, soap..."></textarea></div>
    <div class="tool-step"><h3>1 thing you can taste</h3><textarea id="toolTaste" placeholder="Example: mint, water..."></textarea></div>
    <button onclick="completeGroundingTool()">Complete Grounding +10 XP</button>
  `;
}

function completeGroundingTool(){
  mindPoints += 10;
  completedActivities += 1;
  updateXP();

  const result = document.getElementById("toolResult");
  if(result){
    result.innerHTML = `<strong>Grounding complete.</strong><br>You brought your mind back to the present moment.<br><br>+10 XP`;
  }
  safeSuccessSound();
}

function startWorryReleaseTool(){
  const result = document.getElementById("toolResult");
  if(!result) return;

  result.classList.remove("hidden");
  result.innerHTML = `
    <strong>Worry Release</strong>
    <p>Name the worry, question it, and choose one steady action.</p>
    <div class="tool-step"><h3>What worry is taking up space?</h3><textarea id="worryName" placeholder="Example: I’m worried I will fail tomorrow."></textarea></div>
    <div class="tool-step"><h3>Is this a fact, a fear, or an assumption?</h3><textarea id="worryType" placeholder="Example: It is mostly a fear, not a fact."></textarea></div>
    <div class="tool-step"><h3>What is one more balanced thought?</h3><textarea id="balancedThought" placeholder="Example: I may feel nervous, but I can still handle it."></textarea></div>
    <div class="tool-step"><h3>What is one thing you can control today?</h3><textarea id="worryAction" placeholder="Example: Practice for 10 minutes and get to bed on time."></textarea></div>
    <button onclick="completeWorryReleaseTool()">Release Worry +10 XP</button>
  `;
}

function completeWorryReleaseTool(){
  mindPoints += 10;
  completedActivities += 1;
  updateXP();

  const action = document.getElementById("worryAction")?.value.trim();
  const result = document.getElementById("toolResult");
  if(result){
    result.innerHTML = `<strong>Worry released.</strong><br>You moved from worry to action.<br><br>Steady action: ${action || "Choose one small thing you can control."}<br><br>+10 XP`;
  }
  safeSuccessSound();
}

function startSleepWindDownTool(){
  const result = document.getElementById("toolResult");
  if(!result) return;

  result.classList.remove("hidden");
  result.innerHTML = `
    <strong>Sleep Wind-Down</strong>
    <p>Slow your mind and give your body permission to rest.</p>
    <div class="tool-step"><h3>1. Brain dump</h3><textarea id="sleepBrainDump" placeholder="Write anything your mind is holding onto..."></textarea></div>
    <div class="tool-step"><h3>2. Tomorrow can wait</h3><textarea id="tomorrowWait" placeholder="What can wait until tomorrow?"></textarea></div>
    <div class="tool-step"><h3>3. One peaceful thought</h3><textarea id="peacefulThought" placeholder="Example: I did enough for today."></textarea></div>
    <div class="tool-step"><h3>4. Body cue</h3><p>Relax your jaw, lower your shoulders, and take three slow breaths.</p></div>
    <button onclick="completeSleepWindDownTool()">Complete Wind-Down +10 XP</button>
  `;
}

function completeSleepWindDownTool(){
  mindPoints += 10;
  completedActivities += 1;
  updateXP();

  const result = document.getElementById("toolResult");
  if(result){
    result.innerHTML = `<strong>Sleep wind-down complete.</strong><br>Your mind has been given a place to rest.<br><br>+10 XP`;
  }
  safeSuccessSound();
}

function saveMoodEntry(){
  const score = Number(document.getElementById("calmScore").value);
  const mood = document.getElementById("trackerMood").value;
  const note = document.getElementById("moodNote").value.trim();

  const entry = {
    score,
    mood,
    note,
    date: new Date().toLocaleDateString()
  };

  moodEntries.unshift(entry);

  mindPoints += 5;
  completedActivities += 1;
  updateXP();
  renderMoodTracker();
  safeSuccessSound();

  const noteBox = document.getElementById("moodNote");
  if(noteBox) noteBox.value = "";
}

function renderMoodTracker(){
  const history = document.getElementById("moodHistory");
  const summary = document.getElementById("moodSummary");
  const fill = document.getElementById("moodMeterFill");

  if(!history || !summary || !fill) return;

  if(moodEntries.length === 0){
    summary.innerHTML = "No mood entries yet.";
    fill.style.width = "0%";
    history.innerHTML = "";
    return;
  }

  const avg = moodEntries.reduce((sum, item) => sum + item.score, 0) / moodEntries.length;
  const avgRounded = avg.toFixed(1);
  fill.style.width = (avg * 10) + "%";

  summary.innerHTML =
    `<strong>Average Calm Score:</strong> ${avgRounded} / 10<br>
    <strong>Entries:</strong> ${moodEntries.length}<br>
    <strong>Latest Mood:</strong> ${moodEntries[0].mood}`;

  history.innerHTML = moodEntries.slice(0, 7).map(entry => `
    <div class="mood-entry">
      <strong>${entry.date}</strong><br>
      Calm Score: ${entry.score}/10<br>
      Mood: ${entry.mood}<br>
      ${entry.note ? `Note: ${entry.note}` : ""}
    </div>
  `).join("");
}

/* v20 premium dashboard rendering */
function renderPremiumProfileRows(plan){
  return `
    <div class="profile-row"><span class="mini-icon">👤</span><span class="profile-label">User type</span><span class="profile-value">${plan.userType}</span></div>
    <div class="profile-row"><span class="mini-icon">🎯</span><span class="profile-label">Wants to improve</span><span class="profile-value">${plan.improvementText}</span></div>
    <div class="profile-row"><span class="mini-icon">🧠</span><span class="profile-label">Biggest challenge</span><span class="profile-value">${plan.challenge}</span></div>
    <div class="profile-row"><span class="mini-icon">♡</span><span class="profile-label">Desired feeling</span><span class="profile-value">${plan.hope}</span></div>
    <div class="profile-row"><span class="mini-icon">◷</span><span class="profile-label">Time available</span><span class="profile-value">${plan.time} per day</span></div>
    <div class="profile-row"><span class="mini-icon">▣</span><span class="profile-label">Plan created</span><span class="profile-value">${plan.createdAt}</span></div>
  `;
}
const _v20RenderSavedPlan = renderSavedPlan;
renderSavedPlan = function(){
  if(!savedSteadyPlan){ _v20RenderSavedPlan(); return; }
  const plan = savedSteadyPlan;
  document.getElementById("profileCard").innerHTML = renderPremiumProfileRows(plan);
  const cleanMindType = plan.mindType.name.replace("🌊 ","").replace("🧠 ","").replace("🦁 ","").replace("🔥 ","").replace("🚀 ","").replace("🌱 ","");
  document.getElementById("mindTypeCard").innerHTML = `<strong>${cleanMindType}</strong><p>${plan.mindType.description}</p>`;
  document.getElementById("pathCard").innerHTML = `<div class="path-pill">☆ Primary Path: ${plan.path.title}</div><br>Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>This path is designed to help you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;
  document.getElementById("dailyPlanCard").innerHTML = `<strong>Today's Focus: ${plan.path.name}</strong><br>Today's Goal: Take one small action that helps you steady your mind.<br><br><strong>Your ${plan.time} reset:</strong><ol><li>${plan.path.daily[0]}</li><li>${plan.path.daily[1]}</li><li>${plan.path.daily[2]}</li></ol>`;
  const weeklyCard = document.getElementById("weeklyCard");
  if(weeklyCard){weeklyCard.innerHTML = `<strong>This week, SteadyMind will track:</strong><br>• Anxiety and stress trends<br>• Confidence and focus growth<br>• Activities completed<br>• Mind Points earned<br><br>Your first goal: complete one steady activity today.`;}
  updateXP();
};

/* v21 focused home behavior */
function updateFocusedHome(){
  const primaryTitle=document.getElementById("homePrimaryTitle");
  const mindType=document.getElementById("homeMindType");
  const focus=document.getElementById("homeTodayFocus");
  const progressText=document.getElementById("homeProgressText");
  const progressFill=document.getElementById("homeProgressFill");
  const percent=Math.min(completedActivities*25,100);
  if(progressText)progressText.textContent=`${percent}% Complete`;
  if(progressFill)progressFill.style.width=`${percent}%`;
  if(!savedSteadyPlan){
    if(primaryTitle)primaryTitle.textContent="Continue My Plan";
    if(mindType)mindType.textContent="Build your personalized path";
    if(focus)focus.textContent="Answer a few questions so SteadyMind can guide your daily calm, focus, and confidence plan.";
    return;
  }
  const plan=savedSteadyPlan;
  const clean=plan.mindType.name.replace("🌊 ","").replace("🧠 ","").replace("🦁 ","").replace("🔥 ","").replace("🚀 ","").replace("🌱 ","");
  if(primaryTitle)primaryTitle.textContent="Continue My Plan";
  if(mindType)mindType.textContent=clean;
  if(focus)focus.textContent=`Today's Focus: ${plan.path.name}. ${plan.path.daily[0]}.`;
}
const _v21UpdatePlanStatus=updatePlanStatus;
updatePlanStatus=function(){_v21UpdatePlanStatus();updateFocusedHome();};
const _v21ShowScreen=showScreen;
showScreen=function(screenId){if(screenId==="mainMenu")updateFocusedHome();_v21ShowScreen(screenId);};
const _v21CompleteActivity=completeActivity;
completeActivity=function(){_v21CompleteActivity();updateFocusedHome();};

/* v22 Color Balance */
let colorBalanceLevel=1,colorBalanceTurns=0,selectedColorPower="breathing",colorBoard=[],anxietyFrozenTurns=0,colorBalanceWonLevels=0;
function startColorBalanceGame(){colorBalanceTurns=0;anxietyFrozenTurns=0;selectedColorPower="breathing";let redCount=Math.min(3+Math.floor(colorBalanceLevel/3),9);colorBoard=Array(25).fill("calm");[2,10,14,22].forEach(i=>colorBoard[i]="focus");let placed=0;while(placed<redCount){let idx=Math.floor(Math.random()*25);if(colorBoard[idx]!=="anxiety"){colorBoard[idx]="anxiety";placed++;}}selectColorPower("breathing");renderColorBalanceBoard();updateColorBalanceStats();setColorBalanceMessage("Tap a block to begin restoring balance.");}
function renderColorBalanceBoard(){let board=document.getElementById("colorBalanceBoard");if(!board)return;board.innerHTML=colorBoard.map((state,i)=>`<button class="color-cell ${state}${anxietyFrozenTurns>0&&state==="anxiety"?" frozen":""}" onclick="useColorPower(${i})"></button>`).join("");}
function selectColorPower(power){selectedColorPower=power;["breathingPowerBtn","groundingPowerBtn","challengePowerBtn"].forEach(id=>{let b=document.getElementById(id);if(b)b.classList.remove("active-power")});let a=document.getElementById(power+"PowerBtn");if(a)a.classList.add("active-power");let m={breathing:"Breathing Block: turns nearby anxiety into calm over time.",grounding:"Grounding Block: freezes anxiety spread for 3 turns.",challenge:"Challenge Block: clears anxiety in one focused area."};setColorBalanceMessage(m[power]);}
function getNeighbors(index){let row=Math.floor(index/5),col=index%5,n=[index];for(let r=row-1;r<=row+1;r++){for(let c=col-1;c<=col+1;c++){if(r>=0&&r<5&&c>=0&&c<5){let x=r*5+c;if(!n.includes(x))n.push(x);}}}return n;}
function useColorPower(index){colorBalanceTurns++;if(selectedColorPower==="breathing"){getNeighbors(index).forEach(i=>{if(colorBoard[i]==="anxiety")colorBoard[i]="transitioning";else if(colorBoard[i]==="transitioning")colorBoard[i]="calm";});setColorBalanceMessage("You slowed the system down. Anxiety softened into balance.");}
if(selectedColorPower==="grounding"){anxietyFrozenTurns=3;if(colorBoard[index]==="anxiety")colorBoard[index]="focus";setColorBalanceMessage("You grounded yourself. Anxiety spread is frozen for 3 turns.");}
if(selectedColorPower==="challenge"){getNeighbors(index).forEach(i=>{if(colorBoard[i]==="anxiety"||colorBoard[i]==="transitioning")colorBoard[i]="calm";});setColorBalanceMessage("You challenged the fear directly. This area is restored.");}
colorBoard=colorBoard.map(s=>s==="transitioning"?"calm":s);if(anxietyFrozenTurns>0)anxietyFrozenTurns--;else spreadAnxiety();renderColorBalanceBoard();updateColorBalanceStats();checkColorBalanceWin();}
function spreadAnxiety(){let anxiety=colorBoard.map((s,i)=>s==="anxiety"?i:null).filter(i=>i!==null);let chance=Math.min(.18+colorBalanceLevel*.01,.42);anxiety.forEach(i=>{if(Math.random()<chance){let ns=getNeighbors(i).filter(x=>colorBoard[x]!=="anxiety");if(ns.length)colorBoard[ns[Math.floor(Math.random()*ns.length)]]="anxiety";}});}
function getBalancePercent(){let balanced=colorBoard.filter(s=>s==="calm"||s==="focus").length;return Math.round((balanced/colorBoard.length)*100);}
function updateColorBalanceStats(){let l=document.getElementById("cbLevel"),b=document.getElementById("cbBalance"),t=document.getElementById("cbTurns");if(l)l.textContent=colorBalanceLevel;if(b)b.textContent=getBalancePercent()+"%";if(t)t.textContent=colorBalanceTurns;}
function setColorBalanceMessage(msg){let box=document.getElementById("colorBalanceMessage");if(box)box.innerHTML=msg;}
function checkColorBalanceWin(){let anxiety=colorBoard.filter(s=>s==="anxiety").length,balance=getBalancePercent();if(balance>=80||anxiety<=1){colorBalanceWonLevels++;mindPoints+=15;completedActivities+=1;updateXP();let badge=colorBalanceWonLevels===1?"<br><br>🏆 Achievement unlocked: First Calm":"";setColorBalanceMessage(`Level complete. Balance restored.<br><br>+15 Mind XP<br><br><strong>Lesson:</strong> You do not eliminate anxiety. You learn to manage it.${badge}`);colorBalanceLevel++;setTimeout(startColorBalanceGame,2500);}if(anxiety>=18){setColorBalanceMessage("The board became overwhelmed. Take a breath and try again. Balance can be rebuilt.");setTimeout(startColorBalanceGame,2200);}}
document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{if(document.getElementById("colorBalanceBoard"))startColorBalanceGame();},500));

/* v23 Centered game */
let centeredLevel=1, centeredWave=1, centeredHarmony=0, centeredEnergy=100, centeredCombo=1, centeredTurns=0, centeredFreezeTurns=0;
let centeredBoard=[], centeredPower="deepBreathing", centeredLastAnxietyCount=0, centeredCurrentObjective="Maintain 80% balance.", centeredEventActive=null;
const centeredEmotionStates=["calm","focus","energy","confidence","anxiety"];

function openCenteredGame(){showScreen("centeredGame");setTimeout(startCenteredGame,100);}

function startCenteredGame(){
  centeredWave=1; centeredHarmony=0; centeredEnergy=100; centeredCombo=1; centeredTurns=0; centeredFreezeTurns=0; centeredEventActive=null; centeredPower="deepBreathing";
  const base=["calm","focus","energy","confidence"];
  centeredBoard=Array.from({length:25},(_,i)=>base[i%base.length]);
  let redCount=Math.min(2+Math.floor(centeredLevel/4),7), placed=0;
  while(placed<redCount){let idx=Math.floor(Math.random()*25); if(centeredBoard[idx]!=="anxiety"){centeredBoard[idx]="anxiety";placed++;}}
  centeredLastAnxietyCount=getCenteredAnxietyCount(); chooseCenteredObjective(); selectCenteredPower("deepBreathing"); renderCenteredBoard(); updateCenteredStats(); hideCenteredEvent();
  setCenteredMessage("Select a tool, then tap the board to restore balance.");
}

function chooseCenteredObjective(){
  const objectives=["Maintain 80% balance.","Keep confidence above 25%.","Survive an overthinking storm.","Recover from burnout.","Finish with at least 500 Harmony."];
  centeredCurrentObjective=objectives[(centeredLevel-1)%objectives.length];
  const obj=document.getElementById("centeredObjective"); if(obj)obj.textContent="Objective: "+centeredCurrentObjective;
}

function renderCenteredBoard(){
  const board=document.getElementById("centeredBoard"); if(!board)return;
  board.innerHTML=centeredBoard.map((state,i)=>{
    const frozen=centeredFreezeTurns>0&&state==="anxiety"?" frozen":"";
    const weak=centeredEventActive==="poorSleep"&&state==="energy"?" weakened":"";
    const boosted=centeredEventActive==="encouragement"&&state==="confidence"?" boosted":"";
    return `<button class="color-cell ${state}${frozen}${weak}${boosted}" onclick="useCenteredPower(${i})" aria-label="${state} block"></button>`;
  }).join("");
}

function selectCenteredPower(power){
  centeredPower=power;
  ["deepBreathingBtn","groundingBtn","reframeBtn","supportBtn","restDayBtn"].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove("active-power");});
  const ids={deepBreathing:"deepBreathingBtn",grounding:"groundingBtn",reframe:"reframeBtn",support:"supportBtn",restDay:"restDayBtn"};
  const active=document.getElementById(ids[power]); if(active)active.classList.add("active-power");
  const messages={deepBreathing:"Deep Breathing slows anxiety spread and softens nearby red blocks.",grounding:"Grounding freezes anxiety spread in one area.",reframe:"Reframe converts anxiety into focus.",support:"Support Network creates confidence around pressure.",restDay:"Rest Day restores Mental Energy."};
  setCenteredMessage(messages[power]);
}

function centeredCost(power){return {deepBreathing:5,grounding:10,reframe:12,support:15,restDay:0}[power]||0;}

function useCenteredPower(index){
  const cost=centeredCost(centeredPower);
  if(centeredEnergy<cost){setCenteredMessage("Not enough Mental Energy. Use Rest Day or wait for energy to regenerate.");return;}
  centeredTurns++; centeredEnergy=Math.max(0,centeredEnergy-cost);
  if(centeredPower==="deepBreathing"){getCenteredNeighbors(index).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="energy";});setCenteredMessage("You slowed the nervous system. Anxiety softened into usable energy.");}
  if(centeredPower==="grounding"){centeredFreezeTurns=3;getCenteredNeighbors(index).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="focus";});setCenteredMessage("You grounded the moment. Anxiety spread is paused.");}
  if(centeredPower==="reframe"){if(centeredBoard[index]==="anxiety")centeredBoard[index]="focus";getCenteredNeighbors(index).slice(0,4).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="focus";});setCenteredMessage("You reframed the thought. Anxiety became focus.");}
  if(centeredPower==="support"){getCenteredNeighbors(index).forEach(i=>{if(centeredBoard[i]!=="anxiety")centeredBoard[i]="confidence";});setCenteredMessage("Support boosted confidence around the pressure.");}
  if(centeredPower==="restDay"){centeredEnergy=Math.min(100,centeredEnergy+25);setCenteredMessage("You restored Mental Energy. Recovery is productive.");}

  centeredEnergy=Math.min(100,centeredEnergy+4);
  handleCenteredWaveAndEvents();
  const before=centeredLastAnxietyCount;
  if(centeredFreezeTurns>0) centeredFreezeTurns--; else centeredAnxietySpread();
  const after=getCenteredAnxietyCount();
  centeredCombo=after<before?Math.min(centeredCombo+1,4):(after>before?1:centeredCombo);
  centeredLastAnxietyCount=after;
  centeredHarmony+=calculateHarmonyScore();
  renderCenteredBoard(); updateCenteredStats(); checkCenteredLevelEnd();
}

function getCenteredNeighbors(index){
  const row=Math.floor(index/5), col=index%5, neighbors=[index];
  for(let r=row-1;r<=row+1;r++)for(let c=col-1;c<=col+1;c++)if(r>=0&&r<5&&c>=0&&c<5){let n=r*5+c;if(!neighbors.includes(n))neighbors.push(n);}
  return neighbors;
}
function getCenteredCounts(){return centeredEmotionStates.reduce((a,s)=>{a[s]=centeredBoard.filter(x=>x===s).length;return a;},{});}
function getCenteredAnxietyCount(){return centeredBoard.filter(x=>x==="anxiety").length;}
function calculateBalanceScore(){
  const c=getCenteredCounts(), positive=c.calm+c.focus+c.energy+c.confidence, ideal=positive/4||1;
  const imbalance=Math.abs(c.calm-ideal)+Math.abs(c.focus-ideal)+Math.abs(c.energy-ideal)+Math.abs(c.confidence-ideal);
  return Math.max(0,Math.round(100-imbalance*6-c.anxiety*4));
}
function calculateHarmonyScore(){const b=calculateBalanceScore();let base=b>=90?500:(b>=75?250:(b>=55?100:0));return base*centeredCombo;}
function getCenteredBalancePercent(){return calculateBalanceScore();}

function centeredAnxietySpread(){
  const anxiety=centeredBoard.map((s,i)=>s==="anxiety"?i:null).filter(i=>i!==null);
  let chance=.14+centeredWave*.04+centeredLevel*.004; if(centeredEventActive==="difficultConversation")chance+=.12;
  anxiety.forEach(i=>{if(Math.random()<chance){const ns=getCenteredNeighbors(i).filter(n=>centeredBoard[n]!=="anxiety");if(ns.length)centeredBoard[ns[Math.floor(Math.random()*ns.length)]]="anxiety";}});
}

function handleCenteredWaveAndEvents(){
  if(centeredTurns===4){centeredWave=2;showCenteredEvent("Wave 2: Work stress appears. Anxiety may spread faster.");}
  if(centeredTurns===8){centeredWave=3;showCenteredEvent("Wave 3: Overthinking storm. Stay balanced.");}
  if(centeredTurns===12){centeredWave=4;showCenteredEvent("Wave 4: Confidence drops. Use Support Network.");}
  if(centeredTurns===16){centeredWave=5;showCenteredEvent("Final Wave: Multiple pressures. Maintain harmony.");}
  if(centeredTurns>0&&centeredTurns%5===0){
    const events=["poorSleep","difficultConversation","exercise","encouragement"], ev=events[Math.floor(Math.random()*events.length)]; centeredEventActive=ev;
    if(ev==="poorSleep")showCenteredEvent("Special Event: Poor Sleep. Energy blocks weaken this turn.");
    if(ev==="difficultConversation")showCenteredEvent("Special Event: Difficult Conversation. Red spreads faster.");
    if(ev==="exercise"){centeredBoard=centeredBoard.map((s,i)=>i%3===0&&s!=="anxiety"?"calm":s);showCenteredEvent("Special Event: Exercise. Calm and focus gain strength.");}
    if(ev==="encouragement"){centeredBoard=centeredBoard.map((s,i)=>i%4===0&&s!=="anxiety"?"confidence":s);showCenteredEvent("Special Event: Encouragement. Confidence boosts nearby blocks.");}
  } else if(centeredTurns%5!==1) centeredEventActive=null;
}

function showCenteredEvent(text){const box=document.getElementById("centeredEvent");if(box){box.classList.remove("hidden");box.innerHTML=text;}}
function hideCenteredEvent(){const box=document.getElementById("centeredEvent");if(box){box.classList.add("hidden");box.innerHTML="";}}
function updateCenteredStats(){
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  set("centeredLevel",centeredLevel);set("centeredWave",centeredWave);set("centeredHarmony",centeredHarmony);set("centeredEnergy",centeredEnergy);set("centeredCombo","x"+centeredCombo);set("centeredBalance",getCenteredBalancePercent()+"%");
}
function setCenteredMessage(message){const box=document.getElementById("centeredMessage");if(box)box.innerHTML=message;}

function checkCenteredLevelEnd(){
  const balance=getCenteredBalancePercent(), confidence=getCenteredCounts().confidence, anxiety=getCenteredAnxietyCount();
  let complete=false;
  if(centeredCurrentObjective.includes("80%")&&balance>=80&&centeredTurns>=8)complete=true;
  if(centeredCurrentObjective.includes("confidence")&&confidence>=7&&centeredTurns>=8)complete=true;
  if(centeredCurrentObjective.includes("storm")&&centeredTurns>=14&&anxiety<10)complete=true;
  if(centeredCurrentObjective.includes("burnout")&&centeredEnergy>=50&&centeredTurns>=12)complete=true;
  if(centeredCurrentObjective.includes("500 Harmony")&&centeredHarmony>=500)complete=true;
  if(complete){
    const xp=25+centeredLevel; mindPoints+=xp; completedActivities+=1; updateXP();
    setCenteredMessage(`Level complete. Harmony restored.<br><br>+${xp} Emotional Intelligence XP<br><br><strong>Lesson:</strong> Balance is healthier than perfection.`);
    centeredLevel++; setTimeout(startCenteredGame,3000); return;
  }
  if(anxiety>=18){setCenteredMessage("Overwhelmed. The ecosystem became flooded with anxiety. Take a breath and rebuild balance.");setTimeout(startCenteredGame,2500);}
}

/* v24 Game menu launch helpers */
function openThoughtSortGame(){
  resetThoughtSortGame();
  showScreen("thoughtSortGameScreen");
}

function openCalmFocusGame(){
  resetCalmFocusGame();
  showScreen("calmFocusGameScreen");
}

function openGroundingGame(){
  resetGroundingGame();
  showScreen("groundingGameScreen");
}

function resetThoughtSortGame(){
  if(typeof thoughtSortQuestions !== "undefined"){
    thoughtGameIndex = 0;
    thoughtGameScore = 0;
    const prompt = document.getElementById("thoughtPrompt");
    const idx = document.getElementById("thoughtIndex");
    const result = document.getElementById("thoughtSortResult");
    if(prompt) prompt.textContent = thoughtSortQuestions[0].text;
    if(idx) idx.textContent = "1";
    if(result) result.classList.add("hidden");
  }
}

function resetCalmFocusGame(){
  focusScore = 0;
  const score = document.getElementById("focusScore");
  const result = document.getElementById("focusResult");
  const circle = document.getElementById("focusCircle");
  if(score) score.textContent = "0";
  if(result) result.classList.add("hidden");
  if(circle){
    circle.style.left = "40%";
    circle.style.top = "38%";
  }
}

function resetGroundingGame(){
  ["groundingSee","groundingFeel","groundingHear","groundingSmell","groundingTaste"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  const result = document.getElementById("groundingResult");
  if(result) result.classList.add("hidden");
}
