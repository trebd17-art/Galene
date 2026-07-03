// SteadierPath v60 Clean Baseline

const STORAGE_KEY = "steadierPath.v60.data";
const LEVEL_SIZE = 250;

const DEFAULT_DATA = {
  planBuilt:false,
  savedPlan:null,
  mindPoints:0,
  completedActivities:0,
  streak:0,
  journals:[],
  moods:[],
  notifications:{morning:false,evening:false,streak:false},
  bestScores:{}
};

let appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
let currentEmergencyTool = null;
let currentEmergencyStep = -1;
let todayPlanStep = -1;
let breathingInterval = null;
let breathingRunning = false;
let centeredBoard = [];
let thoughtIndex = 0;
let thoughtScore = 0;
let calmFocusScore = 0;
let calmFocusRunning = false;
let calmFocusTimer = null;

function safeParse(value, fallback){
  try { return value ? JSON.parse(value) : fallback; }
  catch(e){ return fallback; }
}

function loadAppData(){
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), null);
  appData = saved ? {...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...saved} : JSON.parse(JSON.stringify(DEFAULT_DATA));
  appData.planBuilt = !!(appData.savedPlan && appData.savedPlan.path);
  saveAppData();
}

function saveAppData(){
  appData.planBuilt = !!(appData.savedPlan && appData.savedPlan.path);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function resetSteadierPathData(){
  if(!confirm("Reset SteadierPath as a brand-new user on this device?")) return;
  Object.keys(localStorage).forEach(key => {
    if(/steady|steadier|steadymind|journal|mood|xp|plan/i.test(key)) localStorage.removeItem(key);
  });
  sessionStorage.clear();
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveAppData();
  location.href = location.origin + location.pathname;
}

function viewSteadierPathData(){
  alert(JSON.stringify(appData, null, 2).slice(0, 1400));
}

function showScreen(id){
  stopBreathing();
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  const screen = document.getElementById(id);
  if(screen) screen.classList.add("active");

  if(id === "mainMenu") renderHome();
  if(id === "dashboard") renderDashboard();
  if(id === "weekly") renderWeekly();
  if(id === "moodTracker") renderMoodTracker();
  if(id === "rewards") renderRewards();
  if(id === "settings") renderSettings();

  window.scrollTo({top:0, behavior:"smooth"});
}

function getDayOfYear(){
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function getDailyMessage(){
  return DAILY_MESSAGES[(getDayOfYear() - 1) % DAILY_MESSAGES.length];
}

function loadDailyEncouragement(){
  const message = getDailyMessage();
  const home = document.getElementById("dailyEncouragementText");
  const quiet = document.getElementById("quietReminderText");
  if(home) home.textContent = message;
  if(quiet) quiet.textContent = message;
}

function showQuietReminderOrHome(){
  loadDailyEncouragement();
  const today = new Date().toDateString();
  localStorage.getItem("steadierPath.v60.quietReminderSeen") === today ? showScreen("mainMenu") : showScreen("quietReminder");
}

function enterMainMenuFromReminder(){
  localStorage.setItem("steadierPath.v60.quietReminderSeen", new Date().toDateString());
  showScreen("mainMenu");
}

function getCheckedValues(){
  return Array.from(document.querySelectorAll('#improveOptions input[type="checkbox"]:checked')).map(x => x.value);
}

function toggleImproveOptions(){
  document.getElementById("improveOptions").classList.toggle("hidden");
}

function updateImproveButton(){
  const values = getCheckedValues();
  const chips = document.getElementById("selectedImprovements");
  if(chips) chips.innerHTML = values.length ? values.map(x => `<span>${x}</span>`).join("") : "No areas selected yet.";
}

function determinePrimaryPath(improvements, challenge){
  const all = [...improvements, challenge].join(" ").toLowerCase();
  if(all.includes("panic") || all.includes("anxiety") || all.includes("racing")) return {name:"Calm & Anxiety",title:"Calm Foundations",daily:["60-second breathing reset","Grounding exercise","Name one thing you can control today"]};
  if(all.includes("overthinking") || all.includes("negative")) return {name:"Overthinking",title:"Mental Clarity",daily:["Thought challenge","Worry release journal","One-minute mindful pause"]};
  if(all.includes("confidence") || all.includes("social") || all.includes("performance")) return {name:"Confidence",title:"Confidence Builder",daily:["Small courage challenge","Confidence script","Post-action reflection"]};
  if(all.includes("focus")) return {name:"Focus",title:"Focus Reset",daily:["Distraction clear-out","5-minute focus timer","One-task commitment"]};
  if(all.includes("stress") || all.includes("burnout") || all.includes("work")) return {name:"Stress & Burnout",title:"Stress Recovery",daily:["Body tension scan","Recovery break","One boundary for today"]};
  if(all.includes("motivation")) return {name:"Motivation",title:"Momentum Builder",daily:["Tiny goal","Win log","One next step"]};
  return {name:"Balanced Growth",title:"Steady Foundations",daily:["Breathing reset","Short reflection","One steady action"]};
}

function determineMindType(improvements, challenge, hope){
  const all = [...improvements, challenge, hope].join(" ").toLowerCase();
  if(all.includes("racing") || all.includes("panic") || all.includes("stress")) return {name:"🌊 Storm Navigator",description:"You may feel pulled by pressure or racing thoughts, but your goal is to become steadier under stress."};
  if(all.includes("overthinking") || all.includes("negative")) return {name:"🧠 Deep Thinker",description:"Your mind works hard to understand and prepare. SteadierPath helps turn mental noise into clarity."};
  if(all.includes("confidence") || all.includes("social")) return {name:"🦁 Quiet Leader",description:"You may doubt yourself at times, but there is courage there."};
  return {name:"🌱 Steady Builder",description:"You are ready to grow with calm, consistency, and simple daily steps."};
}

function getPathTitle(plan){
  return plan && plan.path ? (typeof plan.path === "string" ? plan.path : (plan.path.title || plan.path.name || "Calm Foundations")) : "Calm Foundations";
}

function getPathName(plan){
  return plan && plan.path ? (typeof plan.path === "string" ? plan.path : (plan.path.name || plan.path.title || "Calm & Anxiety")) : "Calm & Anxiety";
}

function getDailySteps(plan){
  return plan && plan.path && Array.isArray(plan.path.daily) ? plan.path.daily : ["60-second breathing reset","Grounding exercise","Name one thing you can control today"];
}

function buildPlanAndSave(){
  const improvements = getCheckedValues();
  const challenge = document.getElementById("challenge").value;
  const time = document.getElementById("timeCommitment").value;
  const hope = document.getElementById("hope").value;
  const userType = document.getElementById("userType").value;
  const path = determinePrimaryPath(improvements, challenge);
  const mindType = determineMindType(improvements, challenge, hope);

  appData.savedPlan = {
    improvements,
    challenge,
    time,
    hope,
    userType,
    improvementText: improvements.length ? improvements.join(", ") : "your steady mind",
    path,
    mindType,
    supportingPaths: improvements.filter(v => v !== path.name).slice(0, 3),
    createdAt: new Date().toLocaleDateString()
  };

  saveAppData();
  renderHome();
  renderDashboard();
  showScreen("dashboard");
}

function handleHomePlanCTA(event){
  if(event) event.stopPropagation();
  loadAppData();
  appData.savedPlan && appData.savedPlan.path ? showScreen("dashboard") : showScreen("assessment");
}

function renderHome(){
  loadDailyEncouragement();

  const hour = new Date().getHours();
  let greeting = "Good Evening.";
  if(hour < 12) greeting = "Good Morning.";
  else if(hour < 17) greeting = "Good Afternoon.";

  const greetingEl = document.getElementById("dynamicGreeting");
  if(greetingEl){
    greetingEl.innerHTML = `<div class="dynamic-greeting-title">${greeting}</div><div class="dynamic-greeting-subtitle">Let's take one steady step together.</div>`;
  }

  const plan = appData.savedPlan;
  const hasPlan = !!(plan && plan.path);

  const status = document.getElementById("planStatus");
  const heading = document.getElementById("homePlanHeading");
  const sub = document.getElementById("homePlanSubheading");
  const desc = document.getElementById("homePlanDescription");
  const btn = document.getElementById("homePlanCTA");

  const todayFocusCard = document.getElementById("todayFocusCard");
  const todayFocusTitle = document.getElementById("todayFocusTitle");
  const todayFocusTime = document.getElementById("todayFocusTime");
  const whyTodayPlan = document.getElementById("whyTodayPlan");

  if(!hasPlan){
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';
    if(heading) heading.textContent = "Build My Plan";
    if(sub) sub.textContent = "Build your personalized path";
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";
    if(btn) btn.textContent = "Build My Plan →";
    if(todayFocusCard) todayFocusCard.classList.add("hidden");
  } else {
    if(status) status.textContent = `Plan ready: ${getPathTitle(plan)} · ${plan.time} per day`;
    if(heading) heading.innerHTML = "Continue My<br>Plan";
    if(sub) sub.textContent = "Return to your personalized path";
    if(desc) desc.textContent = `Today's Focus: ${getPathName(plan)}. ${getDailySteps(plan)[0]}.`;
    if(btn) btn.textContent = "Continue My Plan →";

    if(todayFocusCard) todayFocusCard.classList.remove("hidden");
    if(todayFocusTitle) todayFocusTitle.textContent = getPathTitle(plan);
    if(todayFocusTime) todayFocusTime.textContent = `${plan.time} session`;
    if(whyTodayPlan) whyTodayPlan.textContent = `Based on your assessment, today's plan focuses on ${getPathName(plan).toLowerCase()} through small, steady actions that are easier to complete consistently.`;
  }

  const pct = Math.min(appData.completedActivities * 20, 100);
  const progressText = document.getElementById("homeProgressText");
  const progressFill = document.getElementById("homeProgressFill");
  if(progressText) progressText.textContent = `${pct}% Complete`;
  if(progressFill) progressFill.style.width = pct + "%";
}

function renderDashboard(){
  const plan = appData.savedPlan;
  const profile = document.getElementById("profileCard");
  const mind = document.getElementById("mindTypeCard");
  const path = document.getElementById("pathCard");
  const daily = document.getElementById("dailyPlanCard");

  if(!plan || !plan.path){
    if(profile) profile.innerHTML = "Complete the assessment to create your personalized profile.";
    if(mind) mind.innerHTML = "Your mind type will appear here after your assessment.";
    if(path) path.innerHTML = "Your primary path will appear here after your assessment.";
    if(daily) daily.innerHTML = "Start with one small steady action today.";
    updateXP();
    return;
  }

  if(profile) profile.innerHTML = `<div class="profile-row"><span>👤</span><span class="profile-label">User type</span><span class="profile-value">${plan.userType}</span></div><div class="profile-row"><span>🎯</span><span class="profile-label">Wants to improve</span><span class="profile-value">${plan.improvementText}</span></div><div class="profile-row"><span>🧠</span><span class="profile-label">Biggest challenge</span><span class="profile-value">${plan.challenge}</span></div><div class="profile-row"><span>♡</span><span class="profile-label">Desired feeling</span><span class="profile-value">${plan.hope}</span></div><div class="profile-row"><span>◷</span><span class="profile-label">Time available</span><span class="profile-value">${plan.time} per day</span></div>`;
  if(mind) mind.innerHTML = `<strong>${plan.mindType.name}</strong><p>${plan.mindType.description}</p>`;
  if(path) path.innerHTML = `<strong>Primary Path: ${getPathTitle(plan)}</strong><br><br>Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>This path helps you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;
  if(daily){
    const steps = getDailySteps(plan);
    daily.innerHTML = `<strong>Today's Focus: ${getPathName(plan)}</strong><br><br><strong>Your ${plan.time} reset:</strong><ol><li>${steps[0]}</li><li>${steps[1]}</li><li>${steps[2]}</li></ol>`;
  }
  updateXP();
}

function levelFromXP(points){ return Math.floor(points / LEVEL_SIZE) + 1; }

function levelName(level){
  return `Level ${level}: ${["Calm Seeker","Steady Builder","Storm Navigator","Resilient Thinker","Grounded Guide"][Math.min(level - 1, 4)]}`;
}

function addXP(amount){
  appData.mindPoints += amount;
  appData.completedActivities += 1;
  appData.streak = Math.max(appData.streak, 1);
  saveAppData();
  updateXP();
  renderHome();
}

function updateXP(){
  const level = levelFromXP(appData.mindPoints);
  const current = appData.mindPoints - ((level - 1) * LEVEL_SIZE);
  const remaining = LEVEL_SIZE - current;
  const percent = Math.min((current / LEVEL_SIZE) * 100, 100);

  ["xpFill","rewardsXpFill"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.width = percent + "%";
  });

  const xpText = document.getElementById("xpText");
  const levelEl = document.getElementById("levelName");
  const nextEl = document.getElementById("nextLevelText");
  const activities = document.getElementById("activitiesText");
  const streak = document.getElementById("streakText");

  if(xpText) xpText.textContent = `${current} / ${LEVEL_SIZE} Mind Points`;
  if(levelEl) levelEl.textContent = levelName(level);
  if(nextEl) nextEl.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
  if(activities) activities.textContent = appData.completedActivities;
  if(streak) streak.textContent = appData.streak + (appData.streak === 1 ? " day" : " days");

  renderRewards();
}

