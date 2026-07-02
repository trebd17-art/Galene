/* SteadierPath v58 Rock-Solid Baseline
   Built clean from scratch: one storage key, one showScreen(), one renderHome().
   No v56/v57 patch layers. No duplicate planStatus. No legacy planBuilt flags.
*/

const STORAGE_KEY = "steadierPath.v58.data";
const LEVEL_SIZE = 250;

const DEFAULT_DATA = {
  planBuilt: false,
  savedPlan: null,
  mindPoints: 0,
  completedActivities: 0,
  streak: 0,
  journals: [],
  moods: [],
  notifications: { morning: false, evening: false, streak: false },
  bestScores: {}
};

let appData = structuredClone(DEFAULT_DATA);
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

const dailyEncouragementMessages = [
  "Calm is not found by waiting for life to become quiet. It is built by learning to remain steady while life is still moving.",
  "You do not have to solve tomorrow today. One steady step is enough for this moment.",
  "Progress is rarely loud. Most lasting change happens quietly, one small choice at a time.",
  "Your mind may offer fear, but you do not have to accept every thought as truth.",
  "A difficult moment is not proof of a difficult life. It is only a moment asking for steadiness.",
  "You can be anxious and still be capable. You can feel uncertain and still move forward.",
  "Peace begins when you stop arguing with every thought that enters your mind.",
  "Your breath is a reminder that you are still here, still trying, still able to begin again.",
  "Not every feeling needs a solution. Some feelings simply need space, patience, and kindness.",
  "You are allowed to slow down without feeling like you are falling behind.",
  "One calm decision can interrupt an entire cycle of worry.",
  "You do not need perfect confidence to take the next right step.",
  "The storm in your mind does not get to decide the direction of your life.",
  "Growth often feels uncomfortable before it feels empowering.",
  "You are not weak for needing support. You are wise for choosing tools that help you stay steady.",
  "Today does not require perfection. It asks only for presence.",
  "Your thoughts can be loud without being accurate.",
  "You are building strength every time you return to calm instead of surrendering to panic.",
  "Small steps count, especially on the days when they feel hard.",
  "You are not behind. You are becoming.",
  "A steady life is built by steady returns, not flawless days.",
  "You can acknowledge anxiety without handing it the wheel.",
  "Let today be handled one breath, one choice, one moment at a time.",
  "Your future is not decided by how you feel this morning.",
  "Every time you pause before reacting, you are practicing freedom.",
  "You are allowed to outgrow old patterns slowly.",
  "Peace is not the absence of pressure. It is learning how to breathe beneath it.",
  "You have survived days you once thought would break you.",
  "A thought is not a command. You can observe it and let it pass.",
  "The smallest act of care is still care.",
  "You do not have to carry yesterday into today.",
  "Your progress is real, even when it is not obvious.",
  "Let your next step be small enough to take and meaningful enough to matter.",
  "You can be a work in progress and still be worthy of peace.",
  "The goal is not to never feel anxious. The goal is to know you can steady yourself when anxiety appears.",
  "Your mind may race, but your body can learn to slow.",
  "You are not failing because today feels heavy.",
  "Consistency is built by returning, not by never missing.",
  "You are stronger than the feeling trying to convince you otherwise.",
  "Calm can begin with one honest breath.",
  "Do not let one hard hour define your whole day.",
  "You do not need to believe every story anxiety tells.",
  "Today, choose progress over pressure.",
  "You can move gently and still move forward.",
  "The fact that you are trying matters.",
  "You are allowed to begin again without punishing yourself for stopping.",
  "There is courage in choosing calm when worry feels familiar.",
  "The next right step is enough light for now.",
  "You do not have to become a different person today. Just take one steadier step.",
  "A peaceful mind is trained through practice, not demanded through pressure.",
  "You are learning how to be steady, and learning takes time.",
  "Pause. Breathe. Return. That is progress.",
  "You are not your worst thought.",
  "Let today be simple. Let your effort be enough.",
  "Anxiety may visit, but it does not have to move in.",
  "You can feel afraid and still make a wise choice.",
  "Your peace is worth protecting.",
  "One breath can become one decision. One decision can become a new direction.",
  "Do not measure your growth only by how you feel. Measure it by how often you return.",
  "You are not starting over. You are continuing with more experience.",
  "Today is not asking you to conquer everything.",
  "The path forward does not have to be fast to be real.",
  "You are allowed to rest without guilt.",
  "A steady mind is not a mind without storms. It is a mind that knows storms pass.",
  "You have more strength than this moment is letting you feel.",
  "Peace often begins with permission: permission to slow down, breathe, and be human.",
  "You do not have to fix every feeling before taking care of yourself.",
  "Your attention is valuable. Spend it wisely today.",
  "A calmer life is built by repeated small returns to what matters.",
  "You can release what is not yours to carry.",
  "The way you speak to yourself matters. Be gentle today.",
  "Your nervous system can learn safety again.",
  "Do not confuse discomfort with danger.",
  "You can be uncertain and still be safe.",
  "Your effort today is part of a bigger story.",
  "You are not alone in needing reminders to stay steady.",
  "Progress may feel invisible while it is forming.",
  "You do not need to win the whole day. Win the next moment.",
  "Let your breath be the place you come back to.",
  "You can choose calm without denying that life is hard.",
  "Healing is often quiet, but it is still powerful.",
  "You are allowed to take your time.",
  "The present moment is smaller than your worries make it seem.",
  "What if you are more capable than your anxiety predicts?",
  "You can notice fear without obeying it.",
  "Small acts of steadiness become habits of strength.",
  "You have permission to do less and do it with peace.",
  "Your life is not measured by anxious moments.",
  "Let today teach you patience, not pressure.",
  "Your mind can be trained. Your peace can be practiced.",
  "You do not need to feel ready to begin.",
  "The next breath is a doorway back to the present.",
  "You are not broken. You are learning how to care for yourself.",
  "Some days, showing up is the victory.",
  "You can hold hope and uncertainty at the same time.",
  "A steady path is walked one ordinary step at a time.",
  "Do not let urgency steal your wisdom.",
  "You are allowed to move through today slowly.",
  "The storm is not permanent. Keep walking.",
  "You are building trust with yourself every time you keep going.",
  "Calm is a skill. Practice counts.",
  "You can let a thought pass without proving it wrong.",
  "Today, choose what grounds you.",
  "Your peace does not need permission from your circumstances.",
  "You have handled hard things before.",
  "The mind can imagine danger. The body can learn safety.",
  "Let your next choice be kind.",
  "You do not have to finish everything to be proud of yourself.",
  "There is strength in quiet consistency.",
  "Your emotions are information, not instructions.",
  "You can feel overwhelmed and still take one small step.",
  "Peace grows where attention is gently redirected.",
  "You are becoming steadier through practice.",
  "A difficult thought does not deserve your whole day.",
  "Let calm be something you build, not something you wait for.",
  "Your future needs your patience more than your panic.",
  "Breathe like you are allowed to be here.",
  "You do not have to rush your growth.",
  "You can come back to yourself at any time.",
  "Not every problem needs to be solved today.",
  "Your mind may wander. Your power is in returning.",
  "Calm is not found by waiting for life to become quiet. It is built by learning to remain steady while life is still moving.",
  "You do not have to solve tomorrow today. One steady step is enough for this moment.",
  "Progress is rarely loud. Most lasting change happens quietly, one small choice at a time.",
  "Your mind may offer fear, but you do not have to accept every thought as truth.",
  "A difficult moment is not proof of a difficult life. It is only a moment asking for steadiness.",
  "You can be anxious and still be capable. You can feel uncertain and still move forward.",
  "Peace begins when you stop arguing with every thought that enters your mind.",
  "Your breath is a reminder that you are still here, still trying, still able to begin again.",
  "Not every feeling needs a solution. Some feelings simply need space, patience, and kindness.",
  "You are allowed to slow down without feeling like you are falling behind.",
  "One calm decision can interrupt an entire cycle of worry.",
  "You do not need perfect confidence to take the next right step.",
  "The storm in your mind does not get to decide the direction of your life.",
  "Growth often feels uncomfortable before it feels empowering.",
  "You are not weak for needing support. You are wise for choosing tools that help you stay steady.",
  "Today does not require perfection. It asks only for presence.",
  "Your thoughts can be loud without being accurate.",
  "You are building strength every time you return to calm instead of surrendering to panic.",
  "Small steps count, especially on the days when they feel hard.",
  "You are not behind. You are becoming.",
  "A steady life is built by steady returns, not flawless days.",
  "You can acknowledge anxiety without handing it the wheel.",
  "Let today be handled one breath, one choice, one moment at a time.",
  "Your future is not decided by how you feel this morning.",
  "Every time you pause before reacting, you are practicing freedom.",
  "You are allowed to outgrow old patterns slowly.",
  "Peace is not the absence of pressure. It is learning how to breathe beneath it.",
  "You have survived days you once thought would break you.",
  "A thought is not a command. You can observe it and let it pass.",
  "The smallest act of care is still care.",
  "You do not have to carry yesterday into today.",
  "Your progress is real, even when it is not obvious.",
  "Let your next step be small enough to take and meaningful enough to matter.",
  "You can be a work in progress and still be worthy of peace.",
  "The goal is not to never feel anxious. The goal is to know you can steady yourself when anxiety appears.",
  "Your mind may race, but your body can learn to slow.",
  "You are not failing because today feels heavy.",
  "Consistency is built by returning, not by never missing.",
  "You are stronger than the feeling trying to convince you otherwise.",
  "Calm can begin with one honest breath.",
  "Do not let one hard hour define your whole day.",
  "You do not need to believe every story anxiety tells.",
  "Today, choose progress over pressure.",
  "You can move gently and still move forward.",
  "The fact that you are trying matters.",
  "You are allowed to begin again without punishing yourself for stopping.",
  "There is courage in choosing calm when worry feels familiar.",
  "The next right step is enough light for now.",
  "You do not have to become a different person today. Just take one steadier step.",
  "A peaceful mind is trained through practice, not demanded through pressure.",
  "You are learning how to be steady, and learning takes time.",
  "Pause. Breathe. Return. That is progress.",
  "You are not your worst thought.",
  "Let today be simple. Let your effort be enough.",
  "Anxiety may visit, but it does not have to move in.",
  "You can feel afraid and still make a wise choice.",
  "Your peace is worth protecting.",
  "One breath can become one decision. One decision can become a new direction.",
  "Do not measure your growth only by how you feel. Measure it by how often you return.",
  "You are not starting over. You are continuing with more experience.",
  "Today is not asking you to conquer everything.",
  "The path forward does not have to be fast to be real.",
  "You are allowed to rest without guilt.",
  "A steady mind is not a mind without storms. It is a mind that knows storms pass.",
  "You have more strength than this moment is letting you feel.",
  "Peace often begins with permission: permission to slow down, breathe, and be human.",
  "You do not have to fix every feeling before taking care of yourself.",
  "Your attention is valuable. Spend it wisely today.",
  "A calmer life is built by repeated small returns to what matters.",
  "You can release what is not yours to carry.",
  "The way you speak to yourself matters. Be gentle today.",
  "Your nervous system can learn safety again.",
  "Do not confuse discomfort with danger.",
  "You can be uncertain and still be safe.",
  "Your effort today is part of a bigger story.",
  "You are not alone in needing reminders to stay steady.",
  "Progress may feel invisible while it is forming.",
  "You do not need to win the whole day. Win the next moment.",
  "Let your breath be the place you come back to.",
  "You can choose calm without denying that life is hard.",
  "Healing is often quiet, but it is still powerful.",
  "You are allowed to take your time.",
  "The present moment is smaller than your worries make it seem.",
  "What if you are more capable than your anxiety predicts?",
  "You can notice fear without obeying it.",
  "Small acts of steadiness become habits of strength.",
  "You have permission to do less and do it with peace.",
  "Your life is not measured by anxious moments.",
  "Let today teach you patience, not pressure.",
  "Your mind can be trained. Your peace can be practiced.",
  "You do not need to feel ready to begin.",
  "The next breath is a doorway back to the present.",
  "You are not broken. You are learning how to care for yourself.",
  "Some days, showing up is the victory.",
  "You can hold hope and uncertainty at the same time.",
  "A steady path is walked one ordinary step at a time.",
  "Do not let urgency steal your wisdom.",
  "You are allowed to move through today slowly.",
  "The storm is not permanent. Keep walking.",
  "You are building trust with yourself every time you keep going.",
  "Calm is a skill. Practice counts.",
  "You can let a thought pass without proving it wrong.",
  "Today, choose what grounds you.",
  "Your peace does not need permission from your circumstances.",
  "You have handled hard things before.",
  "The mind can imagine danger. The body can learn safety.",
  "Let your next choice be kind.",
  "You do not have to finish everything to be proud of yourself.",
  "There is strength in quiet consistency.",
  "Your emotions are information, not instructions.",
  "You can feel overwhelmed and still take one small step.",
  "Peace grows where attention is gently redirected.",
  "You are becoming steadier through practice.",
  "A difficult thought does not deserve your whole day.",
  "Let calm be something you build, not something you wait for.",
  "Your future needs your patience more than your panic.",
  "Breathe like you are allowed to be here.",
  "You do not have to rush your growth.",
  "You can come back to yourself at any time.",
  "Not every problem needs to be solved today.",
  "Your mind may wander. Your power is in returning.",
  "Calm is not found by waiting for life to become quiet. It is built by learning to remain steady while life is still moving.",
  "You do not have to solve tomorrow today. One steady step is enough for this moment.",
  "Progress is rarely loud. Most lasting change happens quietly, one small choice at a time.",
  "Your mind may offer fear, but you do not have to accept every thought as truth.",
  "A difficult moment is not proof of a difficult life. It is only a moment asking for steadiness.",
  "You can be anxious and still be capable. You can feel uncertain and still move forward.",
  "Peace begins when you stop arguing with every thought that enters your mind.",
  "Your breath is a reminder that you are still here, still trying, still able to begin again.",
  "Not every feeling needs a solution. Some feelings simply need space, patience, and kindness.",
  "You are allowed to slow down without feeling like you are falling behind.",
  "One calm decision can interrupt an entire cycle of worry.",
  "You do not need perfect confidence to take the next right step.",
  "The storm in your mind does not get to decide the direction of your life.",
  "Growth often feels uncomfortable before it feels empowering.",
  "You are not weak for needing support. You are wise for choosing tools that help you stay steady.",
  "Today does not require perfection. It asks only for presence.",
  "Your thoughts can be loud without being accurate.",
  "You are building strength every time you return to calm instead of surrendering to panic.",
  "Small steps count, especially on the days when they feel hard.",
  "You are not behind. You are becoming.",
  "A steady life is built by steady returns, not flawless days.",
  "You can acknowledge anxiety without handing it the wheel.",
  "Let today be handled one breath, one choice, one moment at a time.",
  "Your future is not decided by how you feel this morning.",
  "Every time you pause before reacting, you are practicing freedom.",
  "You are allowed to outgrow old patterns slowly.",
  "Peace is not the absence of pressure. It is learning how to breathe beneath it.",
  "You have survived days you once thought would break you.",
  "A thought is not a command. You can observe it and let it pass.",
  "The smallest act of care is still care.",
  "You do not have to carry yesterday into today.",
  "Your progress is real, even when it is not obvious.",
  "Let your next step be small enough to take and meaningful enough to matter.",
  "You can be a work in progress and still be worthy of peace.",
  "The goal is not to never feel anxious. The goal is to know you can steady yourself when anxiety appears.",
  "Your mind may race, but your body can learn to slow.",
  "You are not failing because today feels heavy.",
  "Consistency is built by returning, not by never missing.",
  "You are stronger than the feeling trying to convince you otherwise.",
  "Calm can begin with one honest breath.",
  "Do not let one hard hour define your whole day.",
  "You do not need to believe every story anxiety tells.",
  "Today, choose progress over pressure.",
  "You can move gently and still move forward.",
  "The fact that you are trying matters.",
  "You are allowed to begin again without punishing yourself for stopping.",
  "There is courage in choosing calm when worry feels familiar.",
  "The next right step is enough light for now.",
  "You do not have to become a different person today. Just take one steadier step.",
  "A peaceful mind is trained through practice, not demanded through pressure.",
  "You are learning how to be steady, and learning takes time.",
  "Pause. Breathe. Return. That is progress.",
  "You are not your worst thought.",
  "Let today be simple. Let your effort be enough.",
  "Anxiety may visit, but it does not have to move in.",
  "You can feel afraid and still make a wise choice.",
  "Your peace is worth protecting.",
  "One breath can become one decision. One decision can become a new direction.",
  "Do not measure your growth only by how you feel. Measure it by how often you return.",
  "You are not starting over. You are continuing with more experience.",
  "Today is not asking you to conquer everything.",
  "The path forward does not have to be fast to be real.",
  "You are allowed to rest without guilt.",
  "A steady mind is not a mind without storms. It is a mind that knows storms pass.",
  "You have more strength than this moment is letting you feel.",
  "Peace often begins with permission: permission to slow down, breathe, and be human.",
  "You do not have to fix every feeling before taking care of yourself.",
  "Your attention is valuable. Spend it wisely today.",
  "A calmer life is built by repeated small returns to what matters.",
  "You can release what is not yours to carry.",
  "The way you speak to yourself matters. Be gentle today.",
  "Your nervous system can learn safety again.",
  "Do not confuse discomfort with danger.",
  "You can be uncertain and still be safe.",
  "Your effort today is part of a bigger story.",
  "You are not alone in needing reminders to stay steady.",
  "Progress may feel invisible while it is forming.",
  "You do not need to win the whole day. Win the next moment.",
  "Let your breath be the place you come back to.",
  "You can choose calm without denying that life is hard.",
  "Healing is often quiet, but it is still powerful.",
  "You are allowed to take your time.",
  "The present moment is smaller than your worries make it seem.",
  "What if you are more capable than your anxiety predicts?",
  "You can notice fear without obeying it.",
  "Small acts of steadiness become habits of strength.",
  "You have permission to do less and do it with peace.",
  "Your life is not measured by anxious moments.",
  "Let today teach you patience, not pressure.",
  "Your mind can be trained. Your peace can be practiced.",
  "You do not need to feel ready to begin.",
  "The next breath is a doorway back to the present.",
  "You are not broken. You are learning how to care for yourself.",
  "Some days, showing up is the victory.",
  "You can hold hope and uncertainty at the same time.",
  "A steady path is walked one ordinary step at a time.",
  "Do not let urgency steal your wisdom.",
  "You are allowed to move through today slowly.",
  "The storm is not permanent. Keep walking.",
  "You are building trust with yourself every time you keep going.",
  "Calm is a skill. Practice counts.",
  "You can let a thought pass without proving it wrong.",
  "Today, choose what grounds you.",
  "Your peace does not need permission from your circumstances.",
  "You have handled hard things before.",
  "The mind can imagine danger. The body can learn safety.",
  "Let your next choice be kind.",
  "You do not have to finish everything to be proud of yourself.",
  "There is strength in quiet consistency.",
  "Your emotions are information, not instructions.",
  "You can feel overwhelmed and still take one small step.",
  "Peace grows where attention is gently redirected.",
  "You are becoming steadier through practice.",
  "A difficult thought does not deserve your whole day.",
  "Let calm be something you build, not something you wait for.",
  "Your future needs your patience more than your panic.",
  "Breathe like you are allowed to be here.",
  "You do not have to rush your growth.",
  "You can come back to yourself at any time.",
  "Not every problem needs to be solved today.",
  "Your mind may wander. Your power is in returning.",
  "Calm is not found by waiting for life to become quiet. It is built by learning to remain steady while life is still moving.",
  "You do not have to solve tomorrow today. One steady step is enough for this moment."
];

