"""Breathing timing, pause, completion, routine integration, and layout checks.
Requires Python Playwright and /usr/bin/chromium.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
s = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=s.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    page.goto(f'http://127.0.0.1:{s.server_port}/', wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.clock.install()
    page.evaluate('showScreen("tools")')
    page.locator('#tools button', has_text='Gentle Breathing').click()
    assert page.locator('#gentleBreathingBegin').is_visible()
    assert '60 seconds' in page.locator('#gentleBreathingTimer').inner_text()
    page.locator('#gentleBreathingBegin').click()
    page.clock.run_for(4100)
    assert 'out gently' in page.locator('#gentleBreathingPhase').inner_text()
    page.locator('#gentleBreathingPause').click()
    before = page.locator('#gentleBreathingTimer').inner_text()
    page.clock.run_for(5000)
    assert page.locator('#gentleBreathingTimer').inner_text() == before
    page.locator('#gentleBreathingPause').click()
    page.clock.run_for(1000)
    assert page.locator('#gentleBreathingTimer').inner_text() != before
    points = page.evaluate('mindPoints')
    page.locator('#gentleBreathingFinish').click()
    page.locator('#gentleBreathingContinue').click()
    assert page.evaluate('mindPoints') == points
    page.locator('#tools').wait_for(state='visible')
    for minutes, seconds in [(2, 30), (5, 60), (10, 120)]:
        page.evaluate('showScreen("assessment")')
        while page.locator('#setupBack').is_visible():
            page.locator('#setupBack').click()
        page.locator('#setupNext').click()
        page.locator('#setupNext').click()
        page.locator(f'[name="starterMinutes"][value="{minutes}"]').check()
        page.locator('#setupNext').click()
        page.locator('#starterResult button', has_text='Start My First Routine').click()
        page.locator('#routineNext').click()
        page.locator('#routinePanel button', has_text='Open Breathing').click()
        assert f'{seconds} seconds' in page.locator('#gentleBreathingTimer').inner_text()
        page.locator('#gentleBreathingBegin').click()
        page.clock.run_for(seconds * 1000 + 100)
        assert page.locator('#gentleBreathingEnd').is_visible()
        assert page.locator('#gentleBreathingContinue').inner_text() == 'Continue My Routine'
        points = page.evaluate('mindPoints')
        page.locator('#gentleBreathingContinue').click()
        assert page.locator('#routineHeading').inner_text() == 'Reflect'
        assert page.evaluate('mindPoints') == points + 5
        page.evaluate('continueAfterBreathing()')
        assert page.evaluate('mindPoints') == points + 5
    page.evaluate('startStarterRoutine()')
    page.evaluate('launchStarterTool("breathing")')
    page.locator('#gentleBreathingBegin').click()
    page.locator('#gentleBreathingGrounding').click()
    page.locator('#groundingSession').wait_for(state='visible')
    assert 'five things' in page.locator('#groundingSensePrompt').inner_text()
    page.locator('#groundingSession .text-back').first.click()
    page.locator('#starterRoutine').wait_for(state='visible')
    page.evaluate('openBreathingSession(60)')
    page.locator('#gentleBreathingBegin').click()
    page.evaluate('showScreen("mainMenu")')
    before = page.locator('#gentleBreathingTimer').inner_text()
    page.clock.run_for(70000)
    assert page.locator('#gentleBreathingTimer').inner_text() == before
    page.evaluate('showScreen("todayPlan"); startBreathing()')
    page.locator('#breathingSession').wait_for(state='visible')
    page.locator('#breathingSession .text-back').first.click()
    page.locator('#todayPlan').wait_for(state='visible')
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('openBreathingSession(60)')
        assert page.locator('#breathingSession').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.clock.run_for(1000)
    assert not errors, errors
    print('PASS: explicit start, no hold phase, pause/resume, early finish, 30/60/120-second completion, single XP, routine return, grounding switch, cleanup, mobile layout')
    b.close()
s.shutdown()
