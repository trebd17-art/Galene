"""Check mood persistence, editing, deletion, trends, and mobile layout."""
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
    page.evaluate('showScreen("moodTracker")')
    points=page.evaluate('mindPoints')
    page.locator('#calmScore').select_option('6')
    page.locator('#trackerMood').select_option('Anxious')
    page.locator('[name=moodInfluence][value=Sleep]').check()
    page.locator('#moodNote').fill('<img src=x onerror=bad()>')
    page.locator('#moodSave').click()
    assert page.evaluate('steadierMindMoodHistory.length')==1
    assert page.evaluate('mindPoints')==points+5
    assert page.locator('#moodHistory img').count()==0
    assert page.locator('#moodChart .mood-chart-day').count()==7
    page.locator('#moodSuggestion button').click()
    assert page.locator('#breathingSession').is_visible()
    page.evaluate('showScreen("moodTracker")')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("moodTracker")')
    assert '<img src=x' in page.locator('#moodHistory').inner_text()
    page.locator('#moodHistory button',has_text='Edit').click()
    page.locator('#calmScore').select_option('8')
    page.locator('#moodSave').click()
    assert page.evaluate('steadierMindMoodHistory[0].score')==8
    assert page.evaluate('mindPoints')==points+5
    page.locator('#calmScore').select_option('5')
    page.locator('#trackerMood').select_option('Calm')
    page.locator('#moodNote').fill('Retry note')
    page.evaluate('window.actualSave=saveSteadierMindData;saveSteadierMindData=()=>false')
    page.locator('#moodSave').click()
    assert page.evaluate('steadierMindMoodHistory.length')==1
    assert page.locator('#moodNote').input_value()=='Retry note'
    assert page.evaluate('mindPoints')==points+5
    page.evaluate('saveSteadierMindData=window.actualSave')
    page.locator('#moodSave').click()
    assert page.evaluate('steadierMindMoodHistory.length')==2
    page.on('dialog',lambda d:d.accept())
    page.locator('#moodHistory button',has_text='Delete').first.click()
    assert page.evaluate('steadierMindMoodHistory.length')==1
    page.evaluate('''() => {
      const today = new Date();
      for (const offset of [1,2,7,8,9]) {
        const date=new Date(today);date.setDate(date.getDate()-offset);
        steadierMindMoodHistory.push({mood:'Calm',score:offset<7?6:4,createdAt:date.toISOString(),date:date.toLocaleString()});
      }
      renderMoodTracker();saveSteadierMindData();
    }''')
    assert 'Previous seven days: 4.0/10' in page.locator('#moodSummary').inner_text()
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#moodTracker').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors,errors
    print('PASS: mood save/reload, safe notes, chart, tool suggestion, edit without extra XP, failure rollback/retry, delete, weekly comparison, mobile widths')
    browser.close()
server.shutdown()