function renderRewards(){
  const level = levelFromXP(appData.mindPoints);
  const current = appData.mindPoints - ((level - 1) * LEVEL_SIZE);
  const remaining = LEVEL_SIZE - current;

  const card = document.getElementById("rewardsLevelCard");
  const xpText = document.getElementById("rewardsXpText");
  const remainingText = document.getElementById("rewardsRemainingText");

  if(card) card.textContent = levelName(level);
  if(xpText) xpText.textContent = `${current} / ${LEVEL_SIZE} XP`;
  if(remainingText) remainingText.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
}

const todayPlanSteps = [
  {name:"60-Second Breathing Reset",text:"Begin by slowing your breath. Tap the breathing bubble and follow the rhythm."},
  {name:"Grounding",text:"Name one thing you can see, one thing you can feel, and one thing you can hear."},
  {name:"Reflection",text:"What is one thought you can release today?"},
  {name:"Small Step",text:"Choose one small steady action you can take next."},
  {name:"Complete",text:"Excellent work. A steady path is built through small returns."}
];

function startTodayPlan(){
  todayPlanStep = -1;
  showScreen("todayPlan");
  nextTodayPlanStep();
}

function nextTodayPlanStep(){
  todayPlanStep++;
  if(todayPlanStep >= todayPlanSteps.length){
    addXP(20);
    todayPlanStep = -1;
    showScreen("dashboard");
    return;
  }

  const step = todayPlanSteps[todayPlanStep];
  document.getElementById("todayPlanStepLabel").textContent = `Step ${todayPlanStep + 1} of ${todayPlanSteps.length}`;
  document.getElementById("todayPlanStepName").textContent = step.name;
  document.getElementById("todayPlanContent").textContent = step.text;
  document.getElementById("todayPlanProgressFill").style.width = ((todayPlanStep + 1) / todayPlanSteps.length) * 100 + "%";
  document.getElementById("todayPlanBreathingArea").classList.toggle("hidden", todayPlanStep !== 0);
  document.getElementById("todayPlanNextBtn").textContent = todayPlanStep === todayPlanSteps.length - 1 ? "Finish +20 XP" : "Next";
}

