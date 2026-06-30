
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
      description: "Your mind works hard to understand and prepare, but SteadierPath will help you turn mental noise into clarity."
    };
  }

  if(all.includes("confidence") || all.includes("social anxiety")){
    return {
      name: "🦁 Quiet Leader",
      description: "You may doubt yourself at times, but there is courage there. SteadierPath will help you build it through small actions."
    };
  }

  if(all.includes("burnout") || all.includes("work stress")){
    return {
      name: "🔥 Burned-Out Achiever",
      description: "You keep pushing, but your mind and body need recovery. SteadierPath will help you rebuild energy and balance."
    };
  }

  if(all.includes("motivation") || all.includes("energized")){
    return {
      name: "🚀 Momentum Builder",
      description: "You want to move forward. SteadierPath will help you turn small wins into steady progress."
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
    `<strong>Your SteadierPath Profile</strong><br><br>
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
      `<strong>This week, SteadierPath will track:</strong><br>
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
  if(points >= 400) return "Level 5: SteadierPath Master";
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
    box.textContent = "Breathe with SteadierPath";
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
    "Overthinking":"Overthinking is often your mind trying to solve uncertainty. SteadierPath helps you separate useful planning from mental noise.",
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

  let title = "General SteadierPath Reflection";
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
var thoughtSortQuestions =[
{text:"I am going to mess everything up.",answer:"assumption",explanation:"That is a prediction, not a proven fact."},
{text:"I practiced for 20 minutes today.",answer:"fact",explanation:"That is something observable that actually happened."},
{text:"Everyone will think I failed.",answer:"assumption",explanation:"That assumes you know what others will think."},
{text:"I felt nervous before speaking.",answer:"fact",explanation:"That is a real feeling you noticed."},
{text:"If I feel anxious, something bad must happen.",answer:"assumption",explanation:"Anxiety is a signal, not a guarantee."}
];
var thoughtGameIndex=0;
var thoughtGameScore=0;
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
var _v20RenderSavedPlan = renderSavedPlan;
renderSavedPlan = function(){
  if(!savedSteadyPlan){ _v20RenderSavedPlan(); return; }
  const plan = savedSteadyPlan;
  document.getElementById("profileCard").innerHTML = renderPremiumProfileRows(plan);
  const cleanMindType = plan.mindType.name.replace("🌊 ","").replace("🧠 ","").replace("🦁 ","").replace("🔥 ","").replace("🚀 ","").replace("🌱 ","");
  document.getElementById("mindTypeCard").innerHTML = `<strong>${cleanMindType}</strong><p>${plan.mindType.description}</p>`;
  document.getElementById("pathCard").innerHTML = `<div class="path-pill">☆ Primary Path: ${plan.path.title}</div><br>Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>This path is designed to help you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;
  document.getElementById("dailyPlanCard").innerHTML = `<strong>Today's Focus: ${plan.path.name}</strong><br>Today's Goal: Take one small action that helps you steady your mind.<br><br><strong>Your ${plan.time} reset:</strong><ol><li>${plan.path.daily[0]}</li><li>${plan.path.daily[1]}</li><li>${plan.path.daily[2]}</li></ol>`;
  const weeklyCard = document.getElementById("weeklyCard");
  if(weeklyCard){weeklyCard.innerHTML = `<strong>This week, SteadierPath will track:</strong><br>• Anxiety and stress trends<br>• Confidence and focus growth<br>• Activities completed<br>• Mind Points earned<br><br>Your first goal: complete one steady activity today.`;}
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
    if(focus)focus.textContent="Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";
    return;
  }
  const plan=savedSteadyPlan;
  const clean=plan.mindType.name.replace("🌊 ","").replace("🧠 ","").replace("🦁 ","").replace("🔥 ","").replace("🚀 ","").replace("🌱 ","");
  if(primaryTitle)primaryTitle.textContent="Continue My Plan";
  if(mindType)mindType.textContent=clean;
  if(focus)focus.textContent=`Today's Focus: ${plan.path.name}. ${plan.path.daily[0]}.`;
}
var _v21UpdatePlanStatus=updatePlanStatus;
updatePlanStatus=function(){_v21UpdatePlanStatus();updateFocusedHome();};
var _v21ShowScreen=showScreen;
showScreen=function(screenId){if(screenId==="mainMenu")updateFocusedHome();_v21ShowScreen(screenId);};
var _v21CompleteActivity=completeActivity;
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

/* v25 Calm Focus upgraded game */
let calmFocusRunning = false;
let calmFocusScore = 0;
let calmFocusMisses = 0;
let calmFocusCombo = 1;
let calmFocusMeter = 50;
let calmFocusTheme = "ocean";
let calmFocusSpawnTimer = null;
let calmFocusWanderTimer = null;

function openCalmFocusGame(){
  showScreen("calmFocusGameScreen");
  setTimeout(resetCalmFocusGame, 100);
}

function setCalmFocusTheme(theme, button){
  calmFocusTheme = theme;
  const area = document.getElementById("calmFocusPlayArea");
  if(area){
    area.classList.remove("ocean-theme","forest-theme","clouds-theme","night-theme");
    area.classList.add(theme + "-theme");
  }
  document.querySelectorAll(".theme-chip").forEach(btn => btn.classList.remove("active-theme"));
  if(button) button.classList.add("active-theme");
}

function startCalmFocusRound(){
  resetCalmFocusGame();
  calmFocusRunning = true;
  const result = document.getElementById("calmFocusResult");
  if(result) result.innerHTML = "Tap blue focus orbs. Avoid red distraction orbs.";
  spawnCalmFocusOrbs();
  calmFocusSpawnTimer = setInterval(spawnCalmFocusOrbs, 2400);
  calmFocusWanderTimer = setInterval(triggerMindWandering, 14000);
}

function resetCalmFocusGame(){
  calmFocusRunning = false;
  calmFocusScore = 0;
  calmFocusMisses = 0;
  calmFocusCombo = 1;
  calmFocusMeter = 50;

  if(calmFocusSpawnTimer){ clearInterval(calmFocusSpawnTimer); calmFocusSpawnTimer = null; }
  if(calmFocusWanderTimer){ clearInterval(calmFocusWanderTimer); calmFocusWanderTimer = null; }

  const area = document.getElementById("calmFocusPlayArea");
  if(area){
    area.querySelectorAll(".focus-orb,.distraction-orb,.focus-ripple").forEach(el => el.remove());
  }

  const overlay = document.getElementById("mindWanderOverlay");
  if(overlay) overlay.classList.add("hidden");

  updateCalmFocusStats();

  const result = document.getElementById("calmFocusResult");
  if(result) result.innerHTML = "Tap Start Focus to begin.";
}

function updateCalmFocusStats(){
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set("calmFocusScore", calmFocusScore);
  set("calmFocusMisses", calmFocusMisses);
  set("calmFocusCombo", "x" + calmFocusCombo);
  set("calmFocusMeterText", calmFocusMeter + "%");

  const fill = document.getElementById("calmFocusMeterFill");
  if(fill) fill.style.width = calmFocusMeter + "%";
}

function spawnCalmFocusOrbs(){
  const area = document.getElementById("calmFocusPlayArea");
  if(!area || !calmFocusRunning) return;

  area.querySelectorAll(".focus-orb,.distraction-orb").forEach(el => el.remove());

  const focusCount = 2 + Math.min(Math.floor(calmFocusScore / 3), 3);
  const distractionCount = 1 + Math.min(Math.floor(calmFocusScore / 5), 3);

  for(let i=0; i<focusCount; i++) createCalmFocusOrb("focus");
  for(let i=0; i<distractionCount; i++) createCalmFocusOrb("distraction");
}

function createCalmFocusOrb(type){
  const area = document.getElementById("calmFocusPlayArea");
  if(!area) return;

  const orb = document.createElement("button");
  orb.className = type === "focus" ? "focus-orb" : "distraction-orb";
  orb.textContent = type === "focus" ? "Focus" : "Noise";
  orb.onclick = (event) => {
    event.stopPropagation();
    if(type === "focus") handleFocusOrbTap(orb);
    else handleDistractionTap(orb);
  };

  const maxX = Math.max(area.clientWidth - 86, 20);
  const maxY = Math.max(area.clientHeight - 86, 20);
  orb.style.left = Math.max(12, Math.random() * maxX) + "px";
  orb.style.top = Math.max(12, Math.random() * maxY) + "px";
  orb.style.animationDelay = (Math.random() * 1.8) + "s";
  area.appendChild(orb);
}

function handleFocusOrbTap(orb){
  if(!calmFocusRunning) return;

  calmFocusScore += 1;
  calmFocusCombo = Math.min(calmFocusCombo + 1, 5);
  calmFocusMeter = Math.min(100, calmFocusMeter + 5 + calmFocusCombo);

  createFocusRipple(orb);
  orb.remove();
  updateCalmFocusStats();

  const result = document.getElementById("calmFocusResult");
  if(result) result.innerHTML = `Focused x${calmFocusCombo}. Stay present.`;

  if(calmFocusMeter >= 100 || calmFocusScore >= 12){
    completeCalmFocusRound();
  }
}

function handleDistractionTap(orb){
  calmFocusMisses += 1;
  calmFocusCombo = 1;
  calmFocusMeter = Math.max(0, calmFocusMeter - 12);
  orb.remove();
  updateCalmFocusStats();

  const result = document.getElementById("calmFocusResult");
  if(result) result.innerHTML = "Distraction noticed. Return gently to focus.";
}

function createFocusRipple(orb){
  const area = document.getElementById("calmFocusPlayArea");
  if(!area || !orb) return;

  const ripple = document.createElement("div");
  ripple.className = "focus-ripple";

  const orbRect = orb.getBoundingClientRect();
  const areaRect = area.getBoundingClientRect();
  ripple.style.left = (orbRect.left - areaRect.left + orbRect.width / 2) + "px";
  ripple.style.top = (orbRect.top - areaRect.top + orbRect.height / 2) + "px";

  area.appendChild(ripple);
  setTimeout(() => ripple.remove(), 900);
}

function triggerMindWandering(){
  if(!calmFocusRunning) return;
  const overlay = document.getElementById("mindWanderOverlay");
  if(overlay) overlay.classList.remove("hidden");
  calmFocusMeter = Math.max(0, calmFocusMeter - 8);
  updateCalmFocusStats();
}

function returnToPresent(){
  const overlay = document.getElementById("mindWanderOverlay");
  if(overlay) overlay.classList.add("hidden");
  calmFocusMeter = Math.min(100, calmFocusMeter + 10);
  updateCalmFocusStats();
  const result = document.getElementById("calmFocusResult");
  if(result) result.innerHTML = "You returned to the present. Good work.";
}

function completeCalmFocusRound(){
  calmFocusRunning = false;
  if(calmFocusSpawnTimer){ clearInterval(calmFocusSpawnTimer); calmFocusSpawnTimer = null; }
  if(calmFocusWanderTimer){ clearInterval(calmFocusWanderTimer); calmFocusWanderTimer = null; }

  const area = document.getElementById("calmFocusPlayArea");
  if(area) area.querySelectorAll(".focus-orb,.distraction-orb").forEach(el => el.remove());

  const xpEarned = 10 + calmFocusCombo * 2;
  mindPoints += xpEarned;
  completedActivities += 1;
  updateXP();

  const result = document.getElementById("calmFocusResult");
  if(result){
    result.innerHTML = `<strong>Calm Focus complete.</strong><br>You practiced steady attention and gently returned from distraction.<br><br>+${xpEarned} XP`;
  }

  try { if(typeof successSound === "function") successSound(); } catch(e){}
}

/* v26 Anchor game */
let anchorRunning = false;
let anchorLevel = 1;
let anchorStability = 75;
let anchorScore = 0;
let anchorWaves = 0;
let anchorPosition = 50;
let anchorTimer = null;
let anchorWaveTimer = null;

const anchorThoughts = [
  "What if this goes wrong?",
  "I can't handle this.",
  "Everyone will notice.",
  "I should have done better.",
  "Something bad might happen.",
  "I need certainty right now.",
  "What if I fail?",
  "I feel anxious, so I must be unsafe."
];

function openAnchorGame(){
  showScreen("anchorGameScreen");
  setTimeout(resetAnchorGame, 100);
}

function startAnchorGame(){
  resetAnchorGame();
  anchorRunning = true;
  setAnchorMessage("Stay inside the calm zone. Waves will pass.");
  setAnchorPrompt("Use the buttons to stay anchored.");

  anchorTimer = setInterval(() => {
    if(!anchorRunning) return;

    // Natural drift from anxious waves
    const drift = (Math.random() - 0.5) * (8 + anchorLevel);
    anchorPosition = Math.max(8, Math.min(92, anchorPosition + drift));

    const distanceFromCenter = Math.abs(anchorPosition - 50);
    if(distanceFromCenter <= 18){
      anchorStability = Math.min(100, anchorStability + 2);
      anchorScore += 5;
    } else {
      anchorStability = Math.max(0, anchorStability - 5);
    }

    updateAnchorPlayer();
    updateAnchorStats();
    checkAnchorEnd();
  }, 1100);

  anchorWaveTimer = setInterval(spawnAnchorThought, 2400);
  spawnAnchorThought();
}

function resetAnchorGame(){
  anchorRunning = false;
  if(anchorTimer){ clearInterval(anchorTimer); anchorTimer = null; }
  if(anchorWaveTimer){ clearInterval(anchorWaveTimer); anchorWaveTimer = null; }

  anchorStability = 75;
  anchorScore = 0;
  anchorWaves = 0;
  anchorPosition = 50;

  const sea = document.getElementById("anchorSea");
  if(sea) sea.querySelectorAll(".anchor-thought").forEach(el => el.remove());

  updateAnchorPlayer();
  updateAnchorStats();
  setAnchorPrompt("Tap Start Anchor to begin.");
  setAnchorMessage("The goal is not to stop the waves. The goal is to stay anchored while they pass.");
}

function anchorMove(direction){
  if(!anchorRunning){
    setAnchorMessage("Tap Start Anchor first.");
    return;
  }

  if(direction === "left") anchorPosition = Math.max(8, anchorPosition - 10);
  if(direction === "right") anchorPosition = Math.min(92, anchorPosition + 10);
  if(direction === "center"){
    anchorPosition = 50;
    anchorStability = Math.min(100, anchorStability + 8);
    anchorScore += 15;
    setAnchorPrompt("Anchored thought: This is a thought, not danger.");
    const player = document.getElementById("anchorPlayer");
    if(player){
      player.classList.remove("steady");
      void player.offsetWidth;
      player.classList.add("steady");
    }
  }

  updateAnchorPlayer();
  updateAnchorStats();
  checkAnchorEnd();
}

function updateAnchorPlayer(){
  const player = document.getElementById("anchorPlayer");
  if(player) player.style.left = anchorPosition + "%";
}

function updateAnchorStats(){
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set("anchorLevel", anchorLevel);
  set("anchorStability", anchorStability + "%");
  set("anchorScore", anchorScore);
  set("anchorWaves", anchorWaves);
}

function spawnAnchorThought(){
  const sea = document.getElementById("anchorSea");
  if(!sea || !anchorRunning) return;

  anchorWaves++;
  const thought = document.createElement("div");
  thought.className = "anchor-thought";
  thought.textContent = anchorThoughts[Math.floor(Math.random() * anchorThoughts.length)];
  thought.style.top = (16 + Math.random() * 44) + "%";
  thought.style.animationDuration = Math.max(5.5, 9 - anchorLevel * 0.25) + "s";
  sea.appendChild(thought);

  setTimeout(() => thought.remove(), 9500);
  setAnchorPrompt("A thought wave appeared. Stay anchored.");
  updateAnchorStats();
}

function setAnchorMessage(message){
  const box = document.getElementById("anchorMessage");
  if(box) box.innerHTML = message;
}

function setAnchorPrompt(message){
  const prompt = document.getElementById("anchorPrompt");
  if(prompt) prompt.textContent = message;
}

function checkAnchorEnd(){
  if(anchorStability <= 0){
    anchorRunning = false;
    if(anchorTimer) clearInterval(anchorTimer);
    if(anchorWaveTimer) clearInterval(anchorWaveTimer);
    setAnchorMessage("The storm pulled you away. Take a breath and restart. Stability can be rebuilt.");
    return;
  }

  if(anchorScore >= 160 + anchorLevel * 20){
    anchorRunning = false;
    if(anchorTimer) clearInterval(anchorTimer);
    if(anchorWaveTimer) clearInterval(anchorWaveTimer);

    const xp = 12 + anchorLevel;
    mindPoints += xp;
    completedActivities += 1;
    updateXP();

    setAnchorMessage(`<strong>Anchor complete.</strong><br>You stayed steady while the waves passed.<br><br>+${xp} XP<br><br><strong>Lesson:</strong> Thoughts can move around you without moving you.`);
    anchorLevel++;
    try { if(typeof successSound === "function") successSound(); } catch(e){}
  }
}

/* v27 Centered simplified to Calm, Focus, Anxiety only */
var centeredEmotionStatesV27 = ["calm","focus","anxiety"];

function startCenteredGame(){
  centeredWave=1; centeredHarmony=0; centeredEnergy=100; centeredCombo=1; centeredTurns=0; centeredFreezeTurns=0; centeredEventActive=null; centeredPower="deepBreathing";
  const base=["calm","focus"];
  centeredBoard=Array.from({length:25},(_,i)=>base[i%base.length]);
  let redCount=Math.min(3+Math.floor(centeredLevel/4),8), placed=0;
  while(placed<redCount){let idx=Math.floor(Math.random()*25); if(centeredBoard[idx]!=="anxiety"){centeredBoard[idx]="anxiety";placed++;}}
  centeredLastAnxietyCount=getCenteredAnxietyCount(); chooseCenteredObjectiveV27(); selectCenteredPower("deepBreathing"); renderCenteredBoard(); updateCenteredStats(); hideCenteredEvent();
  setCenteredMessage("Keep Calm and Focus in balance while preventing Anxiety from taking over.");
}
function chooseCenteredObjectiveV27(){
  const objectives=["Maintain 80% balance.","Keep focus above 35%.","Survive an overthinking storm.","Recover from overload.","Finish with at least 500 Harmony."];
  centeredCurrentObjective=objectives[(centeredLevel-1)%objectives.length];
  const obj=document.getElementById("centeredObjective"); if(obj)obj.textContent="Objective: "+centeredCurrentObjective;
}
function selectCenteredPower(power){
  centeredPower=power;
  ["deepBreathingBtn","groundingBtn","reframeBtn","supportBtn","restDayBtn"].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove("active-power");});
  const ids={deepBreathing:"deepBreathingBtn",grounding:"groundingBtn",reframe:"reframeBtn",restDay:"restDayBtn"};
  const active=document.getElementById(ids[power]); if(active)active.classList.add("active-power");
  const messages={deepBreathing:"Deep Breathing turns nearby anxiety into calm.",grounding:"Grounding freezes anxiety spread in one area.",reframe:"Reframe converts anxiety into focus.",restDay:"Rest Day restores Mental Energy."};
  setCenteredMessage(messages[power]||"Choose a tool.");
}
function centeredCost(power){return {deepBreathing:5,grounding:10,reframe:12,restDay:0}[power]||0;}
function useCenteredPower(index){
  const cost=centeredCost(centeredPower);
  if(centeredEnergy<cost){setCenteredMessage("Not enough Mental Energy. Use Rest Day or wait for energy to regenerate.");return;}
  centeredTurns++; centeredEnergy=Math.max(0,centeredEnergy-cost);
  if(centeredPower==="deepBreathing"){getCenteredNeighbors(index).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="calm";});setCenteredMessage("You slowed the nervous system. Anxiety became calm.");}
  if(centeredPower==="grounding"){centeredFreezeTurns=3;getCenteredNeighbors(index).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="focus";});setCenteredMessage("You grounded the moment. Anxiety spread is paused.");}
  if(centeredPower==="reframe"){if(centeredBoard[index]==="anxiety")centeredBoard[index]="focus";getCenteredNeighbors(index).slice(0,4).forEach(i=>{if(centeredBoard[i]==="anxiety")centeredBoard[i]="focus";});setCenteredMessage("You reframed the thought. Anxiety became focus.");}
  if(centeredPower==="restDay"){centeredEnergy=Math.min(100,centeredEnergy+25);setCenteredMessage("You restored Mental Energy. Recovery is productive.");}
  centeredEnergy=Math.min(100,centeredEnergy+4);
  handleCenteredWaveAndEventsV27();
  const before=centeredLastAnxietyCount;
  if(centeredFreezeTurns>0)centeredFreezeTurns--;else centeredAnxietySpread();
  const after=getCenteredAnxietyCount();
  centeredCombo=after<before?Math.min(centeredCombo+1,4):(after>before?1:centeredCombo);
  centeredLastAnxietyCount=after;
  centeredHarmony+=calculateHarmonyScoreV27();
  renderCenteredBoard(); updateCenteredStats(); checkCenteredLevelEndV27();
}
function getCenteredCounts(){
  return centeredEmotionStatesV27.reduce((a,s)=>{a[s]=centeredBoard.filter(x=>x===s).length;return a;},{calm:0,focus:0,anxiety:0});
}
function calculateBalanceScore(){
  const c=getCenteredCounts(), positive=c.calm+c.focus, ideal=positive/2||1;
  const imbalance=Math.abs(c.calm-ideal)+Math.abs(c.focus-ideal);
  return Math.max(0,Math.round(100-imbalance*5-c.anxiety*5));
}
function calculateHarmonyScoreV27(){
  const b=calculateBalanceScore();let base=b>=90?500:(b>=75?250:(b>=55?100:0));return base*centeredCombo;
}
function handleCenteredWaveAndEventsV27(){
  if(centeredTurns===4){centeredWave=2;showCenteredEvent("Wave 2: Work stress appears. Anxiety may spread faster.");}
  if(centeredTurns===8){centeredWave=3;showCenteredEvent("Wave 3: Overthinking storm. Keep returning to focus.");}
  if(centeredTurns===12){centeredWave=4;showCenteredEvent("Wave 4: Focus drops. Use Reframe.");}
  if(centeredTurns===16){centeredWave=5;showCenteredEvent("Final Wave: Maintain calm and focus.");}
  if(centeredTurns>0&&centeredTurns%5===0){
    const events=["poorSleep","difficultConversation","exercise","encouragement"],ev=events[Math.floor(Math.random()*events.length)];centeredEventActive=ev;
    if(ev==="poorSleep")showCenteredEvent("Special Event: Poor Sleep. Focus is harder to maintain.");
    if(ev==="difficultConversation")showCenteredEvent("Special Event: Difficult Conversation. Anxiety spreads faster.");
    if(ev==="exercise"){centeredBoard=centeredBoard.map((s,i)=>i%3===0&&s!=="anxiety"?"calm":s);showCenteredEvent("Special Event: Exercise. Calm strengthens.");}
    if(ev==="encouragement"){centeredBoard=centeredBoard.map((s,i)=>i%4===0&&s!=="anxiety"?"focus":s);showCenteredEvent("Special Event: Encouragement. Focus strengthens.");}
  }else if(centeredTurns%5!==1)centeredEventActive=null;
}
function checkCenteredLevelEndV27(){
  const balance=getCenteredBalancePercent(),counts=getCenteredCounts(),anxiety=getCenteredAnxietyCount();
  let complete=false;
  if(centeredCurrentObjective.includes("80%")&&balance>=80&&centeredTurns>=8)complete=true;
  if(centeredCurrentObjective.includes("focus")&&counts.focus>=9&&centeredTurns>=8)complete=true;
  if(centeredCurrentObjective.includes("storm")&&centeredTurns>=14&&anxiety<10)complete=true;
  if(centeredCurrentObjective.includes("overload")&&centeredEnergy>=50&&centeredTurns>=12)complete=true;
  if(centeredCurrentObjective.includes("500 Harmony")&&centeredHarmony>=500)complete=true;
  if(complete){
    const xp=25+centeredLevel;mindPoints+=xp;completedActivities+=1;updateXP();
    setCenteredMessage(`Level complete. Harmony restored.<br><br>+${xp} Emotional Intelligence XP<br><br><strong>Lesson:</strong> Balance is healthier than eliminating anxiety.`);
    centeredLevel++;setTimeout(startCenteredGame,3000);return;
  }
  if(anxiety>=18){setCenteredMessage("Overwhelmed. Anxiety took over the system. Take a breath and rebuild balance.");setTimeout(startCenteredGame,2500);}
}

