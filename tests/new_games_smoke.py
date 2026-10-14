"""Check all 20 new game levels, rewards, progress, and mobile layout."""
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
    for key in ['meadow','detective','pond','garden']:
        page.evaluate('(key)=>openSimpleGame(key)',key)
        for level in range(5):
            assert f'Level {level+1} of 5' in page.locator('#simpleGameProgress').inner_text()
            if key=='meadow':
                cards=page.evaluate('steadierMindGameProgress.simpleGame_meadow.draft.cards')
                for icon in dict.fromkeys(cards):
                    indices=[i for i,v in enumerate(cards) if v==icon]
                    page.evaluate('(indices)=>indices.forEach(i=>document.querySelectorAll(".memory-grid button")[i].click())',indices)
            elif key=='detective':
                for answer in ['Fact','Prediction','Next step','Fact','Prediction','Next step','Fact'][:level+3]:
                    page.locator('#simpleGameBoard button',has_text=answer).first.click()
                    assert page.locator('#simpleGameBoard button',has_text='Fact').first.is_disabled()
                    page.locator('#simpleGameBoard button',has_text='Finish level' if answer==['Fact','Prediction','Next step','Fact','Prediction','Next step','Fact'][level+2] and page.locator('#simpleGameBoard button',has_text='Finish level').count() else 'Next sentence').click()
            elif key=='pond':
                pattern=page.evaluate('steadierMindGameProgress.simpleGame_pond.draft.pattern')
                page.locator('#simpleGameBoard button',has_text='Ready').click()
                page.evaluate('(pattern)=>pattern.forEach(i=>document.querySelectorAll(".pond-controls button")[i].click())',pattern)
            else:
                picks=[[0,3],[0,5],[0,3,5],[3,4,5],[0,1,3,5]][level]
                page.evaluate('(picks)=>picks.forEach(i=>document.querySelectorAll("#simpleGameBoard button")[i].click())',picks)
                page.locator('#simpleGameBoard button',has_text='Check my garden').click()
            assert page.locator('#simpleGameNext').is_visible(),(key,level,page.locator('#simpleGameFeedback').inner_text())
            points=page.evaluate('mindPoints')
            page.evaluate('saveSimpleGameWin();saveSimpleGameWin()')
            assert page.evaluate('mindPoints')==points
            if page.locator('#rewardContinue').count(): page.locator('#rewardContinue').click()
            if level<4: page.locator('#simpleGameNext').click()
        assert page.evaluate('(key)=>steadierMindGameProgress["simpleGame_"+key].completed.length',key)==5
    # Reload and game switching retain separate completed levels.
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    for key in ['meadow','detective','pond','garden']:
        page.evaluate('(key)=>openSimpleGame(key)',key)
        assert page.locator('#simpleGameNext').is_visible()
        for width in [320,390,768]:
            page.set_viewport_size({'width':width,'height':844})
            assert page.locator('#simpleGame').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    # Failed completion saves roll back rewards and retry safely.
    page.evaluate('delete steadierMindGameProgress.simpleGame_garden;openSimpleGame("garden")')
    page.evaluate('document.querySelectorAll("#simpleGameBoard button")[0].click();document.querySelectorAll("#simpleGameBoard button")[3].click()')
    points=page.evaluate('mindPoints')
    page.evaluate('window.realSave=saveSteadierMindData;saveSteadierMindData=()=>false')
    page.locator('#simpleGameBoard button',has_text='Check my garden').click()
    assert page.locator('#simpleGameRetry').is_visible()
    assert page.evaluate('mindPoints')==points
    page.evaluate('saveSteadierMindData=window.realSave')
    page.locator('#simpleGameRetry').click()
    assert page.evaluate('mindPoints')==points+10
    assert not errors,errors
    print('PASS: all 20 levels playable, single rewards, isolated progress/reload, failure rollback/retry, mobile widths')
    browser.close()
server.shutdown()
