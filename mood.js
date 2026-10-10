/* Mood check-ins share the existing device-local snapshot and export. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let editing = null;
  const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function entryDay(entry) {
    if (entry.day) return entry.day;
    const date = new Date(entry.createdAt || entry.date);
    return Number.isNaN(date.getTime()) ? null : dayKey(date);
  }
  function node(tag, text, className) {
    const element = document.createElement(tag); element.textContent = text;
    if (className) element.className = className; return element;
  }
  function reset() {
    editing = null; $('moodForm').reset(); $('moodSave').textContent = 'Save Mood Entry'; $('moodCancel').hidden = true;
  }
  function commit(change) {
    const previous = steadierMindMoodHistory.slice();
    const points = mindPoints, activities = completedActivities;
    change();
    if (!saveSteadierMindData()) {
      steadierMindMoodHistory = previous; mindPoints = points; completedActivities = activities;
      $('moodStatus').textContent = 'We could not save this change. Your writing is still here. Please try again.'; return false;
    }
    updateXP(); renderMoodTracker(); return true;
  }
  window.saveMoodEntry = function () {
    if (!$('moodForm').reportValidity()) return;
    const previous = editing === null ? null : steadierMindMoodHistory[editing];
    const now = new Date();
    const entry = {...previous, id: previous?.id || crypto.randomUUID(),
      createdAt: previous?.createdAt || now.toISOString(), day: previous ? entryDay(previous) : dayKey(now),
      date: previous?.date || now.toLocaleString(), score: Number($('calmScore').value), mood: $('trackerMood').value,
      note: $('moodNote').value.trim(), influences: Array.from(document.querySelectorAll('[name="moodInfluence"]:checked'), el => el.value)};
    if (!commit(() => {
      if (editing !== null) steadierMindMoodHistory[editing] = entry;
      else { steadierMindMoodHistory.push(entry); mindPoints += 5; completedActivities += 1; }
    })) return;
    const updated = editing !== null; reset();
    $('moodStatus').textContent = updated ? 'Your check-in was updated.' : 'Your check-in is saved.';
    suggest(entry.mood);
  };
  function suggest(mood) {
    const target = $('moodSuggestion'); target.replaceChildren(); target.hidden = false;
    const tool = mood === 'Overwhelmed' ? 'grounding' : mood === 'Anxious' ? 'breathing' : 'reflection';
    target.append(node('p', 'If it feels helpful, take a moment for yourself.'));
    const button = node('button', tool === 'grounding' ? 'Try grounding' : tool === 'breathing' ? 'Try gentle breathing' : 'Open daily reflection', 'secondary');
    button.type = 'button'; button.onclick = () => {
      if (tool === 'grounding') openGroundingSession();
      else if (tool === 'breathing') openBreathingSession();
      else showScreen('journal');
    }; target.append(button);
  }
  function edit(index) {
    const entry = steadierMindMoodHistory[index]; reset(); editing = index;
    $('calmScore').value = entry.score || ''; $('trackerMood').value = entry.mood || ''; $('moodNote').value = entry.note || '';
    document.querySelectorAll('[name="moodInfluence"]').forEach(el => el.checked = (entry.influences || []).includes(el.value));
    $('moodSave').textContent = 'Update Mood Entry'; $('moodCancel').hidden = false;
    $('moodStatus').textContent = 'Editing your saved check-in.'; $('calmScore').focus();
  }
  window.renderMoodTracker = function () {
    const history = $('moodHistory'), chart = $('moodChart'); if (!history || !chart) return;
    history.replaceChildren(); chart.replaceChildren();
    const today = new Date(); today.setHours(12,0,0,0);
    const days = Array.from({length:14}, (_, index) => { const date = new Date(today); date.setDate(date.getDate()-13+index); return date; });
    const values = days.map(date => {
      const scores = steadierMindMoodHistory.filter(entry => entryDay(entry) === dayKey(date) && Number.isFinite(entry.score) && entry.score >= 1 && entry.score <= 10).map(entry => entry.score);
      return scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
    });
    days.slice(7).forEach((date,index) => {
      const score = values[index+7], column = node('div','', 'mood-chart-day');
      column.append(node('span', score === null ? '—' : score.toFixed(1)));
      const track = node('div','', 'mood-chart-track'); const bar = node('div','', 'mood-chart-bar');
      bar.style.height = `${score === null ? 0 : score*10}%`; track.append(bar); column.append(track);
      column.append(node('span', date.toLocaleDateString(undefined,{month:'numeric',day:'numeric'})));
      column.setAttribute('aria-label', `${date.toLocaleDateString()}: ${score === null ? 'No check-in' : score.toFixed(1)+' out of 10'}`); chart.append(column);
    });
    const current = values.slice(7).filter(v => v !== null), prior = values.slice(0,7).filter(v => v !== null);
    const average = list => (list.reduce((a,b)=>a+b,0)/list.length).toFixed(1);
    $('moodSummary').textContent = !current.length ? 'Save a check-in to start your recent trends.' :
      `Last seven days: ${average(current)}/10 across ${current.length} recorded day${current.length===1?'':'s'}. ` +
      (current.length >= 3 && prior.length >= 3 ? `Previous seven days: ${average(prior)}/10 across ${prior.length} recorded days. These are averages of daily calm scores.` : 'A weekly comparison appears once each seven-day period has at least three recorded days.');
    if (!steadierMindMoodHistory.length) history.append(node('p','Your saved check-ins will appear here.'));
    steadierMindMoodHistory.map((entry,index)=>({entry,index})).reverse().forEach(({entry,index}) => {
      const card = node('article','', 'saved-entry'); card.append(node('strong',entry.date || 'Saved check-in'));
      card.append(node('p', `Mood: ${entry.mood || entry.value || 'Not recorded'}`));
      if (entry.score) card.append(node('p',`Calm score: ${entry.score}/10`));
      if (entry.influences?.length) card.append(node('p',`Influences: ${entry.influences.join(', ')}`));
      if (entry.note) card.append(node('p',entry.note,'mood-saved-note'));
      const controls = node('div','', 'mood-entry-controls');
      const editButton = node('button','Edit','secondary'); editButton.onclick=()=>edit(index);
      const deleteButton = node('button','Delete','secondary'); deleteButton.onclick=()=> {
        if (!confirm('Delete this mood check-in?')) return;
        if (commit(()=>steadierMindMoodHistory.splice(index,1))) { reset(); $('moodStatus').textContent='Check-in deleted.'; $('moodSuggestion').hidden=true; }
      }; controls.append(editButton,deleteButton); card.append(controls); history.append(card);
    });
  };
  window.renderSavedMoodHistory = window.renderMoodTracker;
  document.addEventListener('DOMContentLoaded', () => {
    $('moodForm').addEventListener('submit', event=>{event.preventDefault();saveMoodEntry();});
    $('moodCancel').onclick=()=>{reset();$('moodStatus').textContent='Editing canceled.';};
    renderMoodTracker();
  });
})();
