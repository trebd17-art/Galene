/* Worry writing stays in memory unless the user explicitly saves at the end. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => escapeSteadierMindHTML(String(value || ''));
  let session = null;
  function radios(name, choices, value) {
    return '<div class="starter-options">' + choices.map(([key, label]) => `<label><input type="radio" name="${name}" value="${key}" ${value === key ? 'checked' : ''}>${label}</label>`).join('') + '</div>';
  }
  function capture() {
    if (!session) return;
    if ($('worryText')) session.worry = $('worryText').value;
    if ($('worryAction')) session.action = $('worryAction').value;
    const control = document.querySelector('[name="worryControl"]:checked');
    const response = document.querySelector('[name="worryResponse"]:checked');
    if (control) session.control = control.value;
    if (response) session.response = response.value;
    if ($('worrySaveConsent')) session.saveConsent = $('worrySaveConsent').checked;
  }
  function render() {
    const titles = ['Name the worry', 'What is possible right now?', 'Choose a manageable response', 'You don’t have to resolve this right now.'];
    const descriptions = [
      'You can write a few words or just think of it. Writing is optional and stays in this session unless you choose to save it at the end.',
      'Some worries have an actionable part. Others may need space rather than an immediate answer.',
      session.control === 'action' || session.control === 'some' ? 'What is one small step within your control? You don’t have to solve the whole worry.' : 'You can set this aside for now, even if the feeling remains.',
      'Take a moment to notice how you feel. The worry does not need to disappear for you to finish.'
    ];
    $('worryProgress').textContent = `Step ${session.step + 1} of 4`;
    $('worryProgressFill').style.width = `${(session.step + 1) / 4 * 100}%`;
    $('worryHeading').textContent = titles[session.step];
    $('worryDescription').textContent = descriptions[session.step];
    $('worrySkip').hidden = session.step === 3;
    $('worryPrevious').hidden = session.step === 0;
    $('worryNext').textContent = session.step === 3 ? session.inRoutine ? 'Continue My Routine' : 'Back to Calming Tools' : 'Continue';
    let panel = '';
    if (session.step === 0) panel = `<label for="worryText">A few words (optional)</label><textarea id="worryText" maxlength="5000" placeholder="You can also just think of it…">${escape(session.worry)}</textarea>`;
    if (session.step === 1) panel = radios('worryControl', [['action', 'I can take a step'], ['some', 'Some of it is in my control'], ['none', 'There’s nothing I can do right now']], session.control);
    if (session.step === 2) {
      if (session.control === 'action' || session.control === 'some') panel = `<label for="worryAction">One small step (optional)</label><textarea id="worryAction" maxlength="2000" placeholder="Something manageable, at your own pace…">${escape(session.action)}</textarea>`;
      panel += radios('worryResponse', [['grounding', 'Try grounding'], ['later', 'Write it down for later'], ['present', 'Return my attention to the present']], session.response);
      if (session.response === 'later') panel += '<p>You can write now or later. Nothing will be saved unless you choose the save option on the next screen.</p>';
    }
    if (session.step === 3) {
      if (session.action.trim()) panel += `<div class="starter-card"><p>Your small step: ${escape(session.action)}</p></div>`;
      if (session.response === 'grounding') panel += '<button class="secondary" onclick="groundDuringWorry()">Open Grounding</button>';
      if (session.response === 'later') panel += `<label for="worryText">Write for later (optional)</label><textarea id="worryText" maxlength="5000">${escape(session.worry)}</textarea>`;
      if (session.response === 'present') panel += '<div class="starter-card"><p>Notice one nearby detail, then gently return to what you were doing.</p></div>';
      panel += `<label class="worry-save-choice"><input id="worrySaveConsent" type="checkbox" ${session.saveConsent ? 'checked' : ''}> Save my written worry and next step to my journal</label><p class="worry-privacy">Off by default. Saved entries stay in this browser and are included in your data export. Unchecked writing is discarded when you finish, leave, or reload.</p>`;
    }
    $('worryPanel').innerHTML = panel;
    $('worryHeading').focus({ preventScroll: true });
  }
  window.openWorrySession = function (onContinue = null, inRoutine = false) {
    stopBreathingExercise();
    session = { id: Date.now().toString(), step: 0, worry: '', action: '', control: '', response: '', saveConsent: false, skipped: [], finished: false, onContinue, inRoutine };
    $('worrySaveStatus').textContent = '';
    $('toolsCompletionStatus').textContent = '';
    showScreen('worrySession'); render();
  };
  window.nextWorryStep = function (skip = false) {
    if (!session || session.finished) return;
    capture();
    if (session.step < 3) {
      session.skipped = session.skipped.filter(step => step !== session.step);
      if (skip) {
        session.skipped.push(session.step);
        if (session.step === 0) session.worry = '';
        if (session.step === 1) session.control = '';
        if (session.step === 2) { session.action = ''; session.response = ''; }
      }
      session.step++; render(); return;
    }
    if (session.saveConsent && (session.worry.trim() || session.action.trim())) {
      const entry = { date: new Date().toLocaleString(), createdAt: new Date().toISOString(), createdDay: steadierMindJournalArchive.day(new Date()), worrySessionId: session.id, summary: [session.worry.trim() ? 'Worry: ' + session.worry.trim() : '', session.action.trim() ? 'Next step: ' + session.action.trim() : ''].filter(Boolean).join('\n') };
      steadierMindJournalEntries.push(entry);
      if (!saveSteadierMindData()) {
        steadierMindJournalEntries.splice(steadierMindJournalEntries.indexOf(entry), 1);
        $('worrySaveStatus').textContent = 'Your browser could not save this entry. Try again, or uncheck saving to finish without saving.';
        return;
      }
      renderSavedJournalEntries();
    }
    const savedNote = session.saveConsent && (session.worry.trim() || session.action.trim());
    const callback = session.onContinue;
    session.finished = true; session.worry = ''; session.action = '';
    if (session.skipped.length < 3) completeActivity();
    if (callback) callback(); else { showScreen('tools'); $('toolsCompletionStatus').textContent = savedNote ? 'Your worry release is complete. Your written entry is saved in this browser.' : 'Your worry release is complete. No written entry was saved.'; }
  };
  window.previousWorryStep = function () {
    if (!session || session.finished || session.step === 0) return;
    capture(); session.step--; render();
  };
  window.leaveWorrySession = function () {
    if (!session) return;
    const inRoutine = session.inRoutine;
    session.worry = ''; session.action = ''; session.finished = true;
    if (inRoutine) closeEmergencyTool(); else showScreen('tools');
  };
  window.groundDuringWorry = function () {
    if (!session || session.step !== 3) return;
    capture();
    session.inGrounding = true;
    const returnToWorry = () => { session.inGrounding = false; showScreen('worrySession'); render(); };
    openGroundingSession(returnToWorry, false, 'Return to Worry Release', returnToWorry);
  };
  const previousOpen = openEmergencyTool;
  openEmergencyTool = function (type) {
    if (type === 'worry') openWorrySession(); else previousOpen(type);
  };
  const previousShow = showScreen;
  showScreen = function (screenId) {
    if (screenId !== 'tools') $('toolsCompletionStatus').textContent = '';
    // Preserve only while visiting grounding from this flow; discard on other exits.
    if (session && (document.querySelector('#worrySession.active') || session.inGrounding) && !['worrySession', 'groundingSession'].includes(screenId)) {
      session.worry = ''; session.action = ''; session.inGrounding = false; session.finished = true;
      $('worryPanel').replaceChildren();
    }
    previousShow(screenId);
  };
  document.addEventListener('DOMContentLoaded', () => {
    $('worryPanel').addEventListener('input', capture);
    $('worryPanel').addEventListener('change', capture);
  });
})();
