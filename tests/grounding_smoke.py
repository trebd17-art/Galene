"""Checks grounding alternatives, skips, rewards, and starter integration.
Requires Python Playwright and /usr/bin/chromium.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading
from pathlib import Path
from functools import partial
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
    page.evaluate('showScreen("tools")')
    page.locator('#tools button', has_text='Grounding').click()
    assert 'five things' in page.locator('#groundingSensePrompt').inner_text()
    assert page.locator('#groundingContinue').is_hidden()
    points = page.evaluate('mindPoints')
    page.locator('#groundingNext').click()
    assert page.locator('#groundingSenseNumber').inner_text() == '4'
    page.locator('#groundingSkip').click()
    page.locator('#groundingNext').click()
    assert 'smell' in page.locator('#groundingSensePrompt').inner_text()
    page.locator('#groundingAlternative').click()
    assert 'nearby' in page.locator('#groundingSensePrompt').inner_text()
    page.locator('#groundingNext').click()
    assert 'taste' in page.locator('#groundingSensePrompt').inner_text()
    page.locator('#groundingAlternative').click()
    assert 'one other nearby detail' in page.locator('#groundingSensePrompt').inner_text()
    page.locator('#groundingNext').click()
    page.locator('#groundingContinue').click()
    assert page.evaluate('mindPoints') == points + 5
    page.evaluate('continueAfterGrounding()')
    assert page.evaluate('mindPoints') == points + 5
    page.evaluate('openEmergencyTool("grounding")')
    points = page.evaluate('mindPoints')
    for _ in range(5):
        page.locator('#groundingSkip').click()
    page.locator('#groundingContinue').click()
    assert page.evaluate('mindPoints') == points
    page.evaluate('showScreen("assessment")')
    page.locator('#setupNext').click()
    page.locator('[name="starterFeeling"][value="Overwhelmed"]').check()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.locator('#starterResult button', has_text='Start My First Routine').click()
    page.locator('#routineNext').click()
    page.locator('#routinePanel button', has_text='Open Grounding').click()
    page.locator('#groundingSession .text-back').first.click()
    assert page.locator('#routineHeading').inner_text() == 'Settle'
    page.locator('#routinePanel button', has_text='Open Grounding').click()
    for _ in range(5):
        page.locator('#groundingNext').click()
    assert page.locator('#groundingContinue').inner_text() == 'Continue My Routine'
    page.locator('#groundingContinue').click()
    assert page.locator('#routineHeading').inner_text() == 'Reflect'
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('openGroundingSession()')
        assert page.locator('#groundingSession').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors, errors
    print('PASS: all five senses, smell/taste alternatives, skips, single completion reward, skip-all no reward, routine return/back, mobile widths; no JS errors')
    b.close()
s.shutdown()