/* v27 Thought Sort 20 questions + premium difficulty gates */
var thoughtDifficulty="easy";
var thoughtSortBanks={easy:[
{text:"I stumbled over my words once, so the whole conversation was a failure.",answer:"assumption",explanation:"One mistake does not prove the entire conversation failed."},
{text:"My heart is beating fast right now.",answer:"fact",explanation:"That is an observable body sensation."},
{text:"If I feel anxious, everyone can tell.",answer:"assumption",explanation:"That assumes you know what others notice."},
{text:"I practiced for 15 minutes today.",answer:"fact",explanation:"That is a specific action that happened."},
{text:"They did not text back yet, so they must be upset with me.",answer:"assumption",explanation:"There are many possible reasons someone has not replied."},
{text:"I felt nervous before the meeting.",answer:"fact",explanation:"That is a real feeling you noticed."},
{text:"I made one mistake, so I am bad at this.",answer:"assumption",explanation:"A mistake is not the same as a permanent identity."},
{text:"I slept 5 hours last night.",answer:"fact",explanation:"That is measurable information."},
{text:"This anxiety will never go away.",answer:"assumption",explanation:"That predicts the future without evidence."},
{text:"I have handled anxious moments before.",answer:"fact",explanation:"If it has happened before, it is evidence."},
{text:"People will judge me if I ask a question.",answer:"assumption",explanation:"That is mind-reading."},
{text:"I avoided the call today.",answer:"fact",explanation:"That describes a behavior."},
{text:"Because I am tired, tomorrow will be terrible.",answer:"assumption",explanation:"Tiredness can affect tomorrow, but it does not guarantee disaster."},
{text:"My hands were shaking earlier.",answer:"fact",explanation:"That is an observable physical symptom."},
{text:"I should never feel this way.",answer:"assumption",explanation:"Feelings are not moral failures."},
{text:"I completed one task today.",answer:"fact",explanation:"That is concrete progress."},
{text:"If I say no, they will stop liking me.",answer:"assumption",explanation:"That predicts someone else's reaction."},
{text:"I wrote down my worry.",answer:"fact",explanation:"That is a specific action."},
{text:"I cannot do anything right.",answer:"assumption",explanation:"Words like 'anything' are usually overgeneralizations."},
{text:"I took three slow breaths.",answer:"fact",explanation:"That is an action you can observe."}
],
medium:[{text:"Premium Medium level unlocks deeper mixed thought patterns.",answer:"fact",explanation:"This level is reserved for premium."}],
hard:[{text:"Premium Hard level unlocks advanced cognitive distortions.",answer:"fact",explanation:"This level is reserved for premium."}]
};
function setThoughtDifficulty(level){
  if(level==="medium"||level==="hard"){
    const msg=document.getElementById("thoughtDifficultyMessage");
    if(msg)msg.innerHTML=`<strong>${level.charAt(0).toUpperCase()+level.slice(1)} is a Premium level.</strong><br>Free users can play Easy mode.`;
    return;
  }
  thoughtDifficulty=level;
  document.querySelectorAll(".difficulty-btn").forEach(btn=>btn.classList.remove("active-difficulty"));
  const btn=document.getElementById("thoughtEasyBtn"); if(btn)btn.classList.add("active-difficulty");
  const msg=document.getElementById("thoughtDifficultyMessage"); if(msg)msg.innerHTML="Easy mode selected. Medium and Hard unlock with premium.";
  resetThoughtSortGame();
}
function resetThoughtSortGame(){
  thoughtGameIndex=0;thoughtGameScore=0;
  const bank=thoughtSortBanks[thoughtDifficulty]||thoughtSortBanks.easy;
  const prompt=document.getElementById("thoughtPrompt"),idx=document.getElementById("thoughtIndex"),total=document.getElementById("thoughtTotal"),result=document.getElementById("thoughtSortResult");
  if(prompt)prompt.textContent=bank[0].text;if(idx)idx.textContent="1";if(total)total.textContent=bank.length;if(result)result.classList.add("hidden");
}
function answerThoughtSort(choice){
  const bank=thoughtSortBanks[thoughtDifficulty]||thoughtSortBanks.easy,question=bank[thoughtGameIndex],result=document.getElementById("thoughtSortResult");
  result.classList.remove("hidden");
  result.innerHTML=choice===question.answer?`<strong>Correct.</strong><br>${question.explanation}`:`<strong>Good try.</strong><br>${question.explanation}`;
  if(choice===question.answer)thoughtGameScore++;
  setTimeout(()=>{
    thoughtGameIndex++;
    if(thoughtGameIndex>=bank.length){
      const xp=15;mindPoints+=xp;completedActivities+=1;updateXP();
      document.getElementById("thoughtPrompt").textContent="Game complete.";document.getElementById("thoughtIndex").textContent=bank.length;
      result.innerHTML=`<strong>Thought Sort complete.</strong><br>Difficulty: ${thoughtDifficulty.toUpperCase()}<br>Score: ${thoughtGameScore} / ${bank.length}<br><br>You practiced separating facts from assumptions. +${xp} XP`;
      thoughtGameIndex=0;thoughtGameScore=0;return;
    }
    document.getElementById("thoughtPrompt").textContent=bank[thoughtGameIndex].text;document.getElementById("thoughtIndex").textContent=thoughtGameIndex+1;result.classList.add("hidden");
  },1400);
}

