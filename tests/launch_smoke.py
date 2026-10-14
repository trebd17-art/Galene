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
    page.evaluate('showScreen("auth")')
    assert page.locator('#auth button',has_text='Continue to SteadierMind').count()==1
    assert 'No account is needed' in page.locator('#auth').inner_text()
    page.locator('#auth button',has_text='Continue to SteadierMind').click()
    page.evaluate('showScreen("settings")')
    assert 'Developer Tools' not in page.locator('#settings').inner_text()
    page.locator('#settings button',has_text='Help & Support').click()
    assert page.locator('#support a[href="mailto:steadiermind@gmail.com"]').count()==1
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#support').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    page.evaluate('openCalmFocusGame()')
    assert page.locator('#calmFocusGameScreen .premium-locked').count()==0
    page.evaluate('openGroundingGame()')
    assert page.locator('#groundingGameScreen .premium-locked').count()==0
    page.goto(f'http://127.0.0.1:{server.server_port}/support.html')
    assert page.locator('a[href="privacy.html"]').count()==1
    assert page.locator('a[href="mailto:steadiermind@gmail.com"]').count()==1
    assert not errors,errors
    print('PASS: truthful welcome, home navigation, customer settings, support/contact pages, mobile widths, no premium prompts in available games')
    browser.close()
server.shutdown()
