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
    page.evaluate('openCenteredGame()')
    assert page.locator('#centeredPuzzleBoard button').count()==25
    page.locator('#centeredPuzzleBoard button').nth(10).click()
    assert '0 moves' in page.locator('#centeredPuzzleStats').inner_text()
    page.locator('#centeredPuzzleBoard button').nth(1).click()
    assert page.locator('#centeredPuzzleNext').is_visible()
    points=page.evaluate('mindPoints')
    page.evaluate('saveCenteredPuzzleWin();saveCenteredPuzzleWin()')
    assert page.evaluate('mindPoints')==points
    page.locator('#centeredPuzzleNext').click()
    page.locator('#centeredPuzzleTools button').nth(1).click()
    page.locator('#centeredPuzzleBoard button').nth(2).click()
    page.evaluate('undoCenteredPuzzle()')
    assert '0 moves' in page.locator('#centeredPuzzleStats').inner_text()
    page.locator('#centeredPuzzleBoard button').nth(2).click()
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('openCenteredGame()')
    assert '1 move' in page.locator('#centeredPuzzleStats').inner_text()
    page.locator('#centeredPuzzleTools button').nth(0).click()
    page.locator('#centeredPuzzleBoard button').nth(14).click()
    assert page.locator('#centeredPuzzleNext').is_visible()
    page.locator('#centeredPuzzleNext').click()
    for tool,tile in [(2,10),(1,22)]:
        page.locator('#centeredPuzzleTools button').nth(tool).click()
        page.locator('#centeredPuzzleBoard button').nth(tile).click()
    assert page.locator('#centeredPuzzleNext').is_visible()
    page.locator('#centeredPuzzleNext').click()
    for tool,tile in [(0,1),(1,3),(2,14)]:
        page.locator('#centeredPuzzleTools button').nth(tool).click()
        page.locator('#centeredPuzzleBoard button').nth(tile).click()
    assert page.locator('#centeredPuzzleNext').is_visible()
    page.locator('#centeredPuzzleNext').click()
    for tool,tile in [(0,12),(1,2)]:
        page.locator('#centeredPuzzleTools button').nth(tool).click()
        page.locator('#centeredPuzzleBoard button').nth(tile).click()
    page.evaluate('window.realSave=saveSteadierMindData;saveSteadierMindData=()=>false')
    page.locator('#centeredPuzzleTools button').nth(2).click()
    page.locator('#centeredPuzzleBoard button').nth(12).click()
    assert page.locator('#centeredPuzzleRetry').is_visible()
    assert page.locator('#centeredPuzzleNext').is_hidden()
    assert page.evaluate('steadierMindGameProgress.centeredPuzzle.completed.length')==4
    page.evaluate('saveSteadierMindData=window.realSave')
    page.locator('#centeredPuzzleRetry').click()
    assert page.evaluate('steadierMindGameProgress.centeredPuzzle.completed.length')==5
    assert page.locator('.puzzle-path').count()>0
    page.locator('#centeredPuzzleNext').click()
    page.locator('#centeredPuzzleBoard button').nth(1).click()
    points=page.evaluate('mindPoints')
    assert page.evaluate('steadierMindGameProgress.centeredPuzzle.completed.length')==5
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('#centeredGame').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors,errors
    print('PASS: five solvable levels, invalid moves, undo, draft restore, one reward per level, save failure/retry, path highlight, mobile widths')
    browser.close()
server.shutdown()
