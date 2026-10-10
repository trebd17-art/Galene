"""Worry Release privacy and integration smoke checks. Requires Playwright and Chromium."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading
from pathlib import Path
from functools import partial
s = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=s.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = b.new_page()
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    page.goto(f'http://127.0.0.1:{s.server_port}/', wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('openWorrySession()')
    page.locator('#worryText').fill('Consent-only worry')
    page.locator('#worryNext').click()
    page.locator('#worrySkip').click()
    page.locator('#worrySkip').click()
    page.locator('#worrySaveConsent').check()
    points = page.evaluate('mindPoints')
    page.evaluate('window.originalSave = saveSteadierMindData; saveSteadierMindData = () => false')
    page.locator('#worryNext').click()
    assert 'could not save' in page.locator('#worrySaveStatus').inner_text()
    assert page.evaluate('steadierMindJournalEntries.length') == 0
    assert page.evaluate('mindPoints') == points
    page.evaluate('saveSteadierMindData = window.originalSave')
    page.locator('#worryNext').click()
    assert page.evaluate('steadierMindJournalEntries.length') == 1
    assert page.evaluate('mindPoints') == points + 5
    page.evaluate('nextWorryStep()')
    assert page.evaluate('mindPoints') == points + 5
    page.evaluate('openWorrySession()')
    points = page.evaluate('mindPoints')
    for _ in range(3):
        page.locator('#worrySkip').click()
    page.locator('#worryNext').click()
    assert page.evaluate('mindPoints') == points
    print('PASS: save failure rollback and retry, consent-only save, single reward, skip-all no reward')
    b.close()
s.shutdown()