/* v28 emergency calming tools: guided, tap-based, text optional later */
let worryReleaseStep=0,worryCategory="",worryControl="",sleepWindStep=0;

function startGroundingTool(){
  const result=document.getElementById("toolResult"); if(!result)return;
  result.classList.remove("hidden"); result.classList.add("guided-tool");
  result.innerHTML=`
    <div class="guided-message"><strong>Grounding Exercise</strong><p>You do not have to solve anything right now. Bring your attention back to this moment.</p></div>
    <div class="grounding-count"><div class="grounding-number">5</div><div><strong>Look around.</strong><br>Find five things you can see.</div></div>
    <div class="grounding-count"><div class="grounding-number">4</div><div><strong>Notice touch.</strong><br>Find four things you can feel.</div></div>
    <div class="grounding-count"><div class="grounding-number">3</div><div><strong>Listen.</strong><br>Name three things you can hear.</div></div>
    <div class="grounding-count"><div class="grounding-number">2</div><div><strong>Breathe in.</strong><br>Notice two things you can smell.</div></div>
    <div class="grounding-count"><div class="grounding-number">1</div><div><strong>Return.</strong><br>Notice one thing you can taste, or take one slow breath.</div></div>
    <div class="guided-message"><strong>You are here.</strong><p>This moment is real. The worry is a signal, not a command.</p></div>
    <button onclick="completeGroundingTool()">Complete Grounding +10 XP</button>
    <button class="secondary reflect-later-btn" onclick="showScreen('journal')">Journal About This Later</button>`;
}

function startWorryReleaseTool(){worryReleaseStep=1;worryCategory="";worryControl="";renderWorryReleaseStep();}
function renderWorryReleaseStep(){
  const result=document.getElementById("toolResult"); if(!result)return;
  result.classList.remove("hidden"); result.classList.add("guided-tool");
  if(worryReleaseStep===1){
    result.innerHTML=`<div class="guided-message"><strong>Worry Release</strong><p>First, name the kind of worry. You do not need to explain the whole story right now.</p></div>
      <div class="guided-options">
      <button onclick="selectWorryCategory('Work')">Work</button><button onclick="selectWorryCategory('Health')">Health</button><button onclick="selectWorryCategory('Relationships')">Relationships</button><button onclick="selectWorryCategory('Money')">Money</button><button onclick="selectWorryCategory('Future')">Future</button><button onclick="selectWorryCategory('Other')">Other</button>
      </div>`;
  }
  if(worryReleaseStep===2){
    result.innerHTML=`<div class="guided-message"><strong>${worryCategory} worry noticed.</strong><p>Can you control this right now?</p></div>
      <div class="guided-options">
      <button onclick="selectWorryControl('Yes')">Yes — there is one small action I can take</button>
      <button onclick="selectWorryControl('No')">No — this is outside my control right now</button>
      <button onclick="selectWorryControl('Not sure')">I am not sure yet</button>
      </div>`;
  }
  if(worryReleaseStep===3){
    let body="";
    if(worryControl==="Yes"){
      body=`<strong>Choose one small step.</strong><p>You do not need to solve the whole problem. One steady action is enough.</p><div class="guided-options"><button onclick="finishWorryRelease('Prepare for 5 minutes')">Prepare for 5 minutes</button><button onclick="finishWorryRelease('Send one message')">Send one message</button><button onclick="finishWorryRelease('Write it down')">Write it down</button><button onclick="finishWorryRelease('Take a short walk')">Take a short walk</button></div>`;
    }else if(worryControl==="No"){
      body=`<strong>Release what is not yours to carry.</strong><p>It is okay to put this down for now. You can return to it when you are steadier.</p><div class="guided-options"><button onclick="finishWorryRelease('I can release this for now')">I can release this for now</button><button onclick="finishWorryRelease('I can come back to this tomorrow')">I can come back to this tomorrow</button></div>`;
    }else{
      body=`<strong>Uncertainty is allowed.</strong><p>You do not need perfect clarity to take one steady breath.</p><div class="guided-options"><button onclick="finishWorryRelease('I will pause and breathe')">I will pause and breathe</button><button onclick="finishWorryRelease('I will write it down later')">I will write it down later</button></div>`;
    }
    result.innerHTML=`<div class="guided-message">${body}</div>`;
  }
}
function selectWorryCategory(category){worryCategory=category;worryReleaseStep=2;renderWorryReleaseStep();}
function selectWorryControl(control){worryControl=control;worryReleaseStep=3;renderWorryReleaseStep();}
function finishWorryRelease(action){
  mindPoints+=10;completedActivities+=1;updateXP();
  const result=document.getElementById("toolResult");
  if(result){result.innerHTML=`<div class="guided-message"><strong>Worry released.</strong><p>You moved from mental noise to one steady response.</p><p><strong>Your steady step:</strong> ${action}</p><p>+10 XP</p></div><button class="secondary reflect-later-btn" onclick="showScreen('journal')">Journal About This Later</button>`;}
  safeSuccessSound();
}

function startSleepWindDownTool(){sleepWindStep=1;renderSleepWindDownStep();}
function renderSleepWindDownStep(){
  const result=document.getElementById("toolResult"); if(!result)return;
  result.classList.remove("hidden"); result.classList.add("guided-tool");
  const steps={
    1:{title:"Sleep Wind-Down",text:"Your responsibilities can wait. Right now, your job is to let your body know it is safe to rest.",button:"Begin Wind-Down"},
    2:{title:"Release the day.",text:"You did what you could with the energy you had today.",button:"I did enough today"},
    3:{title:"Let tomorrow wait.",text:"Tomorrow can be handled tomorrow. This moment is for rest.",button:"Tomorrow can wait"},
    4:{title:"Soften the body.",text:"Relax your jaw. Lower your shoulders. Let your hands rest.",button:"My body can rest"},
    5:{title:"Settle the mind.",text:"You do not need to solve anything before sleeping.",button:"I can rest now"}
  };
  const step=steps[sleepWindStep];
  result.innerHTML=`<div class="guided-message"><strong>${step.title}</strong><p>${step.text}</p></div><div class="sleep-affirmation">${step.button}</div><button onclick="nextSleepWindDownStep()">${sleepWindStep>=5?"Complete Wind-Down +10 XP":"Continue"}</button><button class="secondary" onclick="playAmbient('rain')">Play Rain</button><button class="secondary" onclick="playAmbient('ocean')">Play Ocean</button>`;
}
function nextSleepWindDownStep(){if(sleepWindStep>=5){completeSleepWindDownTool();return;}sleepWindStep++;renderSleepWindDownStep();}

/* v29 Emergency tool player */
let emergencyToolType="grounding";
let emergencyToolStep=0;
let emergencyToolMessages=[];

const emergencyToolData={
  breathing:{
    title:"60-Second Reset", icon:"🚨",
    messages:[
      "You are safe in this moment.",
      "Nothing needs to be solved right now.",
      "Let your body slow down before your mind tries to figure everything out.",
      "Tap the breathing bubble below and follow the rhythm.",
      "You are in control. One breath at a time."
    ]
  },
  grounding:{
    title:"Grounding", icon:"🌿",
    messages:[
      "You do not need to escape this moment. You can return to it.",
      "Find five things you can see.",
      "Find four things you can feel.",
      "Name three things you can hear.",
      "Notice two things you can smell.",
      "Notice one thing you can taste, or take one slow breath.",
      "You are here. This moment is real. The worry is a signal, not a command."
    ]
  },
  worry:{
    title:"Worry Release", icon:"🕊️",
    messages:[
      "First, name the worry without judging it.",
      "Ask yourself: Can I control this right now?",
      "If the answer is yes, choose one small steady action.",
      "If the answer is no, give yourself permission to release it for now.",
      "You do not need certainty to be steady.",
      "You moved from mental noise to one steady response. That is progress."
    ]
  },
  sleep:{
    title:"Sleep Wind-Down", icon:"🌙",
    messages:[
      "Your responsibilities can wait. Right now, your body needs rest.",
      "You did what you could with the energy you had today.",
      "Tomorrow can be handled tomorrow.",
      "Relax your jaw. Lower your shoulders. Let your hands rest.",
      "You do not need to solve anything before sleeping.",
      "You can rest now. You are allowed to put the day down."
    ]
  }
};

function openEmergencyTool(type){
  emergencyToolType=type;
  emergencyToolStep=0;
  emergencyToolMessages=emergencyToolData[type].messages;

  const title=document.getElementById("emergencyToolTitle");
  const icon=document.getElementById("emergencyToolIcon");
  if(title)title.textContent=emergencyToolData[type].title;
  if(icon)icon.textContent=emergencyToolData[type].icon;

  showScreen("emergencyToolPlayer");
  renderEmergencyToolStep();

  const breathingArea=document.getElementById("breathingBubbleArea");
  if(breathingArea){
    if(type==="breathing")breathingArea.classList.remove("hidden");
    else breathingArea.classList.add("hidden");
  }
}

function renderEmergencyToolStep(){
  const bubble=document.getElementById("emergencyMessageBubble");
  const stepText=document.getElementById("emergencyStepText");
  const fill=document.getElementById("emergencyStepFill");
  const nextBtn=document.getElementById("emergencyNextBtn");
  const total=emergencyToolMessages.length;
  const message=emergencyToolMessages[emergencyToolStep]||emergencyToolMessages[total-1];

  if(bubble){
    bubble.style.animation="none";
    void bubble.offsetWidth;
    bubble.style.animation="bubbleMessageIn .55s cubic-bezier(.22,.61,.36,1) both";
    bubble.innerHTML=message;
  }
  if(stepText)stepText.textContent=`Step ${emergencyToolStep+1} of ${total}`;
  if(fill)fill.style.width=`${((emergencyToolStep+1)/total)*100}%`;
  if(nextBtn)nextBtn.textContent=emergencyToolStep>=total-1?"Finish":"Next";
}

function nextEmergencyToolStep(){
  if(emergencyToolStep<emergencyToolMessages.length-1){
    emergencyToolStep++;
    renderEmergencyToolStep();
  }else{
    completeEmergencyTool();
  }
}

function completeEmergencyTool(){
  mindPoints+=10;
  completedActivities+=1;
  updateXP();
  const bubble=document.getElementById("emergencyMessageBubble");
  const endings={
    breathing:"Strengthening thought: Your body can calm down. You are safe in this moment. You are in control.",
    grounding:"Strengthening thought: You returned to the present. You can be steady even when your mind feels loud.",
    worry:"Strengthening thought: You do not have to carry every thought. You can choose one steady step.",
    sleep:"Strengthening thought: Rest is not weakness. Rest is how you recover your strength."
  };
  if(bubble)bubble.innerHTML=`${endings[emergencyToolType]}<br><br>+10 XP`;
  const nextBtn=document.getElementById("emergencyNextBtn");
  if(nextBtn)nextBtn.textContent="Complete";
  try{if(typeof successSound==="function")successSound();}catch(e){}
}

function closeEmergencyTool(){
  if(typeof stopBreathingExercise==="function")stopBreathingExercise();
  showScreen("tools");
}


/* v30 game menu restored; existing game logic preserved. */

