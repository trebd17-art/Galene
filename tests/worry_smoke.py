"""Worry Release privacy and integration smoke checks. Requires Playwright and Chromium."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
root = Path(__file__).resolve().parents[1]
s = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
threading.Thread(target=s.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    url = f'http://127.0.0.1:{s.server_port}/'
    page.goto(url, wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("tools")')
    page.locator('#tools button', has_text='Worry Release').click()
    page.locator('#worryText').fill('PRIVATE_UNSAVED')
    page.evaluate('saveSteadierMindData()')
    assert 'PRIVATE_UNSAVED' not in page.evaluate('JSON.stringify(localStorage)')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('openEmergencyTool("worry")')
    assert page.locator('#worryText').input_value() == ''
    for control in ['action', 'some', 'none']:
        page.evaluate('openEmergencyTool("worry")')
        page.locator('#worryText').fill('PRIVATE_UNSAVED')
        page.locator('#worryNext').click()
        page.locator(f'[name="worryControl"][value="{control}"]').check()
        page.locator('#worryNext').click()
        if control in ['action', 'some']:
            page.locator('#worryAction').fill('Take one small step')
        else:
            assert 'feeling remains' in page.locator('#worryDescription').inner_text()
        page.locator('[name="worryResponse"][value="present"]').check()
        page.locator('#worryNext').click()
        assert not page.locator('#worrySaveConsent').is_checked()
        page.locator('#worryNext').click()
        assert 'PRIVATE_UNSAVED' not in page.evaluate('JSON.stringify(localStorage)')
        assert page.locator('#worryPanel').inner_text() == ''
    page.evaluate('openEmergencyTool("worry")')
    page.locator('#worryText').fill('Saved worry <script>bad()</script>')
    page.locator('#worryNext').click()
    page.locator('[name="worryControl"][value="none"]').check()
    page.locator('#worryNext').click()
    page.locator('[name="worryResponse"][value="later"]').check()
    page.locator('#worryNext').click()
    page.locator('#worrySaveConsent').check()
    page.locator('#worryNext').click()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.worrySessionId).length') == 1
    page.evaluate('nextWorryStep()')
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.worrySessionId).length') == 1
    page.evaluate('openEmergencyTool("worry")')
    page.locator('#worrySkip').click()
    page.locator('#worrySkip').click()
    page.locator('[name="worryResponse"][value="grounding"]').check()
    page.locator('#worryNext').click()
    page.locator('#worryPanel button', has_text='Open Grounding').click()
    page.locator('#groundingSession .text-back').first.click()
    assert 'resolve this' in page.locator('#worryHeading').inner_text()
    page.locator('#worryPanel button', has_text='Open Grounding').click()
    for _ in range(5):
        page.locator('#groundingNext').click()
    assert page.locator('#groundingContinue').inner_text() == 'Return to Worry Release'
    page.locator('#groundingContinue').click()
    page.locator('#worryNext').click()
    page.locator('#tools').wait_for(state='visible')
    page.evaluate('openEmergencyTool("worry")')
    for _ in range(3):
        page.locator('#worrySkip').click()
    page.locator('#worryNext').click()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.worrySessionId).length') == 1
    page.evaluate('showScreen("assessment")')
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.locator('#starterResult button', has_text='Start My First Routine').click()
    page.locator('#routineNext').click()
    page.evaluate('launchStarterTool("worry")')
    page.locator('#worrySession .text-back').first.click()
    assert page.locator('#routineHeading').inner_text() == 'Settle'
    page.evaluate('launchStarterTool("worry")')
    for _ in range(3):
        page.locator('#worrySkip').click()
    assert page.locator('#worryNext').inner_text() == 'Continue My Routine'
    page.locator('#worryNext').click()
    assert page.locator('#routineHeading').inner_text() == 'Reflect'
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.worrySessionId).length') == 1
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('openWorrySession()')
        assert page.locator('#worrySession').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors, errors
    print('PASS: optional writing, no autosave, reload discards unsaved writing, three control branches, opt-in journal save once, grounding round trip, skips, routine return, persisted entry, mobile widths; no JS exceptions')
    b.close()
s.shutdown()
