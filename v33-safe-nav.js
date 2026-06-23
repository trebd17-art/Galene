
(function(){
  function safeShowScreen(screenId){
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
  }

  window.safeShowScreen = safeShowScreen;
  window.showScreen = safeShowScreen;

  window.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll(".screen").forEach(function(screen){
      screen.style.display = screen.classList.contains("active") ? "block" : "none";
    });

    var splash = document.getElementById("splash");
    if(splash && !document.querySelector(".screen.active")){
      splash.classList.add("active");
      splash.style.display = "block";
    }

    document.querySelectorAll("[onclick]").forEach(function(el){
      var attr = el.getAttribute("onclick");
      if(attr && attr.indexOf("showScreen(") !== -1){
        el.setAttribute("onclick", attr.replaceAll("showScreen(", "safeShowScreen("));
      }
    });
  });
})();
