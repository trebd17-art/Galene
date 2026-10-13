"""Check learning content, completion persistence, tools, and mobile layout."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
server = ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("mainMenu")')
    assert page.locator('#pointsFeedback').count()==0
    before=page.evaluate('mindPoints')
    page.evaluate('mindPoints+=5;updateXP()')
    assert page.locator('#pointsFeedback').inner_text()=='+5 Mind Points ✨'
    page.evaluate('updateXP();updateXP()')
    assert page.evaluate('mindPoints')==before+5
    page.evaluate('mindPoints+=10;updateXP()')
    assert page.locator('#pointsFeedback').count()==1
    assert '+10' in page.locator('#pointsFeedback').inner_text()
    page.wait_for_timeout(1800)
    assert page.locator('#pointsFeedback').count()==0
    page.emulate_media(reduced_motion='reduce')
    page.evaluate('mindPoints+=5;updateXP()')
    assert page.locator('#pointsFeedback').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
    page.evaluate('openBreathingSession();mindPoints+=5;updateXP()')
    assert page.locator('#pointsFeedback').count()==0
    page.evaluate('openSleepSession();mindPoints+=5;updateXP()')
    assert page.locator('#pointsFeedback').count()==0
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.locator('#pointsFeedback').count()==0
    assert not errors,errors
    print('PASS: actual point deltas, no duplicate awards/toasts, cleanup, reduced motion, quiet tools, no reward popup on restore')
    browser.close()
server.shutdown()
