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
  if(!box) return;

  box.classList.add("calm-breathe");

  const steps = [
    "Breathe in slowly...",
    "Hold gently...",
    "Breathe out fully...",
    "Rest. You are safe in this moment.",
    "YOU are in control."
  ];

  let i = 0;
  box.textContent = steps[i];

  const timer = setInterval(() => {
    i++;

    if(i >= steps.length){
      clearInterval(timer);
      box.classList.remove("calm-breathe");
      box.textContent = "Reset complete. You earned +5 XP.";
      completeActivity();
    } else {
      box.textContent = steps[i];
    }
  }, 4000);
}

function setMoodChoice(mood, button){
  const moodSelect = document.getElementById("mood");
  if(moodSelect) moodSelect.value = mood;

  document.querySelectorAll(".emotion-btn").forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected");
}
