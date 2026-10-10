"""Check game round lifecycle, rewards, progress, and mobile layout."""
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
    page.evaluate('openThoughtSortGame();startThoughtSortGame()')
    page.evaluate('sortThoughtCard(thoughtSortCurrentBank[0].bucket)')
    score=page.evaluate('thoughtSortScore')
    page.wait_for_timeout(1800)
    assert page.evaluate('thoughtSortIndex')==0
    assert page.locator('#thoughtNext').is_visible()
    page.evaluate('sortThoughtCard("unhelpful")')
    assert page.evaluate('thoughtSortScore')==score
    page.locator('#thoughtNext').click()
    assert page.evaluate('thoughtSortIndex')==1
    page.evaluate('nextThoughtSortCard()')
    assert page.evaluate('thoughtSortIndex')==1
    page.evaluate('''() => {while(thoughtSortRunning){sortThoughtCard(thoughtSortCurrentBank[thoughtSortIndex].bucket);nextThoughtSortCard();}}''')
    points=page.evaluate('mindPoints')
    page.evaluate('finishThoughtSortGame()')
    assert page.evaluate('mindPoints')==points
    assert page.evaluate('steadierMindGameProgress.thought.roundsCompleted')==1
    page.evaluate('openGroundingGame();startGroundingGameRound()')
    page.evaluate('''() => {const target=document.querySelector('[data-target="true"]');handleGroundingObjectTap(target);handleGroundingObjectTap(target);}''')
    page.wait_for_timeout(800)
    assert page.evaluate('groundingGameStepIndex')==1
    page.evaluate('''() => {handleGroundingObjectTap(document.querySelector('[data-target="true"]'));resetGroundingGame();startGroundingGameRound();}''')
    page.wait_for_timeout(800)
    assert page.evaluate('groundingGameStepIndex')==0
    page.evaluate('showScreen("games")')
    assert page.evaluate('groundingAdvanceTimer') is None
    page.evaluate('openCalmFocusGame();startCalmFocusRound();showScreen("games")')
    assert not page.evaluate('calmFocusRunning')
    assert page.evaluate('calmFocusSpawnTimer') is None
    page.evaluate('openAnchorGame();startAnchorGame();showScreen("games")')
    assert not page.evaluate('anchorRunning')
    assert page.evaluate('anchorTimer') is None
    page.evaluate('openCalmFocusGame();startCalmFocusRound()')
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))')
    assert not page.evaluate('calmFocusRunning')
    assert page.locator('#gameSessionNotice').is_visible()
    page.evaluate('delete document.hidden;startCalmFocusRound()')
    assert page.locator('#gameSessionNotice').count()==0
    page.evaluate('openAnchorGame();startAnchorGame();anchorScore=999;checkAnchorEnd()')
    points=page.evaluate('mindPoints')
    page.evaluate('checkAnchorEnd()')
    assert page.evaluate('mindPoints')==points
    level=page.evaluate('anchorLevel')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.evaluate('anchorLevel')==level
    for screen in ['games','thoughtSortGameScreen','centeredGame','groundingGameScreen','calmFocusGameScreen','anchorGameScreen']:
        page.evaluate('(screen)=>showScreen(screen)',screen)
        for width in [320,390]:
            page.set_viewport_size({'width':width,'height':844})
            assert page.locator('#'+screen).evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors,errors
    print('PASS: manual next, duplicate taps/rewards, canceled grounding transitions, game exit timers, saved levels/progress, mobile widths')
    browser.close()
server.shutdown()
