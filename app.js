/* SteadierPath v56 Clean Build
   Clean baseline: no duplicate HTML IDs, no conflicting home-card overrides.
   Sections included: splash, welcome, quiet reminder, home, assessment, dashboard,
   daily plan, emergency tools, journal, mood tracker, games, education, rewards, settings.
*/

const STORAGE_KEY = "steadierPath.v56.data";
const LEVEL_SIZE = 250;

let appData = {
  mindPoints: 0,
  completedActivities: 0,
  streak: 0,
  planBuilt: false,
  savedPlan: null,
  journals: [],
  moods: [],
  notifications: { morning: false, evening: false, streak: false },
  bestScores: {}
};

let currentEmergencyTool = null;
let currentEmergencyStep = -1;
let todayPlanStep = -1;
let selectedMoodChoice = "Steady";
let breathingInterval = null;
let breathingRunning = false;
let soundEnabled = true;
let audioCtx = null;

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

function safeParse(json, fallback) {
  try { return JSON.parse(json) || fallback; } catch(e) { return fallback; }
}

function saveAppData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  localStorage.setItem("steadierPath.planBuilt", appData.planBuilt ? "true" : "false");
}

function loadAppData() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), null);
  if(saved) {
    appData = { ...appData, ...saved };
  }

  const oldPlanBuilt = localStorage.getItem("steadierPath.planBuilt") === "true" || localStorage.getItem("steadyMind.planBuilt") === "true";
  if(oldPlanBuilt) appData.planBuilt = true;

  const savedNotifications = safeParse(localStorage.getItem("steadierPath.notifications"), null);
  if(savedNotifications) appData.notifications = { ...appData.notifications, ...savedNotifications };
}

