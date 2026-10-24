/* No analytics, advertising pixels, account prompts, or autoplay on the public page. */
(() => {
  // Preserve old Home Screen installations that still launch the root URL.
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
    location.replace('app'); return;
  }
  const clips = [...document.querySelectorAll('.demo-video video')];
  clips.forEach(clip => clip.addEventListener('play', () => clips.forEach(other => { if (other !== clip) other.pause(); })));
  document.addEventListener('visibilitychange', () => { if (document.hidden) clips.forEach(clip => clip.pause()); });
})();
