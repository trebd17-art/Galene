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
    page.add_init_script('if(!sessionStorage.getItem("fixtureOnce")){sessionStorage.setItem("fixtureOnce","1");localStorage.setItem("steadyMind.v1.data",JSON.stringify({version:1,xp:55,completedActivities:0,journalEntries:[{id:"old",date:"2025-10-14",summary:"One year earlier"},{id:"ambiguous",date:"01/02/2025",summary:"Uncertain legacy date"}],moodHistory:[],gameProgress:{}}));}')
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalArchive.available')
    assert page.evaluate('mindPoints')==55
    assert page.evaluate('steadierMindJournalEntries.length')==2
    assert page.evaluate('JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY)).journalStorage')=='indexeddb-v1'
    page.evaluate('showScreen("journal")')
    page.locator('#pastReflections summary').click()
    page.locator('#journalDate').fill('2025-10-14')
    assert 'One year earlier' in page.locator('#journalHistory').inner_text()
    page.locator('#journalDate').fill('2025-01-02')
    assert 'Uncertain legacy date' not in page.locator('#journalHistory').inner_text()
    page.evaluate('clearJournalDate()')
    page.locator('#journalHistory input[type=date]').fill('2025-01-02')
    page.locator('#journalDate').fill('2025-01-02')
    assert 'Uncertain legacy date' in page.locator('#journalHistory').inner_text()
    page.evaluate('clearJournalDate()')
    page.locator('#reflectionAnswer').fill('A new journal entry')
    page.locator('#reflectionSave').click()
    if page.locator('#rewardContinue').count():page.locator('#rewardContinue').click()
    created=page.evaluate('steadierMindJournalEntries.at(-1).createdAt')
    day=page.evaluate('steadierMindJournalEntries.at(-1).createdDay')
    page.locator('#reflectionAnswer').fill('Edited without changing its original date')
    page.locator('#reflectionSave').click()
    assert page.evaluate('steadierMindJournalEntries.at(-1).createdAt')==created
    assert page.evaluate('steadierMindJournalEntries.at(-1).createdDay')==day
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.length')==3
    assert 'Edited without' in page.evaluate('steadierMindJournalEntries.at(-1).summary')
    assert page.evaluate('JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY)).journalEntries.length')==0
    page.evaluate('showScreen("journal")')
    page.locator('#pastReflections summary').click()
    page.locator('#journalDate').fill(day)
    assert page.locator('#journalHistory .saved-entry').count()==1
    # Removing an entry before its first archive flush must not resurrect it.
    page.evaluate("""async () => {
      steadierMindJournalEntries.push({id:'rapid-remove',createdDay:'2025-10-14',summary:'Temporary'});
      saveSteadierMindData();
      steadierMindJournalEntries=steadierMindJournalEntries.filter(e=>e.id!=='rapid-remove');
      saveSteadierMindData();await steadierMindJournalArchive.flush();
    }""")
    assert not page.evaluate("async () => (await steadierMindJournalArchive.entriesForDay('2025-10-14')).some(e=>e.id==='rapid-remove')")
    # Persistence through an immediate reload is protected by the recovery log.
    page.evaluate('steadierMindJournalEntries.push({id:"recover",createdDay:"2025-10-14",summary:"Recovery entry"});saveSteadierMindData();location.reload()')
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.some(e=>e.id==="recover")')
    page.evaluate('window.steadierMindRestoring=true;localStorage.removeItem(STEADIERMIND_STORAGE_KEY);location.reload()')
    page.wait_for_load_state('networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.length')==4
    page.evaluate('showScreen("journal")')
    page.locator('#pastReflections summary').click()
    page.evaluate('''() => {
      for(let i=0;i<30;i++)steadierMindJournalEntries.push({id:'page-'+i,createdDay:'2025-10-14',summary:'Page '+i});
      saveSteadierMindData();renderSavedJournalEntries();
    }''')
    assert page.locator('#journalHistory .saved-entry').count()==20
    page.locator('#journalShowMore').click()
    assert page.locator('#journalHistory .saved-entry').count()==34
    page.evaluate('''() => {
      window.originalTransaction=IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction=function(...args){const tx=window.originalTransaction.apply(this,args);if(args[1]==='readwrite')tx.abort();return tx;};
      steadierMindJournalEntries.push({id:'pending-test',createdDay:'2025-10-14',summary:'Pending archive'});saveSteadierMindData();
    }''')
    page.wait_for_timeout(150)
    assert page.evaluate('JSON.parse(localStorage.getItem(STEADIERMIND_STORAGE_KEY)).journalPending.some(op=>op.entry?.id==="pending-test")')
    # A failed IndexedDB transaction retains the recovery log for replay.
    page.evaluate('() => {IDBDatabase.prototype.transaction=window.originalTransaction;}')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('steadierMindJournalEntries.some(e=>e.id==="pending-test")')
    fallback=browser.new_page()
    fallback.add_init_script('indexedDB.open=()=>{throw new Error("unavailable")};localStorage.setItem("steadyMind.v1.data",JSON.stringify({version:1,xp:9,journalEntries:[{summary:"Fallback entry"}],moodHistory:[],gameProgress:{}}))')
    fallback.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    fallback.locator('#welcome').wait_for(state='visible')
    assert fallback.evaluate('!steadierMindJournalArchive.available')
    assert fallback.evaluate('steadierMindJournalEntries[0].summary')=='Fallback entry'
    fallback.close()
    assert not errors,errors
    print('PASS: legacy migration, preserved points, date index/filter, ambiguous-date confirmation, original date survives edits, IndexedDB reload, recovery log')
    browser.close()
server.shutdown()
