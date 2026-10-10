"""Sleep wind-down privacy, finish behavior, and integration checks.
Requires Python Playwright and Chromium.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("tools")')
    page.locator('#tools button', has_text='Sleep Wind-Down').click()
    assert page.locator('body').evaluate('(e)=>e.classList.contains("sleep-mode")')
    assert page.evaluate('ambientNodes.length') == 0
    assert page.locator('#sleepSound').evaluate('(e)=>!e.open')
    page.locator('#sleepNext').click()
    page.locator('#sleepNote').fill('PRIVATE_UNSAVED_SLEEP')
    page.evaluate('saveSteadierMindData()')
    assert 'PRIVATE_UNSAVED_SLEEP' not in page.evaluate('JSON.stringify(localStorage)')
    page.locator('#sleepNext').click()
    for name in ['Your jaw', 'Your shoulders', 'Your hands']:
        assert name in page.locator('#sleepPanel').inner_text()
        page.locator('#sleepNext').click()
    points = page.evaluate('mindPoints')
    page.locator('#sleepNext').click()
    assert page.locator('#sleepProgress').inner_text() == 'Finished for tonight'
    assert page.locator('#sleepSession').is_visible()
    assert page.evaluate('mindPoints') == points
    assert 'PRIVATE_UNSAVED_SLEEP' not in page.evaluate('JSON.stringify(localStorage)')
    page.locator('#sleepPanel button').click()
    assert not page.locator('body').evaluate('(e)=>e.classList.contains("sleep-mode")')
    page.evaluate('openSleepSession()')
    page.locator('#sleepNext').click()
    page.locator('#sleepNote').fill('Saved for tomorrow <script>no execution</script>')
    page.locator('#sleepSaveConsent').check()
    page.locator('#sleepNext').click()
    for _ in range(3):
        page.locator('#sleepSkip').click()
    page.evaluate('window.originalSave = saveSteadierMindData; saveSteadierMindData = () => false')
    page.locator('#sleepNext').click()
    assert 'could not save' in page.locator('#sleepSaveStatus').inner_text()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.sleepSessionId).length') == 0
    page.evaluate('saveSteadierMindData = window.originalSave')
    page.locator('#sleepNext').click()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.sleepSessionId).length') == 1
    page.evaluate('nextSleepStep()')
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.sleepSessionId).length') == 1
    page.evaluate('showScreen("assessment")')
    page.locator('[name="starterGoal"][value="Sleep"]').check()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    assert 'gentle wind-down' in page.locator('#starterSummary').inner_text()
    page.locator('#starterResult button', has_text='Start My First Routine').click()
    page.locator('#routineNext').click()
    page.locator('#routinePanel button', has_text='Open Sleep Wind-Down').click()
    page.locator('#sleepSession .text-back').first.click()
    assert page.locator('#routineHeading').inner_text() == 'Settle'
    page.locator('#routinePanel button', has_text='Open Sleep Wind-Down').click()
    for _ in range(5):
        page.locator('#sleepSkip').click()
    page.locator('#sleepNext').click()
    assert page.locator('#sleepSession').is_visible()
    assert page.locator('#sleepPanel button').inner_text() == 'Return to My Routine'
    page.locator('#sleepPanel button').click()
    assert page.locator('#routineHeading').inner_text() == 'Reflect'
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.sleepSessionId).length') == 1
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('openSleepSession()')
        assert page.locator('#sleepSession').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors, errors
    print('PASS: dim mode, sound off, optional/private note, three relaxation prompts, no reward or automatic bright exit, opt-in save/retry/once, skips, sleep recommendation, routine back/return, persisted note, mobile widths; no JS exceptions')
    browser.close()
server.shutdown()
