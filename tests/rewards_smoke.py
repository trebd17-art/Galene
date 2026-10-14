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
    page.evaluate('showScreen("rewards")')
    assert page.locator('#participationBadges .card').count()==5
    assert '0 activities across 0 days' in page.locator('#weeklyActivityCount').inner_text()
    points=page.evaluate('mindPoints')
    page.evaluate('showScreen("checkin");saveCheckIn();saveCheckIn();saveCheckIn()')
    assert page.evaluate('mindPoints')==points+5
    assert page.locator('#rewardCelebration').count()==0
    assert page.locator('#pointsFeedback').count()==1
    page.evaluate('openLesson("alarm");completeLearningLesson()')
    assert page.evaluate('mindPoints')==points+10
    page.evaluate('completeLearningLesson()')
    assert page.evaluate('mindPoints')==points+10
    page.evaluate('openLesson("sensations");completeLearningLesson();openLesson("support");completeLearningLesson()')
    assert 'Curious Mind' in page.locator('#rewardCelebration').inner_text()
    page.locator('#rewardContinue').click()
    page.evaluate('showScreen("journal")')
    page.locator('#reflectionAnswer').fill('A private reflection')
    page.locator('#reflectionSave').click()
    assert 'First Reflection' in page.locator('#rewardCelebration').inner_text()
    page.locator('#rewardContinue').click()
    page.evaluate('''() => {
      const state=getSteadierMindSnapshot().starter;
      state.routine={id:'reward-test-routine',step:4,before:'Anxious',reflection:'',action:'Rest',after:'Steady',skipped:[],finished:false};
      showScreen('starterRoutine');starterRoutineNext();starterRoutineNext();
    }''')
    assert 'routine is complete' in page.locator('#rewardCelebration').inner_text()
    assert '+10' in page.locator('.achievement-points').inner_text()
    page.locator('#rewardContinue').click()
    page.evaluate('showScreen("rewards")')
    assert '6 activities across 1 day' in page.locator('#weeklyActivityCount').inner_text()
    assert 'SteadierMind Master' not in page.locator('#rewards').inner_text()
    stored=page.evaluate('JSON.stringify(steadierMindGameProgress.rewards)')
    assert 'private reflection' not in stored
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("rewards")')
    assert '6 activities' in page.locator('#weeklyActivityCount').inner_text()
    assert page.locator('#rewardCelebration').count()==0
    page.evaluate('''() => {
      for(const open of [openBreathingSession,openGroundingSession,openWorrySession]){open();completeActivity();completeActivity();}
      showScreen('moodTracker');
      for(let i=0;i<4;i++){document.getElementById('calmScore').value='5';document.getElementById('trackerMood').value='Calm';saveMoodEntry();}
      showScreen('rewards');
    }''')
    assert page.evaluate('steadierMindGameProgress.rewards.badges.length')==5
    page.evaluate('steadierMindGameProgress.rewards.events[0].day="2000-01-01";saveSteadierMindData();renderRewardsPage()')
    assert '12 activities' in page.locator('#weeklyActivityCount').inner_text()
    page.evaluate('openLesson("facts")')
    points=page.evaluate('mindPoints')
    event_count=page.evaluate('steadierMindGameProgress.rewards.events.length')
    page.evaluate('window.actualSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error("full")};completeLearningLesson()')
    assert page.evaluate('mindPoints')==points
    assert page.evaluate('steadierMindGameProgress.rewards.events.length')==event_count
    page.evaluate('Storage.prototype.setItem=window.actualSet;completeLearningLesson()')
    assert page.evaluate('mindPoints')==points+5
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        page.evaluate('showScreen("rewards")')
        assert page.locator('#rewards').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    migrated=browser.new_page()
    migrated.add_init_script('localStorage.setItem("steadyMind.v1.data",JSON.stringify({xp:175,completedActivities:8,journalEntries:[],moodHistory:Array.from({length:5},()=>({mood:"Calm"})),gameProgress:{}}))')
    migrated.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    migrated.locator('#welcome').wait_for(state='visible')
    migrated.evaluate('showScreen("rewards")')
    assert migrated.evaluate('mindPoints')==175
    assert '0 activities' in migrated.locator('#weeklyActivityCount').inner_text()
    assert migrated.locator('#rewardCelebration').count()==0
    assert migrated.evaluate('steadierMindGameProgress.rewards.badges.includes("checkins")')
    migrated.evaluate('steadierMindMoodHistory=[];saveSteadierMindData();renderRewardsPage()')
    assert migrated.evaluate('steadierMindGameProgress.rewards.badges.includes("checkins")')
    migrated.close()
    assert not errors,errors
    print('PASS: five badges, honest weekly dates, check-in deduplication, consistent lesson/routine points, first reflection/learning badges, no private event text, persistence, no restore celebrations')
    browser.close()
server.shutdown()