function startBreathing(){
  const circle = document.querySelector(".breathing-circle");
  const box = document.getElementById("breathingBox");
  if(!circle || !box || breathingRunning) return;

  breathingRunning = true;
  let elapsed = 0;
  let phase = 0;
  let phaseElapsed = 0;
  const phases = [
    {text:"Breathe in slowly...",className:"inhale",seconds:4},
    {text:"Hold gently...",className:"hold",seconds:4},
    {text:"Breathe out fully...",className:"exhale",seconds:6},
    {text:"Rest...",className:"rest",seconds:6}
  ];

  function apply(){
    circle.classList.remove("inhale","hold","exhale","rest");
    circle.classList.add(phases[phase].className);
    box.textContent = phases[phase].text;
  }

  apply();
  breathingInterval = setInterval(() => {
    elapsed++;
    phaseElapsed++;
    if(phaseElapsed >= phases[phase].seconds){
      phase = (phase + 1) % phases.length;
      phaseElapsed = 0;
      apply();
    }
    if(elapsed >= 60){
      stopBreathing();
      box.textContent = "60-second reset complete.";
      addXP(5);
    }
  }, 1000);
}

function stopBreathing(){
  if(breathingInterval) clearInterval(breathingInterval);
  breathingInterval = null;
  breathingRunning = false;
}

