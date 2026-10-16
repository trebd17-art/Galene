"""Daily reflection privacy, save/update consistency, history, and mobile checks.
Requires Python Playwright and Chromium.
"""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("mainMenu")')
    page.locator('.home-quick-actions button', has_text='Reflection').click()
    assert page.locator('#reflectionExtras').evaluate('(e)=>!e.open')
    assert page.locator('#pastReflections').evaluate('(e)=>!e.open')
    page.locator('#reflectionSave').click()
    assert 'Choose a feeling' in page.locator('#journalResult').inner_text()
    assert page.evaluate('steadierMindJournalEntries.length') == 0
    page.locator('#reflectionAnswer').fill('UNSAVED_REFLECTION')
    page.evaluate('saveSteadierMindData()')
    assert 'UNSAVED_REFLECTION' not in page.evaluate('JSON.stringify(localStorage)')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("journal")')
    assert page.locator('#reflectionAnswer').input_value() == ''
    page.locator('#journalMood').select_option('Anxious')
    page.locator('#reflectionPromptToggle').click()
    prompt = page.locator('#reflectionPromptLabel').inner_text()
    page.locator('#reflectionAnswer').fill('A thought <script>window.bad = true</script>')
    page.locator('#reflectionPromptToggle').click()
    assert page.locator('#reflectionPromptLabel').inner_text() == prompt
    page.locator('#reflectionSupport').fill('Rest or ask for help')
    page.locator('#reflectionExtras summary').click()
    page.locator('#reflectionUncertainty').fill('I know one fact')
    page.locator('#reflectionGratitude').fill('A quiet moment')
    points = page.evaluate('mindPoints')
    page.locator('#reflectionSave').click()
    assert page.evaluate('steadierMindJournalEntries.length') == 1
    assert page.evaluate('mindPoints') == points + 10
    if page.locator('#rewardCelebration').count():
        page.locator('#rewardContinue').click()
    entry = page.evaluate('steadierMindJournalEntries[0]')
    assert entry['mood'] == 'Anxious'
    assert len(entry['responses']) == 4
    assert entry['responses'][0]['prompt'] == prompt
    page.evaluate('saveJournal()')
    assert page.evaluate('mindPoints') == points + 10
    assert page.evaluate('steadierMindJournalEntries.length') == 1
    page.locator('#reflectionAnswer').fill('An updated thought')
    page.locator('#reflectionSave').click()
    assert page.evaluate('steadierMindJournalEntries.length') == 1
    assert page.evaluate('mindPoints') == points + 10
    page.locator('#pastReflections summary').click()
    assert 'Anxious' in page.locator('#journalHistory').inner_text()
    assert 'An updated thought' in page.locator('#journalHistory').inner_text()
    assert page.locator('.reflection-history-question').count() == 4
    assert page.locator('.reflection-history-question').first.inner_text() == prompt
    assert page.locator('.reflection-history-answer').first.inner_text() == 'An updated thought'
    question_style = page.locator('.reflection-history-question').first.evaluate('(e)=>[getComputedStyle(e).fontSize,getComputedStyle(e).fontWeight,getComputedStyle(e).color]')
    answer_style = page.locator('.reflection-history-answer').first.evaluate('(e)=>[getComputedStyle(e).fontSize,getComputedStyle(e).fontWeight,getComputedStyle(e).color]')
    assert all(q != a for q, a in zip(question_style, answer_style))
    assert page.evaluate('window.bad') is None
    page.locator('#reflectionNew').click()
    page.locator('#reflectionAnswer').fill('Failed save stays in editor')
    page.evaluate('window.actualSave = saveSteadierMindData; saveSteadierMindData = () => false')
    page.locator('#reflectionSave').click()
    assert 'could not save' in page.locator('#journalResult').inner_text()
    assert page.evaluate('steadierMindJournalEntries.length') == 1
    assert page.evaluate('mindPoints') == points + 10
    assert 'Failed save' in page.locator('#reflectionAnswer').input_value()
    page.evaluate('saveSteadierMindData = window.actualSave')
    page.locator('#reflectionSave').click()
    assert page.evaluate('steadierMindJournalEntries.length') == 2
    assert page.evaluate('mindPoints') == points + 20
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("journal")')
    page.locator('#pastReflections summary').click()
    assert 'Failed save' in page.locator('#journalHistory').inner_text()
    assert 'An updated thought' in page.locator('#journalHistory').inner_text()
    page.evaluate('recordSteadierMindJournalEntry({text:"Legacy entry <img src=x onerror=bad()>"}); recordSteadierMindJournalEntry({summary:"Saved worry"})')
    assert 'Legacy entry <img' in page.locator('#journalHistory').inner_text()
    assert page.locator('#journalHistory img').count() == 0
    assert 'Saved worry' in page.locator('#journalHistory').inner_text()
    page.evaluate('showScreen("assessment")')
    page.locator('[name="starterGoal"][value="Overthinking"]').check()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.locator('#setupNext').click()
    page.evaluate('showScreen("journal")')
    page.locator('#reflectionPromptToggle').click()
    assert 'recurring thought' in page.locator('#reflectionPromptLabel').inner_text()
    page.locator('#journalMood').select_option('Calm')
    page.locator('#reflectionSave').click()
    assert page.evaluate('steadierMindJournalEntries.at(-1).mood') == 'Calm'
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.locator('#journal').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert not errors, errors
    print('PASS: short form, optional extras, explicit save, unsaved reload, labeled prompt/mood, single XP, same-entry updates, save failure rollback/retry, history persistence, escaped legacy entries, goal prompt, mood-only save, mobile widths')
    b.close()
server.shutdown()
