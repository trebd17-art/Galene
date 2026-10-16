"""Mismatches reset automatically without losing matches or changing another game."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page()
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.clock.install()
    page.evaluate('steadierMindGameProgress.simpleGame_meadow={unlocked:1,completed:[],draft:null};openSimpleGame("meadow")')
    cards=page.evaluate('steadierMindGameProgress.simpleGame_meadow.draft.cards')
    matched=[i for i,v in enumerate(cards) if v==cards[0]]
    remaining=[i for i in range(len(cards)) if i not in matched]
    mismatch=[remaining[0],next(i for i in remaining if cards[i]!=cards[remaining[0]])]
    click='(indices)=>indices.forEach(i=>document.querySelectorAll(".memory-grid button")[i].click())'
    page.evaluate(click,matched)
    points=page.evaluate('mindPoints')
    page.evaluate(click,mismatch)
    assert page.get_by_role('button',name='Try another pair').count()==0
    assert page.locator('.memory-grid button:disabled').count()==6
    page.clock.run_for(1100)
    draft=page.evaluate('steadierMindGameProgress.simpleGame_meadow.draft')
    assert draft['revealed']==[] and sorted(draft['matched'])==matched
    assert draft['moves']==2 and page.evaluate('mindPoints')==points
    page.evaluate(click,mismatch)
    page.evaluate('openSimpleGame("pond")')
    before=page.evaluate('JSON.stringify(steadierMindGameProgress.simpleGame_pond)')
    page.clock.run_for(1500)
    assert page.evaluate('JSON.stringify(steadierMindGameProgress.simpleGame_pond)')==before
    page.evaluate('openSimpleGame("meadow")')
    page.clock.run_for(1100)
    assert page.evaluate('steadierMindGameProgress.simpleGame_meadow.draft.revealed.length')==0
    assert page.evaluate('steadierMindGameProgress.simpleGame_meadow.draft.matched.length')==2
    browser.close()
server.shutdown()
print('PASS: automatic mismatch reset, matched pairs retained, input lock, no extra points, safe navigation/resume')