const emergencyTools = {
  breathing:{icon:"🚨",title:"60-Second Reset",steps:["Pause. Place both feet on the ground.","Take one slow breath in.","Let your shoulders drop as you breathe out.","You are safe in this moment.","You can return to calm one breath at a time."]},
  grounding:{icon:"🌿",title:"Grounding",steps:["Name five things you can see.","Notice four things you can feel.","Listen for three sounds.","Name two things you can smell.","The present is smaller than your worries make it seem."]},
  worry:{icon:"🕊️",title:"Worry Release",steps:["Name the worry without judging it.","Ask: is this a fact, fear, or assumption?","Choose one thing you can control.","Let the rest be handled later."]},
  sleep:{icon:"🌙",title:"Sleep Wind-Down",steps:["Let your jaw soften.","Lower your shoulders.","Set tomorrow's concern aside.","Take three slow breaths."]}
};

function openEmergencyTool(type){
  currentEmergencyTool = emergencyTools[type];
  currentEmergencyStep = -1;
  document.getElementById("emergencyToolIcon").textContent = currentEmergencyTool.icon;
  document.getElementById("emergencyToolTitle").textContent = currentEmergencyTool.title;
  document.getElementById("emergencyMessageBubble").textContent = "Press Next to begin.";
  document.getElementById("emergencyNextBtn").textContent = "Next";
  showScreen("emergencyToolPlayer");
}