/* v31 XP, Rewards, Difficulty, Bug Fixes */
var STEADIERPATH_XP_PER_LEVEL=250;
function getSteadyLevelInfo(){
  const totalXP=typeof mindPoints!=="undefined"?mindPoints:0;
  const level=Math.floor(totalXP/STEADIERPATH_XP_PER_LEVEL)+1;
  const xpIntoLevel=totalXP%STEADIERPATH_XP_PER_LEVEL;
  const remaining=STEADIERPATH_XP_PER_LEVEL-xpIntoLevel;
  const names={1:"Calm Seeker",2:"Building Stability",3:"Steady Beginner",4:"Finding Balance",5:"Grounded Mind",6:"Focus Builder",7:"Calm Under Pressure",8:"Resilience Builder",9:"Thought Challenger",10:"Storm Navigator",15:"Steady Guide",20:"Resilient Mind",30:"Calm Leader",40:"Deeply Grounded",50:"SteadierPath Master"};
  return {totalXP,level,xpIntoLevel,remaining,name:names[level]||(level>=50?"SteadierPath Master":"Steady Progress")};
}
function renderRewardsPage(){
  const i=getSteadyLevelInfo();
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
  set("rewardsLevelCard",`Level ${i.level}: ${i.name}`);set("rewardsXpText",`${i.xpIntoLevel} / ${STEADIERPATH_XP_PER_LEVEL} XP`);set("rewardsRemainingText",`${i.remaining} XP until Level ${i.level+1}.`);
  const f=document.getElementById("rewardsXpFill");if(f)f.style.width=`${(i.xpIntoLevel/STEADIERPATH_XP_PER_LEVEL)*100}%`;
}
var _v31ShowScreen=showScreen;showScreen=function(screenId){_v31ShowScreen(screenId);if(screenId==="rewards")renderRewardsPage();};
var _v31UpdateXP=updateXP;updateXP=function(){
  const i=getSteadyLevelInfo();
  const levelNameEl=document.getElementById("levelName"),xpFill=document.getElementById("xpFill"),xpText=document.getElementById("xpText");
  if(levelNameEl)levelNameEl.textContent=`Level ${i.level}: ${i.name}`;
  if(xpFill)xpFill.style.width=`${(i.xpIntoLevel/STEADIERPATH_XP_PER_LEVEL)*100}%`;
  if(xpText)xpText.textContent=`${i.xpIntoLevel} / ${STEADIERPATH_XP_PER_LEVEL} XP • ${i.remaining} XP to Level ${i.level+1}`;
  renderRewardsPage();
};
document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{document.querySelectorAll("h3").forEach(h=>{if(h.textContent.trim().toLowerCase()==="gamified progress")h.textContent="Steady Progress";});updateXP();},300));

function setGameDifficulty(game,level){
  const msg=document.getElementById(`${game}DifficultyMessage`);
  if(level==="medium"||level==="hard"){if(msg)msg.innerHTML=`<strong>${level.charAt(0).toUpperCase()+level.slice(1)} is Premium.</strong><br>Upgrade to unlock more advanced levels.`;return;}
  ["Easy","Medium","Hard"].forEach(n=>{const b=document.getElementById(`${game}${n}Btn`);if(b)b.classList.remove("active-difficulty");});
  const a=document.getElementById(`${game}EasyBtn`);if(a)a.classList.add("active-difficulty");
  if(msg)msg.innerHTML="Easy mode selected. Medium and Hard unlock with premium.";
}
var _v31SetThoughtDifficulty=typeof setThoughtDifficulty==="function"?setThoughtDifficulty:null;
setThoughtDifficulty=function(level){
  if(level==="medium"||level==="hard"){const m=document.getElementById("thoughtDifficultyMessage");if(m)m.innerHTML=`<strong>${level.charAt(0).toUpperCase()+level.slice(1)} is a Premium level.</strong><br>Free users can play Easy mode.`;return;}
  if(_v31SetThoughtDifficulty)_v31SetThoughtDifficulty("easy");
};

var _v31ResetCalmFocusGame=resetCalmFocusGame;resetCalmFocusGame=function(){_v31ResetCalmFocusGame();const o=document.getElementById("mindWanderOverlay");if(o)o.classList.add("hidden");};
var _v31StartCalmFocusRound=startCalmFocusRound;startCalmFocusRound=function(){const o=document.getElementById("mindWanderOverlay");if(o)o.classList.add("hidden");_v31StartCalmFocusRound();};

function setupAnchorTapMovement(){
  const sea=document.getElementById("anchorSea");if(!sea||sea.dataset.anchorTapReady==="true")return;sea.dataset.anchorTapReady="true";
  sea.addEventListener("click",e=>{if(!anchorRunning)return;const r=sea.getBoundingClientRect();anchorPosition=Math.max(8,Math.min(92,((e.clientX-r.left)/r.width)*100));const d=Math.abs(anchorPosition-50);if(d<=18){anchorStability=Math.min(100,anchorStability+3);anchorScore+=8;setAnchorPrompt("Nice. You moved back toward your calm zone.");}updateAnchorPlayer();updateAnchorStats();checkAnchorEnd();});
}
var _v31OpenAnchorGame=openAnchorGame;openAnchorGame=function(){_v31OpenAnchorGame();setTimeout(setupAnchorTapMovement,150);};
var _v31AnchorMove=anchorMove;anchorMove=function(direction){
  if(!anchorRunning){setAnchorMessage("Tap Start first.");return;}
  if(direction==="left")anchorPosition=Math.max(8,anchorPosition-5);
  else if(direction==="right")anchorPosition=Math.min(92,anchorPosition+5);
  else return _v31AnchorMove(direction);
  updateAnchorPlayer();updateAnchorStats();checkAnchorEnd();
};

/* v32 Thought Sort actual game */
var thoughtDifficulty = "easy";
var thoughtSortRunning = false;
var thoughtSortIndex = 0;
var thoughtSortScore = 0;
var thoughtSortCombo = 1;
var thoughtSortCurrentBank = [];
var thoughtSortAnswered = false;

var thoughtSortGameBanks = {
  easy: [
    {text:"I have a presentation tomorrow.",bucket:"helpful",explanation:"This is a neutral fact. It can help you prepare."},
    {text:"Everyone will think I sound stupid.",bucket:"unhelpful",explanation:"This is mind-reading and assumes you know what others will think."},
    {text:"I might feel nervous, but I can still speak.",bucket:"helpful",explanation:"This thought is realistic and supportive."},
    {text:"What if I mess up one sentence?",bucket:"uncertain",explanation:"It is possible, but not guaranteed. This belongs in uncertainty."},
    {text:"My heart is beating fast right now.",bucket:"helpful",explanation:"This is an observation. Noticing facts can ground you."},
    {text:"If I feel anxious, something must be wrong.",bucket:"unhelpful",explanation:"Anxiety is uncomfortable, but it is not proof of danger."},
    {text:"They did not text back yet.",bucket:"helpful",explanation:"This is a fact without adding a scary meaning."},
    {text:"They must be upset with me.",bucket:"unhelpful",explanation:"That assumes a reason without evidence."},
    {text:"I do not know how tomorrow will go.",bucket:"uncertain",explanation:"This honestly names uncertainty without catastrophizing."},
    {text:"I handled hard things before.",bucket:"helpful",explanation:"This uses past evidence to support confidence."},
    {text:"One mistake means I failed completely.",bucket:"unhelpful",explanation:"This is all-or-nothing thinking."},
    {text:"I can take one steady step.",bucket:"helpful",explanation:"This moves you toward action."},
    {text:"This feeling may pass.",bucket:"helpful",explanation:"This is balanced and calming."},
    {text:"What if people judge me?",bucket:"uncertain",explanation:"It is a possibility your mind is raising, not a known fact."},
    {text:"I am having an anxious thought.",bucket:"helpful",explanation:"This creates distance from the thought."},
    {text:"I cannot do anything right.",bucket:"unhelpful",explanation:"This is an overgeneralization."},
    {text:"I need to solve everything tonight.",bucket:"unhelpful",explanation:"This adds pressure and urgency that may not be required."},
    {text:"I can come back to this tomorrow.",bucket:"helpful",explanation:"This supports rest and perspective."},
    {text:"Something bad could happen.",bucket:"uncertain",explanation:"Could happen is not the same as will happen."},
    {text:"I completed one task today.",bucket:"helpful",explanation:"This is evidence of progress."}
  ],
  medium: [
    {text:"My boss seemed distracted, so I may need more information before assuming anything.",bucket:"helpful",explanation:"This avoids jumping to conclusions."},
    {text:"My boss seemed distracted, so he must be disappointed in me.",bucket:"unhelpful",explanation:"This reads another person's mind."},
    {text:"If I rest, I might fall behind.",bucket:"uncertain",explanation:"It is a concern, but not a proven outcome."},
    {text:"Rest can help me think more clearly tomorrow.",bucket:"helpful",explanation:"This is balanced and recovery-oriented."},
    {text:"If I do not get this perfect, my reputation is ruined.",bucket:"unhelpful",explanation:"This is catastrophizing."}
  ],
  hard: [
    {text:"I noticed anxiety before the opportunity, which may mean this matters to me rather than that I should avoid it.",bucket:"helpful",explanation:"This reframes anxiety as importance, not danger."},
    {text:"Because I failed once before, failure is the most likely outcome now.",bucket:"unhelpful",explanation:"Past failure does not guarantee future failure."},
    {text:"I cannot know exactly how they interpreted my tone.",bucket:"uncertain",explanation:"This accepts uncertainty without inventing a conclusion."},
    {text:"I can act while confidence is still catching up.",bucket:"helpful",explanation:"This encourages values-based action."},
    {text:"If I need reassurance, that proves I cannot handle this.",bucket:"unhelpful",explanation:"Need for reassurance does not prove inability."}
  ]
};

function setThoughtDifficulty(level){
  if(level === "medium" || level === "hard"){
    const msg = document.getElementById("thoughtDifficultyMessage");
    if(msg) msg.innerHTML = `<strong>${level.charAt(0).toUpperCase()+level.slice(1)} is a Premium level.</strong><br>Upgrade to unlock more advanced Thought Sort cards.`;
    return;
  }

  thoughtDifficulty = "easy";
  document.querySelectorAll("#thoughtSortGameScreen .difficulty-btn").forEach(btn => btn.classList.remove("active-difficulty"));
  const easyBtn = document.getElementById("thoughtEasyBtn");
  if(easyBtn) easyBtn.classList.add("active-difficulty");

  const msg = document.getElementById("thoughtDifficultyMessage");
  if(msg) msg.innerHTML = "Easy mode selected. Medium and Hard unlock with premium.";
  resetThoughtSortGame();
}

function openThoughtSortGame(){
  showScreen("thoughtSortGameScreen");
  setTimeout(resetThoughtSortGame, 100);
}

function startThoughtSortGame(){
  thoughtSortRunning = true;
  thoughtSortIndex = 0;
  thoughtSortScore = 0;
  thoughtSortCombo = 1;
  thoughtSortAnswered = false;
  thoughtSortCurrentBank = [...(thoughtSortGameBanks[thoughtDifficulty] || thoughtSortGameBanks.easy)];

  const result = document.getElementById("thoughtSortResult");
  if(result) result.classList.add("hidden");

  renderThoughtSortCard();
  updateThoughtSortStats();
}

function resetThoughtSortGame(){
  thoughtSortRunning = false;
  thoughtSortIndex = 0;
  thoughtSortScore = 0;
  thoughtSortCombo = 1;
  thoughtSortAnswered = false;
  thoughtSortCurrentBank = [...(thoughtSortGameBanks[thoughtDifficulty] || thoughtSortGameBanks.easy)];

  const card = document.getElementById("thoughtFloatingCard");
  if(card){
    card.classList.remove("correct","incorrect");
    card.textContent = "Press Start to begin.";
  }

  const result = document.getElementById("thoughtSortResult");
  if(result) result.classList.add("hidden");

  updateThoughtSortStats();
}

function renderThoughtSortCard(){
  const card = document.getElementById("thoughtFloatingCard");
  if(!card) return;

  const current = thoughtSortCurrentBank[thoughtSortIndex];
  card.classList.remove("correct","incorrect");
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "thoughtFloatIn .65s cubic-bezier(.22,.61,.36,1) both";
  card.textContent = current ? current.text : "Game complete.";
  thoughtSortAnswered = false;
}

function sortThoughtCard(bucket){
  if(!thoughtSortRunning){
    const result = document.getElementById("thoughtSortResult");
    if(result){
      result.classList.remove("hidden");
      result.innerHTML = "Tap Start Thought Sort first.";
    }
    return;
  }

  if(thoughtSortAnswered) return;
  thoughtSortAnswered = true;

  const current = thoughtSortCurrentBank[thoughtSortIndex];
  const card = document.getElementById("thoughtFloatingCard");
  const result = document.getElementById("thoughtSortResult");
  if(!current || !result) return;

  result.classList.remove("hidden");

  if(bucket === current.bucket){
    thoughtSortScore += 10 * thoughtSortCombo;
    thoughtSortCombo = Math.min(thoughtSortCombo + 1, 5);
    if(card) card.classList.add("correct");
    result.innerHTML = `<strong>Correct.</strong><br>${current.explanation}<br><br>Combo x${thoughtSortCombo}`;
  } else {
    thoughtSortCombo = 1;
    if(card) card.classList.add("incorrect");
    result.innerHTML = `<strong>Good try.</strong><br>This belongs under <strong>${current.bucket}</strong>.<br>${current.explanation}`;
  }

  updateThoughtSortStats();

  setTimeout(() => {
    thoughtSortIndex += 1;

    if(thoughtSortIndex >= thoughtSortCurrentBank.length){
      finishThoughtSortGame();
      return;
    }

    renderThoughtSortCard();
    result.classList.add("hidden");
    updateThoughtSortStats();
  }, 1600);
}

