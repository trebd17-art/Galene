function showScreen(screenId){
  document.querySelectorAll(".screen").forEach(screen=>screen.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function toggleImproveOptions(){
  document.getElementById("improveOptions").classList.toggle("hidden");
}

function getCheckedValues(){
  return Array.from(document.querySelectorAll('.multi input[type="checkbox"]:checked')).map(item=>item.value);
}

function updateImproveButton(){
  const improvements = getCheckedValues();
  const button = document.querySelector(".dropdown-toggle");
  if(improvements.length === 0){
    button.textContent = "Select improvement areas";
  } else if(improvements.length <= 2){
    button.textContent = improvements.join(", ");
  } else {
    button.textContent = improvements.length + " areas selected";
  }
}

function buildPlan(){
  const improvements=getCheckedValues();
  const challenge=document.getElementById("challenge").value;
  const time=document.getElementById("timeCommitment").value;
  const hope=document.getElementById("hope").value;
  const userType=document.getElementById("userType").value;
  const improvementText=improvements.length?improvements.join(", "):"your steady mind";

  document.getElementById("planText").innerHTML =
    `You are a <strong>${userType}</strong> who wants to improve <strong>${improvementText}</strong> and feel more <strong>${hope}</strong>.<br><br>
    Your biggest challenge right now is <strong>${challenge}</strong>.<br><br>
    Start with a <strong>${time}</strong> daily routine designed to help you steady your mind past the storm.`;

  showScreen("dashboard");
}