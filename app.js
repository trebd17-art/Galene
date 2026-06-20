let mindPoints=0;let completedActivities=0;let currentProfile={};

function showScreen(screenId){
  const current = document.querySelector(".screen.active");
  if(current){
    current.classList.add("leaving");
    setTimeout(() => {
      document.querySelectorAll(".screen").forEach(screen=>{
        screen.classList.remove("active");
        screen.classList.remove("leaving");
      });
      const next = document.getElementById(screenId);
      next.classList.add("active");
      if(screenId==="journal" && typeof updateSmartPrompts==="function"){setTimeout(updateSmartPrompts,120)}
      window.scrollTo({top:0,behavior:"smooth"});
    }, 220);
  } else {
    document.getElementById(screenId).classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }
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
  setTimeout(() => {
    showScreen("welcome");
  }, 3000);
});


function startBreathing(){
  const box = document.getElementById("breathingBox");
  const circle = document.querySelector(".breathing-circle");
  const panel = document.querySelector(".breathing-panel");
  if(!box || !circle) return;

  if(window.steadyBreathingRunning) return;
  window.steadyBreathingRunning = true;

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
      window.steadyBreathingRunning = false;
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

function toggleImproveOptions(){
  document.getElementById("improveOptions").classList.toggle("hidden");
}


/* v13 Build My Plan + Continue Plan functionality */
let savedSteadyPlan = null;

function buildPlanAndSave(){
  const improvements = getCheckedValues();
  const challenge = document.getElementById("challenge").value;
  const time = document.getElementById("timeCommitment").value;
  const hope = document.getElementById("hope").value;
  const userType = document.getElementById("userType").value;
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
    document.getElementById("profileCard").innerHTML = "Complete the assessment to create your personalized profile.";
    document.getElementById("mindTypeCard").innerHTML = "Your mind type will appear here after your assessment.";
    document.getElementById("pathCard").innerHTML = "Your primary path will appear here after your assessment.";
    document.getElementById("dailyPlanCard").innerHTML = "Start with one small steady action today.";
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
      status.classList.add("saved-pulse");
      setTimeout(() => status.classList.remove("saved-pulse"), 1200);
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
