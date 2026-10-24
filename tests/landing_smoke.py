"""Test the public landing page, marketing entry flows, and same-origin data preservation."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import threading,tomllib,json
root=Path(__file__).resolve().parents[1]
config=tomllib.loads((root/'netlify.toml').read_text())
assert any(r.get('from')=='/' and r.get('to')=='/landing.html' and r.get('force') for r in config['redirects'])
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0]=='/':self.path='/landing.html'
  elif self.path.split('?')[0]=='/app':self.path=self.path.replace('/app','/index.html',1)
  super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000})
 context.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='networkidle')
 assert page.title()=='SteadierMind — A little space in a busy day'
 assert page.locator('h1').count()==1
 assert page.locator('.demo-video video').count()==3
 assert page.locator('.button-primary').first.get_attribute('href')=='app?start=routine'
 assert page.locator('script[src*="bootstrap"]').count()==0
 assert page.evaluate('localStorage.length')==0
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/workspace/galene-setup/landing-desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/workspace/galene-setup/landing-mobile.png',full_page=True)
 for index,item in enumerate(json.loads((root/'media/marketing/catalog.json').read_text())):
  video=page.locator('.demo-video video').nth(index)
  assert video.get_attribute('autoplay') is None
  video.evaluate('(v)=>v.play()');page.wait_for_function('(i)=>document.querySelectorAll(".demo-video video")[i].currentTime>.1',arg=index)
  assert video.evaluate('(v)=>[v.videoWidth,v.videoHeight]')==[1080,1920]
  assert abs(video.evaluate('(v)=>v.duration')-item['duration'])<.1
  with page.expect_download() as d:page.locator('.download-link').nth(index).click()
  assert d.value.failure() is None
  assert d.value.suggested_filename==item['slug']+'.mp4'
 assert page.locator('.demo-video video').nth(0).evaluate('(v)=>v.paused')
 page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));delete document.hidden')
 assert page.locator('.demo-video video').nth(2).evaluate('(v)=>v.paused')
 page.locator('.faq-list summary').first.click();assert page.locator('.faq-list details').first.evaluate('(d)=>d.open')
 page.evaluate('localStorage.setItem("steadiermind.marketing-preservation-check","keep")')
 page.locator('.button-primary').first.click();page.locator('#auth').wait_for(state='visible')
 assert 'Terms & Conditions' in page.locator('#auth').inner_text()
 page.locator('#auth button',has_text='Continue to SteadierMind').click()
 assert page.locator('#assessment').is_visible()
 assert page.evaluate('localStorage.getItem("steadiermind.marketing-preservation-check")')=='keep'
 assert 'start=' not in page.url
 for intent,screen in [('grounding','groundingSession'),('worry','worrySession')]:
  page.goto(url+'/app?start='+intent,wait_until='networkidle');page.locator('#auth').wait_for(state='visible')
  page.locator('#auth button',has_text='Continue to SteadierMind').click()
  assert page.locator('#'+screen).is_visible()
 assert json.loads((root/'manifest.webmanifest').read_text())['start_url']=='/app'
 assert not errors,errors
 print('PASS: public root, mobile layouts, three clip playbacks/downloads, no autoplay, entry intent/consent routing, no-account flow, same-origin storage preservation, installed-app entry')
 browser.close()
server.shutdown()
