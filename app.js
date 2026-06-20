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
