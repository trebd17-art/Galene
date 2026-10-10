/* Quiet bedtime flow: no autoplay, forced outcome, or automatic bright-screen exit. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => escapeSteadierMindHTML(String(value || ''));
  let session = null;
  const bodyPrompts = [
    ['Your jaw', 'If it feels comfortable, soften your jaw. Let your teeth rest slightly apart, or simply notice how your jaw feels.'],
    ['Your shoulders', 'Allow your shoulders to settle a little, if comfortable. There is no need to push or change anything.'],
    ['Your hands', 'Let your hands rest wherever they feel supported. Notice the contact, without needing to do anything else.']
  ];
  function capture() {
    if (!session) return;
    if ($('sleepNote')) session.note = $('sleepNote').value;
    if ($('sleepSaveConsent')) session.saveConsent = $('sleepSaveConsent').checked;
  }
  function render() {
    const headings = ['Settle in', 'What can wait until tomorrow?', 'Relax gently', 'Rest at your own pace'];
    const descriptions = [
      'If you’re ready to rest, get comfortable. You can keep your eyes open and adjust anything that helps you feel supported.',
      'If there is something you can safely leave for later, name it here or just think of it. You do not need to put aside anything urgent.',
      'Notice one area at a time. Skip any instruction that does not feel comfortable.',
      'You don’t need to force sleep. Rest at your own pace.'
    ];
    $('sleepProgress').textContent = session.finished ? 'Finished for tonight' : `Step ${session.step + 1} of 4`;
    $('sleepHeading').textContent = headings[session.step];
    $('sleepDescription').textContent = descriptions[session.step];
    $('sleepNext').hidden = session.finished;
    $('sleepSkip').hidden = session.finished || session.step === 3;
    $('sleepNext').textContent = session.step === 3 ? 'Finish for Tonight' : 'Continue';
    $('sleepSkip').textContent = session.step === 2 ? 'Skip this instruction' : 'Skip this step';
    $('sleepSound').hidden = session.finished;
    let panel = '<p>No timer. No need to rush.</p>';
    if (session.step === 1) panel = `<label for="sleepNote">A note for tomorrow (optional)</label><textarea id="sleepNote" maxlength="5000" placeholder="You can also just think of it…">${escape(session.note)}</textarea><label class="sleep-save-choice"><input id="sleepSaveConsent" type="checkbox" ${session.saveConsent ? 'checked' : ''}> Save this note to my journal when I finish</label><p class="sleep-privacy">Off by default. Saved notes stay in this browser and appear in your data export. Unsaved writing is discarded when you finish, leave, or reload.</p>`;
    if (session.step === 2) panel = `<p class="starter-eyebrow">Gentle pause ${session.bodyStep + 1} of 3</p><h3>${bodyPrompts[session.bodyStep][0]}</h3><p>${bodyPrompts[session.bodyStep][1]}</p>`;
    if (session.step === 3) panel = '<p>You can finish here, even if you are still awake.</p>';
    if (session.finished) panel = `<p>This pause is complete. There is nothing else you need to do in the app tonight.</p>${session.saved ? '<p>Your note was saved to your journal.</p>' : ''}<button class="text-back" onclick="leaveSleepSession()">${session.inRoutine ? 'Return to My Routine' : 'Back to Calming Tools'}</button>`;
    $('sleepPanel').innerHTML = panel;
    $('sleepHeading').focus({ preventScroll: true });
  }
  window.openSleepSession = function (onReturn = null, inRoutine = false) {
    stopBreathingExercise();
    session = { id: Date.now().toString(), step: 0, bodyStep: 0, note: '', saveConsent: false, saved: false, finished: false, returned: false, onReturn, inRoutine };
    $('sleepSaveStatus').textContent = '';
    $('sleepSound').open = false;
    showScreen('sleepSession'); render();
  };
  window.nextSleepStep = function (skip = false) {
    if (!session || session.finished) return;
    capture();
    if (session.step === 3) {
      if (session.saveConsent && session.note.trim()) {
        const entry = { date: new Date().toLocaleString(), sleepSessionId: session.id, summary: 'For tomorrow: ' + session.note.trim() };
        steadierMindJournalEntries.push(entry);
        if (!saveSteadierMindData()) {
          steadierMindJournalEntries.splice(steadierMindJournalEntries.indexOf(entry), 1);
          $('sleepSaveStatus').textContent = 'Your browser could not save this note. Try again, or finish without saving.';
          $('sleepPanel').innerHTML = '<button class="secondary" onclick="finishSleepWithoutSaving()">Finish without saving</button>';
          return;
        }
        session.saved = true; $('sleepSaveStatus').textContent = ''; renderSavedJournalEntries();
      }
      session.finished = true; session.note = '';
      stopAmbient(); render(); return;
    }
    if (session.step === 1 && skip) { session.note = ''; session.saveConsent = false; }
    if (session.step === 2 && session.bodyStep < 2) session.bodyStep++;
    else session.step++;
    render();
  };
  window.finishSleepWithoutSaving = function () {
    if (!session || session.finished) return;
    session.saveConsent = false; $('sleepSaveStatus').textContent = ''; nextSleepStep();
  };
  window.leaveSleepSession = function () {
    if (!session || session.returned) return;
    capture(); session.note = ''; stopAmbient();
    session.returned = true;
    if (session.inRoutine && session.finished && session.onReturn) session.onReturn();
    else if (session.inRoutine) closeEmergencyTool(); else showScreen('tools');
  };
  const previousOpen = openEmergencyTool;
  openEmergencyTool = function (type) {
    if (type === 'sleep') openSleepSession(); else previousOpen(type);
  };
  const previousShow = showScreen;
  showScreen = function (screenId) {
    if (session && document.querySelector('#sleepSession.active') && screenId !== 'sleepSession') {
      session.note = ''; $('sleepPanel').replaceChildren(); stopAmbient();
    }
    document.body.classList.toggle('sleep-mode', screenId === 'sleepSession');
    document.querySelector('.phone').classList.toggle('sleep-mode', screenId === 'sleepSession');
    previousShow(screenId);
  };
  document.addEventListener('DOMContentLoaded', () => {
    $('sleepPanel').addEventListener('input', capture);
    $('sleepPanel').addEventListener('change', capture);
  });
})();
