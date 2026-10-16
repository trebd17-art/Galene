/* Opt-in push preferences are separate from journals, backups, and mood data. */
(function () {
  'use strict';
  const key = 'steadyMind.pushReminder', api = '/.netlify/functions/reminders';
  const $ = id => document.getElementById(id);
  let saved = null, config = null, busy = false;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const supported = window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && (!ios || installed);
  const say = message => { $('reminderStatus').textContent = message; };
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n=>n.toString(16).padStart(2,'0')).join('');
  const persist = value => { localStorage.setItem(key,JSON.stringify(value)); saved = value; };
  function render() {
    const enabled = !!saved?.enabled;
    $('reminderEnable').textContent = enabled ? 'Save reminder changes' : 'Turn on daily reminders';
    $('reminderEnable').disabled = busy || !supported || !config?.ready;
    $('reminderDisable').hidden = !saved?.token;
    $('reminderDisable').disabled = busy;
    $('reminderTest').hidden = !enabled;
    $('reminderTest').disabled = busy;
    $('reminderState').textContent = saved?.pending ? 'Check setup' : enabled ? 'On · once a day' : 'Off';
  }
  async function request(method, body) {
    const result = await fetch(api,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    let data;
    try { data = await result.json(); } catch (_) { throw Error('The reminder service is unavailable. Please try again later.'); }
    if (!result.ok) throw Error(data.error || 'Reminders could not be updated.');
    return data;
  }
  function applicationKey(value) {
    const binary = atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='));
    return Uint8Array.from(binary,c=>c.charCodeAt(0));
  }
  async function enable(event) {
    event.preventDefault();
    if (busy || !supported || !config?.ready) return;
    busy = true; render();
    let subscription, registration;
    try {
      // Permission must follow the user's button click, including on iOS.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw Error('Reminders are off. You can change notification permission in your browser or device settings.');
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(config.publicKey)});
      const next = {token:saved?.token || token(), time:$('reminderTime').value, timezone:$('reminderTimezone').value, discreet:$('reminderDiscreet').checked, enabled:false, pending:true};
      // Retain the deletion token even if a connection fails after the server saves.
      persist(next);
      await request('POST',{...next, subscription:subscription.toJSON()});
      persist({...next,enabled:true,pending:false});
      say('Your daily reminder is on. Delivery time can vary with your device and connection.');
    } catch(error) { say((error.message || 'Reminders could not be enabled.') + (saved?.pending ? ' Setup is unconfirmed. Retry saving, or turn off reminders to remove this subscription.' : '')); }
    finally { busy = false; render(); }
  }
  async function disable() {
    if (busy) throw Error('Please wait for the reminder update to finish.');
    busy = true; render();
    try {
      if (saved?.token) await request('DELETE',{token:saved.token});
      // Keep the token until both steps succeed, so an interrupted opt-out can be retried.
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : null;
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription && !await subscription.unsubscribe()) throw Error('Your device could not finish turning off reminders. Please try again.');
      localStorage.removeItem(key); saved = null;
      say('Daily reminders are off.');
    } finally { busy = false; render(); }
  }
  window.disableSteadierMindReminders = disable;
  document.addEventListener('DOMContentLoaded', async () => {
    const select = $('reminderTime');
    for(let hour=8;hour<21;hour++) for(const minute of [0,15,30,45]) {
      const option=document.createElement('option');option.value=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
      option.textContent=`${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`; select.append(option);
    }
    select.value = saved?.time || '10:00';
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const zones = [...new Set([localZone,saved?.timezone,'UTC',...(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [])].filter(Boolean))];
    zones.forEach(zone=>{const option=document.createElement('option');option.value=zone;option.textContent=zone.replace(/_/g,' ');$('reminderTimezone').append(option);});
    $('reminderTimezone').value=saved?.timezone || localZone;
    $('reminderDiscreet').checked = saved?.discreet ?? true;
    $('reminderForm').addEventListener('submit',enable);
    $('reminderDisable').onclick = () => disable().catch(error=>say(error.message));
    $('reminderTest').onclick = async () => {
      try {
        const registration=await navigator.serviceWorker.getRegistration('/');
        if (!registration || Notification.permission !== 'granted') throw Error('Allow notifications on this device before sending a preview.');
        await registration.showNotification('SteadierMind',{body:$('reminderDiscreet').checked?'Your daily reminder is here.':'A small pause, if you need one.',tag:'steadiermind-preview',silent:true,icon:'/logo-picture.png'});
        say('Preview sent to your device. Device settings may hide or silence it.');
      } catch(error) { say(error.message); }
    };
    if (saved?.enabled && 'Notification' in window && Notification.permission !== 'granted') {
      try { persist({...saved,enabled:false}); } catch (_) {}
    }
    render();
    if (!supported) {
      say(ios && !installed ? 'On iPhone or iPad, use Safari → Share → Add to Home Screen, then open SteadierMind from that icon. Notifications require iOS/iPadOS 16.4 or later.' : 'This browser does not support reminders here. Try an updated browser over a secure HTTPS connection.');
      return;
    }
    try {
      const result=await fetch(api,{cache:'no-store'});
      if (!result.ok) throw Error();
      config=await result.json();
      if (!config.ready) say('Daily reminders are not available yet. You can keep using all other app features.');
      else if (Notification.permission === 'denied') say('Notifications are blocked. You can allow them in your browser or device settings.');
      else say(saved?.enabled?'Your daily reminder is on. Save changes if you travel to another timezone.':'Optional: choose a time and turn on a daily reminder.');
    } catch (_) { say('The reminder service is unavailable. Reminders cannot be enabled right now.'); }
    render();
  });
})();