function showScreen(screenId) {
  stopBreathing();
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  const next = document.getElementById(screenId);
  if(next) next.classList.add("active");
  if(screenId === "mainMenu") renderHome();
  if(screenId === "dashboard") renderSavedPlan();
  if(screenId === "weekly") renderWeekly();
  if(screenId === "moodTracker") renderMoodTracker();
  if(screenId === "rewards") renderRewards();
  if(screenId === "settings") loadNotificationSettings();
  if(screenId === "journal") updateSmartPrompts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function getDailyMessage() {
  const idx = (getDayOfYear() - 1) % dailyEncouragementMessages.length;
  return dailyEncouragementMessages[idx];
}

function loadDailyEncouragement() {
  const message = getDailyMessage();
  const home = document.getElementById("dailyEncouragementText");
  const quiet = document.getElementById("quietReminderText");
  if(home) home.textContent = message;
  if(quiet) quiet.textContent = message;
}

function showQuietReminderOrHome() {
  loadDailyEncouragement();
  const today = new Date().toDateString();
  const lastSeen = localStorage.getItem("steadierPath.quietReminderSeenDate");
  if(lastSeen === today) showScreen("mainMenu");
  else showScreen("quietReminder");
}

function enterMainMenuFromReminder() {
  localStorage.setItem("steadierPath.quietReminderSeenDate", new Date().toDateString());
  showScreen("mainMenu");
}

/* Assessment and plan */
function toggleImproveOptions(){
  const options = document.getElementById("improveOptions");
  if(options) options.classList.toggle("hidden");
}

function getCheckedValues(){
  return Array.from(document.querySelectorAll('#improveOptions input[type="checkbox"]:checked')).map(item => item.value);
}

function updateImproveButton(){
  const improvements = getCheckedValues();
  const button = document.querySelector(".dropdown-toggle");
  const chips = document.getElementById("selectedImprovements");

  if(button){
    button.textContent = improvements.length === 0 ? "Select improvement areas" :
      improvements.length <= 2 ? improvements.join(", ") : improvements.length + " areas selected";
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
    return { name: "Calm & Anxiety", title: "Calm Foundations", daily: ["60-second breathing reset", "Grounding exercise", "Name one thing you can control today"] };
  }
  if(all.includes("overthinking") || all.includes("negative")){
    return { name: "Overthinking", title: "Mental Clarity", daily: ["Thought challenge", "Worry release journal", "One-minute mindful pause"] };
  }
  if(all.includes("confidence") || all.includes("social anxiety") || all.includes("low confidence") || all.includes("performance")){
    return { name: "Confidence", title: "Confidence Builder", daily: ["Small courage challenge", "Confidence script", "Post-action reflection"] };
  }
  if(all.includes("focus")){
    return { name: "Focus", title: "Focus Reset", daily: ["Distraction clear-out", "5-minute focus timer", "One-task commitment"] };
  }
  if(all.includes("stress") || all.includes("burnout") || all.includes("work stress")){
    return { name: "Stress & Burnout", title: "Stress Recovery", daily: ["Body tension scan", "Recovery break", "One boundary for today"] };
  }
  if(all.includes("motivation")){
    return { name: "Motivation", title: "Momentum Builder", daily: ["Tiny goal", "Win log", "One next step"] };
  }
  return { name: "Balanced Growth", title: "Steady Foundations", daily: ["Breathing reset", "Short reflection", "One steady action"] };
}

function determineMindType(improvements, challenge, hope){
  const all = [...improvements, challenge, hope].join(" ").toLowerCase();

  if(all.includes("racing thoughts") || all.includes("panic") || all.includes("stress")){
    return { name: "🌊 Storm Navigator", description: "You may feel pulled by pressure, racing thoughts, or emotional storms, but your goal is to become steadier under stress." };
  }
  if(all.includes("overthinking") || all.includes("negative")){
    return { name: "🧠 Deep Thinker", description: "Your mind works hard to understand and prepare, but SteadierPath will help you turn mental noise into clarity." };
  }
  if(all.includes("confidence") || all.includes("social anxiety")){
    return { name: "🦁 Quiet Leader", description: "You may doubt yourself at times, but there is courage there. SteadierPath will help you build it through small actions." };
  }
  if(all.includes("burnout") || all.includes("work stress")){
    return { name: "🔥 Burned-Out Achiever", description: "You keep pushing, but your mind and body need recovery. SteadierPath will help you rebuild energy and balance." };
  }
  if(all.includes("motivation") || all.includes("energized")){
    return { name: "🚀 Momentum Builder", description: "You want to move forward. SteadierPath will help you turn small wins into steady progress." };
  }
  return { name: "🌱 Steady Builder", description: "You are ready to grow with calm, consistency, and simple daily steps." };
}

function buildPlanAndSave(){
  const improvements = getCheckedValues();
  const challenge = document.getElementById("challenge").value;
  const time = document.getElementById("timeCommitment").value;
  const hope = document.getElementById("hope").value;
  const userType = document.getElementById("userType").value;
  const improvementText = improvements.length ? improvements.join(", ") : "your steady mind";
  const path = determinePrimaryPath(improvements, challenge);
  const mindType = determineMindType(improvements, challenge, hope);

  appData.savedPlan = {
    improvements,
    challenge,
    time,
    hope,
    userType,
    improvementText,
    path,
    mindType,
    supportingPaths: improvements.filter(item => item !== path.name).slice(0, 3),
    createdAt: new Date().toLocaleDateString()
  };

  appData.planBuilt = true;
  localStorage.removeItem("steadierPath.forceNewUser");
  saveAppData();
  renderHome();
  renderSavedPlan();
  showScreen("dashboard");
}

function handleHomePlanCTA(event) {
  if(event) event.stopPropagation();
  if(appData.planBuilt && appData.savedPlan) showScreen("dashboard");
  else showScreen("assessment");
}

function renderHome() {
  loadDailyEncouragement();

  const status = document.getElementById("planStatus");
  const heading = document.getElementById("homePlanHeading");
  const sub = document.getElementById("homePlanSubheading");
  const desc = document.getElementById("homePlanDescription");
  const btn = document.getElementById("homePlanCTA");

  if(!appData.planBuilt || !appData.savedPlan) {
    if(status) status.textContent = 'No plan built yet. Start with “Build My Plan.”';
    if(heading) heading.textContent = "Build My Plan";
    if(sub) sub.textContent = "Build your personalized path";
    if(desc) desc.textContent = "Answer a few questions so SteadierPath can guide your daily calm, focus, and confidence plan.";
    if(btn) btn.textContent = "Build My Plan →";
  } else {
    const plan = appData.savedPlan;
    if(status) status.textContent = `Plan ready: ${plan.path.title} · ${plan.time} per day`;
    if(heading) heading.innerHTML = "Continue My<br>Plan";
    if(sub) sub.textContent = "Return to your personalized path";
    if(desc) desc.textContent = `Today's Focus: ${plan.path.name}. ${plan.path.daily[0]}.`;
    if(btn) btn.textContent = "Continue My Plan →";
  }

  const percent = Math.min(appData.completedActivities * 20, 100);
  const progressText = document.getElementById("homeProgressText");
  const progressFill = document.getElementById("homeProgressFill");
  if(progressText) progressText.textContent = `${percent}% Complete`;
  if(progressFill) progressFill.style.width = `${percent}%`;
}

function renderSavedPlan(){
  const plan = appData.savedPlan;
  const profileCard = document.getElementById("profileCard");
  const mindTypeCard = document.getElementById("mindTypeCard");
  const pathCard = document.getElementById("pathCard");
  const dailyPlanCard = document.getElementById("dailyPlanCard");

  if(!plan){
    if(profileCard) profileCard.innerHTML = "Complete the assessment to create your personalized profile.";
    if(mindTypeCard) mindTypeCard.innerHTML = "Your mind type will appear here after your assessment.";
    if(pathCard) pathCard.innerHTML = "Your primary path will appear here after your assessment.";
    if(dailyPlanCard) dailyPlanCard.innerHTML = "Start with one small steady action today.";
    updateXP();
    return;
  }

  if(profileCard) {
    profileCard.innerHTML = `
      <div class="profile-row"><span>👤</span><span class="profile-label">User type</span><span class="profile-value">${plan.userType}</span></div>
      <div class="profile-row"><span>🎯</span><span class="profile-label">Wants to improve</span><span class="profile-value">${plan.improvementText}</span></div>
      <div class="profile-row"><span>🧠</span><span class="profile-label">Biggest challenge</span><span class="profile-value">${plan.challenge}</span></div>
      <div class="profile-row"><span>♡</span><span class="profile-label">Desired feeling</span><span class="profile-value">${plan.hope}</span></div>
      <div class="profile-row"><span>◷</span><span class="profile-label">Time available</span><span class="profile-value">${plan.time} per day</span></div>
    `;
  }

  if(mindTypeCard) mindTypeCard.innerHTML = `<strong>${plan.mindType.name}</strong><p>${plan.mindType.description}</p>`;
  if(pathCard) pathCard.innerHTML = `<strong>Primary Path: ${plan.path.title}</strong><br><br>Supporting Focus: ${plan.supportingPaths.length ? plan.supportingPaths.join(", ") : "Steady daily habits"}<br><br>This path helps you feel more <strong>${plan.hope}</strong> while working through <strong>${plan.challenge}</strong>.`;
  if(dailyPlanCard) dailyPlanCard.innerHTML = `<strong>Today's Focus: ${plan.path.name}</strong><br><br><strong>Your ${plan.time} reset:</strong><ol><li>${plan.path.daily[0]}</li><li>${plan.path.daily[1]}</li><li>${plan.path.daily[2]}</li></ol>`;
  updateXP();
}

/* XP and rewards */
function levelFromXP(points) {
  return Math.floor(points / LEVEL_SIZE) + 1;
}

function levelName(level) {
  const names = [
    "Calm Seeker", "Steady Builder", "Storm Navigator", "Resilient Thinker", "Grounded Guide",
    "Quiet Strength", "Focused Pathmaker", "Night Calm", "Confidence Carrier", "SteadierPath Master"
  ];
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

function updateXP(){
  const level = levelFromXP(appData.mindPoints);
  const levelStart = (level - 1) * LEVEL_SIZE;
  const current = appData.mindPoints - levelStart;
  const remaining = LEVEL_SIZE - current;
  const percent = Math.min((current / LEVEL_SIZE) * 100, 100);

  const xpFill = document.getElementById("xpFill");
  const xpText = document.getElementById("xpText");
  const levelNameEl = document.getElementById("levelName");
  const nextLevelText = document.getElementById("nextLevelText");
  const activitiesText = document.getElementById("activitiesText");
  const streakText = document.getElementById("streakText");

  if(xpFill) xpFill.style.width = percent + "%";
  if(xpText) xpText.textContent = `${current} / ${LEVEL_SIZE} Mind Points`;
  if(levelNameEl) levelNameEl.textContent = levelName(level);
  if(nextLevelText) nextLevelText.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
  if(activitiesText) activitiesText.textContent = appData.completedActivities;
  if(streakText) streakText.textContent = appData.streak + (appData.streak === 1 ? " day" : " days");

  renderRewards();
}

function renderRewards(){
  const level = levelFromXP(appData.mindPoints);
  const current = appData.mindPoints - ((level - 1) * LEVEL_SIZE);
  const remaining = LEVEL_SIZE - current;
  const percent = Math.min((current / LEVEL_SIZE) * 100, 100);
  const levelCard = document.getElementById("rewardsLevelCard");
  const rewardsXpFill = document.getElementById("rewardsXpFill");
  const rewardsXpText = document.getElementById("rewardsXpText");
  const rewardsRemainingText = document.getElementById("rewardsRemainingText");
  if(levelCard) levelCard.textContent = levelName(level);
  if(rewardsXpFill) rewardsXpFill.style.width = percent + "%";
  if(rewardsXpText) rewardsXpText.textContent = `${current} / ${LEVEL_SIZE} XP`;
  if(rewardsRemainingText) rewardsRemainingText.textContent = `${remaining} XP until ${levelName(level + 1)}.`;
}

/* Daily plan */
const todayPlanSteps = [
  { name: "60-Second Breathing Reset", text: "Begin by slowing your breath. Tap the breathing bubble and follow the rhythm." },
  { name: "Grounding", text: "Name one thing you can see, one thing you can feel, and one thing you can hear." },
  { name: "Reflection", text: "What is one thought you can release today?" },
  { name: "Small Step", text: "Choose one small steady action you can take next." },
  { name: "Complete", text: "Excellent work. A steady path is built through small returns." }
];

function startTodayPlan(){
  todayPlanStep = -1;
  showScreen("todayPlan");
  nextTodayPlanStep();
}

function nextTodayPlanStep(){
  todayPlanStep++;
  const step = todayPlanSteps[Math.min(todayPlanStep, todayPlanSteps.length - 1)];
  const label = document.getElementById("todayPlanStepLabel");
  const name = document.getElementById("todayPlanStepName");
  const content = document.getElementById("todayPlanContent");
  const fill = document.getElementById("todayPlanProgressFill");
  const btn = document.getElementById("todayPlanNextBtn");
  const breathingArea = document.getElementById("todayPlanBreathingArea");

  if(label) label.textContent = `Step ${Math.min(todayPlanStep + 1, todayPlanSteps.length)} of ${todayPlanSteps.length}`;
  if(name) name.textContent = step.name;
  if(content) content.textContent = step.text;
  if(fill) fill.style.width = `${((todayPlanStep + 1) / todayPlanSteps.length) * 100}%`;
  if(breathingArea) breathingArea.classList.toggle("hidden", todayPlanStep !== 0);

  if(todayPlanStep >= todayPlanSteps.length - 1) {
    if(btn) btn.textContent = "Finish +20 XP";
  } else {
    if(btn) btn.textContent = "Next";
  }

  if(todayPlanStep >= todayPlanSteps.length) {
    addXP(20);
    todayPlanStep = -1;
    showScreen("dashboard");
  }
}

/* Emergency tools */
const emergencyTools = {
  breathing: { icon: "🚨", title: "60-Second Reset", steps: ["Pause. Place both feet on the ground.", "Take one slow breath in.", "Let your shoulders drop as you breathe out.", "You are safe in this moment.", "Quiet reminder: you can return to calm one breath at a time."] },
  grounding: { icon: "🌿", title: "Grounding", steps: ["Look around and name five things you can see.", "Notice four things you can feel.", "Listen for three sounds.", "Name two things you can smell.", "Quiet reminder: the present is smaller than your worries make it seem."] },
  worry: { icon: "🕊️", title: "Worry Release", steps: ["Name the worry without judging it.", "Ask: is this a fact, a fear, or an assumption?", "Choose one thing you can control.", "Let the rest be handled later.", "Quiet reminder: you do not have to solve tomorrow today."] },
  sleep: { icon: "🌙", title: "Sleep Wind-Down", steps: ["Let your jaw soften.", "Lower your shoulders.", "Write tomorrow's concern down mentally and set it aside.", "Take three slow breaths.", "Quiet reminder: rest is part of healing."] }
};

function openEmergencyTool(type){
  currentEmergencyTool = emergencyTools[type];
  currentEmergencyStep = -1;
  document.getElementById("emergencyToolIcon").textContent = currentEmergencyTool.icon;
  document.getElementById("emergencyToolTitle").textContent = currentEmergencyTool.title;
  document.getElementById("emergencyMessageBubble").textContent = "Press Next to begin.";
  document.getElementById("emergencyStepText").textContent = `Step 1 of ${currentEmergencyTool.steps.length}`;
  document.getElementById("emergencyStepFill").style.width = "0%";
  document.getElementById("breathingBubbleArea").classList.toggle("hidden", type !== "breathing");
  showScreen("emergencyToolPlayer");
}

function nextEmergencyToolStep(){
  if(!currentEmergencyTool) return;
  currentEmergencyStep++;
  if(currentEmergencyStep >= currentEmergencyTool.steps.length) {
    completeEmergencyTool();
    return;
  }
  document.getElementById("emergencyMessageBubble").textContent = currentEmergencyTool.steps[currentEmergencyStep];
  document.getElementById("emergencyStepText").textContent = `Step ${currentEmergencyStep + 1} of ${currentEmergencyTool.steps.length}`;
  document.getElementById("emergencyStepFill").style.width = `${((currentEmergencyStep + 1) / currentEmergencyTool.steps.length) * 100}%`;
  document.getElementById("emergencyNextBtn").textContent = currentEmergencyStep === currentEmergencyTool.steps.length - 1 ? "Finish" : "Next";
}

function completeEmergencyTool(){
  addXP(10);
  document.getElementById("emergencyMessageBubble").innerHTML = "<strong>Tool complete.</strong><br>You took a steady step back toward calm.";
  document.getElementById("emergencyNextBtn").textContent = "Done";
}

function startBreathing(){
  const circle = document.querySelector(".breathing-circle");
  const box = document.getElementById("breathingBox") || document.getElementById("todayPlanBreathingText");
  if(!circle || !box || breathingRunning) return;
  breathingRunning = true;
  let elapsed = 0;
  const phases = [
    { text: "Breathe in slowly...", className: "inhale", seconds: 4 },
    { text: "Hold gently...", className: "hold", seconds: 4 },
    { text: "Breathe out fully...", className: "exhale", seconds: 6 },
    { text: "Rest...", className: "rest", seconds: 6 }
  ];
  let phaseIndex = 0;
  let phaseElapsed = 0;

  function applyPhase() {
    const phase = phases[phaseIndex];
    circle.classList.remove("inhale", "hold", "exhale", "rest");
    circle.classList.add(phase.className);
    box.textContent = phase.text;
  }

  applyPhase();
  breathingInterval = setInterval(() => {
    elapsed++;
    phaseElapsed++;
    if(phaseElapsed >= phases[phaseIndex].seconds) {
      phaseIndex = (phaseIndex + 1) % phases.length;
      phaseElapsed = 0;
      applyPhase();
    }
    if(elapsed >= 60) {
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

/* Journal and mood */
function setMoodChoice(mood, button){
  selectedMoodChoice = mood;
  const moodSelect = document.getElementById("mood");
  if(moodSelect) moodSelect.value = mood;
  document.querySelectorAll(".emotion-btn").forEach(btn => btn.classList.remove("selected"));
  if(button) button.classList.add("selected");
}

function saveCheckIn(){
  const mood = document.getElementById("mood").value || selectedMoodChoice;
  const need = document.getElementById("need").value;
  const result = document.getElementById("checkinResult");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Check-in saved.</strong><br>Your mind feels <strong>${mood}</strong>. Today, focus on <strong>${need}</strong>.`;
  }
  addXP(5);
}

function updateSmartPrompts(){
  const plan = appData.savedPlan;
  let title = "General SteadierPath Reflection";
  let prompts = [
    "What thought or feeling needs your attention today?",
    "What would a calmer version of you say about this situation?",
    "What is one steady step you can take next?"
  ];

  const all = plan ? [...(plan.improvements || []), plan.challenge].join(" ").toLowerCase() : "";
  if(all.includes("overthinking") || all.includes("negative") || all.includes("racing thoughts")){
    title = "Smart Journal: Overthinking";
    prompts = ["What thought kept repeating today?", "How likely is your fear to actually happen?", "What would you tell a friend in this situation?"];
  } else if(all.includes("burnout") || all.includes("work stress") || all.includes("stress")){
    title = "Smart Journal: Stress Recovery";
    prompts = ["Did you rest today?", "What expectation are you putting on yourself?", "What can wait until tomorrow?"];
  } else if(all.includes("confidence") || all.includes("social anxiety") || all.includes("low confidence")){
    title = "Smart Journal: Confidence Builder";
    prompts = ["What did you do well today?", "What are you proud of?", "Where did you show courage?"];
  }

  const card = document.getElementById("smartPromptCard");
  if(card) card.innerHTML = `<strong>${title}</strong><br>These prompts are designed to match your current path.`;
  const labels = ["smartPromptOneLabel", "smartPromptTwoLabel", "smartPromptThreeLabel"];
  labels.forEach((id, i) => {
    const label = document.getElementById(id);
    if(label) label.textContent = prompts[i];
  });
}

function saveJournal(){
  const entry = {
    date: new Date().toLocaleDateString(),
    mood: document.getElementById("journalMood").value,
    feelingWords: document.getElementById("feelingWords").value.trim(),
    weighingMind: document.getElementById("weighingMind").value.trim(),
    controlToday: document.getElementById("controlToday").value.trim(),
    wentWell: document.getElementById("wentWell").value.trim(),
    gratitude: ["gratitudeOne","gratitudeTwo","gratitudeThree"].map(id => document.getElementById(id).value.trim()).filter(Boolean)
  };

  if(!entry.feelingWords && !entry.weighingMind && !entry.controlToday && !entry.wentWell && !entry.gratitude.length) {
    const result = document.getElementById("journalResult");
    if(result){ result.classList.remove("hidden"); result.textContent = "Write at least one reflection before saving."; }
    return;
  }

  appData.journals.unshift(entry);
  saveAppData();
  const result = document.getElementById("journalResult");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Reflection saved.</strong><br>You gave your thoughts a place to land.<br><br>+10 XP`;
  }
  addXP(10);
}

function saveMoodEntry(){
  const entry = {
    score: Number(document.getElementById("calmScore").value),
    mood: document.getElementById("trackerMood").value,
    note: document.getElementById("moodNote").value.trim(),
    date: new Date().toLocaleDateString()
  };
  appData.moods.unshift(entry);
  saveAppData();
  renderMoodTracker();
  addXP(5);
  document.getElementById("moodNote").value = "";
}

function renderMoodTracker(){
  const history = document.getElementById("moodHistory");
  const summary = document.getElementById("moodSummary");
  const fill = document.getElementById("moodMeterFill");
  if(!history || !summary || !fill) return;

  if(appData.moods.length === 0){
    summary.innerHTML = "No mood entries yet.";
    fill.style.width = "0%";
    history.innerHTML = "";
    return;
  }

  const avg = appData.moods.reduce((sum, item) => sum + Number(item.score || 0), 0) / appData.moods.length;
  fill.style.width = (avg * 10) + "%";
  summary.innerHTML = `<strong>Average Calm Score:</strong> ${avg.toFixed(1)} / 10<br><strong>Entries:</strong> ${appData.moods.length}<br><strong>Latest Mood:</strong> ${appData.moods[0].mood}`;
  history.innerHTML = appData.moods.slice(0, 7).map(entry => `
    <div class="mood-entry card">
      <strong>${entry.date}</strong><br>
      Calm Score: ${entry.score}/10<br>
      Mood: ${entry.mood}<br>
      ${entry.note ? `Note: ${entry.note}` : ""}
    </div>
  `).join("");
}

/* Games */
function premiumLock(){
  alert("Medium and Hard modes are premium features.");
}

function openGame(screenId){
  showScreen(screenId);
}

function completeGame(name, xp, score=0){
  appData.bestScores[name] = Math.max(appData.bestScores[name] || 0, score);
  saveAppData();
  addXP(xp);
}

/* Centered */
let centeredBoard = [];
function startCenteredGame(){
  const states = ["calm","focus","energy","confidence","anxiety"];
  centeredBoard = Array.from({length:25}, (_,i) => states[i % states.length]);
  renderCenteredBoard();
  document.getElementById("centeredMessage").innerHTML = "Tap red anxiety blocks to turn them into calm.";
}

function renderCenteredBoard(){
  const board = document.getElementById("centeredBoard");
  if(!board) return;
  board.innerHTML = centeredBoard.map((state,i) => `<button class="color-cell ${state}" onclick="tapCentered(${i})"></button>`).join("");
}

function tapCentered(index){
  if(centeredBoard[index] === "anxiety") centeredBoard[index] = "calm";
  else centeredBoard[index] = "focus";
  renderCenteredBoard();
  const anxietyLeft = centeredBoard.filter(x => x === "anxiety").length;
  document.getElementById("centeredMessage").innerHTML = `Balance improving. Anxiety blocks left: ${anxietyLeft}.`;
  if(anxietyLeft === 0) {
    document.getElementById("centeredMessage").innerHTML = "<strong>Centered complete.</strong><br>You restored emotional balance.<br><br>+25 XP";
    completeGame("centered", 25, 100);
  }
}

/* Thought Sort */
const thoughtCards = [
  { text: "I practiced today.", answer: "helpful" },
  { text: "Everyone will judge me.", answer: "unhelpful" },
  { text: "I do not know exactly what will happen.", answer: "uncertain" },
  { text: "I can take one small step.", answer: "helpful" },
  { text: "If I feel anxious, I must be unsafe.", answer: "unhelpful" }
];
let thoughtIndex = 0;
let thoughtScore = 0;

function startThoughtSortGame(){
  thoughtIndex = 0;
  thoughtScore = 0;
  const result = document.getElementById("thoughtSortResult");
  if(result) result.classList.add("hidden");
  showThoughtCard();
}

function showThoughtCard(){
  const card = document.getElementById("thoughtFloatingCard");
  if(card) card.textContent = thoughtCards[thoughtIndex].text;
}

function sortThoughtCard(choice){
  const result = document.getElementById("thoughtSortResult");
  if(!result) return;
  const correct = choice === thoughtCards[thoughtIndex].answer;
  if(correct) thoughtScore++;
  result.classList.remove("hidden");
  result.innerHTML = correct ? "<strong>Correct.</strong><br>You sorted that thought clearly." : "<strong>Good try.</strong><br>This is practice, not perfection.";
  thoughtIndex++;
  if(thoughtIndex >= thoughtCards.length){
    result.innerHTML += `<br><br><strong>Thought Sort complete.</strong><br>Score: ${thoughtScore}/${thoughtCards.length}<br>+15 XP`;
    completeGame("thoughtSort", 15, thoughtScore);
    document.getElementById("thoughtFloatingCard").textContent = "Game complete.";
  } else {
    setTimeout(() => {
      result.classList.add("hidden");
      showThoughtCard();
    }, 900);
  }
}

/* Calm Focus */
let calmFocusRunning = false;
let calmFocusScore = 0;
let calmFocusMeter = 50;
let calmFocusTimer = null;

function startCalmFocusRound(){
  resetCalmFocusGame();
  calmFocusRunning = true;
  document.getElementById("calmFocusResult").textContent = "Tap blue focus orbs. Avoid red noise.";
  spawnCalmFocusOrbs();
  calmFocusTimer = setInterval(spawnCalmFocusOrbs, 1700);
}

function resetCalmFocusGame(){
  calmFocusRunning = false;
  calmFocusScore = 0;
  calmFocusMeter = 50;
  if(calmFocusTimer) clearInterval(calmFocusTimer);
  calmFocusTimer = null;
  const area = document.getElementById("calmFocusPlayArea");
  if(area) area.innerHTML = "";
  updateCalmFocusStats();
}

function updateCalmFocusStats(){
  const text = document.getElementById("calmFocusMeterText");
  const fill = document.getElementById("calmFocusMeterFill");
  if(text) text.textContent = calmFocusMeter + "%";
  if(fill) fill.style.width = calmFocusMeter + "%";
}

function spawnCalmFocusOrbs(){
  const area = document.getElementById("calmFocusPlayArea");
  if(!area || !calmFocusRunning) return;
  area.innerHTML = "";
  for(let i=0;i<3;i++) createFocusOrb(i === 0 ? "focus" : (Math.random() > .6 ? "distraction" : "focus"));
}

function createFocusOrb(type){
  const area = document.getElementById("calmFocusPlayArea");
  const orb = document.createElement("button");
  orb.className = type === "focus" ? "focus-orb" : "distraction-orb";
  orb.textContent = type === "focus" ? "Focus" : "Noise";
  orb.onclick = function(e){
    e.stopPropagation();
    if(type === "focus") {
      calmFocusScore++;
      calmFocusMeter = Math.min(100, calmFocusMeter + 10);
      orb.remove();
      document.getElementById("calmFocusResult").textContent = "Focused. Stay present.";
      if(calmFocusScore >= 8 || calmFocusMeter >= 100) completeCalmFocusRound();
    } else {
      calmFocusMeter = Math.max(0, calmFocusMeter - 10);
      orb.remove();
      document.getElementById("calmFocusResult").textContent = "Distraction noticed. Return gently.";
    }
    updateCalmFocusStats();
  };
  orb.style.left = Math.max(12, Math.random() * (area.clientWidth - 90)) + "px";
  orb.style.top = Math.max(12, Math.random() * (area.clientHeight - 90)) + "px";
  area.appendChild(orb);
}

function completeCalmFocusRound(){
  calmFocusRunning = false;
  if(calmFocusTimer) clearInterval(calmFocusTimer);
  calmFocusTimer = null;
  document.getElementById("calmFocusResult").innerHTML = "<strong>Calm Focus complete.</strong><br>You practiced steady attention.<br><br>+15 XP";
  completeGame("calmFocus", 15, calmFocusScore);
}

/* Grounding Game */
const groundingObjects = [
  { label:"See", emoji:"👀" }, { label:"Feel", emoji:"🤲" }, { label:"Hear", emoji:"👂" }, { label:"Smell", emoji:"🌸" }, { label:"Taste", emoji:"🍋" }
];
let groundingStep = 0;
let groundingScore = 0;

function startGroundingGameRound(){
  groundingStep = 0;
  groundingScore = 0;
  renderGroundingObjects();
  document.getElementById("groundingResult").classList.add("hidden");
  updateGroundingInstruction();
}

function updateGroundingInstruction(){
  const el = document.getElementById("groundingInstruction");
  if(el) el.textContent = `Find: ${groundingObjects[groundingStep].label}`;
}

function renderGroundingObjects(){
  const area = document.getElementById("groundingPlayArea");
  if(!area) return;
  area.innerHTML = "";
  groundingObjects.forEach((obj, i) => {
    const btn = document.createElement("button");
    btn.className = "grounding-object";
    btn.textContent = obj.emoji + " " + obj.label;
    btn.onclick = () => tapGroundingObject(i);
    btn.style.left = Math.max(8, Math.random() * (area.clientWidth - 90)) + "px";
    btn.style.top = Math.max(8, Math.random() * (area.clientHeight - 90)) + "px";
    area.appendChild(btn);
  });
}

function tapGroundingObject(index){
  const result = document.getElementById("groundingResult");
  if(index === groundingStep) {
    groundingScore++;
    groundingStep++;
    if(groundingStep >= groundingObjects.length) {
      result.classList.remove("hidden");
      result.innerHTML = "<strong>Grounding complete.</strong><br>You returned to the present moment.<br><br>+10 XP";
      document.getElementById("groundingPlayArea").innerHTML = "";
      completeGame("grounding", 10, groundingScore);
    } else {
      updateGroundingInstruction();
      renderGroundingObjects();
    }
  } else {
    result.classList.remove("hidden");
    result.textContent = "Good try. Find the current sense first.";
  }
}

/* Anchor */
let anchorPosition = 45;
let anchorStability = 75;
let anchorTimer = null;

function startAnchorGame(){
  anchorPosition = 45;
  anchorStability = 75;
  renderAnchor();
  document.getElementById("anchorMessage").textContent = "Stay near the calm zone.";
  if(anchorTimer) clearInterval(anchorTimer);
  anchorTimer = setInterval(() => {
    anchorStability -= 4;
    if(anchorStability <= 0) {
      clearInterval(anchorTimer);
      document.getElementById("anchorMessage").innerHTML = "You drifted into the storm. Reset and try again.";
    }
  }, 1200);
}

function anchorMove(direction){
  if(direction === "left") anchorPosition = Math.max(0, anchorPosition - 8);
  if(direction === "right") anchorPosition = Math.min(88, anchorPosition + 8);
  if(direction === "center") { anchorPosition = 45; anchorStability = Math.min(100, anchorStability + 18); }
  renderAnchor();
  if(anchorStability >= 100) {
    clearInterval(anchorTimer);
    document.getElementById("anchorMessage").innerHTML = "<strong>Anchor complete.</strong><br>You stayed steady through the wave.<br><br>+15 XP";
    completeGame("anchor", 15, anchorStability);
  } else {
    document.getElementById("anchorMessage").textContent = `Stability: ${anchorStability}%.`;
  }
}

function renderAnchor(){
  const player = document.getElementById("anchorPlayer");
  if(player) player.style.left = anchorPosition + "%";
}

/* Education */
function openLesson(topic){
  const lessons = {
    "Anxiety Basics": "Anxiety is your body's alarm system. The goal is not to fear the alarm, but to understand it and respond steadily.",
    "Overthinking": "Overthinking is often your mind trying to solve uncertainty. SteadierPath helps you separate useful planning from mental noise.",
    "Confidence": "Confidence grows after action. Small repeated courage steps build self-trust.",
    "Sleep": "Sleep improves when your body feels safe. Wind-down routines teach your nervous system to settle."
  };
  const result = document.getElementById("lessonResult");
  if(result) {
    result.classList.remove("hidden");
    result.innerHTML = `<strong>${topic}</strong><br>${lessons[topic]}`;
  }
  addXP(5);
}

function renderWeekly(){
  const weekly = document.getElementById("weeklyCard");
  if(weekly) {
    weekly.innerHTML = `<strong>This week:</strong><br>Activities completed: ${appData.completedActivities}<br>Total XP: ${appData.mindPoints}<br>Journal entries: ${appData.journals.length}<br>Mood entries: ${appData.moods.length}`;
  }
  updateXP();
}

/* Notifications settings only */
function saveNotificationSettings(){
  appData.notifications = {
    morning: document.getElementById("morningReminder")?.checked || false,
    evening: document.getElementById("eveningReminder")?.checked || false,
    streak: document.getElementById("streakReminder")?.checked || false
  };
  localStorage.setItem("steadierPath.notifications", JSON.stringify(appData.notifications));
  saveAppData();
}

function loadNotificationSettings(){
  const n = appData.notifications || {};
  const morning = document.getElementById("morningReminder");
  const evening = document.getElementById("eveningReminder");
  const streak = document.getElementById("streakReminder");
  if(morning) morning.checked = !!n.morning;
  if(evening) evening.checked = !!n.evening;
  if(streak) streak.checked = !!n.streak;
}

/* Settings and data */
function toggleSoundSetting(){
  const toggle = document.getElementById("soundToggle");
  soundEnabled = toggle ? toggle.checked : true;
}

function exportSteadierPathData(){
  const data = JSON.stringify(appData, null, 2);
  alert(data.slice(0, 900) + (data.length > 900 ? "\n\n...data continues" : ""));
}

function clearSteadierPathData(){
  if(!confirm("Clear saved SteadierPath data on this device?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("steadierPath.planBuilt");
  localStorage.removeItem("steadyMind.planBuilt");
  appData = {
    mindPoints: 0,
    completedActivities: 0,
    streak: 0,
    planBuilt: false,
    savedPlan: null,
    journals: [],
    moods: [],
    notifications: { morning: false, evening: false, streak: false },
    bestScores: {}
  };
  saveAppData();
  showScreen("mainMenu");
}

function resetSteadierPathData(){
  if(!confirm("Reset SteadierPath as a brand-new user on this device?")) return;
  localStorage.clear();
  sessionStorage.clear();
  alert("SteadierPath test data cleared. Reloading now.");
  window.location.href = window.location.origin + window.location.pathname;
}

function viewSteadierPathData(){
  exportSteadierPathData();
}

/* Init */
document.addEventListener("DOMContentLoaded", function(){
  loadAppData();
  updateImproveButton();
  loadDailyEncouragement();
  renderHome();
  renderSavedPlan();
  renderMoodTracker();
  updateXP();

  const splash = document.getElementById("splash");
  if(splash) {
    setTimeout(() => {
      showScreen("welcome");
    }, 1600);
  }
});
