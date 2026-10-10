/* Round lifecycle safeguards for the existing five games. */
var centeredRoundActive = false;
var groundingAdvanceTimer = null;
(function () {
  'use strict';
  const screens = ['centeredGame','thoughtSortGameScreen','calmFocusGameScreen','groundingGameScreen','anchorGameScreen'];
  function cancelGroundingAdvance() {
    if (groundingAdvanceTimer !== null) clearTimeout(groundingAdvanceTimer);
    groundingAdvanceTimer = null;
  }
  function thoughtControls() {
    document.getElementById('thoughtNext').hidden = true;
    document.querySelectorAll('.thought-buckets button').forEach(button => button.disabled = !thoughtSortRunning);
  }
  for (const name of ['startThoughtSortGame','resetThoughtSortGame','renderThoughtSortCard','finishThoughtSortGame']) {
    const original = window[name]; window[name] = function (...args) { const result = original(...args); thoughtControls(); return result; };
  }
  for (const name of ['startGroundingGameRound','resetGroundingGame']) {
    const original = window[name]; window[name] = function (...args) { cancelGroundingAdvance(); return original(...args); };
  }
  const startCentered = startCenteredGame;
  window.startCenteredGame = function () { centeredRoundActive = true; return startCentered(); };
  const moveCentered = useCenteredPower;
  window.useCenteredPower = function (index) { if (centeredRoundActive) moveCentered(index); };
  // Open synchronously so a delayed reset cannot overwrite a newly started round.
  window.openCenteredGame = function () { showScreen('centeredGame'); startCenteredGame(); };
  window.openThoughtSortGame = function () { showScreen('thoughtSortGameScreen'); resetThoughtSortGame(); };
  window.openCalmFocusGame = function () { showScreen('calmFocusGameScreen'); resetCalmFocusGame(); };
  window.openGroundingGame = function () { showScreen('groundingGameScreen'); resetGroundingGame(); };
  window.openAnchorGame = function () { showScreen('anchorGameScreen'); resetAnchorGame(); setupAnchorTapMovement(); };
  function stop(screen) {
    if (screen === 'centeredGame') centeredRoundActive = false;
    if (screen === 'thoughtSortGameScreen') resetThoughtSortGame();
    if (screen === 'calmFocusGameScreen') resetCalmFocusGame();
    if (screen === 'groundingGameScreen') resetGroundingGame();
    if (screen === 'anchorGameScreen') resetAnchorGame();
  }
  const navigate = showScreen;
  window.showScreen = function (screen) {
    const active = document.querySelector('.screen.active');
    if (active && active.id !== screen && screens.includes(active.id)) stop(active.id);
    return navigate.apply(this, arguments);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    const active = document.querySelector('.screen.active');
    if (active && screens.includes(active.id)) {
      stop(active.id);
      const message = document.getElementById('gameSessionNotice');
      if (message) message.remove();
      const notice = document.createElement('p'); notice.id = 'gameSessionNotice'; notice.role = 'status';
      notice.textContent = 'Your round stopped while you were away. Start or restart whenever you’re ready.';
      active.prepend(notice);
    }
  });
  // Save final levels after legacy finish functions increment them.
  for (const [name,key] of [['finishThoughtSortGame','thought'],['completeCalmFocusRound','calmFocus'],['finishGroundingGame','grounding'],['checkAnchorEnd','anchor'],['checkCenteredLevelEndV27','centered']]) {
    const original = window[name]; window[name] = function (...args) {
      const before = completedActivities; const result = original(...args);
      if (completedActivities > before) updateSteadierMindGameProgress(key, {
        roundsCompleted: (steadierMindGameProgress[key]?.roundsCompleted || 0) + 1,
        lastCompletedAt: new Date().toISOString()
      });
      return result;
    };
  }
  for (const name of ['startCenteredGame','startThoughtSortGame','startCalmFocusRound','startGroundingGameRound','startAnchorGame']) {
    const original = window[name]; window[name] = function (...args) {
      document.getElementById('gameSessionNotice')?.remove();
      return original(...args);
    };
  }
})();