function nextEmergencyToolStep(){
  if(!currentEmergencyTool) return;
  currentEmergencyStep++;
  if(currentEmergencyStep >= currentEmergencyTool.steps.length) return completeEmergencyTool();

  document.getElementById("emergencyMessageBubble").textContent = currentEmergencyTool.steps[currentEmergencyStep];
  document.getElementById("emergencyNextBtn").textContent = currentEmergencyStep === currentEmergencyTool.steps.length - 1 ? "Finish" : "Next";
}

function completeEmergencyTool(){
  addXP(10);
  document.getElementById("emergencyMessageBubble").innerHTML = "<strong>Tool complete.</strong><br>You took a steady step back toward calm.";
  document.getElementById("emergencyNextBtn").textContent = "Done";
}

function saveCheckIn(){
  const mood = document.getElementById("mood").value;
  const need = document.getElementById("need").value;
  const result = document.getElementById("checkinResult");
  result.classList.remove("hidden");
  result.innerHTML = `<strong>Check-in saved.</strong><br>Your mind feels <strong>${mood}</strong>. Today, focus on <strong>${need}</strong>.`;
  addXP(5);
}

function saveJournal(){
  const entry = {
    date:new Date().toLocaleDateString(),
    mood:document.getElementById("journalMood").value,
    feelingWords:document.getElementById("feelingWords").value.trim(),
    weighingMind:document.getElementById("weighingMind").value.trim(),
    controlToday:document.getElementById("controlToday").value.trim(),
    wentWell:document.getElementById("wentWell").value.trim()
  };

  const result = document.getElementById("journalResult");
  if(!entry.feelingWords && !entry.weighingMind && !entry.controlToday && !entry.wentWell){
    result.classList.remove("hidden");
    result.textContent = "Write at least one reflection before saving.";
    return;
  }

  appData.journals.unshift(entry);
  saveAppData();
  result.classList.remove("hidden");
  result.innerHTML = "<strong>Reflection saved.</strong><br>You gave your thoughts a place to land.<br><br>+10 XP";
  addXP(10);
}

