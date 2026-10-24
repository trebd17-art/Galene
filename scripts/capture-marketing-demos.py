"""Capture real app screens in an isolated browser using invented demonstration inputs."""
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading,argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':450,'height':900},device_scale_factor=2)
 page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
 page.locator('#welcome').wait_for(state='visible')
 def shot(name):
  page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(750)
  page.screenshot(path=str(out/(name+'.png')))
 # Build a genuine two-minute plan through the public setup flow.
 page.evaluate('showScreen("assessment")')
 page.locator('[name="starterGoal"][value="Focus"]').check()
 page.locator('[name="starterGoal"][value="Stress"]').check()
 shot('routine-choose')
 page.locator('#setupNext').click();page.locator('#setupNext').click()
 page.locator('[name="starterMinutes"][value="2"]').check();shot('routine-time')
 page.locator('#setupNext').click();page.locator('#starterResult').wait_for(state='visible')
 page.evaluate('showScreen("dashboard")');shot('routine-profile')
 (root/'media/marketing/app-preview.png').write_bytes((out/'routine-profile.png').read_bytes())
 page.locator('#profileRoutineCTA').click();shot('routine-arrive')
 page.locator('#routineSkip').click();page.locator('#routineSkip').click()
 page.locator('#starterReflection').fill('One thing at a time.');shot('routine-reflect')
 page.locator('#routineNext').click();page.locator('[name="routineAction"]').first.check();shot('routine-step')
 # Grounding requires no writing, saves, or invented health results.
 page.evaluate('openGroundingSession()');shot('pause-see')
 page.locator('#groundingNext').click();shot('pause-feel')
 page.locator('#groundingNext').click();shot('pause-hear')
 # Example Worry Release writing remains unsaved.
 page.evaluate('openWorrySession()');page.locator('#worryText').fill('I have a busy afternoon ahead.');shot('thought-name')
 page.locator('#worryNext').click();page.locator('[name="worryControl"][value="some"]').check();shot('thought-possible')
 page.locator('#worryNext').click();page.locator('#worryAction').fill('Check my notes, then choose one task.');shot('thought-step')
 browser.close()
server.shutdown()
print('Captured real screens using example inputs in a temporary browser. No user data was accessed.')
