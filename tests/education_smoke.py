"""Check learning content, completion persistence, tools, and mobile layout."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading
import json
video_catalog=json.loads((Path(__file__).resolve().parents[1]/'media/education-video-catalog.json').read_text())
video_lengths={item['lesson']:item['duration'] for item in video_catalog}
video_lengths.update({'sensations':106.5,'support':112.8})
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
    page.evaluate('showScreen("education")')
    assert page.locator('#learningPaths .learning-path').count()==5
    assert page.locator('.learning-lesson-link').count()==15
    points=page.evaluate('mindPoints')
    page.locator('#learningContinue').click()
    assert page.locator('#learningLessonTitle').inner_text()=='Understanding the alarm response'
    video=page.locator('#learningVideo')
    assert video.is_visible()
    assert video.get_attribute('autoplay') is None
    assert video.evaluate('(v)=>v.paused')
    page.evaluate('document.getElementById("learningVideo").play()')
    page.wait_for_function('document.getElementById("learningVideo").currentTime > 0.5')
    assert 90 <= video.evaluate('(v)=>v.duration') <= 120
    assert video.evaluate('(v)=>[v.videoWidth,v.videoHeight]') == [1920,1080]
    captions=page.request.get(f'http://127.0.0.1:{server.server_port}/'+video.locator('track').get_attribute('src'))
    assert captions.ok and captions.text().startswith('WEBVTT')
    page.locator('#learningLessonBack').click()
    assert page.locator('#educationTopic').is_visible()
    assert page.locator('#learningTopicTitle').inner_text()=='Understanding anxiety'
    assert page.locator('#learningTopicLessons button').count()==3
    assert video.evaluate('(v)=>v.paused')
    page.locator('#learningTopicLessons button').first.click()
    assert page.evaluate('steadierMindGameProgress.learning.completed.length')==0
    page.evaluate('openLearningTool()')
    assert page.locator('#groundingSession').is_visible()
    assert video.evaluate('(v)=>v.paused')
    page.evaluate('showScreen("educationLesson")')
    page.evaluate('window.actualSave=saveSteadierMindData;saveSteadierMindData=()=>false')
    page.locator('#learningComplete').click()
    assert page.evaluate('steadierMindGameProgress.learning.completed.length')==0
    assert 'could not save' in page.locator('#learningLessonStatus').inner_text()
    page.evaluate('saveSteadierMindData=window.actualSave')
    catalog=page.evaluate('steadierMindLessons')
    assert len(catalog)==15
    for lesson in catalog:
        page.evaluate('(id)=>openLesson(id)',lesson['id'])
        assert page.locator('#learningAlarmVideo').is_visible()
        if lesson['id']!='alarm':
            source=video.locator('source').get_attribute('src')
            assert page.locator('#learningVideoDownload').get_attribute('href')==source
            assert lesson['title'].lower() in page.locator('#learningVideoTitle').inner_text().lower()
            assert video.evaluate('(v)=>v.paused')
            page.locator('#learningVideo').evaluate('(v)=>v.play()')
            page.wait_for_function('document.getElementById("learningVideo").currentTime > 0.2')
            expected_duration=video_lengths[lesson['id']]
            assert abs(video.evaluate('(v)=>v.duration')-expected_duration)<1
            assert video.evaluate('(v)=>[v.videoWidth,v.videoHeight]')==[1920,1080]
            with page.expect_download() as result:
                page.locator('#learningVideoDownload').click()
            download=result.value
            assert download.failure() is None
            assert download.suggested_filename==source.rsplit('/',1)[-1]
            video.evaluate('(v)=>v.pause()')
        assert page.locator('#learningLessonTitle').inner_text()==lesson['title']
        if lesson['id'] in {item['lesson'] for item in video_catalog}:
            metadata=next(item for item in video_catalog if item['lesson']==lesson['id'])
            links=page.locator('#learningLessonBody a').evaluate_all('(links)=>links.map(a=>a.href)')
            assert all(ref['url'] in links for ref in metadata['references'])
        assert page.locator('.learning-block').count()==3
        page.locator('.learning-question button').nth((lesson['answer']+1)%3).click()
        assert lesson['explanation'] in page.locator('.learning-question').inner_text()
        page.locator('.learning-text-button').click()
        page.locator('.learning-question button').nth(lesson['answer']).click()
        assert 'That fits.' in page.locator('.learning-question').inner_text()
        for width in [320,390,768]:
            page.set_viewport_size({'width':width,'height':844})
            assert page.locator('#educationLesson').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        page.locator('#learningComplete').click()
        page.evaluate('completeLearningLesson()')
        if page.locator('#rewardContinue').count():page.locator('#rewardContinue').click()
        page.locator('#learningLessonBack').click()
        assert page.locator('#educationTopic').is_visible()
        topic=page.evaluate('(id)=>steadierMindLearningPaths.find(p=>p.id===id)',lesson['path'])
        assert page.locator('#learningTopicTitle').inner_text()==topic['name']
        members=[item for item in catalog if item['path']==lesson['path']]
        links=page.locator('#learningTopicLessons button')
        assert links.count()==3
        assert all(member['title'] in links.nth(i).inner_text() for i,member in enumerate(members))
        if lesson==catalog[-1]:
            assert page.locator('#learningTopicCount').inner_text()=='3 of 3 lessons completed'
            page.get_by_role('button',name='All education topics').click()
            assert page.locator('#education').is_visible()
    assert page.evaluate('steadierMindGameProgress.learning.completed.length')==15
    assert page.evaluate('mindPoints')==points+75
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("education")')
    assert '15 of 15' in page.locator('#learningCount').inner_text()
    assert page.locator('#learningProgress').get_attribute('value')=='15'
    page.evaluate('openLesson("loops");openLearningTool()')
    assert page.locator('#worrySession').is_visible()
    page.evaluate('openLesson("winddown");openLearningTool()')
    assert page.locator('#sleepSession').is_visible()
    page.evaluate('openLesson("smallsteps");openLearningTool()')
    assert page.locator('#journal').is_visible()
    page.evaluate('delete steadierMindGameProgress.learning;openLesson("facts")')
    page.reload(wait_until='networkidle')
    page.locator('#welcome').wait_for(state='visible')
    page.evaluate('showScreen("education");continueLearning()')
    assert page.locator('#learningLessonTitle').inner_text()=='Facts, predictions, and uncertainty'
    assert not errors,errors
    print('PASS: 15 lessons, five paths, optional quizzes, explicit completion, no duplicates/extra XP, save failure/retry, reload/continue, related tools, mobile widths')
    browser.close()
server.shutdown()