function finishThoughtSortGame(){
  thoughtSortRunning = false;

  const xp = 15;
  mindPoints += xp;
  completedActivities += 1;
  updateXP();

  const card = document.getElementById("thoughtFloatingCard");
  const result = document.getElementById("thoughtSortResult");

  if(card) card.textContent = "Thought Sort complete.";
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Thought Sort complete.</strong><br>Score: ${thoughtSortScore}<br><br>You practiced sorting facts, uncertainty, and anxious assumptions.<br><br>+${xp} XP`;
  }

  try { if(typeof successSound === "function") successSound(); } catch(e){}
}

function updateThoughtSortStats(){
  const score = document.getElementById("thoughtGameScore");
  const combo = document.getElementById("thoughtGameCombo");
  const progress = document.getElementById("thoughtGameProgress");

  const bank = thoughtSortCurrentBank.length ? thoughtSortCurrentBank : (thoughtSortGameBanks[thoughtDifficulty] || thoughtSortGameBanks.easy);

  if(score) score.textContent = thoughtSortScore;
  if(combo) combo.textContent = "x" + thoughtSortCombo;
  if(progress) progress.textContent = `${Math.min(thoughtSortIndex, bank.length)}/${bank.length}`;
}

/* v35 final navigation fallback */
if (typeof window.showScreen !== "function") {
  window.showScreen = function(screenId){
    document.querySelectorAll(".screen").forEach(function(screen){
      screen.classList.remove("active");
      screen.style.display = "none";
    });
    var target = document.getElementById(screenId);
    if(target){
      target.classList.add("active");
      target.style.display = "block";
      window.scrollTo({top:0, behavior:"smooth"});
    }
  };
}

/* v37 Grounding actual game */
var groundingGameRunning = false;
var groundingGameScore = 0;
var groundingGameCombo = 1;
var groundingGameStepIndex = 0;
var groundingGameMisses = 0;

var groundingSenseOrder = [
  { key:"see", label:"See", icon:"👀", instruction:"Find something you can SEE." },
  { key:"feel", label:"Feel", icon:"🤲", instruction:"Find something you can FEEL." },
  { key:"hear", label:"Hear", icon:"👂", instruction:"Find something you can HEAR." },
  { key:"smell", label:"Smell", icon:"🌸", instruction:"Find something you can SMELL." },
  { key:"taste", label:"Taste", icon:"🍋", instruction:"Find something you can TASTE." }
];

var groundingObjects = {
  see: [
    {emoji:"🪟", text:"Window"}, {emoji:"💡", text:"Light"}, {emoji:"📘", text:"Book"},
    {emoji:"🌿", text:"Plant"}, {emoji:"🪑", text:"Chair"}
  ],
  feel: [
    {emoji:"🧥", text:"Sleeve"}, {emoji:"🪵", text:"Table"}, {emoji:"🧊", text:"Cool Air"},
    {emoji:"👟", text:"Floor"}, {emoji:"🛏️", text:"Blanket"}
  ],
  hear: [
    {emoji:"🌀", text:"Fan"}, {emoji:"🚗", text:"Traffic"}, {emoji:"🐦", text:"Birds"},
    {emoji:"⌚", text:"Clock"}, {emoji:"🌧️", text:"Rain"}
  ],
  smell: [
    {emoji:"☕", text:"Coffee"}, {emoji:"🧼", text:"Soap"}, {emoji:"🌸", text:"Flower"},
    {emoji:"🍃", text:"Fresh Air"}, {emoji:"🕯️", text:"Candle"}
  ],
  taste: [
    {emoji:"🍋", text:"Lemon"}, {emoji:"💧", text:"Water"}, {emoji:"🍬", text:"Mint"},
    {emoji:"🍎", text:"Apple"}, {emoji:"🫖", text:"Tea"}
  ]
};

var groundingWorryTexts = [
  "What if?", "Not safe", "Hurry", "Overthink", "Worst case", "Pressure"
];

function openGroundingGame(){
  showScreen("groundingGameScreen");
  setTimeout(resetGroundingGame, 100);
}

function startGroundingGameRound(){
  groundingGameRunning = true;
  groundingGameScore = 0;
  groundingGameCombo = 1;
  groundingGameStepIndex = 0;
  groundingGameMisses = 0;

  var result = document.getElementById("groundingResult");
  if(result) result.classList.add("hidden");

  clearGroundingPlayArea();
  updateGroundingGameStats();
  updateGroundingSenseProgress();
  renderGroundingRound();
}

function resetGroundingGame(){
  groundingGameRunning = false;
  groundingGameScore = 0;
  groundingGameCombo = 1;
  groundingGameStepIndex = 0;
  groundingGameMisses = 0;

  clearGroundingPlayArea();
  setGroundingInstruction("Press Start to begin.");
  updateGroundingGameStats();
  updateGroundingSenseProgress();

  var result = document.getElementById("groundingResult");
  if(result) result.classList.add("hidden");
}

function clearGroundingPlayArea(){
  var area = document.getElementById("groundingPlayArea");
  if(!area) return;
  area.querySelectorAll(".sensory-object,.worry-cloud").forEach(function(el){ el.remove(); });
}

function renderGroundingRound(){
  if(!groundingGameRunning) return;

  var current = groundingSenseOrder[groundingGameStepIndex];
  if(!current){
    finishGroundingGame();
    return;
  }

  clearGroundingPlayArea();
  setGroundingInstruction(current.icon + " " + current.instruction);

  var senses = ["see","feel","hear","smell","taste"];
  var targetObjects = groundingObjects[current.key] || [];
  var target = targetObjects[Math.floor(Math.random() * targetObjects.length)];

  createGroundingObject(target, current.key, true);

  // Add distractor sensory objects
  senses.filter(function(s){ return s !== current.key; }).slice(0, 3).forEach(function(sense){
    var pool = groundingObjects[sense] || [];
    var obj = pool[Math.floor(Math.random() * pool.length)];
    createGroundingObject(obj, sense, false);
  });

  // Add worry clouds
  var cloudCount = 2;
  for(var i=0; i<cloudCount; i++) createWorryCloud();
}

function createGroundingObject(obj, sense, isTarget){
  var area = document.getElementById("groundingPlayArea");
  if(!area || !obj) return;

  var btn = document.createElement("button");
  btn.className = "sensory-object";
  btn.innerHTML = '<span class="sense-emoji">' + obj.emoji + '</span><span>' + obj.text + '</span>';
  btn.dataset.sense = sense;
  btn.dataset.target = isTarget ? "true" : "false";
  btn.onclick = function(event){
    event.stopPropagation();
    handleGroundingObjectTap(btn);
  };

  placeGroundingElement(btn);
  area.appendChild(btn);
}

function createWorryCloud(){
  var area = document.getElementById("groundingPlayArea");
  if(!area) return;

  var cloud = document.createElement("button");
  cloud.className = "worry-cloud";
  cloud.textContent = groundingWorryTexts[Math.floor(Math.random() * groundingWorryTexts.length)];
  cloud.onclick = function(event){
    event.stopPropagation();
    groundingGameMisses += 1;
    groundingGameCombo = 1;
    groundingGameScore = Math.max(0, groundingGameScore - 5);
    updateGroundingGameStats();
    setGroundingFeedback("That was a worry cloud. Notice it, then come back to the present.");
    cloud.remove();
  };

  placeGroundingElement(cloud);
  area.appendChild(cloud);
}

function placeGroundingElement(el){
  var area = document.getElementById("groundingPlayArea");
  if(!area) return;

  var maxX = Math.max(area.clientWidth - 110, 30);
  var maxY = Math.max(area.clientHeight - 150, 80);
  el.style.left = (20 + Math.random() * maxX) + "px";
  el.style.top = (70 + Math.random() * maxY) + "px";
  el.style.animationDelay = (Math.random() * 1.6) + "s";
}

function handleGroundingObjectTap(btn){
  if(!groundingGameRunning) return;

  if(btn.dataset.target === "true"){
    groundingGameScore += 10 * groundingGameCombo;
    groundingGameCombo = Math.min(groundingGameCombo + 1, 5);
    btn.classList.add("correct-pop");
    setGroundingFeedback("Good. You anchored your attention to the present.");
    setTimeout(function(){
      groundingGameStepIndex += 1;
      updateGroundingGameStats();
      updateGroundingSenseProgress();
      renderGroundingRound();
    }, 650);
  } else {
    groundingGameCombo = 1;
    groundingGameScore = Math.max(0, groundingGameScore - 3);
    setGroundingFeedback("Close. Look for the sense the game asked for.");
    updateGroundingGameStats();
  }
}

function setGroundingInstruction(text){
  var instruction = document.getElementById("groundingInstruction");
  if(instruction) instruction.textContent = text;
}

function setGroundingFeedback(text){
  var result = document.getElementById("groundingResult");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = text;
  }
}

function updateGroundingGameStats(){
  var score = document.getElementById("groundingGameScore");
  var combo = document.getElementById("groundingGameCombo");
  var step = document.getElementById("groundingGameStep");
  var current = groundingSenseOrder[groundingGameStepIndex];

  if(score) score.textContent = groundingGameScore;
  if(combo) combo.textContent = "x" + groundingGameCombo;
  if(step) step.textContent = current ? current.label : "Done";
}

function updateGroundingSenseProgress(){
  var ids = ["senseSee","senseFeel","senseHear","senseSmell","senseTaste"];
  ids.forEach(function(id, index){
    var el = document.getElementById(id);
    if(!el) return;
    if(index < groundingGameStepIndex) el.classList.add("sense-complete");
    else el.classList.remove("sense-complete");
  });
}

function finishGroundingGame(){
  groundingGameRunning = false;
  clearGroundingPlayArea();
  setGroundingInstruction("Grounding complete.");

  var xp = 10;
  mindPoints += xp;
  completedActivities += 1;
  updateXP();

  var result = document.getElementById("groundingResult");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = "<strong>Grounding complete.</strong><br>You practiced returning to the present through your senses.<br><br>Score: " + groundingGameScore + "<br>+10 XP";
  }

  try { if(typeof successSound === "function") successSound(); } catch(e){}
}

/* v38 Today's personalized plan flow */
var todayPlanStep=0;
var todayPlanAction="";
var todayPlanSteps=[
  {name:"60-Second Breathing Reset",type:"breathing"},
  {name:"Quick Grounding Exercise",type:"message",message:"Name 3 things you can see, 2 things you can hear, and 1 thing you can feel.<small>This brings your attention back to the present moment.</small>"},
  {name:"Daily Mind Shift",type:"message",message:"What evidence do you have that today’s challenge is harder than something you have handled before?<small>You do not need to answer perfectly. Just notice the thought.</small>"},
  {name:"One Action Step",type:"choice"},
  {name:"Reset Complete",type:"complete"}
];

function startTodayPlan(){
  todayPlanStep=0;
  todayPlanAction="";
  showScreen("todayPlan");
  renderTodayPlanStep();
}

function renderTodayPlanStep(){
  var step=todayPlanSteps[todayPlanStep];
  var label=document.getElementById("todayPlanStepLabel");
  var name=document.getElementById("todayPlanStepName");
  var fill=document.getElementById("todayPlanProgressFill");
  var content=document.getElementById("todayPlanContent");
  var breathing=document.getElementById("todayPlanBreathingArea");
  var choices=document.getElementById("todayPlanChoices");
  var next=document.getElementById("todayPlanNextBtn");

  if(label)label.textContent="Step "+(todayPlanStep+1)+" of "+todayPlanSteps.length;
  if(name)name.textContent=step.name;
  if(fill)fill.style.width=(((todayPlanStep+1)/todayPlanSteps.length)*100)+"%";

  if(content){content.style.animation="none";void content.offsetWidth;content.style.animation="todayPlanFade .55s cubic-bezier(.22,.61,.36,1) both";}
  if(breathing)breathing.classList.add("hidden");
  if(choices){choices.classList.add("hidden");choices.innerHTML="";}

  if(step.type==="breathing"){
    if(content)content.innerHTML="Let’s slow things down together.<small>Tap the breathing bubble below and follow the rhythm for 60 seconds.</small>";
    if(breathing)breathing.classList.remove("hidden");
    if(next)next.textContent="Next";
  } else if(step.type==="message"){
    if(content)content.innerHTML=step.message;
    if(next)next.textContent="Next";
  } else if(step.type==="choice"){
    if(content)content.innerHTML="Choose one small steady action for today.<small>Small actions build momentum.</small>";
    if(choices){
      choices.classList.remove("hidden");
      ["Take a 5-minute walk","Drink water","Complete one task","Text a friend","Write one worry down"].forEach(function(action){
        var btn=document.createElement("button");
        btn.textContent=action;
        btn.onclick=function(){
          todayPlanAction=action;
          document.querySelectorAll("#todayPlanChoices button").forEach(function(b){b.classList.remove("selected");});
          btn.classList.add("selected");
        };
        choices.appendChild(btn);
      });
    }
    if(next)next.textContent="Complete Reset";
  } else if(step.type==="complete"){
    var actionText=todayPlanAction||"Take one steady step";
    if(content)content.innerHTML="🌿 Today’s Reset Complete<br><small>+15 XP • Streak maintained<br><br>Your action step: "+actionText+"<br><br>Progress is learning to move forward even when anxiety is present.</small>";
    if(next)next.textContent="Return to Dashboard";
  }
}

function nextTodayPlanStep(){
  if(todayPlanSteps[todayPlanStep]&&todayPlanSteps[todayPlanStep].type==="choice"&&!todayPlanAction){
    var content=document.getElementById("todayPlanContent");
    if(content)content.innerHTML="Choose one small steady action first.<small>It can be very simple.</small>";
    return;
  }
  if(todayPlanSteps[todayPlanStep]&&todayPlanSteps[todayPlanStep].type==="complete"){
    showScreen("dashboard");
    return;
  }
  todayPlanStep++;
  if(todayPlanStep===todayPlanSteps.length-1){
    mindPoints+=15;
    completedActivities+=1;
    updateXP();
    try{if(typeof successSound==="function")successSound();}catch(e){}
  }
  renderTodayPlanStep();
}

/* v39 Today's Plan repair: button opens flow; XP only at completion */
var todayPlanStep = 0;
var todayPlanAction = "";
var todayPlanAwarded = false;
var todayPlanSteps = [
  {name:"60-Second Breathing Reset",type:"breathing"},
  {name:"Quick Grounding Exercise",type:"message",message:"Name 3 things you can see, 2 things you can hear, and 1 thing you can feel.<small>This brings your attention back to the present moment.</small>"},
  {name:"Daily Mind Shift",type:"message",message:"What evidence do you have that today’s challenge is harder than something you have handled before?<small>You do not need to answer perfectly. Just notice the thought.</small>"},
  {name:"One Action Step",type:"choice"},
  {name:"Reset Complete",type:"complete"}
];

function startTodayPlan(){
  todayPlanStep = 0;
  todayPlanAction = "";
  todayPlanAwarded = false;
  showScreen("todayPlan");
  renderTodayPlanStep();
}

function renderTodayPlanStep(){
  var step = todayPlanSteps[todayPlanStep];
  var label = document.getElementById("todayPlanStepLabel");
  var name = document.getElementById("todayPlanStepName");
  var fill = document.getElementById("todayPlanProgressFill");
  var content = document.getElementById("todayPlanContent");
  var breathing = document.getElementById("todayPlanBreathingArea");
  var choices = document.getElementById("todayPlanChoices");
  var next = document.getElementById("todayPlanNextBtn");

  if(!step) return;

  if(label) label.textContent = "Step " + (todayPlanStep + 1) + " of " + todayPlanSteps.length;
  if(name) name.textContent = step.name;
  if(fill) fill.style.width = (((todayPlanStep + 1) / todayPlanSteps.length) * 100) + "%";

  if(content){
    content.style.animation = "none";
    void content.offsetWidth;
    content.style.animation = "todayPlanFade .55s cubic-bezier(.22,.61,.36,1) both";
  }

  if(breathing) breathing.classList.add("hidden");
  if(choices){ choices.classList.add("hidden"); choices.innerHTML = ""; }

  if(step.type === "breathing"){
    if(content) content.innerHTML = "Let’s slow things down together.<small>Tap the breathing bubble below and follow the rhythm for 60 seconds.</small>";
    if(breathing) breathing.classList.remove("hidden");
    if(next) next.textContent = "Next";
  } else if(step.type === "message"){
    if(content) content.innerHTML = step.message;
    if(next) next.textContent = "Next";
  } else if(step.type === "choice"){
    if(content) content.innerHTML = "Choose one small steady action for today.<small>Small actions build momentum.</small>";
    if(choices){
      choices.classList.remove("hidden");
      ["Take a 5-minute walk","Drink water","Complete one task","Text a friend","Write one worry down"].forEach(function(action){
        var btn = document.createElement("button");
        btn.textContent = action;
        btn.onclick = function(){
          todayPlanAction = action;
          document.querySelectorAll("#todayPlanChoices button").forEach(function(b){ b.classList.remove("selected"); });
          btn.classList.add("selected");
        };
        choices.appendChild(btn);
      });
    }
    if(next) next.textContent = "Complete Reset";
  } else if(step.type === "complete"){
    var actionText = todayPlanAction || "Take one steady step";
    if(!todayPlanAwarded){
      mindPoints += 15;
      completedActivities += 1;
      todayPlanAwarded = true;
      updateXP();
      try{ if(typeof successSound === "function") successSound(); }catch(e){}
    }
    if(content) content.innerHTML = "🌿 Today’s Reset Complete<br><small>+15 XP • Streak maintained<br><br>Your action step: " + actionText + "<br><br>Progress is learning to move forward even when anxiety is present.</small>";
    if(next) next.textContent = "Return to Dashboard";
  }
}

function nextTodayPlanStep(){
  var step = todayPlanSteps[todayPlanStep];

  if(step && step.type === "choice" && !todayPlanAction){
    var content = document.getElementById("todayPlanContent");
    if(content) content.innerHTML = "Choose one small steady action first.<small>It can be very simple.</small>";
    return;
  }

  if(step && step.type === "complete"){
    showScreen("dashboard");
    return;
  }

  todayPlanStep += 1;
  renderTodayPlanStep();
}

document.addEventListener("DOMContentLoaded", function(){
  document.querySelectorAll("button").forEach(function(btn){
    var text = (btn.textContent || "").trim();
    if(text === "Continue Today’s Plan →" || text === "Continue Today's Plan →" || text === "Start Now →" || text === "Start Now"){
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        startTodayPlan();
      };
    }
  });
});

/* v40 Local Storage System */
var STEADIERPATH_STORAGE_KEY = "steadierPath.v1.data";
var steadierPathLoadedFromStorage = false;
var steadierPathJournalEntries = [];
var steadierPathMoodHistory = [];
var steadierPathGameProgress = {};
var steadierPathAchievements = [];
var steadierPathCompletedDates = [];

function getSteadierPathSnapshot(){
  var plan = null;
  try { plan = typeof savedSteadyPlan !== "undefined" ? savedSteadyPlan : null; } catch(e){}

  return {
    version: 1,
    savedAt: new Date().toISOString(),

    xp: typeof mindPoints !== "undefined" ? mindPoints : 0,
    completedActivities: typeof completedActivities !== "undefined" ? completedActivities : 0,

    plan: plan,
    selectedOptions: {
      mindType: typeof selectedMindType !== "undefined" ? selectedMindType : null,
      userGoal: typeof selectedGoal !== "undefined" ? selectedGoal : null,
      timeCommitment: typeof selectedTime !== "undefined" ? selectedTime : null,
      challenge: typeof selectedChallenge !== "undefined" ? selectedChallenge : null
    },

    journalEntries: steadierPathJournalEntries,
    moodHistory: steadierPathMoodHistory,
    gameProgress: steadierPathGameProgress,
    achievements: steadierPathAchievements,
    completedDates: steadierPathCompletedDates,

    games: {
      centeredLevel: typeof centeredLevel !== "undefined" ? centeredLevel : 1,
      colorBalanceLevel: typeof colorBalanceLevel !== "undefined" ? colorBalanceLevel : 1,
      anchorLevel: typeof anchorLevel !== "undefined" ? anchorLevel : 1,
      thoughtDifficulty: typeof thoughtDifficulty !== "undefined" ? thoughtDifficulty : "easy"
    }
  };
}

function saveSteadierPathData(){
  try {
    var snapshot = getSteadierPathSnapshot();
    localStorage.setItem(STEADIERPATH_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch(err) {
    console.warn("SteadierPath save failed:", err);
    return false;
  }
}

function loadSteadierPathData(){
  try {
    var raw = localStorage.getItem(STEADIERPATH_STORAGE_KEY);
    if(!raw) return false;

    var data = JSON.parse(raw);
    steadierPathLoadedFromStorage = true;

    if(typeof mindPoints !== "undefined") mindPoints = Number(data.xp || 0);
    if(typeof completedActivities !== "undefined") completedActivities = Number(data.completedActivities || 0);

    if(data.plan && typeof savedSteadyPlan !== "undefined") savedSteadyPlan = data.plan;

    if(data.selectedOptions){
      try { if(typeof selectedMindType !== "undefined") selectedMindType = data.selectedOptions.mindType; } catch(e){}
      try { if(typeof selectedGoal !== "undefined") selectedGoal = data.selectedOptions.userGoal; } catch(e){}
      try { if(typeof selectedTime !== "undefined") selectedTime = data.selectedOptions.timeCommitment; } catch(e){}
      try { if(typeof selectedChallenge !== "undefined") selectedChallenge = data.selectedOptions.challenge; } catch(e){}
    }

    steadierPathJournalEntries = Array.isArray(data.journalEntries) ? data.journalEntries : [];
    steadierPathMoodHistory = Array.isArray(data.moodHistory) ? data.moodHistory : [];
    steadierPathGameProgress = data.gameProgress || {};
    steadierPathAchievements = Array.isArray(data.achievements) ? data.achievements : [];
    steadierPathCompletedDates = Array.isArray(data.completedDates) ? data.completedDates : [];

    if(data.games){
      try { if(typeof centeredLevel !== "undefined") centeredLevel = Number(data.games.centeredLevel || 1); } catch(e){}
      try { if(typeof colorBalanceLevel !== "undefined") colorBalanceLevel = Number(data.games.colorBalanceLevel || 1); } catch(e){}
      try { if(typeof anchorLevel !== "undefined") anchorLevel = Number(data.games.anchorLevel || 1); } catch(e){}
      try { if(typeof thoughtDifficulty !== "undefined") thoughtDifficulty = data.games.thoughtDifficulty || "easy"; } catch(e){}
    }

    refreshSteadierPathSavedUI();
    return true;
  } catch(err) {
    console.warn("SteadierPath load failed:", err);
    return false;
  }
}

function refreshSteadierPathSavedUI(){
  try { if(typeof updateXP === "function") updateXP(); } catch(e){}
  try { if(typeof updatePlanStatus === "function") updatePlanStatus(); } catch(e){}
  try { if(typeof renderRewardsPage === "function") renderRewardsPage(); } catch(e){}
  try { renderSavedJournalEntries(); } catch(e){}
  try { renderSavedMoodHistory(); } catch(e){}
}

function renderSavedJournalEntries(){
  var targets = [
    document.getElementById("journalHistory"),
    document.getElementById("savedJournalEntries"),
    document.getElementById("journalEntries")
  ].filter(Boolean);

  if(!targets.length) return;

  var html = steadierPathJournalEntries.length
    ? steadierPathJournalEntries.slice().reverse().map(function(entry){
        return '<div class="saved-entry"><strong>' + escapeSteadierPathHTML(entry.date || "") + '</strong><p>' + escapeSteadierPathHTML(entry.text || entry.summary || "") + '</p></div>';
      }).join("")
    : "<p>No saved journal entries yet.</p>";

  targets.forEach(function(t){ t.innerHTML = html; });
}

function renderSavedMoodHistory(){
  var targets = [
    document.getElementById("moodHistory"),
    document.getElementById("savedMoodHistory"),
    document.getElementById("moodEntries")
  ].filter(Boolean);

  if(!targets.length) return;

  var html = steadierPathMoodHistory.length
    ? steadierPathMoodHistory.slice().reverse().map(function(entry){
        return '<div class="saved-entry"><strong>' + escapeSteadierPathHTML(entry.date || "") + '</strong><p>Mood: ' + escapeSteadierPathHTML(String(entry.mood || entry.value || "")) + '</p></div>';
      }).join("")
    : "<p>No saved moods yet.</p>";

  targets.forEach(function(t){ t.innerHTML = html; });
}

function escapeSteadierPathHTML(value){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function recordSteadierPathJournalEntry(entry){
  var finalEntry = entry || {};
  finalEntry.date = finalEntry.date || new Date().toLocaleString();
  steadierPathJournalEntries.push(finalEntry);
  saveSteadierPathData();
  renderSavedJournalEntries();
}

function recordSteadierPathMoodEntry(entry){
  var finalEntry = entry || {};
  finalEntry.date = finalEntry.date || new Date().toLocaleString();
  steadierPathMoodHistory.push(finalEntry);
  saveSteadierPathData();
  renderSavedMoodHistory();
}

function updateSteadierPathGameProgress(game, data){
  steadierPathGameProgress[game] = Object.assign(steadierPathGameProgress[game] || {}, data || {}, {
    updatedAt: new Date().toISOString()
  });
  saveSteadierPathData();
}

function exportSteadierPathData(){
  var data = JSON.stringify(getSteadierPathSnapshot(), null, 2);
  var blob = new Blob([data], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "steadymind-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function clearSteadierPathData(){
  if(confirm("Clear saved SteadierPath data on this device?")){
    localStorage.removeItem(STEADIERPATH_STORAGE_KEY);
    location.reload();
  }
}

/* Save wrappers */
(function(){
  var originalUpdateXP = typeof updateXP === "function" ? updateXP : null;
  updateXP = function(){
    if(originalUpdateXP) originalUpdateXP();
    saveSteadierPathData();
  };

  var originalBuildPlan = typeof buildMyPlan === "function" ? buildMyPlan : null;
  if(originalBuildPlan){
    buildMyPlan = function(){
      var result = originalBuildPlan.apply(this, arguments);
      saveSteadierPathData();
      return result;
    };
  }

  var originalCompleteActivity = typeof completeActivity === "function" ? completeActivity : null;
  if(originalCompleteActivity){
    completeActivity = function(){
      var result = originalCompleteActivity.apply(this, arguments);
      saveSteadierPathData();
      return result;
    };
  }

  var originalSaveJournal = typeof saveJournal === "function" ? saveJournal : null;
  if(originalSaveJournal){
    saveJournal = function(){
      var result = originalSaveJournal.apply(this, arguments);
      captureJournalFromPage();
      return result;
    };
  }

  var originalSaveMood = typeof saveMood === "function" ? saveMood : null;
  if(originalSaveMood){
    saveMood = function(){
      var result = originalSaveMood.apply(this, arguments);
      captureMoodFromPage();
      return result;
    };
  }
})();

function captureJournalFromPage(){
  var fields = Array.from(document.querySelectorAll("#journal textarea, #journal input"))
    .map(function(el){ return el.value; })
    .filter(function(v){ return v && v.trim(); });

  if(fields.length){
    recordSteadierPathJournalEntry({text: fields.join(" | ")});
  } else {
    saveSteadierPathData();
  }
}

function captureMoodFromPage(){
  var checked = document.querySelector("#moodTracker input:checked");
  var moodValue = checked ? checked.value : "";
  var selectedBtn = document.querySelector("#moodTracker .selected, #moodTracker .active");
  if(!moodValue && selectedBtn) moodValue = selectedBtn.textContent.trim();

  var noteField = document.querySelector("#moodTracker textarea, #moodTracker input[type='text']");
  var note = noteField ? noteField.value : "";

  if(moodValue || note){
    recordSteadierPathMoodEntry({mood:moodValue || "Entry", note:note});
  } else {
    saveSteadierPathData();
  }
}

document.addEventListener("DOMContentLoaded", function(){
  loadSteadierPathData();

  document.addEventListener("change", function(event){
    if(event.target && event.target.closest("#journal, #moodTracker, #assessment, #settings")){
      saveSteadierPathData();
    }
  });

  document.addEventListener("click", function(event){
    var btn = event.target && event.target.closest ? event.target.closest("button") : null;
    if(!btn) return;
    var text = (btn.textContent || "").toLowerCase();

    setTimeout(function(){
      if(text.includes("complete") || text.includes("save") || text.includes("finish") || text.includes("build") || text.includes("start")){
        saveSteadierPathData();
      }
    }, 200);
  });

  window.addEventListener("beforeunload", saveSteadierPathData);
});




/* v44 Clean Build Plan / Continue Plan Logic */
(function(){
  function smPlanExists(){
    try{
      var raw = localStorage.getItem("steadierPath.v1.data");
      if(raw){
        var data = JSON.parse(raw);
        if(data && data.plan) return true;
      }
      if(typeof savedSteadyPlan !== "undefined" && savedSteadyPlan) return true;
    }catch(e){}
    return false;
  }

  function findRecommendedCard(){
    var cards = Array.from(document.querySelectorAll(".primary-home-card, .dashboard-card, .premium-card, .card, section div"));
    return cards.find(function(card){
      var txt = (card.textContent || "").toLowerCase();
      return txt.includes("recommended next step") &&
             (txt.includes("continue my plan") || txt.includes("build your personalized path") || txt.includes("build plan"));
    });
  }

  function setCardText(card, built){
    if(!card) return;

    // Heading: find the biggest heading inside the recommended card.
    var headings = Array.from(card.querySelectorAll("h1,h2,h3,strong"));
    var planHeading = headings.find(function(el){
      var t = (el.textContent || "").toLowerCase();
      return t.includes("continue my") || t.includes("build plan") || t.includes("build my plan");
    });

    if(planHeading){
      planHeading.innerHTML = built ? "Continue My<br>Plan" : "Build Plan";
    }

    // Subheading/description text
    var all = Array.from(card.querySelectorAll("p,div,span,strong"));
    all.forEach(function(el){
      var t = (el.textContent || "").trim();

      if(t === "Build your personalized path" || t === "Return to your personalized path"){
        el.textContent = built ? "Return to your personalized path" : "Build your personalized path";
      }

      if(t.includes("Answer a few questions so SteadierPath") || t.includes("Your SteadierPath profile is ready")){
        el.textContent = built
          ? "Your SteadierPath profile is ready. Continue your daily calm, focus, and confidence plan."
          : "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";
      }
    });

    // Button: choose the largest/last button inside the card.
    var buttons = Array.from(card.querySelectorAll("button"));
    var btn = buttons.find(function(b){
      var t = (b.textContent || "").toLowerCase();
      return t.includes("continue") || t.includes("build") || t.includes("start");
    }) || buttons[buttons.length - 1];

    if(btn){
      btn.textContent = built ? "Continue My Plan →" : "Build My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        if(smPlanExists()) showScreen("profile");
        else showScreen("assessment");
      };
    }
  }

  window.refreshBuildContinuePlanCard = function(){
    var card = findRecommendedCard();
    setCardText(card, smPlanExists());
  };

  window.handleHomePlanCTA = function(){
    if(smPlanExists()) showScreen("profile");
    else showScreen("assessment");
  };

  function afterPlanBuilt(){
    try{ if(typeof saveSteadierPathData === "function") saveSteadierPathData(); }catch(e){}
    setTimeout(function(){
      refreshBuildContinuePlanCard();
      if(smPlanExists() && document.getElementById("profile")){
        showScreen("profile");
      }
    }, 250);
  }

  var originalBuildMyPlan = typeof buildMyPlan === "function" ? buildMyPlan : null;
  if(originalBuildMyPlan){
    buildMyPlan = function(){
      var result = originalBuildMyPlan.apply(this, arguments);
      afterPlanBuilt();
      return result;
    };
  }

  var originalBuildPlan = typeof buildPlan === "function" ? buildPlan : null;
  if(originalBuildPlan){
    buildPlan = function(){
      var result = originalBuildPlan.apply(this, arguments);
      afterPlanBuilt();
      return result;
    };
  }

  var originalShowScreen = typeof showScreen === "function" ? showScreen : null;
  if(originalShowScreen){
    showScreen = function(screenId){
      originalShowScreen(screenId);
      if(screenId === "dashboard" || screenId === "mainMenu" || screenId === "profile"){
        setTimeout(refreshBuildContinuePlanCard, 100);
      }
    };
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(refreshBuildContinuePlanCard, 300);
    setTimeout(refreshBuildContinuePlanCard, 900);
  });
})();


/* v45 Developer Tools */
function resetSteadierPathData(){
  var confirmed = confirm(
    "Reset all SteadierPath data?\n\nThis will remove:\n• XP\n• Levels\n• Journal Entries\n• Mood History\n• Personalized Plan\n• Game Progress"
  );

  if(!confirmed) return;

  try{
    localStorage.removeItem("steadierPath.v1.data");
    localStorage.clear();

    alert("SteadierPath data cleared. The app will now restart.");

    location.reload();
  }catch(err){
    alert("Unable to clear data: " + err.message);
  }
}

function viewSteadierPathData(){
  try{
    var raw = localStorage.getItem("steadierPath.v1.data");

    if(!raw){
      alert("No SteadierPath data found.");
      return;
    }

    console.log(JSON.parse(raw));

    alert(
      "Saved data has been printed to the browser console.\n\nPress F12 → Console to view."
    );
  }catch(err){
    alert("Unable to read saved data.");
  }
}

/* v46 stronger reset tools */
function resetSteadierPathAppDataHard(){
  var ok = confirm("Reset SteadierPath as a brand-new user on this device?");
  if(!ok) return;
  try{
    var keys = [];
    for(var i=0;i<localStorage.length;i++){
      var k = localStorage.key(i);
      if(k && /steady|steadymind|plan|journal|mood|xp/i.test(k)){ keys.push(k); }
    }
    keys.forEach(function(k){ localStorage.removeItem(k); });
    localStorage.removeItem("steadierPath.v1.data");
    localStorage.removeItem("steadierPathData");
    sessionStorage.clear();
    alert("SteadierPath test data cleared. Reloading now.");
    window.location.href = window.location.origin + window.location.pathname;
  }catch(err){
    alert("Reset failed: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", function(){
  if(window.location.search.includes("dev=true")){
    var btn = document.createElement("button");
    btn.textContent = "Reset Test Data";
    btn.onclick = resetSteadierPathAppDataHard;
    btn.style.position = "fixed";
    btn.style.right = "14px";
    btn.style.bottom = "90px";
    btn.style.zIndex = "99999";
    btn.style.width = "auto";
    btn.style.padding = "12px 16px";
    btn.style.borderRadius = "999px";
    btn.style.boxShadow = "0 10px 25px rgba(0,0,0,.18)";
    document.body.appendChild(btn);
  }
});

/* v46 override Settings reset */
function resetSteadierPathData(){
  resetSteadierPathAppDataHard();
}


/* v47 First-run plan-state fix */
function markSteadierPathPlanBuilt(){
  try { localStorage.setItem("steadierPath.planBuilt", "true"); } catch(e){}
}

function clearSteadierPathPlanBuilt(){
  try { localStorage.removeItem("steadierPath.planBuilt"); } catch(e){}
}

function isSteadierPathPlanBuilt(){
  try {
    return localStorage.getItem("steadierPath.planBuilt") === "true";
  } catch(e){}
  return false;
}

function forceFirstRunHomeState(){
  var status = document.getElementById("planStatus");
  if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';

  var heading = document.getElementById("homePlanHeading");
  if(heading) heading.textContent = "Build My Plan";

  var sub = document.getElementById("homePlanSubheading");
  if(sub) sub.textContent = "Build your personalized path";

  var desc = document.getElementById("homePlanDescription");
  if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";

  var btn = document.getElementById("homePlanCTA");
  if(btn){
    btn.textContent = "Build My Plan →";
    btn.onclick = function(event){
      if(event) event.stopPropagation();
      showScreen("assessment");
    };
  }
}

function forceBuiltPlanHomeState(){
  var status = document.getElementById("planStatus");
  if(status && typeof savedSteadyPlan !== "undefined" && savedSteadyPlan){
    var path = savedSteadyPlan.primaryPath || savedSteadyPlan.path || "Calm Foundations";
    var time = savedSteadyPlan.time || savedSteadyPlan.timeCommitment || "5 minutes";
    status.textContent = "Plan ready: " + path + " · " + time + " per day";
  }

  var heading = document.getElementById("homePlanHeading");
  if(heading) heading.innerHTML = "Continue My<br>Plan";

  var sub = document.getElementById("homePlanSubheading");
  if(sub) sub.textContent = "Return to your personalized path";

  var desc = document.getElementById("homePlanDescription");
  if(desc) desc.textContent = "Your SteadierPath profile is ready. Continue your daily calm, focus, and confidence plan.";

  var btn = document.getElementById("homePlanCTA");
  if(btn){
    btn.textContent = "Continue My Plan →";
    btn.onclick = function(event){
      if(event) event.stopPropagation();
      showScreen("profile");
    };
  }
}

function refreshTruePlanState(){
  if(isSteadierPathPlanBuilt()) forceBuiltPlanHomeState();
  else forceFirstRunHomeState();
}

// Override older plan-exists logic so default JS variables no longer count as a completed plan.
window.steadierPathPlanExists = function(){ return isSteadierPathPlanBuilt(); };
window.hasBuiltPlan = function(){ return isSteadierPathPlanBuilt(); };

var _v47RefreshBuildContinuePlanCard = typeof refreshBuildContinuePlanCard === "function" ? refreshBuildContinuePlanCard : null;
refreshBuildContinuePlanCard = function(){ refreshTruePlanState(); };

var _v47HandleHomePlanCTA = typeof handleHomePlanCTA === "function" ? handleHomePlanCTA : null;
handleHomePlanCTA = function(){
  if(isSteadierPathPlanBuilt()) showScreen("profile");
  else showScreen("assessment");
};

// Mark plan built only when assessment Build button actually runs.
var _v47BuildPlanAndSave = typeof buildPlanAndSave === "function" ? buildPlanAndSave : null;
if(_v47BuildPlanAndSave){
  buildPlanAndSave = function(){
    var result = _v47BuildPlanAndSave.apply(this, arguments);
    markSteadierPathPlanBuilt();
    try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
    setTimeout(function(){
      refreshTruePlanState();
      if(document.getElementById("profile")) showScreen("profile");
      else if(document.getElementById("dashboard")) showScreen("dashboard");
    }, 250);
    return result;
  };
}

var _v47BuildPlan = typeof buildPlan === "function" ? buildPlan : null;
if(_v47BuildPlan){
  buildPlan = function(){
    var result = _v47BuildPlan.apply(this, arguments);
    markSteadierPathPlanBuilt();
    try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
    setTimeout(function(){
      refreshTruePlanState();
      if(document.getElementById("profile")) showScreen("profile");
      else if(document.getElementById("dashboard")) showScreen("dashboard");
    }, 250);
    return result;
  };
}

var _v47ResetHard = typeof resetSteadierPathAppDataHard === "function" ? resetSteadierPathAppDataHard : null;
resetSteadierPathAppDataHard = function(){
  var ok = confirm("Reset SteadierPath as a brand-new user on this device?");
  if(!ok) return;
  try{
    localStorage.clear();
    sessionStorage.clear();
  }catch(e){}
  alert("SteadierPath test data cleared. Reloading now.");
  window.location.href = window.location.origin + window.location.pathname;
};

document.addEventListener("DOMContentLoaded", function(){
  setTimeout(refreshTruePlanState, 100);
  setTimeout(refreshTruePlanState, 800);
  setTimeout(refreshTruePlanState, 1600);
});


/* v48 Authoritative Home Plan CTA Fix */
(function(){
  function getPlanBuiltFlag(){
    try { return localStorage.getItem("steadierPath.planBuilt") === "true"; }
    catch(e){ return false; }
  }

  function isForcedNewUser(){
    try { return localStorage.getItem("steadierPath.forceNewUser") === "true" && !getPlanBuiltFlag(); }
    catch(e){ return false; }
  }

  function setPlanBuiltFlag(){
    try {
      localStorage.setItem("steadierPath.planBuilt", "true");
      localStorage.removeItem("steadierPath.forceNewUser");
    } catch(e){}
  }

  function setHomeFirstRun(){
    var status = document.getElementById("planStatus");
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.textContent = "Build My Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Build your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = function(event){ handleHomePlanCTA(event); };
    }

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Build My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("assessment");
      };
    }
  }

  function setHomeBuilt(){
    var status = document.getElementById("planStatus");
    if(status){
      var path = "Calm Foundations";
      var time = "5 minutes";
      try {
        if(typeof savedSteadyPlan !== "undefined" && savedSteadyPlan){
          path = savedSteadyPlan.primaryPath || savedSteadyPlan.path || path;
          time = savedSteadyPlan.time || savedSteadyPlan.timeCommitment || time;
        }
      } catch(e){}
      status.textContent = "Plan ready: " + path + " · " + time + " per day";
    }

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.innerHTML = "Continue My<br>Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Return to your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Your SteadierPath profile is ready. Continue your daily calm, focus, and confidence plan.";

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = function(event){ handleHomePlanCTA(event); };
    }

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Continue My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("dashboard");
      };
    }
  }

  window.handleHomePlanCTA = function(event){
    if(event) event.stopPropagation();
    if(getPlanBuiltFlag()){
      showScreen("dashboard");
    } else {
      showScreen("assessment");
    }
  };

  window.refreshBuildContinuePlanCard = function(){
    if(getPlanBuiltFlag()) setHomeBuilt();
    else setHomeFirstRun();
  };

  // Override all plan-exists checks so default savedSteadyPlan values do NOT count.
  window.hasBuiltPlan = function(){ return getPlanBuiltFlag(); };
  window.steadierPathPlanExists = function(){ return getPlanBuiltFlag(); };

  // Force old updatePlanStatus not to resurrect a default plan.
  var previousUpdatePlanStatus = typeof updatePlanStatus === "function" ? updatePlanStatus : null;
  updatePlanStatus = function(){
    if(getPlanBuiltFlag()){
      if(previousUpdatePlanStatus) previousUpdatePlanStatus();
      setHomeBuilt();
    } else {
      setHomeFirstRun();
    }
  };

  function afterAssessmentBuild(){
    setPlanBuiltFlag();
    try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
    setTimeout(function(){
      setHomeBuilt();
      if(document.getElementById("dashboard")) showScreen("dashboard");
    }, 250);
  }

  // Mark built when the actual assessment build button is pressed.
  var oldBuildPlanAndSave = typeof buildPlanAndSave === "function" ? buildPlanAndSave : null;
  if(oldBuildPlanAndSave){
    buildPlanAndSave = function(){
      var result = oldBuildPlanAndSave.apply(this, arguments);
      afterAssessmentBuild();
      return result;
    };
  }

  var oldBuildPlan = typeof buildPlan === "function" ? buildPlan : null;
  if(oldBuildPlan){
    buildPlan = function(){
      var result = oldBuildPlan.apply(this, arguments);
      afterAssessmentBuild();
      return result;
    };
  }

  // Strong reset: clears and sets forced new-user mode.
  window.resetSteadierPathAppDataHard = function(){
    var ok = confirm("Reset SteadierPath as a brand-new user on this device?");
    if(!ok) return;
    try{
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("steadierPath.forceNewUser", "true");
    }catch(e){}
    alert("SteadierPath test data cleared. Reloading now.");
    window.location.href = window.location.origin + window.location.pathname;
  };

  window.resetSteadierPathData = function(){
    resetSteadierPathAppDataHard();
  };

  document.addEventListener("DOMContentLoaded", function(){
    refreshBuildContinuePlanCard();

    // Re-apply several times because older scripts update the same home card after load.
    [100, 300, 800, 1500, 3000].forEach(function(ms){
      setTimeout(refreshBuildContinuePlanCard, ms);
    });
  });
})();


/* v50 FINAL OVERRIDE — requested home card and welcome tweaks only */
(function(){
  function planBuiltV50(){
    try { return localStorage.getItem("steadierPath.planBuilt") === "true"; } catch(e){}
    return false;
  }

  function setFirstTimeHomeV50(){
    var status = document.getElementById("planStatus");
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.textContent = "Build My Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Build your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Build My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("assessment");
      };
    }

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = function(event){ 
        if(event) event.stopPropagation();
        showScreen("assessment"); 
      };
    }
  }

  function setReturningHomeV50(){
    var status = document.getElementById("planStatus");
    if(status){
      var path = "Calm Foundations";
      var time = "5 minutes";
      try {
        if(typeof savedSteadyPlan !== "undefined" && savedSteadyPlan){
          path = savedSteadyPlan.primaryPath || savedSteadyPlan.path || path;
          time = savedSteadyPlan.time || savedSteadyPlan.timeCommitment || time;
        }
      } catch(e){}
      status.textContent = "Plan ready: " + path + " · " + time + " per day";
    }

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.innerHTML = "Continue My<br>Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Return to your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Your SteadierPath profile is ready. Continue your daily calm, focus, and confidence plan.";

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Continue My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("dashboard");
      };
    }

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("dashboard");
      };
    }
  }

  window.refreshHomeCardV50 = function(){
    if(planBuiltV50()) setReturningHomeV50();
    else setFirstTimeHomeV50();
  };

  window.handleHomePlanCTA = function(event){
    if(event) event.stopPropagation();
    if(planBuiltV50()) showScreen("dashboard");
    else showScreen("assessment");
  };

  var oldShowV50 = typeof showScreen === "function" ? showScreen : null;
  if(oldShowV50){
    showScreen = function(screenId){
      oldShowV50(screenId);
      if(screenId === "mainMenu" || screenId === "dashboard" || screenId === "profile" || screenId === "assessment"){
        setTimeout(window.refreshHomeCardV50, 50);
      }
    };
  }

  var oldBuildPlanAndSaveV50 = typeof buildPlanAndSave === "function" ? buildPlanAndSave : null;
  if(oldBuildPlanAndSaveV50){
    buildPlanAndSave = function(){
      var result = oldBuildPlanAndSaveV50.apply(this, arguments);
      try { localStorage.setItem("steadierPath.planBuilt", "true"); } catch(e){}
      try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
      setTimeout(function(){
        window.refreshHomeCardV50();
        showScreen("dashboard");
      }, 250);
      return result;
    };
  }

  var oldResetHardV50 = typeof resetSteadierPathAppDataHard === "function" ? resetSteadierPathAppDataHard : null;
  window.resetSteadierPathAppDataHard = function(){
    var ok = confirm("Reset SteadierPath as a brand-new user on this device?");
    if(!ok) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("steadierPath.forceNewUser", "true");
    } catch(e){}
    alert("SteadierPath test data cleared. Reloading now.");
    window.location.href = window.location.origin + window.location.pathname;
  };

  window.resetSteadierPathData = function(){
    resetSteadierPathAppDataHard();
  };

  document.addEventListener("DOMContentLoaded", function(){
    var authTitle = document.querySelector("#auth h2");
    var authIntro = document.querySelector("#auth .intro");
    if(authTitle) authTitle.style.textAlign = "center";
    if(authIntro) authIntro.style.textAlign = "center";

    [0, 100, 300, 800, 1500, 3000].forEach(function(ms){
      setTimeout(window.refreshHomeCardV50, ms);
    });
  });
})();

/* v52: keep recommended card inactive; only the Build/Continue button is clickable */
function lockRecommendedCardAsTextV52(){
  var card = document.querySelector(".daily-priority-card");
  var btn = document.getElementById("homePlanCTA");

  if(card){
    card.onclick = null;
    card.style.cursor = "default";
  }

  if(btn){
    btn.onclick = function(event){
      if(event) event.stopPropagation();
      if(typeof handleHomePlanCTA === "function") handleHomePlanCTA(event);
    };
  }

  document.querySelectorAll(".daily-priority-card .arrow").forEach(function(el){
    el.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", function(){
  [0,100,300,800,1500,3000].forEach(function(ms){
    setTimeout(lockRecommendedCardAsTextV52, ms);
  });
});

var oldRefreshHomeCardV50_v52 = typeof refreshHomeCardV50 === "function" ? refreshHomeCardV50 : null;
if(oldRefreshHomeCardV50_v52){
  refreshHomeCardV50 = function(){
    oldRefreshHomeCardV50_v52();
    lockRecommendedCardAsTextV52();
  };
}


/* v53 Final Build My Plan / Continue My Plan Logic */
(function(){
  function getPlanBuiltV53(){
    try {
      return localStorage.getItem("steadierPath.planBuilt") === "true" ||
             localStorage.getItem("steadyMind.planBuilt") === "true";
    } catch(e) {
      return false;
    }
  }

  function setPlanBuiltV53(){
    try {
      localStorage.setItem("steadierPath.planBuilt", "true");
      localStorage.setItem("steadyMind.planBuilt", "true");
      localStorage.removeItem("steadierPath.forceNewUser");
      localStorage.removeItem("steadyMind.forceNewUser");
    } catch(e){}
  }

  function renderBuildStateV53(){
    var status = document.getElementById("planStatus");
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.textContent = "Build My Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Build your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Build My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        showScreen("assessment");
      };
    }

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = null;
      card.style.cursor = "default";
    }
  }

  function renderContinueStateV53(){
    var status = document.getElementById("planStatus");
    if(status){
      var path = "Calm Foundations";
      var time = "5 minutes";
      try {
        if(typeof savedSteadyPlan !== "undefined" && savedSteadyPlan){
          path = savedSteadyPlan.primaryPath || savedSteadyPlan.path || path;
          time = savedSteadyPlan.time || savedSteadyPlan.timeCommitment || time;
        }
      } catch(e){}
      status.textContent = "Plan ready: " + path + " · " + time + " per day";
    }

    var heading = document.getElementById("homePlanHeading");
    if(heading) heading.innerHTML = "Continue My<br>Plan";

    var sub = document.getElementById("homePlanSubheading");
    if(sub) sub.textContent = "Return to your personalized path";

    var desc = document.getElementById("homePlanDescription");
    if(desc) desc.textContent = "Your personalized plan is ready. Continue today's journey.";

    var btn = document.getElementById("homePlanCTA");
    if(btn){
      btn.textContent = "Continue My Plan →";
      btn.onclick = function(event){
        if(event) event.stopPropagation();
        if(document.getElementById("dashboard")) showScreen("dashboard");
        else if(document.getElementById("profile")) showScreen("profile");
        else showScreen("mainMenu");
      };
    }

    var card = document.querySelector(".daily-priority-card");
    if(card){
      card.onclick = null;
      card.style.cursor = "default";
    }
  }

  window.refreshHomePlanCard = function(){
    if(getPlanBuiltV53()) renderContinueStateV53();
    else renderBuildStateV53();
  };

  window.handleHomePlanCTA = function(event){
    if(event) event.stopPropagation();
    if(getPlanBuiltV53()){
      if(document.getElementById("dashboard")) showScreen("dashboard");
      else if(document.getElementById("profile")) showScreen("profile");
      else showScreen("mainMenu");
    } else {
      showScreen("assessment");
    }
  };

  window.hasBuiltPlan = function(){ return getPlanBuiltV53(); };
  window.steadyMindPlanExists = function(){ return getPlanBuiltV53(); };
  window.steadierPathPlanExists = function(){ return getPlanBuiltV53(); };

  var oldBuildPlanAndSaveV53 = typeof buildPlanAndSave === "function" ? buildPlanAndSave : null;
  if(oldBuildPlanAndSaveV53){
    buildPlanAndSave = function(){
      var result = oldBuildPlanAndSaveV53.apply(this, arguments);
      setPlanBuiltV53();
      try { if(typeof saveSteadyMindData === "function") saveSteadyMindData(); } catch(e){}
      try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
      setTimeout(function(){
        refreshHomePlanCard();
        if(document.getElementById("dashboard")) showScreen("dashboard");
        else if(document.getElementById("profile")) showScreen("profile");
      }, 250);
      return result;
    };
  }

  var oldBuildPlanV53 = typeof buildPlan === "function" ? buildPlan : null;
  if(oldBuildPlanV53){
    buildPlan = function(){
      var result = oldBuildPlanV53.apply(this, arguments);
      setPlanBuiltV53();
      try { if(typeof saveSteadyMindData === "function") saveSteadyMindData(); } catch(e){}
      try { if(typeof saveSteadierPathData === "function") saveSteadierPathData(); } catch(e){}
      setTimeout(function(){
        refreshHomePlanCard();
        if(document.getElementById("dashboard")) showScreen("dashboard");
        else if(document.getElementById("profile")) showScreen("profile");
      }, 250);
      return result;
    };
  }

  var oldShowScreenV53 = typeof showScreen === "function" ? showScreen : null;
  if(oldShowScreenV53){
    showScreen = function(screenId){
      oldShowScreenV53(screenId);
      if(screenId === "mainMenu" || screenId === "dashboard" || screenId === "profile" || screenId === "assessment"){
        setTimeout(refreshHomePlanCard, 50);
      }
    };
  }

  var oldResetHardV53 = typeof resetSteadyMindAppDataHard === "function" ? resetSteadyMindAppDataHard : null;
  window.resetSteadyMindAppDataHard = function(){
    var ok = confirm("Reset SteadierPath as a brand-new user on this device?");
    if(!ok) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("steadierPath.forceNewUser", "true");
      localStorage.setItem("steadyMind.forceNewUser", "true");
    } catch(e){}
    alert("SteadierPath test data cleared. Reloading now.");
    window.location.href = window.location.origin + window.location.pathname;
  };

  window.resetSteadyMindData = function(){
    resetSteadyMindAppDataHard();
  };

  document.addEventListener("DOMContentLoaded", function(){
    [0, 100, 300, 800, 1500, 3000].forEach(function(ms){
      setTimeout(refreshHomePlanCard, ms);
    });
  });
})();


/* v54 Today's Dashboard Start Button Fix */
function wireTodayDashboardStartButtonV54(){
  var btn = document.getElementById("todayDashboardStartBtn");
  if(btn){
    btn.textContent = "Start Now →";
    btn.onclick = function(event){
      if(event) event.stopPropagation();
      if(typeof startTodayPlan === "function") startTodayPlan();
      else showScreen("todayPlan");
    };
  }
}

document.addEventListener("DOMContentLoaded", function(){
  [0,100,300,800,1500,3000].forEach(function(ms){
    setTimeout(wireTodayDashboardStartButtonV54, ms);
  });
});

var oldShowScreenV54 = typeof showScreen === "function" ? showScreen : null;
if(oldShowScreenV54){
  showScreen = function(screenId){
    oldShowScreenV54(screenId);
    if(screenId === "dashboard" || screenId === "mainMenu"){
      setTimeout(wireTodayDashboardStartButtonV54, 75);
    }
  };
}
/* Notification Settings Only - Mobile App Ready */

function saveNotificationSettings() {
  var settings = {
    morning: document.getElementById("morningReminder")?.checked || false,
    evening: document.getElementById("eveningReminder")?.checked || false,
    streak: document.getElementById("streakReminder")?.checked || false
  };

  localStorage.setItem("steadierPath.notifications", JSON.stringify(settings));
}

function loadNotificationSettings() {
  var saved = localStorage.getItem("steadierPath.notifications");
  if (!saved) return;

  try {
    var settings = JSON.parse(saved);

    var morning = document.getElementById("morningReminder");
    var evening = document.getElementById("eveningReminder");
    var streak = document.getElementById("streakReminder");

    if (morning) morning.checked = !!settings.morning;
    if (evening) evening.checked = !!settings.evening;
    if (streak) streak.checked = !!settings.streak;
  } catch (error) {
    console.warn("Could not load notification settings:", error);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  loadNotificationSettings();
});
