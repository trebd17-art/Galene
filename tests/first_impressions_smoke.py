"""Check first-use expectations, the backup shortcut, and safe session exits."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("journal")')
    page.locator('.journal-storage-note button').click()
    assert page.locator('#settings').is_visible()
    assert page.locator('#savedDataHeading').evaluate('(e)=>e===document.activeElement')
    page.evaluate('openBreathingSession(30);beginGentleBreathing();finishGentleBreathing()')
    assert 'early' in page.locator('#gentleBreathingCompletion').inner_text()
    points=page.evaluate('mindPoints')
    page.locator('#gentleBreathingContinue').click()
    assert page.evaluate('mindPoints')==points
    for open_game,screen,running in [('openCalmFocusGame','calmFocusGameScreen','calmFocusRunning'),('openGroundingGame','groundingGameScreen','groundingGameRunning')]:
        page.evaluate(open_game+'()')
        start='startCalmFocusRound' if 'Calm' in open_game else 'startGroundingGameRound'
        page.evaluate(start+'()')
        assert page.evaluate(running)
        page.locator('#'+screen+' button',has_text='Finish round').click()
        assert not page.evaluate(running)
        assert page.evaluate('mindPoints')==points
        assert 'Round ended' in page.locator('#'+('calmFocusResult' if 'Calm' in open_game else 'groundingResult')).inner_text()
    page.evaluate('openSimpleGame("meadow")')
    page.locator('#simpleGame button',has_text='Finish and return').click()
    assert page.locator('#games').is_visible()
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        for screen in ['tools','journal','simpleGame']:
            page.evaluate('(screen)=>showScreen(screen)',screen)
            assert page.locator('#'+screen).evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS: backup shortcut/focus, honest early finish, game exits without points, mobile layout')