function saveMoodEntry(){
  appData.moods.unshift({
    date:new Date().toLocaleDateString(),
    score:Number(document.getElementById("calmScore").value),
    mood:document.getElementById("trackerMood").value,
    note:document.getElementById("moodNote").value.trim()
  });
  saveAppData();
  renderMoodTracker();
  addXP(5);
  document.getElementById("moodNote").value = "";
}

function renderMoodTracker(){
  const fill = document.getElementById("moodMeterFill");
  const summary = document.getElementById("moodSummary");
  const history = document.getElementById("moodHistory");
  if(!fill || !summary || !history) return;

  if(!appData.moods.length){
    fill.style.width = "0%";
    summary.textContent = "No mood entries yet.";
    history.innerHTML = "";
    return;
  }

  const avg = appData.moods.reduce((sum, item) => sum + item.score, 0) / appData.moods.length;
  fill.style.width = (avg * 10) + "%";
  summary.innerHTML = `<strong>Average Calm Score:</strong> ${avg.toFixed(1)} / 10<br><strong>Entries:</strong> ${appData.moods.length}`;
  history.innerHTML = appData.moods.slice(0,7).map(item => `<div class="card"><strong>${item.date}</strong><br>${item.mood} · ${item.score}/10<br>${item.note || ""}</div>`).join("");
}

function openGame(id){ showScreen(id); }

function completeGame(name, xp, score){
  appData.bestScores[name] = Math.max(appData.bestScores[name] || 0, score || 0);
  saveAppData();
  addXP(xp);
}

function startCenteredGame(){
  const states = ["calm","focus","anxiety","calm","focus"];
  centeredBoard = Array.from({length:25}, (_, i) => states[i % states.length]);
  renderCenteredBoard();
  document.getElementById("centeredMessage").textContent = "Tap anxiety blocks.";
}

function renderCenteredBoard(){
  document.getElementById("centeredBoard").innerHTML = centeredBoard.map((state, i) => `<button class="color-cell ${state}" onclick="tapCentered(${i})"></button>`).join("");
}

function tapCentered(index){
  centeredBoard[index] = centeredBoard[index] === "anxiety" ? "calm" : "focus";
  renderCenteredBoard();
  const left = centeredBoard.filter(x => x === "anxiety").length;
  document.getElementById("centeredMessage").textContent = `Anxiety blocks left: ${left}.`;
  if(left === 0){
    document.getElementById("centeredMessage").innerHTML = "<strong>Centered complete.</strong><br>+25 XP";
    completeGame("centered", 25, 100);
  }
}

const thoughtCards = [
  {text:"I practiced today.",answer:"helpful"},
  {text:"Everyone will judge me.",answer:"unhelpful"},
  {text:"I do not know exactly what will happen.",answer:"uncertain"},
  {text:"I can take one small step.",answer:"helpful"},
  {text:"If I feel anxious, I must be unsafe.",answer:"unhelpful"}
];

function startThoughtSortGame(){
  thoughtIndex = 0;
  thoughtScore = 0;
  document.getElementById("thoughtSortResult").classList.add("hidden");
  showThoughtCard();
}

function showThoughtCard(){
  document.getElementById("thoughtFloatingCard").textContent = thoughtCards[thoughtIndex].text;
}

function sortThoughtCard(choice){
  const result = document.getElementById("thoughtSortResult");
  const correct = choice === thoughtCards[thoughtIndex].answer;
  if(correct) thoughtScore++;

  result.classList.remove("hidden");
  result.innerHTML = correct ? "<strong>Correct.</strong>" : "<strong>Good try.</strong>";
  thoughtIndex++;

  if(thoughtIndex >= thoughtCards.length){
    result.innerHTML += `<br><br><strong>Thought Sort complete.</strong><br>Score: ${thoughtScore}/${thoughtCards.length}<br>+15 XP`;
    document.getElementById("thoughtFloatingCard").textContent = "Game complete.";
    completeGame("thoughtSort", 15, thoughtScore);
  } else {
    setTimeout(() => {
      result.classList.add("hidden");
      showThoughtCard();
    }, 800);
  }
}

