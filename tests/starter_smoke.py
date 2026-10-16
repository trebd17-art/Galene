"""Browser smoke test for setup, routine persistence, and existing tool integration.
Requires Python Playwright and /usr/bin/chromium. Uses temporary browser data.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
s = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=s.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{s.server_port}/'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())

    def open_app():
        page.goto(url, wait_until='networkidle')
        page.locator('#welcome').wait_for(state='visible')
        page.wait_for_timeout(300)
        page.evaluate('showScreen("mainMenu")')

    def reload_app():
        page.reload(wait_until='networkidle')
        page.locator('#welcome').wait_for(state='visible')
        page.wait_for_timeout(300)
        page.evaluate('showScreen("mainMenu")')
    open_app()
    page.locator('#mainMenu #homePlanCTA').click()
    page.locator('[name="starterGoal"][value="Overthinking"]').check()
    page.locator('[name="starterGoal"][value="Focus"]').check()
    page.locator('[name="starterGoal"][value="Sleep"]').click()
    assert not page.locator('[name="starterGoal"][value="Sleep"]').is_checked()
    assert 'up to two' in page.locator('#setupError').inner_text()
    page.locator('#setupNext').click()
    page.locator('[name="starterFeeling"][value="Overwhelmed"]').check()
    reload_app()
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#setupProgress').inner_text() == 'Step 2 of 3'
    assert page.locator('[name="starterFeeling"][value="Overwhelmed"]').is_checked()
    page.locator('#setupNext').click()
    page.locator('[name="starterMinutes"][value="2"]').check()
    page.locator('#setupNext').click()
    page.locator('#starterResult').wait_for(state='visible')
    assert '2-minute' in page.locator('#starterSummary').inner_text()
    assert 'grounding' in page.locator('#starterSummary').inner_text()
    page.evaluate('showScreen("mainMenu")')
    page.wait_for_timeout(3200)  # Include delayed legacy home-card refreshes.
    assert page.locator('#mainMenu #homePlanCTA').inner_text() == 'View My Plan →'
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#dashboard').is_visible()
    assert page.evaluate('getSteadierMindSnapshot().starter.routine') is None
    page.locator('#profileRoutineCTA').click()

    page.locator('[name="routineBefore"][value="Restless"]').check()
    page.locator('#routineNext').click()
    assert '30 seconds' in page.locator('#routineDescription').inner_text()
    page.locator('#routinePanel button', has_text='Open Grounding').click()
    page.locator('#groundingNext').click()
    page.locator('#groundingSession .text-back').first.click()
    assert page.locator('#routineHeading').inner_text() == 'Settle'
    page.locator('#routinePanel button', has_text='Try breathing instead').click()
    page.locator('#gentleBreathingFinish').click()
    page.locator('#gentleBreathingContinue').click()
    assert page.locator('#routineHeading').inner_text() == 'Reflect'
    page.locator('#starterReflection').fill('A saved reflection <script>no execution</script>')
    reload_app()
    page.wait_for_timeout(200)
    assert page.locator('#mainMenu #homePlanCTA').inner_text() == 'Continue My Routine →'
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#routineHeading').inner_text() == 'Reflect'
    assert 'saved reflection' in page.locator('#starterReflection').input_value()
    assert 'what do you know for certain' in page.locator('#routineDescription').inner_text()
    page.locator('#routineNext').click()
    page.locator('[name="routineAction"]').first.check()
    page.locator('#routineNext').click()
    page.locator('[name="routineAfter"][value="About the same"]').check()
    page.locator('#routineNext').click()
    assert 'little space' in page.locator('#routineHeading').inner_text()
    assert 'About the same' in page.locator('#routinePanel').inner_text()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.routineId).length') == 1
    page.evaluate('starterRoutineNext()')
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.routineId).length') == 1
    if page.locator('#rewardCelebration').evaluate('(el) => el.open'):
        page.locator('#rewardContinue').click()
    page.evaluate('showScreen("mainMenu")')
    assert page.locator('#mainMenu #homePlanCTA').inner_text() == 'View My Plan →'
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#dashboard').is_visible()
    page.evaluate('showScreen("mainMenu")')
    page.locator('#mainMenu .daily-priority-card').click()
    assert page.locator('#dashboard').is_visible()
    page.evaluate('showScreen("starterRoutine")')
    page.locator('#routinePanel button', has_text='View My Plan').click()
    assert 'Overthinking' in page.locator('#profileFocusTitle').inner_text()
    assert not page.locator('#profilePreferences').evaluate('(el)=>el.open')
    page.locator('#profilePreferences summary').click()
    assert 'Overthinking' in page.locator('#profileCard').inner_text()
    reload_app()
    page.evaluate('showScreen("dashboard")')
    assert 'Overthinking' in page.locator('#profileFocusTitle').inner_text()
    assert not page.locator('#profilePreferences').evaluate('(el)=>el.open')
    page.locator('#profilePreferences summary').click()
    assert 'Overthinking' in page.locator('#profileCard').inner_text()
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.locator('#dashboard').evaluate('(el)=>el.scrollWidth<=el.clientWidth')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.locator('#profilePreferences summary').click()
    page.screenshot(path='/workspace/galene-setup/profile-refresh.png', full_page=True)
    page.locator('#profileRoutineCTA').click()
    assert page.locator('#starterRoutine').is_visible()
    page.evaluate('showScreen("dashboard")')
    assert 'Continue' in page.locator('#profileRoutineCTA').inner_text()
    page.evaluate('showScreen("mainMenu")')
    assert page.locator('#mainMenu #homePlanCTA').inner_text() == 'Continue My Routine →'
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#starterRoutine').is_visible()
    page.evaluate('showScreen("dashboard")')

    page.locator('#profilePreferences summary').click()
    page.locator('#profilePreferences button').click()
    assert page.locator('#assessment').is_visible()
    page.evaluate('showScreen("assessment")')
    page.locator('#setupBack').click()
    page.locator('#setupBack').click()
    page.locator('[name="starterGoal"]').evaluate_all('(es)=>es.forEach(e=>{e.checked=false;e.dispatchEvent(new Event("change",{bubbles:true}))})')
    page.locator('#setupNext').click()
    page.locator('[name="starterFeeling"][value="Prefer not to say"]').check()
    page.locator('#setupNext').click()
    page.locator('[name="starterMinutes"][value="10"]').check()
    page.locator('#setupNext').click()
    assert '10-minute' in page.locator('#starterSummary').inner_text()
    page.evaluate('showScreen("mainMenu")')
    page.wait_for_timeout(3200)  # Include delayed legacy home-card refreshes.
    assert page.locator('#mainMenu #homePlanCTA').inner_text() == 'View My Plan →'
    page.locator('#mainMenu #homePlanCTA').click()
    assert page.locator('#dashboard').is_visible()
    assert page.evaluate('getSteadierMindSnapshot().starter.routine') is None
    page.locator('#profileRoutineCTA').click()

    for _ in range(5):
        page.locator('#routineSkip').click()
    assert '0 of 4' in page.locator('#routinePanel').inner_text()
    assert page.evaluate('steadierMindJournalEntries.filter(e=>e.routineId).length') == 1
    page.evaluate('showScreen("mainMenu")')
    page.locator('.home-quick-actions button', has_text='Calm Now').click()
    page.locator('#tools button', has_text='Grounding').click()
    page.locator('#groundingSession .text-back').first.click()
    page.locator('#tools').wait_for(state='visible')
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('showScreen("assessment")')
        assert page.locator('#assessment').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors, errors
    print('PASS: setup selection limit, optional answers, reload draft, 2/10 minute personalization, tool switch/back/completion, routine resume, escaped reflection, single journal save, neutral ending, skip all, profile reload, existing tool navigation, mobile widths; no JS exceptions')
    b.close()
s.shutdown()
