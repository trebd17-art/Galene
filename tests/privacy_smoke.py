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
    page.evaluate('showScreen("education")')
    page.locator('#education button',has_text='Educational Sources').click()
    assert page.locator('#educationalSourceList details').count()==15
    page.evaluate('openLesson("boundaries")')
    assert page.locator('#learningLessonBody a').count()==1
    assert 'Assertiveness' in page.locator('#learningLessonBody a').text_content()
    assert 'verification is pending' in page.locator('#learningLessonBody').text_content()
    page.evaluate('''() => {
        steadierMindJournalEntries.push({summary:'PRIVATE_REFLECTION'});
        steadierMindMoodHistory.push({mood:'Anxious',note:'PRIVATE_MOOD'});
        steadierMindGameProgress.learning={completed:['boundaries'],last:'boundaries'};
        localStorage.setItem('unrelated.preference','keep');
        localStorage.setItem('steadyMind.planBuilt','true');
        saveSteadierMindData();
    }''')
    page.evaluate('showScreen("settings")')
    with page.expect_download() as download:
        page.locator('#settings button',has_text='Export My Data').click()
    contents=Path(download.value.path()).read_text()
    assert 'PRIVATE_REFLECTION' in contents and 'PRIVATE_MOOD' in contents and 'boundaries' in contents
    page.once('dialog',lambda d:d.dismiss())
    page.locator('#settings button',has_text='Clear Saved Data').click()
    assert page.evaluate('steadierMindJournalEntries.some(e=>e.summary==="PRIVATE_REFLECTION")')
    page.once('dialog',lambda d:d.accept())
    page.locator('#settings button',has_text='Clear Saved Data').click()
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    saved=page.evaluate('JSON.stringify(localStorage)')
    assert 'PRIVATE_REFLECTION' not in saved and 'PRIVATE_MOOD' not in saved
    assert page.evaluate('steadierMindJournalEntries.length')==0
    assert page.evaluate('steadierMindMoodHistory.length')==0
    assert page.evaluate('localStorage.getItem("steadyMind.planBuilt")') is None
    assert page.evaluate('localStorage.getItem("unrelated.preference")')=='keep'
    page.reload(wait_until='networkidle')
    assert 'PRIVATE_REFLECTION' not in page.evaluate('JSON.stringify(localStorage)')
    page.evaluate('showScreen("privacy")')
    assert 'validated JSON backup' in page.locator('#privacy').inner_text()
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#privacy').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    page.goto(f'http://127.0.0.1:{server.server_port}/privacy.html')
    assert 'SteadierMind Privacy Policy' in page.locator('h2').inner_text()
    assert not errors,errors
    print('PASS: lesson-specific references, central sources, readable export, cancel deletion, deletion survives reload, scoped deletion, privacy page, mobile widths')
    browser.close()
server.shutdown()
