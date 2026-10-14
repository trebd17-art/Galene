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
    import json
    page.evaluate('''() => {
      steadierMindJournalEntries.push({id:'journal-one',type:'dailyReflection',date:'10/14/2026',mood:'Anxious',responses:[{prompt:'What matters?',answer:'<script>bad()</script> & a thought'}],summary:'Journal'});
      steadierMindMoodHistory.push({id:'mood-one',date:'10/14/2026',mood:'Calm',score:6,note:'=HYPERLINK("x")',influences:['Sleep']});
      saveSteadierMindData();showScreen('settings');
    }''')
    with page.expect_download() as d:page.locator('#settings button',has_text='Download Journal').click()
    html=Path(d.value.path()).read_text()
    assert '&lt;script&gt;' in html and '<script>' not in html
    assert 'What matters?' in html
    with page.expect_download() as d:page.locator('#settings button',has_text='Download Moods').click()
    csv=Path(d.value.path()).read_text()
    assert "'=HYPERLINK" in csv
    with page.expect_download() as d:page.locator('#settings button',has_text='Export My Data').click()
    backup=json.loads(Path(d.value.path()).read_text())
    assert backup['app']=='SteadierMind'
    backup['journalEntries'].append({'id':'journal-two','date':'10/14/2026','summary':'Imported thought '+('x'*12000)})
    backup['moodHistory'].append({'id':'mood-two','date':'10/14/2026','mood':'Anxious','score':4,'note':'Imported mood'})
    backup['xp']=42
    backup['plan']={'improvements':['Stress'],'challenge':'Work stress','time':'5 minutes','hope':'Calm','userType':'Student','improvementText':'Stress','path':{'name':'Stress','title':'Stress Recovery','daily':['Pause']},'mindType':{'name':'Storm Navigator','description':'A personalized path'},'supportingPaths':[],'createdAt':'10/14/2026'}
    backup['starter']={'setup':{'step':2,'goals':['Stress'],'feeling':'Anxious','minutes':5,'profile':'Student'},'routine':None}
    backup['gameProgress']['learning']={'completed':['alarm'],'last':'alarm'}
    backup['gameProgress']['simpleGame_pond']={'completed':[0],'unlocked':1,'draft':{'level':1,'won':False,'moves':0,'pattern':[0,1,2,3],'input':[0],'study':False}}
    def upload(data):
        page.locator('#backupFile').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
        page.locator('#backupPreview').wait_for(state='visible')
    upload(backup)
    assert 'Merge adds 1 journals and 1 moods' in page.locator('#backupPreviewText').inner_text()
    assert page.evaluate('steadierMindJournalEntries.length')==1
    points=page.evaluate('mindPoints')
    page.locator('#backupPreview button',has_text='Merge journal').click()
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.length')==2
    assert page.evaluate('steadierMindMoodHistory.length')==2
    assert page.evaluate('mindPoints')==points
    page.evaluate('showScreen("settings")')
    upload(backup)
    assert 'Merge adds 0 journals and 0 moods' in page.locator('#backupPreviewText').inner_text()
    page.once('dialog',lambda dialog:dialog.dismiss())
    page.locator('#backupPreview button',has_text='Replace all').click()
    assert page.evaluate('mindPoints')==points
    page.evaluate('() => {window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error("full")};}')
    page.locator('#backupPreview button',has_text='Merge journal').click()
    assert 'could not be saved' in page.locator('#transferStatus').inner_text()
    assert page.evaluate('mindPoints')==points
    page.evaluate('() => {Storage.prototype.setItem=window.realSet;}')
    page.once('dialog',lambda dialog:dialog.accept())
    page.locator('#backupPreview button',has_text='Replace all').click()
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('mindPoints')==42
    assert page.evaluate('steadierMindJournalEntries.length')==2
    assert page.locator('#rewardCelebration').count()==0
    assert page.evaluate('savedSteadyPlan.userType')=='Student'
    assert page.evaluate('hasBuiltPlan()')
    assert page.evaluate('steadierMindGameProgress.learning.completed')==['alarm']
    page.evaluate('openSimpleGame("pond")')
    assert 'Level 2 of 5' in page.locator('#simpleGameProgress').inner_text()
    page.evaluate('showScreen("settings")')
    page.evaluate('showScreen("settings")')
    invalid={**backup,'plan':{'improvements':[],'time':'5 minutes','userType':'<img src=x>','path':'Balance','mindType':'Balanced'}}
    page.locator('#backupFile').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
    page.wait_for_function('document.getElementById("transferStatus").textContent.includes("not a supported")')
    assert page.locator('#backupPreview').is_hidden()
    assert page.evaluate('mindPoints')==42
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#settings').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors,errors
    print('PASS: printable escaped journal, formula-safe mood CSV, full backup, local preview, duplicate merge, preserved points, confirmation/cancel, storage failure, full restore surviving unload, unsafe settings rejection, mobile')
    browser.close()
server.shutdown()
