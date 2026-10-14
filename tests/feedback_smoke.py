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
    page.evaluate('showScreen("mainMenu")')
    assert page.locator('#rewardCelebration').count()==0
    before=page.evaluate('mindPoints')
    page.evaluate('mindPoints+=5;updateXP()')
    assert page.locator('#rewardCelebration').count()==0
    assert '+5 Mind Points' in page.locator('#pointsFeedback').inner_text()
    page.evaluate('updateXP();updateXP()')
    assert page.evaluate('mindPoints')==before+5
    page.wait_for_timeout(1900)
    assert page.locator('#pointsFeedback').count()==0
    page.evaluate('mindPoints=95;updateXP();mindPoints=100;updateXP()')
    assert '100 Mind Points earned' in page.locator('#rewardCelebration').inner_text()
    page.keyboard.press('Escape')
    assert page.locator('#rewardCelebration').count()==0
    page.evaluate('openSimpleGame("meadow")')
    page.evaluate('''() => {
        const cards=steadierMindGameProgress.simpleGame_meadow.draft.cards;
        for(const icon of new Set(cards))cards.forEach((value,index)=>{if(value===icon)document.querySelectorAll('.memory-grid button')[index].click();});
    }''')
    assert 'Level complete' in page.locator('#rewardCelebration').inner_text()
    assert '+10' in page.locator('.achievement-points').inner_text()
    page.locator('#rewardContinue').click()
    page.locator('#simpleGameNext').click()
    assert 'Level 2 of 5' in page.locator('#simpleGameProgress').inner_text()
    page.evaluate('''() => {
        getSteadierMindSnapshot().starter.routine={id:'celebration-test',step:4,before:'Anxious',reflection:'A brief thought',action:'Rest',after:'Steady',skipped:[],finished:false};
        showScreen('starterRoutine');starterRoutineNext();
    }''')
    assert 'routine is complete' in page.locator('#rewardCelebration').inner_text()
    assert '+10' in page.locator('.achievement-points').inner_text()
    page.evaluate('showScreen("mainMenu")')
    assert page.locator('#rewardCelebration').count()==0
    page.emulate_media(reduced_motion='reduce')
    page.evaluate('mindPoints=195;updateXP();mindPoints=200;updateXP()')
    assert page.locator('#rewardCelebration').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
    assert page.locator('.reward-particle').count()==0
    page.locator('#rewardContinue').click()
    for command in ['openGroundingSession()','openBreathingSession()','openSleepSession()']:
        page.evaluate(command+';mindPoints+=5;updateXP()')
        assert page.locator('#rewardCelebration').count()==0
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    assert page.locator('#rewardCelebration').count()==0
    assert not errors,errors
    print('PASS: centered persistent card, accurate combined points, keyboard focus/Escape, mobile sizing, Continue/game navigation, milestones, routine without fake XP, reduced motion, quiet tools, reload')
    browser.close()
server.shutdown()