function startCalmFocusRound(){
  const area = document.getElementById("calmFocusPlayArea");
  const result = document.getElementById("calmFocusResult");

  if(calmFocusTimer) clearInterval(calmFocusTimer);
  area.innerHTML = "";
  calmFocusScore = 0;
  calmFocusRunning = true;
  result.textContent = "Tap blue focus orbs. Avoid red noise.";

  spawnFocusOrbs();
  calmFocusTimer = setInterval(spawnFocusOrbs, 1500);
}

function spawnFocusOrbs(){
  const area = document.getElementById("calmFocusPlayArea");
  if(!area || !calmFocusRunning) return;

  area.innerHTML = "";
  for(let i = 0; i < 3; i++){
    const type = i === 0 || Math.random() > .5 ? "focus" : "noise";
    const orb = document.createElement("button");
    orb.className = type === "focus" ? "focus-orb" : "noise-orb";
    orb.textContent = type === "focus" ? "Focus" : "Noise";
    orb.style.left = Math.max(10, Math.random() * (area.clientWidth - 90)) + "px";
    orb.style.top = Math.max(10, Math.random() * (area.clientHeight - 90)) + "px";
    orb.onclick = () => {
      if(type === "focus"){
        calmFocusScore++;
        document.getElementById("calmFocusResult").textContent = `Focused: ${calmFocusScore}/8`;
        if(calmFocusScore >= 8){
          calmFocusRunning = false;
          clearInterval(calmFocusTimer);
          document.getElementById("calmFocusResult").innerHTML = "<strong>Calm Focus complete.</strong><br>+15 XP";
          completeGame("calmFocus", 15, calmFocusScore);
        }
      } else {
        document.getElementById("calmFocusResult").textContent = "Noise noticed. Return gently.";
      }
      orb.remove();
    };
    area.appendChild(orb);
  }
}

function openLesson(topic){
  const lessons = {
    "Anxiety Basics":"Anxiety is your body's alarm system. The goal is to understand it and respond steadily.",
    "Overthinking":"Separate useful planning from mental noise.",
    "Confidence":"Small repeated courage steps build self-trust.",
    "Sleep":"Wind-down routines teach your nervous system to settle."
  };
  const el = document.getElementById("lessonResult");
  el.classList.remove("hidden");
  el.innerHTML = `<strong>${topic}</strong><br>${lessons[topic]}`;
  addXP(5);
}

function renderWeekly(){
  const el = document.getElementById("weeklyCard");
  if(el) el.innerHTML = `<strong>This week:</strong><br>Activities completed: ${appData.completedActivities}<br>Total XP: ${appData.mindPoints}<br>Journal entries: ${appData.journals.length}<br>Mood entries: ${appData.moods.length}`;
  updateXP();
}

function saveNotificationSettings(){
  appData.notifications = {
    morning: document.getElementById("morningReminder")?.checked || false,
    evening: document.getElementById("eveningReminder")?.checked || false,
    streak: document.getElementById("streakReminder")?.checked || false
  };
  saveAppData();
}

function renderSettings(){
  const settings = appData.notifications || {};
  const morning = document.getElementById("morningReminder");
  const evening = document.getElementById("eveningReminder");
  const streak = document.getElementById("streakReminder");

  if(morning) morning.checked = !!settings.morning;
  if(evening) evening.checked = !!settings.evening;
  if(streak) streak.checked = !!settings.streak;
}

document.addEventListener("DOMContentLoaded", () => {
  if(location.search.includes("reset=true") || location.hash.includes("reset")){
    Object.keys(localStorage).forEach(key => {
      if(/steady|steadier|steadymind|journal|mood|xp|plan/i.test(key)) localStorage.removeItem(key);
    });
    history.replaceState(null, "", location.pathname);
  }

  loadAppData();
  updateImproveButton();
  loadDailyEncouragement();
  renderHome();
  renderDashboard();
  updateXP();

  setTimeout(() => showScreen("welcome"), 650);
});