function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch(e) { return fallback; }
}

function loadAppData() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), null);
  appData = saved ? { ...structuredClone(DEFAULT_DATA), ...saved } : structuredClone(DEFAULT_DATA);

  // Source of truth: a plan only exists if savedPlan exists.
  appData.planBuilt = !!(appData.savedPlan && appData.savedPlan.path);
  saveAppData();
}

function saveAppData() {
  appData.planBuilt = !!(appData.savedPlan && appData.savedPlan.path);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function resetSteadierPathData() {
  if(!confirm("Reset SteadierPath as a brand-new user on this device?")) return;
  try {
    Object.keys(localStorage).forEach(key => {
      if(/steady|steadier|steadymind|journal|mood|xp|plan/i.test(key)) localStorage.removeItem(key);
    });
    sessionStorage.clear();
  } catch(e) {}
  appData = structuredClone(DEFAULT_DATA);
  saveAppData();
  alert("SteadierPath data cleared. Reloading now.");
  window.location.href = window.location.origin + window.location.pathname;
}

function viewSteadierPathData() {
  alert(JSON.stringify(appData, null, 2).slice(0, 1200));
}

function showScreen(screenId) {
  stopBreathing();
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(screenId);
  if(screen) screen.classList.add("active");

  if(screenId === "mainMenu") renderHome();
  if(screenId === "dashboard") renderDashboard();
  if(screenId === "weekly") renderWeekly();
  if(screenId === "moodTracker") renderMoodTracker();
  if(screenId === "rewards") renderRewards();
  if(screenId === "settings") renderSettings();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function getDailyMessage() {
  return dailyEncouragementMessages[(getDayOfYear() - 1) % dailyEncouragementMessages.length];
}

function loadDailyEncouragement() {
  const msg = getDailyMessage();
  const home = document.getElementById("dailyEncouragementText");
  const quiet = document.getElementById("quietReminderText");
  if(home) home.textContent = msg;
  if(quiet) quiet.textContent = msg;
}

function showQuietReminderOrHome() {
  loadDailyEncouragement();
  const today = new Date().toDateString();
  if(localStorage.getItem("steadierPath.v58.quietReminderSeen") === today) showScreen("mainMenu");
  else showScreen("quietReminder");
}

function enterMainMenuFromReminder() {
  localStorage.setItem("steadierPath.v58.quietReminderSeen", new Date().toDateString());
  showScreen("mainMenu");
}

function getCheckedValues() {
  return Array.from(document.querySelectorAll('#improveOptions input[type="checkbox"]:checked')).map(x => x.value);
}

function toggleImproveOptions() {
  document.getElementById("improveOptions")?.classList.toggle("hidden");
}

function updateImproveButton() {
  const values = getCheckedValues();
  const button = document.querySelector(".dropdown-toggle");
  const chips = document.getElementById("selectedImprovements");
  if(button) button.textContent = values.length ? (values.length <= 2 ? values.join(", ") : values.length + " areas selected") : "Select improvement areas";
  if(chips) chips.innerHTML = values.length ? values.map(v => `<span>${v}</span>`).join("") : "No areas selected yet.";
}

function determinePrimaryPath(improvements, challenge) {
  const all = [...improvements, challenge].join(" ").toLowerCase();
  if(all.includes("panic") || all.includes("anxiety") || all.includes("racing")) return { name:"Calm & Anxiety", title:"Calm Foundations", daily:["60-second breathing reset","Grounding exercise","Name one thing you can control today"] };
  if(all.includes("overthinking") || all.includes("negative")) return { name:"Overthinking", title:"Mental Clarity", daily:["Thought challenge","Worry release journal","One-minute mindful pause"] };
  if(all.includes("confidence") || all.includes("social") || all.includes("performance")) return { name:"Confidence", title:"Confidence Builder", daily:["Small courage challenge","Confidence script","Post-action reflection"] };
  if(all.includes("focus")) return { name:"Focus", title:"Focus Reset", daily:["Distraction clear-out","5-minute focus timer","One-task commitment"] };
  if(all.includes("stress") || all.includes("burnout") || all.includes("work")) return { name:"Stress & Burnout", title:"Stress Recovery", daily:["Body tension scan","Recovery break","One boundary for today"] };
  if(all.includes("motivation")) return { name:"Motivation", title:"Momentum Builder", daily:["Tiny goal","Win log","One next step"] };
  return { name:"Balanced Growth", title:"Steady Foundations", daily:["Breathing reset","Short reflection","One steady action"] };
}

function determineMindType(improvements, challenge, hope) {
  const all = [...improvements, challenge, hope].join(" ").toLowerCase();
  if(all.includes("racing") || all.includes("panic") || all.includes("stress")) return { name:"🌊 Storm Navigator", description:"You may feel pulled by pressure, racing thoughts, or emotional storms, but your goal is to become steadier under stress." };
  if(all.includes("overthinking") || all.includes("negative")) return { name:"🧠 Deep Thinker", description:"Your mind works hard to understand and prepare, but SteadierPath will help you turn mental noise into clarity." };
  if(all.includes("confidence") || all.includes("social")) return { name:"🦁 Quiet Leader", description:"You may doubt yourself at times, but there is courage there. SteadierPath helps you build it through small actions." };
  if(all.includes("burnout") || all.includes("work")) return { name:"🔥 Burned-Out Achiever", description:"You keep pushing, but your mind and body need recovery. SteadierPath will help you rebuild energy and balance." };
  return { name:"🌱 Steady Builder", description:"You are ready to grow with calm, consistency, and simple daily steps." };
}

function getPathTitle(plan) {
  if(!plan || !plan.path) return "Calm Foundations";
  return typeof plan.path === "string" ? plan.path : (plan.path.title || plan.path.name || "Calm Foundations");
}

function getPathName(plan) {
  if(!plan || !plan.path) return "Calm & Anxiety";
  return typeof plan.path === "string" ? plan.path : (plan.path.name || plan.path.title || "Calm & Anxiety");
}

function getDailySteps(plan) {
  return plan && plan.path && Array.isArray(plan.path.daily) ? plan.path.daily : ["60-second breathing reset","Grounding exercise","Name one thing you can control today"];
}

function buildPlanAndSave() {
  const improvements = getCheckedValues();
  const challenge = document.getElementById("challenge").value;
  const time = document.getElementById("timeCommitment").value;
  const hope = document.getElementById("hope").value;
  const userType = document.getElementById("userType").value;
  const path = determinePrimaryPath(improvements, challenge);
  const mindType = determineMindType(improvements, challenge, hope);
  const improvementText = improvements.length ? improvements.join(", ") : "your steady mind";

  appData.savedPlan = {
    improvements, challenge, time, hope, userType, improvementText, path, mindType,
    supportingPaths: improvements.filter(v => v !== path.name).slice(0, 3),
    createdAt: new Date().toLocaleDateString()
  };
  appData.planBuilt = true;
  saveAppData();

  renderHome();
  renderDashboard();
  showScreen("dashboard");
}

function handleHomePlanCTA(event) {
  if(event) event.stopPropagation();
  loadAppData();
  if(appData.savedPlan && appData.savedPlan.path) showScreen("dashboard");
  else showScreen("assessment");
}

function renderHome() {
  loadDailyEncouragement();
  const plan = appData.savedPlan;
  const hasPlan = !!(plan && plan.path);

  const status = document.getElementById("planStatus");
  const heading = document.getElementById("homePlanHeading");
  const sub = document.getElementById("homePlanSubheading");
  const desc = document.getElementById("homePlanDescription");
  const btn = document.getElementById("homePlanCTA");

  if(!hasPlan) {
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';
    if(heading) heading.textContent = "Build My Plan";
    if(sub) sub.textContent = "Build your personalized path";
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";
    if(btn) btn.textContent = "Build My Plan →";
  } else {
    if(status) status.textContent = `Plan ready: ${getPathTitle(plan)} · ${plan.time} per day`;
    if(heading) heading.innerHTML = "Continue My<br>Plan";
    if(sub) sub.textContent = "Return to your personalized path";
    if(desc) desc.textContent = `Today's Focus: ${getPathName(plan)}. ${getDailySteps(plan)[0]}.`;
    if(btn) btn.textContent = "Continue My Plan →";
  }

  const percent = Math.min(appData.completedActivities * 20, 100);
  const txt = document.getElementById("homeProgressText");
  const fill = document.getElementById("homeProgressFill");
  if(txt) txt.textContent = `${percent}% Complete`;
  if(fill) fill.style.width = `${percent}%`;
}

function renderDashboard() {
  const plan = appData.savedPlan;
  const profileCard = document.getElementById("profileCard");
  const mindTypeCard = document.getElementById("mindTypeCard");
  const pathCard = document.getElementById("pathCard");
  const dailyPlanCard = document.getElementById("dailyPlanCard");

  if(!plan || !plan.path) {
    if(profileCard) profileCard.innerHTML = "Complete the assessment to create your personalized profile.";
    if(mindTypeCard) mindTypeCard.innerHTML = "Your mind type will appear here after your assessment.";
    if(pathCard) pathCard.innerHTML = "Your primary path will appear here after your assessment.";
    if(dailyPlanCard) dailyPlanCard.innerHTML = "Start with one small steady action today.";
    updateXP();
    return;
  }

  if(profileCard) profileCard.innerHTML = `
    <div class="profile-row"><span>👤</span><span class="profile-label">User type</span><span class="profile-value">${plan.userType}</span></div>
    <div class="profile-row"><span>🎯</span><span class="profile-label">Wants to improve</span><span class="profile-value">${plan.improvementText}</span></div>
    <div class="profile-row"><span>🧠</span><span class="profile-label">Biggest challenge</span><span class="profile-value">${plan.challenge}</span></div>
    <div class="profile-row"><span>♡</span><span class="profile-label">Desired feeling</span><span class="profile-value">${plan.hope}</span></div>
    <div class="profile-row"><span>◷</span><span class="profile-label">Time available</span><span class="profile-value">${plan.time} per day</span></div>
  `;
  if(mindTypeCard) mindTypeCard.innerHTML = `<strong>${plan.mindType.name}</strong><p>${plan.mindType.description}</p>`;
  if(pathCard) pathCard.innerHTML = `<strong>Primary Path: ${getPathTitle(plan)}</strong><br><br>Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>This path helps you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;
  if(dailyPlanCard) {
    const steps = getDailySteps(plan);
    dailyPlanCard.innerHTML = `<strong>Today's Focus: ${getPathName(plan)}</strong><br><br><strong>Your ${plan.time} reset:</strong><ol><li>${steps[0]}</li><li>${steps[1]}</li><li>${steps[2]}</li></ol>`;
  }
  updateXP();
}

function levelFromXP(points) { return Math.floor(points / LEVEL_SIZE) + 1; }
function levelName(level) {
  const names = ["Calm Seeker","Steady Builder","Storm Navigator","Resilient Thinker","Grounded Guide","Quiet Strength","Focused Pathmaker","Night Calm","Confidence Carrier","SteadierPath Master"];
  return `Level ${level}: ${names[Math.min(level - 1, names.length - 1)]}`;
}

function addXP(amount) {
  appData.mindPoints += amount;
  appData.completedActivities += 1;
  appData.streak = Math.max(appData.streak, 1);
  saveAppData();
  updateXP();
  renderHome();
}

function updateXP() {
  const level = levelFromXP(appData.mindPoints);
  const current = appData.mindPoints - ((level - 1) * LEVEL_SIZE);
  const remaining = LEVEL_SIZE - current;
  const percent = Math.min((current / LEVEL_SIZE) * 100, 100);
  [["xpFill", percent], ["rewardsXpFill", percent]].forEach(([id,p]) => { const el = document.getElementById(id); if(el) el.style.width = p + "%"; });
  const xpText = document.getElementById("xpText"); if(xpText) xpText.textContent = `${current} / ${LEVEL_SIZE} Mind Points`;
  const levelEl = document.getElementById("levelName"); if(levelEl) levelEl.textContent = levelName(level);
  const next = document.getElementById("nextLevelText"); if(next) next.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
  const acts = document.getElementById("activitiesText"); if(acts) acts.textContent = appData.completedActivities;
  const streak = document.getElementById("streakText"); if(streak) streak.textContent = appData.streak + (appData.streak === 1 ? " day" : " days");
  renderRewards();
}

function renderRewards() {
  const level = levelFromXP(appData.mindPoints);
  const current = appData.mindPoints - ((level - 1) * LEVEL_SIZE);
  const remaining = LEVEL_SIZE - current;
  const card = document.getElementById("rewardsLevelCard"); if(card) card.textContent = levelName(level);
  const txt = document.getElementById("rewardsXpText"); if(txt) txt.textContent = `${current} / ${LEVEL_SIZE} XP`;
  const rem = document.getElementById("rewardsRemainingText"); if(rem) rem.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
}

const todayPlanSteps = [
  {name:"60-Second Breathing Reset", text:"Begin by slowing your breath. Tap the breathing bubble and follow the rhythm."},
  {name:"Grounding", text:"Name one thing you can see, one thing you can feel, and one thing you can hear."},
  {name:"Reflection", text:"What is one thought you can release today?"},
  {name:"Small Step", text:"Choose one small steady action you can take next."},
  {name:"Complete", text:"Excellent work. A steady path is built through small returns."}
];

function startTodayPlan() {
  todayPlanStep = -1;
  showScreen("todayPlan");
  nextTodayPlanStep();
}

function nextTodayPlanStep() {
  todayPlanStep++;
  if(todayPlanStep >= todayPlanSteps.length) {
    addXP(20);
    todayPlanStep = -1;
    showScreen("dashboard");
    return;
  }
  const step = todayPlanSteps[todayPlanStep];
  document.getElementById("todayPlanStepLabel").textContent = `Step ${todayPlanStep+1} of ${todayPlanSteps.length}`;
  document.getElementById("todayPlanStepName").textContent = step.name;
  document.getElementById("todayPlanContent").textContent = step.text;
  document.getElementById("todayPlanProgressFill").style.width = `${((todayPlanStep+1)/todayPlanSteps.length)*100}%`;
  document.getElementById("todayPlanBreathingArea").classList.toggle("hidden", todayPlanStep !== 0);
  document.getElementById("todayPlanNextBtn").textContent = todayPlanStep === todayPlanSteps.length - 1 ? "Finish +20 XP" : "Next";
}

function startBreathing() {
  const circle = document.querySelector(".breathing-circle");
  const box = document.getElementById("breathingBox");
  if(!circle || !box || breathingRunning) return;
  breathingRunning = true;
  let elapsed = 0, phase = 0, phaseElapsed = 0;
  const phases = [
    {text:"Breathe in slowly...", className:"inhale", seconds:4},
    {text:"Hold gently...", className:"hold", seconds:4},
    {text:"Breathe out fully...", className:"exhale", seconds:6},
    {text:"Rest...", className:"rest", seconds:6}
  ];
  function apply() {
    circle.classList.remove("inhale","hold","exhale","rest");
    circle.classList.add(phases[phase].className);
    box.textContent = phases[phase].text;
  }
  apply();
  breathingInterval = setInterval(() => {
    elapsed++; phaseElapsed++;
    if(phaseElapsed >= phases[phase].seconds) { phase = (phase + 1) % phases.length; phaseElapsed = 0; apply(); }
    if(elapsed >= 60) { stopBreathing(); box.textContent = "60-second reset complete."; addXP(5); }
  }, 1000);
}

function stopBreathing() {
  if(breathingInterval) clearInterval(breathingInterval);
  breathingInterval = null;
  breathingRunning = false;
}

const emergencyTools = {
  breathing: { icon:"🚨", title:"60-Second Reset", steps:["Pause. Place both feet on the ground.","Take one slow breath in.","Let your shoulders drop as you breathe out.","You are safe in this moment.","You can return to calm one breath at a time."] },
  grounding: { icon:"🌿", title:"Grounding", steps:["Name five things you can see.","Notice four things you can feel.","Listen for three sounds.","Name two things you can smell.","The present is smaller than your worries make it seem."] },
  worry: { icon:"🕊️", title:"Worry Release", steps:["Name the worry without judging it.","Ask: is this a fact, fear, or assumption?","Choose one thing you can control.","Let the rest be handled later.","You do not have to solve tomorrow today."] },
  sleep: { icon:"🌙", title:"Sleep Wind-Down", steps:["Let your jaw soften.","Lower your shoulders.","Set tomorrow's concern aside.","Take three slow breaths.","Rest is part of healing."] }
};

function openEmergencyTool(type) {
  currentEmergencyTool = emergencyTools[type];
  currentEmergencyStep = -1;
  document.getElementById("emergencyToolIcon").textContent = currentEmergencyTool.icon;
  document.getElementById("emergencyToolTitle").textContent = currentEmergencyTool.title;
  document.getElementById("emergencyMessageBubble").textContent = "Press Next to begin.";
  document.getElementById("emergencyNextBtn").textContent = "Next";
  showScreen("emergencyToolPlayer");
}

function nextEmergencyToolStep() {
  if(!currentEmergencyTool) return;
  currentEmergencyStep++;
  if(currentEmergencyStep >= currentEmergencyTool.steps.length) return completeEmergencyTool();
  document.getElementById("emergencyMessageBubble").textContent = currentEmergencyTool.steps[currentEmergencyStep];
  document.getElementById("emergencyNextBtn").textContent = currentEmergencyStep === currentEmergencyTool.steps.length - 1 ? "Finish" : "Next";
}

function completeEmergencyTool() {
  addXP(10);
  document.getElementById("emergencyMessageBubble").innerHTML = "<strong>Tool complete.</strong><br>You took a steady step back toward calm.";
  document.getElementById("emergencyNextBtn").textContent = "Done";
}

function saveCheckIn() {
  const mood = document.getElementById("mood").value;
  const need = document.getElementById("need").value;
  const res = document.getElementById("checkinResult");
  res.classList.remove("hidden");
  res.innerHTML = `<strong>Check-in saved.</strong><br>Your mind feels <strong>${mood}</strong>. Today, focus on <strong>${need}</strong>.`;
  addXP(5);
}

function saveJournal() {
  const entry = {
    date:new Date().toLocaleDateString(),
    mood:document.getElementById("journalMood").value,
    feelingWords:document.getElementById("feelingWords").value.trim(),
    weighingMind:document.getElementById("weighingMind").value.trim(),
    controlToday:document.getElementById("controlToday").value.trim(),
    wentWell:document.getElementById("wentWell").value.trim()
  };
  if(!entry.feelingWords && !entry.weighingMind && !entry.controlToday && !entry.wentWell) {
    document.getElementById("journalResult").classList.remove("hidden");
    document.getElementById("journalResult").textContent = "Write at least one reflection before saving.";
    return;
  }
  appData.journals.unshift(entry);
  saveAppData();
  document.getElementById("journalResult").classList.remove("hidden");
  document.getElementById("journalResult").innerHTML = "<strong>Reflection saved.</strong><br>You gave your thoughts a place to land.<br><br>+10 XP";
  addXP(10);
}

function saveMoodEntry() {
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

function renderMoodTracker() {
  const fill = document.getElementById("moodMeterFill");
  const summary = document.getElementById("moodSummary");
  const history = document.getElementById("moodHistory");
  if(!fill || !summary || !history) return;
  if(!appData.moods.length) { fill.style.width = "0%"; summary.textContent = "No mood entries yet."; history.innerHTML = ""; return; }
  const avg = appData.moods.reduce((s,m)=>s+m.score,0)/appData.moods.length;
  fill.style.width = (avg*10) + "%";
  summary.innerHTML = `<strong>Average Calm Score:</strong> ${avg.toFixed(1)} / 10<br><strong>Entries:</strong> ${appData.moods.length}`;
  history.innerHTML = appData.moods.slice(0,7).map(m=>`<div class="card mood-entry"><strong>${m.date}</strong><br>${m.mood} · ${m.score}/10<br>${m.note || ""}</div>`).join("");
}

function openGame(id) { showScreen(id); }
function completeGame(name, xp, score) {
  appData.bestScores[name] = Math.max(appData.bestScores[name] || 0, score || 0);
  saveAppData();
  addXP(xp);
}

function startCenteredGame() {
  const states = ["calm","focus","anxiety","calm","focus"];
  centeredBoard = Array.from({length:25},(_,i)=>states[i%states.length]);
  renderCenteredBoard();
  document.getElementById("centeredMessage").textContent = "Tap anxiety blocks.";
}

function renderCenteredBoard() {
  const board = document.getElementById("centeredBoard");
  board.innerHTML = centeredBoard.map((s,i)=>`<button class="color-cell ${s}" onclick="tapCentered(${i})"></button>`).join("");
}

function tapCentered(i) {
  centeredBoard[i] = centeredBoard[i] === "anxiety" ? "calm" : "focus";
  renderCenteredBoard();
  const left = centeredBoard.filter(x=>x==="anxiety").length;
  document.getElementById("centeredMessage").textContent = `Anxiety blocks left: ${left}.`;
  if(left === 0) {
    document.getElementById("centeredMessage").innerHTML = "<strong>Centered complete.</strong><br>+25 XP";
    completeGame("centered",25,100);
  }
}

const thoughtCards = [
  {text:"I practiced today.",answer:"helpful"},
  {text:"Everyone will judge me.",answer:"unhelpful"},
  {text:"I do not know exactly what will happen.",answer:"uncertain"},
  {text:"I can take one small step.",answer:"helpful"},
  {text:"If I feel anxious, I must be unsafe.",answer:"unhelpful"}
];

function startThoughtSortGame() {
  thoughtIndex = 0; thoughtScore = 0;
  document.getElementById("thoughtSortResult").classList.add("hidden");
  showThoughtCard();
}

function showThoughtCard() {
  document.getElementById("thoughtFloatingCard").textContent = thoughtCards[thoughtIndex].text;
}

function sortThoughtCard(choice) {
  const res = document.getElementById("thoughtSortResult");
  const correct = choice === thoughtCards[thoughtIndex].answer;
  if(correct) thoughtScore++;
  res.classList.remove("hidden");
  res.innerHTML = correct ? "<strong>Correct.</strong>" : "<strong>Good try.</strong>";
  thoughtIndex++;
  if(thoughtIndex >= thoughtCards.length) {
    res.innerHTML += `<br><br><strong>Thought Sort complete.</strong><br>Score: ${thoughtScore}/${thoughtCards.length}<br>+15 XP`;
    document.getElementById("thoughtFloatingCard").textContent = "Game complete.";
    completeGame("thoughtSort",15,thoughtScore);
  } else setTimeout(()=>{res.classList.add("hidden");showThoughtCard();},800);
}

function startCalmFocusRound() {
  const area = document.getElementById("calmFocusPlayArea");
  const result = document.getElementById("calmFocusResult");
  if(calmFocusTimer) clearInterval(calmFocusTimer);
  area.innerHTML = ""; calmFocusScore = 0; calmFocusRunning = true;
  result.textContent = "Tap blue focus orbs. Avoid red noise.";
  spawnFocusOrbs();
  calmFocusTimer = setInterval(spawnFocusOrbs,1500);
}

function spawnFocusOrbs() {
  const area = document.getElementById("calmFocusPlayArea");
  if(!area || !calmFocusRunning) return;
  area.innerHTML = "";
  for(let i=0;i<3;i++) {
    const type = i===0 || Math.random()>.5 ? "focus" : "noise";
    const orb = document.createElement("button");
    orb.className = type==="focus" ? "focus-orb" : "noise-orb";
    orb.textContent = type==="focus" ? "Focus" : "Noise";
    orb.style.left = Math.max(10, Math.random()*(area.clientWidth-90))+"px";
    orb.style.top = Math.max(10, Math.random()*(area.clientHeight-90))+"px";
    orb.onclick = () => {
      if(type==="focus") {
        calmFocusScore++;
        document.getElementById("calmFocusResult").textContent = `Focused: ${calmFocusScore}/8`;
        if(calmFocusScore >= 8) {
          calmFocusRunning = false; clearInterval(calmFocusTimer);
          document.getElementById("calmFocusResult").innerHTML = "<strong>Calm Focus complete.</strong><br>+15 XP";
          completeGame("calmFocus",15,calmFocusScore);
        }
      } else document.getElementById("calmFocusResult").textContent = "Noise noticed. Return gently.";
      orb.remove();
    };
    area.appendChild(orb);
  }
}

function openLesson(topic) {
  const lessons = {
    "Anxiety Basics":"Anxiety is your body's alarm system. The goal is not to fear the alarm, but to understand it and respond steadily.",
    "Overthinking":"Overthinking is often your mind trying to solve uncertainty. Separate useful planning from mental noise.",
    "Confidence":"Confidence grows after action. Small repeated courage steps build self-trust.",
    "Sleep":"Sleep improves when your body feels safe. Wind-down routines teach your nervous system to settle."
  };
  const el = document.getElementById("lessonResult");
  el.classList.remove("hidden");
  el.innerHTML = `<strong>${topic}</strong><br>${lessons[topic]}`;
  addXP(5);
}

function renderWeekly() {
  const el = document.getElementById("weeklyCard");
  if(el) el.innerHTML = `<strong>This week:</strong><br>Activities completed: ${appData.completedActivities}<br>Total XP: ${appData.mindPoints}<br>Journal entries: ${appData.journals.length}<br>Mood entries: ${appData.moods.length}`;
  updateXP();
}

function saveNotificationSettings() {
  appData.notifications = {
    morning: document.getElementById("morningReminder")?.checked || false,
    evening: document.getElementById("eveningReminder")?.checked || false,
    streak: document.getElementById("streakReminder")?.checked || false
  };
  saveAppData();
}

function renderSettings() {
  const n = appData.notifications || {};
  if(document.getElementById("morningReminder")) document.getElementById("morningReminder").checked = !!n.morning;
  if(document.getElementById("eveningReminder")) document.getElementById("eveningReminder").checked = !!n.evening;
  if(document.getElementById("streakReminder")) document.getElementById("streakReminder").checked = !!n.streak;
}

document.addEventListener("DOMContentLoaded", () => {
  loadAppData();
  updateImproveButton();
  loadDailyEncouragement();
  renderHome();
  renderDashboard();
  updateXP();
  setTimeout(() => showScreen("welcome"), 1200);
});
