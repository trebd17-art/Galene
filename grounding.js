/* A flexible 5–4–3–2–1 grounding exercise. No personal input is required. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const senses = [
    { number: 5, icon: '◉', prompt: 'Notice five things you can see.', hint: 'Look for a color, a shape, or something nearby.' },
    { number: 4, icon: '✋', prompt: 'Notice four things you can feel.', hint: 'Perhaps your feet on the floor, your clothing, or the chair supporting you.' },
    { number: 3, icon: '♫', prompt: 'Notice three things you can hear.', hint: 'Sounds can be close by or far away. There is no need to search for a perfect answer.' },
    { number: 2, icon: '〰', prompt: 'Notice two things you can smell.', hint: 'If this sense isn’t available or comfortable, notice another nearby detail instead.' },
    { number: 1, icon: '◡', prompt: 'Notice one thing you can taste.', hint: 'There is no need to eat or drink anything. You can notice another nearby detail instead.' }
  ];
  let session = null;
  function render() {
    const ended = session.step === senses.length;
    const sense = senses[Math.min(session.step, senses.length - 1)];
    $('groundingProgress').textContent = ended ? 'Your grounding pause is complete' : `Sense ${session.step + 1} of 5`;
    $('groundingProgressFill').style.width = `${(ended ? 5 : session.step + 1) / 5 * 100}%`;
    $('groundingSenseNumber').textContent = ended ? '' : sense.number;
    $('groundingSenseIcon').textContent = ended ? '✓' : sense.icon;
    $('groundingSensePrompt').textContent = ended ? 'You made time to notice.' : session.alternative ? `Notice ${sense.number === 1 ? 'one' : sense.number} other nearby ${sense.number === 1 ? 'detail' : 'details'}.` : sense.prompt;
    $('groundingSenseHint').textContent = ended ? 'You can finish here, at your own pace.' : session.alternative ? 'Use any sense that feels available and comfortable to you.' : sense.hint;
    $('groundingNext').hidden = ended;
    $('groundingNext').textContent = session.step === 4 ? 'Finish grounding' : 'Next sense';
    $('groundingSkip').hidden = ended;
    $('groundingAlternative').hidden = ended || session.alternative;
    $('groundingEnding').hidden = !ended;
    $('groundingContinue').textContent = session.inRoutine ? 'Continue My Routine' : 'Back to Calming Tools';
    $('groundingSensePrompt').focus({ preventScroll: true });
  }
  window.openGroundingSession = function (onContinue = null, inRoutine = false) {
    stopBreathingExercise();
    session = { step: 0, skipped: 0, alternative: false, continued: false, onContinue, inRoutine };
    showScreen('groundingSession'); render();
  };
  window.useGroundingAlternative = function () {
    if (!session || session.step >= senses.length) return;
    session.alternative = true; render();
  };
  window.nextGroundingSense = function (skip = false) {
    if (!session || session.step >= senses.length) return;
    if (skip) session.skipped++;
    session.step++; session.alternative = false; render();
  };
  window.continueAfterGrounding = function () {
    if (!session || session.step !== senses.length || session.continued) return;
    session.continued = true;
    if (session.skipped < senses.length) completeActivity();
    if (session.onContinue) session.onContinue(); else showScreen('tools');
  };
  window.leaveGroundingSession = function () {
    if (!session) return;
    if (session.inRoutine) closeEmergencyTool(); else showScreen('tools');
  };
  const previousOpen = openEmergencyTool;
  openEmergencyTool = function (type) {
    if (type === 'grounding') openGroundingSession(); else previousOpen(type);
  };
})();
