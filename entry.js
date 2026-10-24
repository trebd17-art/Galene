/* Marketing links enter through the existing terms/privacy notice, never past it. */
window.continueFromWelcome = function () {
  const intent = window.steadierMindEntryIntent;
  window.steadierMindEntryIntent = '';
  const url = new URL(window.location.href); url.searchParams.delete('start');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  if (intent === 'routine') {
    if (hasBuiltPlan()) startStarterRoutine(); else showScreen('assessment');
  } else if (intent === 'grounding') openGroundingSession();
  else if (intent === 'worry') openWorrySession();
  else showScreen('mainMenu');
};
