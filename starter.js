/* Guided setup and first routine. Uses the existing snapshot and calming tools. */
(function () {
  'use strict';
  const defaults = () => ({ setup: { step: 0, goals: [], feeling: 'Prefer not to say', minutes: 5, profile: '' }, routine: null });
  let state = defaults();
  // Capture before legacy DOMContentLoaded autosaving refreshes the snapshot.
  let restoredSnapshot = null;
  try { restoredSnapshot = JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY) || 'null'); } catch (_) {}
  let sessionPlanBuilt = false;
  const previousHasBuiltPlan = hasBuiltPlan;
  hasBuiltPlan = () => sessionPlanBuilt || previousHasBuiltPlan();
  let usingRoutineTool = false;
  let lastSaveSucceeded = true;
  const $ = id => document.getElementById(id);
  const escape = value => escapeSteadierMindHTML(String(value || ''));
  const snapshot = getSteadierMindSnapshot;
  getSteadierMindSnapshot = function () {
    return Object.assign(snapshot(), { starter: state });
  };
  function persist() {
    const ok = saveSteadierMindData();
    lastSaveSucceeded = ok;
    document.querySelectorAll('.starter-save-status').forEach(el => {
      el.textContent = ok ? '' : 'Your browser could not save this session. Keep this page open; progress may be lost on reload.';
    });
    return ok;
  }
  function readSetup() {
    state.setup.goals = Array.from(document.querySelectorAll('[name="starterGoal"]:checked'), el => el.value);
    state.setup.feeling = document.querySelector('[name="starterFeeling"]:checked').value;
    state.setup.minutes = Number(document.querySelector('[name="starterMinutes"]:checked').value);
    state.setup.profile = $('starterProfile').value;
  }
  function renderSetup() {
    const setup = state.setup;
    document.querySelectorAll('[name="starterGoal"]').forEach(el => { el.checked = setup.goals.includes(el.value); });
    document.querySelectorAll('[name="starterFeeling"]').forEach(el => { el.checked = el.value === setup.feeling; });
    document.querySelectorAll('[name="starterMinutes"]').forEach(el => { el.checked = Number(el.value) === setup.minutes; });
    $('starterProfile').value = setup.profile;
    document.querySelectorAll('[data-setup-step]').forEach(el => { el.hidden = Number(el.dataset.setupStep) !== setup.step; });
    $('setupProgress').textContent = `Step ${setup.step + 1} of 3`;
    $('setupProgressFill').style.width = `${(setup.step + 1) / 3 * 100}%`;
    $('setupBack').hidden = setup.step === 0;
    $('setupNext').textContent = setup.step === 2 ? 'See My Starting Routine' : 'Continue';
  }
  window.starterSetupBack = function () {
    readSetup(); state.setup.step = Math.max(0, state.setup.step - 1); persist(); renderSetup();
  };
  function recommendation() {
    const { goals, feeling, minutes } = state.setup;
    const goal = goals[0] || 'Balance';
    const tool = feeling === 'Overwhelmed' || goal === 'Focus' ? 'grounding' : goal === 'Sleep' ? 'sleep' : 'breathing';
    const prompts = {
      Stress: 'What is one pressure you can make a little smaller today?',
      Overthinking: 'What thought keeps returning, and what do you know for certain about it?',
      Sleep: 'What can wait until tomorrow so you can make space for rest?',
      Focus: 'What is the one task you want to give your attention to next?',
      Confidence: 'What is one small action you could take even with some uncertainty?',
      Balance: 'What would feel like a kind, manageable next step today?'
    };
    const actions = {
      Stress: ['Take a short pause', 'Make one request for help', 'Choose one task to postpone'],
      Overthinking: ['Write down one known fact', 'Set aside a worry for later', 'Return to one task'],
      Sleep: ['Put my phone aside', 'Prepare a quiet space', 'Write down tomorrow’s task'],
      Focus: ['Clear one distraction', 'Choose one small task', 'Take a short reset'],
      Confidence: ['Try one small step', 'Notice one recent effort', 'Ask one question'],
      Balance: ['Take a short pause', 'Choose one small task', 'Make space for rest']
    };
    return { goal, tool, prompt: prompts[goal] || prompts.Balance, actions: actions[goal] || actions.Balance, settleSeconds: minutes === 2 ? 30 : minutes === 5 ? 60 : 120 };
  }
  function buildStartingPlan() {
    const { goals, feeling, minutes, profile } = state.setup;
    const goal = goals[0] || 'Balance';
    const challenge = { Stress: 'Work stress', Overthinking: 'Overthinking', Sleep: 'Difficulty sleeping', Focus: 'Focus', Confidence: 'Low confidence', Balance: 'Everyday wellbeing' }[goal];
    const improvements = goals.map(item => item === 'Sleep' ? 'Sleep trouble' : item);
    savedSteadyPlan = {
      improvements, challenge, time: `${minutes} minutes`, hope: goal === 'Confidence' ? 'Confident' : goal === 'Focus' ? 'Focused' : 'Calm',
      userType: profile || 'Not specified', improvementText: goals.join(', ') || 'Everyday wellbeing',
      path: determinePrimaryPath(improvements, challenge), mindType: determineMindType(improvements, challenge, feeling),
      supportingPaths: goals.slice(1), createdAt: new Date().toLocaleDateString()
    };
    currentProfile = savedSteadyPlan;
    state.routine = null;
    sessionPlanBuilt = true;
    try {
      localStorage.setItem('steadyMind.planBuilt', 'true');
      localStorage.removeItem('steadyMind.forceNewUser');
    } catch (_) { /* Continue in memory; persist() displays the storage warning. */ }
    renderSavedPlan(); updatePlanStatus(); persist();
    showScreen('starterResult');
  }
  window.buildPlanAndSave = buildStartingPlan;
  function renderResult() {
    const { goal, tool } = recommendation();
    const focus = goal === 'Balance' ? 'everyday wellbeing' : state.setup.goals.map(x => x.toLowerCase()).join(' and ');
    $('starterSummary').textContent = `A ${state.setup.minutes}-minute routine for ${focus}: ${tool === 'grounding' ? 'grounding' : tool === 'sleep' ? 'a gentle wind-down' : 'gentle breathing'}, one reflection, and a manageable next step.`;
  }
  window.startStarterRoutine = function () {
    if (!hasBuiltPlan()) { showScreen('assessment'); return; }
    if (!state.routine || state.routine.finished) {
      state.routine = { id: Date.now().toString(), step: 0, before: '', reflection: '', action: '', after: '', skipped: [], finished: false };
      persist();
    }
    showScreen('starterRoutine');
  };
  function radios(name, values, selected) {
    return '<div class="starter-options">' + values.map(value => `<label><input type="radio" name="${name}" value="${escape(value)}" ${selected === value ? 'checked' : ''}> ${escape(value)}</label>`).join('') + '</div>';
  }
  function renderRoutine() {
    const routine = state.routine;
    if (!routine) return;
    const rec = recommendation();
    const headings = ['Arrive', 'Settle', 'Reflect', 'Take one small step', 'Notice how you feel'];
    const descriptions = [
      'How are you feeling right now? Noticing is enough.',
      rec.tool === 'sleep' ? 'Take a quiet wind-down pause at your own pace. You can skip any instruction or try grounding instead.' : `Try ${rec.tool === 'grounding' ? 'grounding' : 'gentle breathing'} for about ${rec.settleSeconds} seconds. Go at your own pace; stop or switch if it feels uncomfortable.`,
      rec.prompt + (state.setup.minutes === 2 ? ' A few words are enough.' : state.setup.minutes === 10 ? ' Take a little time to explore what comes up.' : ' One or two sentences are enough.'),
      'Choose something manageable to carry into your day.',
      'There is no right outcome. About the same is a valid answer.'
    ];
    $('routineProgress').textContent = routine.step < 4 ? `Step ${routine.step + 1} of 4` : 'Closing check-in';
    $('routineProgressFill').style.width = `${Math.min(routine.step + 1, 4) / 4 * 100}%`;
    $('routineHeading').textContent = headings[routine.step];
    $('routineDescription').textContent = descriptions[routine.step];
    $('routineNext').hidden = false; $('routineSkip').hidden = false;
    $('routineNext').textContent = routine.step === 4 ? 'Finish for Today' : 'Continue';
    let panel = '';
    if (routine.step === 0) panel = radios('routineBefore', ['Restless', 'Overwhelmed', 'Anxious', 'Steady', 'Prefer not to say'], routine.before);
    if (routine.step === 1) {
      panel = `<button onclick="launchStarterTool('${rec.tool}')">Open ${rec.tool === 'grounding' ? 'Grounding' : rec.tool === 'sleep' ? 'Sleep Wind-Down' : 'Breathing'}</button><button class="secondary" onclick="launchStarterTool('${rec.tool === 'grounding' ? 'breathing' : 'grounding'}')">Try ${rec.tool === 'grounding' ? 'breathing' : 'grounding'} instead</button>`;
      $('routineNext').hidden = true;
    }
    if (routine.step === 2) panel = `<label for="starterReflection">Your reflection (optional)</label><textarea id="starterReflection" maxlength="5000" placeholder="A few words, just for you…">${escape(routine.reflection)}</textarea>`;
    if (routine.step === 3) panel = radios('routineAction', rec.actions.concat('Choose later'), routine.action);
    if (routine.step === 4) {
      panel = radios('routineAfter', ['A little more settled', 'About the same', 'Less settled', 'Prefer not to say'], routine.after);
      $('routineSkip').textContent = 'Finish without answering';
    } else $('routineSkip').textContent = 'Skip this activity';
    if (routine.finished) {
      $('routineProgress').textContent = 'Your routine is complete';
      $('routineHeading').textContent = 'You made a little space for yourself today.';
      $('routineDescription').textContent = 'You can finish here. Come back when it feels right.';
      panel = `<div class="starter-card"><p>${4 - routine.skipped.filter(n => n < 4).length} of 4 activities completed.</p>${routine.action ? `<p>Your next step: ${escape(routine.action)}</p>` : ''}${routine.after ? `<p>Afterward: ${escape(routine.after)}</p>` : ''}<p>${lastSaveSucceeded ? 'Your routine is saved in this browser.' : 'This routine is available for this session only.'}</p></div><button onclick="showScreen('mainMenu')">Back to Home</button><button class="secondary" onclick="showScreen('dashboard')">View My Plan</button>`;
      $('routineNext').hidden = true; $('routineSkip').hidden = true;
    }
    $('routinePanel').innerHTML = panel;
    $('routineHeading').focus({ preventScroll: true });
  }
  function captureRoutine() {
    const routine = state.routine;
    if (!routine) return;
    const before = document.querySelector('[name="routineBefore"]:checked');
    const action = document.querySelector('[name="routineAction"]:checked');
    const after = document.querySelector('[name="routineAfter"]:checked');
    if (before) routine.before = before.value;
    if ($('starterReflection')) routine.reflection = $('starterReflection').value;
    if (action) routine.action = action.value;
    if (after) routine.after = after.value;
  }
  window.starterRoutineNext = function (skip = false) {
    const routine = state.routine;
    if (!routine || routine.finished) return;
    captureRoutine();
    if (skip && !routine.skipped.includes(routine.step)) routine.skipped.push(routine.step);
    if (routine.step === 4) {
      routine.finished = true;
      if (routine.reflection.trim() && !routine.skipped.includes(2) && !steadierMindJournalEntries.some(entry => entry.routineId === routine.id)) {
        recordSteadierMindJournalEntry({ summary: routine.reflection, routineId: routine.id });
      }
    } else routine.step++;
    persist(); renderRoutine();
  };
  window.launchStarterTool = function (tool) {
    usingRoutineTool = true;
    if (tool === 'breathing') {
      openBreathingSession(recommendation().settleSeconds, () => {
        usingRoutineTool = false;
        state.routine.step = 2; persist(); showScreen('starterRoutine');
      }, true);
      return;
    }
    if (tool === 'grounding') {
      openGroundingSession(() => {
        usingRoutineTool = false;
        state.routine.step = 2; persist(); showScreen('starterRoutine');
      }, true);
      return;
    }
    if (tool === 'worry') {
      openWorrySession(() => {
        usingRoutineTool = false;
        state.routine.step = 2; persist(); showScreen('starterRoutine');
      }, true);
      return;
    }
    if (tool === 'sleep') {
      openSleepSession(() => {
        usingRoutineTool = false;
        state.routine.step = 2; persist(); showScreen('starterRoutine');
      }, true);
      return;
    }
    openEmergencyTool(tool);
    const back = document.querySelector('#emergencyToolPlayer .text-back');
    back.textContent = '← Back to My Routine';
  };
  const completeTool = completeEmergencyTool;
  completeEmergencyTool = function () {
    if (!usingRoutineTool) { completeTool(); return; }
    usingRoutineTool = false;
    stopBreathingExercise();
    completeTool();
    state.routine.step = 2;
    persist(); showScreen('starterRoutine');
  };
  const closeTool = closeEmergencyTool;
  closeEmergencyTool = function () {
    if (!usingRoutineTool) { closeTool(); return; }
    usingRoutineTool = false; stopBreathingExercise(); showScreen('starterRoutine');
  };
  const previousShowScreen = showScreen;
  showScreen = function (screenId) {
    if (usingRoutineTool && screenId !== 'emergencyToolPlayer' && screenId !== 'breathingSession' && screenId !== 'groundingSession' && screenId !== 'worrySession' && screenId !== 'sleepSession') {
      usingRoutineTool = false; stopBreathingExercise();
    }
    previousShowScreen(screenId);
    if (screenId === 'assessment') renderSetup();
    if (screenId === 'starterResult') renderResult();
    if (screenId === 'starterRoutine') renderRoutine();
    if (screenId === 'emergencyToolPlayer' && !usingRoutineTool) document.querySelector('#emergencyToolPlayer .text-back').textContent = '← Back to Calming Tools';
    if (screenId === 'dashboard' && savedSteadyPlan && hasBuiltPlan()) { currentProfile = savedSteadyPlan; renderSavedPlan(); }
  };
  const refreshHome = refreshHomeCardV50;
  refreshHomeCardV50 = function () {
    refreshHome();
    if (!hasBuiltPlan()) return;
    const btn = document.querySelector('#mainMenu #homePlanCTA');
    const pending = state.routine && !state.routine.finished;
    btn.textContent = pending ? 'Continue My Routine →' : 'Start My Routine →';
    btn.onclick = event => { event.stopPropagation(); startStarterRoutine(); };
    document.querySelector('#mainMenu .daily-priority-card').onclick = () => startStarterRoutine();
  };
  // Legacy refresh timers must finish by applying the current routine action.
  const oldTruePlanRefresh = refreshTruePlanState;
  refreshTruePlanState = function () { oldTruePlanRefresh(); refreshHomeCardV50(); };
  const oldBuildContinueRefresh = refreshBuildContinuePlanCard;
  refreshBuildContinuePlanCard = function () { oldBuildContinueRefresh(); refreshHomeCardV50(); };
  document.addEventListener('click', event => {
    if (event.target.closest('#mainMenu .daily-priority-card')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (hasBuiltPlan()) startStarterRoutine(); else showScreen('assessment');
    }
  }, true);
  handleHomePlanCTA = function (event) {
    if (event) event.stopPropagation();
    if (hasBuiltPlan()) startStarterRoutine(); else showScreen('assessment');
  };
  document.addEventListener('DOMContentLoaded', function () {
    try {
      const raw = restoredSnapshot;
      if (raw && raw.starter && raw.starter.setup) {
        const draft = raw.starter;
        state.setup.goals = Array.isArray(draft.setup.goals) ? draft.setup.goals.filter(x => ['Stress', 'Overthinking', 'Sleep', 'Focus', 'Confidence'].includes(x)).slice(0, 2) : [];
        state.setup.step = Math.max(0, Math.min(2, Number(draft.setup.step) || 0));
        state.setup.feeling = ['Restless', 'Overwhelmed', 'Anxious', 'Steady', 'Prefer not to say'].includes(draft.setup.feeling) ? draft.setup.feeling : 'Prefer not to say';
        state.setup.minutes = [2, 5, 10].includes(draft.setup.minutes) ? draft.setup.minutes : 5;
        state.setup.profile = draft.setup.profile || '';
        if (draft.routine && Number.isInteger(draft.routine.step) && draft.routine.step >= 0 && draft.routine.step <= 4 && Array.isArray(draft.routine.skipped)) state.routine = draft.routine;
      } else if (hasBuiltPlan() && savedSteadyPlan) {
        state.setup.goals = (savedSteadyPlan.improvements || []).map(x => x === 'Sleep trouble' ? 'Sleep' : x).filter(x => ['Stress', 'Overthinking', 'Sleep', 'Focus', 'Confidence'].includes(x)).slice(0, 2);
        state.setup.minutes = [2, 5, 10].includes(parseInt(savedSteadyPlan.time, 10)) ? parseInt(savedSteadyPlan.time, 10) : 5;
        state.setup.profile = savedSteadyPlan.userType || '';
      }
    } catch (error) { console.warn('Starting routine could not be restored:', error); }
    if (hasBuiltPlan() && savedSteadyPlan) { currentProfile = savedSteadyPlan; renderSavedPlan(); }
    renderSetup(); refreshHomeCardV50();
    $('starterSetupForm').addEventListener('change', event => {
      if (event.target.name === 'starterGoal' && document.querySelectorAll('[name="starterGoal"]:checked').length > 2) {
        event.target.checked = false; $('setupError').textContent = 'Choose up to two areas. You can change them later.';
      } else $('setupError').textContent = '';
      readSetup(); persist();
    });
    $('starterSetupForm').addEventListener('submit', event => {
      event.preventDefault(); readSetup();
      if (state.setup.step < 2) { state.setup.step++; persist(); renderSetup(); }
      else buildStartingPlan();
    });
    $('routinePanel').addEventListener('input', () => { captureRoutine(); persist(); });
    $('routinePanel').addEventListener('change', () => { captureRoutine(); persist(); });
    window.addEventListener('beforeunload', persist);
  });
})();
