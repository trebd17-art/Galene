"""Exercise reminder controls with a simulated device; no real pushes or external data."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
mock="""(() => {
window.permissionRequests=0;window.previewNotifications=[];window.unsubscribed=false;
window.Notification=class { static permission='granted'; static async requestPermission(){window.permissionRequests++;return this.permission;} };
window.PushManager=class {};
const sub={toJSON:()=>({endpoint:'https://fcm.googleapis.com/fcm/send/test',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}}),unsubscribe:async()=>{window.unsubscribed=true;return true;}};
const registration={pushManager:{getSubscription:async()=>sub,subscribe:async()=>sub},showNotification:async(title,options)=>window.previewNotifications.push({title,...options})};
Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register:async()=>registration,ready:Promise.resolve(registration),getRegistration:async()=>registration}});
})();"""
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844})
    context.route('https://fonts.googleapis.com/**',lambda r:r.abort())
    requests=[]
    def api(route):
        req=route.request
        if req.method=='GET': route.fulfill(json={'ready':True,'publicKey':'B'*87})
        else:
            requests.append((req.method,req.post_data_json))
            route.fulfill(json={'ok':True})
    context.route('**/.netlify/functions/reminders',api)
    page=context.new_page();page.add_init_script(mock)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    def open_settings():
        page.locator('#welcome').wait_for(state='visible')
        page.evaluate('showScreen("settings")')
        page.locator('#reminderEnable').wait_for(state='visible')
        page.wait_for_function('!document.getElementById("reminderEnable").disabled')
    page.goto(url,wait_until='networkidle');open_settings()
    assert page.evaluate('permissionRequests')==0
    assert page.locator('#reminderState').inner_text()=='Off'
    assert page.locator('#reminderTime option').count()==52
    page.locator('#reminderTime').select_option('14:30')
    page.locator('#reminderTimezone').select_option('America/New_York')
    page.locator('#reminderEnable').click()
    page.wait_for_function('document.getElementById("reminderState").textContent.startsWith("On")')
    assert page.evaluate('permissionRequests')==1
    method,data=requests[-1];assert method=='POST'
    assert data['time']=='14:30' and data['timezone']=='America/New_York' and data['discreet']
    assert len(data['token'])==64
    assert not any(k in data for k in ['journalEntries','moodHistory','plan','starter'])
    page.locator('#reminderTest').click()
    page.wait_for_function('previewNotifications.length===1')
    assert page.evaluate('previewNotifications[0].body')=='Your daily reminder is here.'
    page.reload(wait_until='networkidle');open_settings()
    assert page.locator('#reminderTime').input_value()=='14:30'
    assert page.evaluate('permissionRequests')==0
    assert page.locator('#reminderState').inner_text().startswith('On')
    page.locator('#reminderDiscreet').uncheck()
    page.locator('#reminderEnable').click()
    page.wait_for_timeout(100)
    assert not requests[-1][1]['discreet']
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#settings').evaluate('(el)=>el.scrollWidth<=el.clientWidth')
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='/workspace/galene-setup/daily-reminders.png',full_page=True)
    page.locator('#reminderDisable').click()
    page.wait_for_function('document.getElementById("reminderState").textContent==="Off"')
    assert requests[-1][0]=='DELETE' and page.evaluate('unsubscribed')
    assert page.evaluate('localStorage.getItem("steadyMind.pushReminder")') is None
    page.evaluate('Notification.permission="denied"')
    page.locator('#reminderEnable').click()
    page.wait_for_function('document.getElementById("reminderStatus").textContent.includes("permission")')
    assert page.locator('#reminderState').inner_text()=='Off'
    # A save failure must not claim activation; retain a retry/deletion token.
    page.evaluate('Notification.permission="granted"')
    page.route('**/.netlify/functions/reminders',lambda r:r.fulfill(status=503,json={'error':'Temporarily unavailable.'}) if r.request.method=='POST' else api(r))
    page.locator('#reminderEnable').click()
    page.wait_for_function('document.getElementById("reminderStatus").textContent.includes("Temporarily")')
    assert page.locator('#reminderState').inner_text()=='Check setup'
    assert page.locator('#reminderDisable').is_visible()
    page.route('**/.netlify/functions/reminders',lambda r:r.fulfill(status=503,json={'error':'Could not turn off yet.'}) if r.request.method=='DELETE' else api(r))
    page.locator('#reminderDisable').click()
    page.wait_for_function('document.getElementById("reminderStatus").textContent.includes("Could not turn off")')
    assert page.evaluate('JSON.parse(localStorage.getItem("steadyMind.pushReminder")).token')
    # Clearing app data must remove the remote subscription before losing its deletion token.
    page.route('**/.netlify/functions/reminders',api)
    page.locator('#reminderEnable').click()
    page.wait_for_function('document.getElementById("reminderState").textContent.startsWith("On")')
    with page.expect_download() as download:
        page.locator('#settings button',has_text='Export My Data').click()
    assert requests[-1][1]['token'] not in Path(download.value.path()).read_text()
    page.once('dialog',lambda d:d.accept())
    page.locator('#settings button',has_text='Clear Saved Data').click()
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert requests[-1][0]=='DELETE'
    assert page.evaluate('localStorage.getItem("steadyMind.pushReminder")') is None
    # A site without server keys never asks for permission or offers a working enable button.
    other=browser.new_context();other.route('https://fonts.googleapis.com/**',lambda r:r.abort())
    other.route('**/.netlify/functions/reminders',lambda r:r.fulfill(json={'ready':False,'publicKey':None}))
    unavailable=other.new_page();unavailable.add_init_script(mock)
    unavailable.goto(url,wait_until='networkidle');unavailable.locator('#welcome').wait_for(state='visible')
    unavailable.evaluate('showScreen("settings")')
    assert unavailable.locator('#reminderEnable').is_disabled()
    assert 'not available yet' in unavailable.locator('#reminderStatus').inner_text()
    assert unavailable.evaluate('permissionRequests')==0
    unsupported=other.new_page();unsupported.add_init_script('delete window.PushManager;')
    unsupported.goto(url,wait_until='networkidle');unsupported.locator('#welcome').wait_for(state='visible')
    unsupported.evaluate('showScreen("settings")')
    assert unsupported.locator('#reminderEnable').is_disabled()
    assert 'does not support' in unsupported.locator('#reminderStatus').inner_text()
    # Installation metadata and service worker are actually served as standalone resources.
    assert context.request.get(url+'manifest.webmanifest').json()['display']=='standalone'
    assert context.request.get(url+'sw.js').status==200
    assert not errors,errors
    print('PASS: opt-in only, saved time/timezone, generic preview, updates, unsubscribe, denied permission, failed save, unconfigured/unsupported states, mobile widths, manifest/service-worker assets')
    browser.close()
server.shutdown()
