/* Short daily reflection with explicit, transactional saves and labeled history. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const basePrompt = 'What’s taking up space in your mind?';
  let draft = null;
  function goalPrompt() {
    const goals = savedSteadyPlan && hasBuiltPlan() ? (savedSteadyPlan.improvements || []).join(' ').toLowerCase() : '';
    if (goals.includes('overthinking')) return 'What do you know about a recurring thought, and what feels uncertain?';
    if (goals.includes('stress')) return 'What is asking the most of you today, and what support might help?';
    if (goals.includes('sleep')) return 'What is on your mind as you make space for rest?';
    if (goals.includes('focus')) return 'What has your attention today, and what would you like to make space for?';
    if (goals.includes('confidence')) return 'What felt challenging today, and how might you respond with kindness?';
    return 'What would you like to understand about your day?';
  }
  function markEdited() {
    $('reflectionSave').disabled = false;
    $('reflectionSave').textContent = draft.saved ? 'Update Reflection' : 'Save Reflection';
    $('journalResult').textContent = draft.saved ? 'Changes are not saved yet.' : '';
  }
  window.chooseReflectionPrompt = function () {
    // Keep the question attached to an existing answer rather than relabeling it.
    if ($('reflectionAnswer').value.trim()) {
      $('journalResult').textContent = 'Keep this prompt with your answer. Start a new reflection to try another prompt.';
      return;
    }
    draft.prompt = draft.prompt === basePrompt ? goalPrompt() : basePrompt;
    $('reflectionPromptLabel').textContent = draft.prompt;
    $('reflectionPromptToggle').textContent = draft.prompt === basePrompt ? 'Try a prompt for my goal' : 'Use the everyday prompt';
    markEdited();
  };
  window.newDailyReflection = function () {
    draft = { id: crypto.randomUUID(), prompt: basePrompt, saved: false };
    $('reflectionForm').reset();
    $('reflectionExtras').open = false;
    $('reflectionPromptLabel').textContent = basePrompt;
    $('reflectionPromptToggle').textContent = 'Try a prompt for my goal';
    $('reflectionNew').hidden = true;
    markEdited();
  };
  window.updateSmartPrompts = function () {
    // The selected prompt stays stable as a draft is written or a plan changes.
    if (!draft) newDailyReflection();
  };
  function answers() {
    return [
      { prompt: draft.prompt, answer: $('reflectionAnswer').value.trim() },
      { prompt: 'What would feel supportive right now?', answer: $('reflectionSupport').value.trim() },
      { prompt: 'What do you know, and what feels uncertain?', answer: $('reflectionUncertainty').value.trim() },
      { prompt: 'Is there something you appreciate today, if anything?', answer: $('reflectionGratitude').value.trim() }
    ].filter(item => item.answer);
  }
  window.saveJournal = function () {
    if (!draft) newDailyReflection();
    if ($('reflectionSave').disabled) return;
    const mood = $('journalMood').value;
    const responses = answers();
    if (!responses.length && mood === 'Prefer not to say') {
      $('journalResult').textContent = 'Choose a feeling or write a few words to save. You can also leave without saving.';
      return;
    }
    const index = steadierMindJournalEntries.findIndex(entry => entry.id === draft.id);
    const previous = index >= 0 ? steadierMindJournalEntries[index] : null;
    const entry = {
      id: draft.id, type: 'dailyReflection', date: previous ? previous.date : new Date().toLocaleString(),
      updatedAt: new Date().toISOString(), mood, responses,
      summary: [`Feeling: ${mood}`, ...responses.map(item => `${item.prompt}\n${item.answer}`)].join('\n\n')
    };
    const priorPoints = mindPoints;
    const priorCompleted = completedActivities;
    if (index >= 0) steadierMindJournalEntries[index] = entry;
    else { steadierMindJournalEntries.push(entry); mindPoints += 10; completedActivities++; }
    if (!saveSteadierMindData()) {
      if (index >= 0) steadierMindJournalEntries[index] = previous;
      else steadierMindJournalEntries.pop();
      mindPoints = priorPoints; completedActivities = priorCompleted;
      $('journalResult').textContent = 'Your browser could not save this reflection. Keep this page open and try again; your writing is still here.';
      return;
    }
    draft.saved = true;
    $('reflectionSave').disabled = true;
    $('reflectionSave').textContent = 'Reflection saved';
    $('reflectionNew').hidden = false;
    $('journalResult').textContent = 'You made time to reflect. Your entry is saved.';
    updateXP(); renderSavedJournalEntries();
  };
  window.renderSavedJournalEntries = function () {
    const targets = ['journalHistory', 'savedJournalEntries', 'journalEntries'].map($).filter(Boolean);
    targets.forEach(target => {
      target.replaceChildren();
      if (!steadierMindJournalEntries.length) {
        const empty = document.createElement('p'); empty.textContent = 'Your saved reflections will appear here.'; target.append(empty); return;
      }
      steadierMindJournalEntries.slice().reverse().forEach(entry => {
        const card = document.createElement('article'); card.className = 'saved-entry';
        const date = document.createElement('strong'); date.textContent = entry.date || 'Saved entry'; card.append(date);
        if (entry.type === 'dailyReflection' && Array.isArray(entry.responses)) {
          const mood = document.createElement('p'); mood.className = 'reflection-history-mood';
          mood.textContent = `Feeling: ${entry.mood || 'Prefer not to say'}`; card.append(mood);
          entry.responses.forEach(response => {
            const pair = document.createElement('div'); pair.className = 'reflection-history-response';
            const question = document.createElement('p'); question.className = 'reflection-history-question';
            question.textContent = response.prompt;
            const answer = document.createElement('p'); answer.className = 'reflection-history-answer';
            answer.textContent = response.answer;
            pair.append(question, answer); card.append(pair);
          });
        } else {
          const text = document.createElement('p'); text.textContent = entry.text || entry.summary || '';
          text.style.whiteSpace = 'pre-wrap'; card.append(text);
        }
        target.append(card);
      });
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    newDailyReflection(); renderSavedJournalEntries();
    $('reflectionForm').addEventListener('submit', event => { event.preventDefault(); saveJournal(); });
    $('reflectionForm').addEventListener('input', markEdited);
    $('reflectionForm').addEventListener('change', markEdited);
  });
})();
