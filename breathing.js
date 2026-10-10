/* One focused breathing session with a pauseable clock and no breath holds. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let session = null;
  let tick = null;
  function clearTick() { if (tick !== null) clearInterval(tick); tick = null; }
  function cleanup() {
    clearTick();
    if (session) session.running = false;
    stopAmbient();
  }
  function render() {
    if (!session) return;
    const elapsed = session.elapsed / 1000;
    const inhale = elapsed % 10 < 4;
    const circle = $('gentleBreathingCircle');
    circle.classList.toggle('breathing-in', session.started && !session.ended && inhale);
    circle.classList.toggle('breathing-out', session.started && !session.ended && !inhale);
    circle.classList.toggle('breathing-paused', !session.running);
    $('gentleBreathingPhase').textContent = session.ended ? 'At your own pace' : !session.started ? 'At your own pace' : !session.running ? 'Paused · breathe naturally' : inhale ? 'Breathe in gently' : 'Breathe out gently';
    $('gentleBreathingTimer').textContent = session.ended ? '' : `${Math.max(0, Math.ceil(session.seconds - elapsed))} seconds${session.started ? ' remaining' : ' · at your own pace'}`;
    $('gentleBreathingBegin').hidden = session.started;
    $('gentleBreathingPause').hidden = !session.started;
    $('gentleBreathingPause').textContent = session.running ? 'Pause' : 'Resume';
    $('gentleBreathingControls').hidden = session.ended;
    $('gentleBreathingEnd').hidden = !session.ended;
    $('gentleBreathingGrounding').hidden = session.ended;
    $('gentleBreathingContinue').textContent = session.inRoutine ? 'Continue My Routine' : 'Back to Calming Tools';
  }
  window.openBreathingSession = function (seconds = 60, onContinue = null, inRoutine = false, returnScreen = 'tools') {
    cleanup();
    session = { seconds: [30, 60, 120].includes(seconds) ? seconds : 60, elapsed: 0, started: false, running: false, ended: false, completed: false, continued: false, onContinue, inRoutine, returnScreen };
    document.querySelector('#breathingSession .breathing-sound').open = false;
    showScreen('breathingSession'); render();
  };
  function startClock() {
    session.running = true;
    let last = performance.now();
    clearTick();
    tick = setInterval(() => {
      const now = performance.now();
      session.elapsed = Math.min(session.seconds * 1000, session.elapsed + now - last);
      last = now;
      if (session.elapsed >= session.seconds * 1000) finishGentleBreathing(true);
      else render();
    }, 100);
    render();
  }
  window.beginGentleBreathing = function () {
    if (!session || session.started || session.ended) return;
    session.started = true; startClock();
  };
  window.pauseGentleBreathing = function () {
    if (!session || !session.started || session.ended) return;
    if (session.running) { session.running = false; clearTick(); render(); }
    else startClock();
  };
  window.finishGentleBreathing = function (completed = false) {
    if (!session || session.ended) return;
    cleanup(); session.ended = true;
    session.completed = completed === true && session.elapsed >= session.seconds * 1000;
    render();
  };
  window.continueAfterBreathing = function () {
    if (!session || !session.ended || session.continued) return;
    session.continued = true;
    if (session.completed) completeActivity();
    if (session.onContinue) session.onContinue();
    else showScreen('tools');
  };
  window.leaveBreathingSession = function () {
    if (!session) return;
    const inRoutine = session.inRoutine;
    cleanup();
    if (inRoutine) closeEmergencyTool(); else showScreen(session.returnScreen);
  };
  window.switchBreathingToGrounding = function () {
    if (!session) return;
    const inRoutine = session.inRoutine;
    cleanup();
    if (inRoutine) launchStarterTool('grounding'); else openEmergencyTool('grounding');
  };
  const previousOpenTool = openEmergencyTool;
  openEmergencyTool = function (type) {
    if (type === 'breathing') openBreathingSession(60);
    else previousOpenTool(type);
  };
  const previousStop = stopBreathingExercise;
  stopBreathingExercise = function () { cleanup(); previousStop(); };
  const previousShow = showScreen;
  showScreen = function (screenId) {
    if (document.querySelector('#breathingSession.active') && screenId !== 'breathingSession') cleanup();
    previousShow(screenId);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && session && session.running) pauseGentleBreathing();
  });
})();
