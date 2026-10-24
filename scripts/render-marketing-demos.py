"""Render captioned 1080×1920 MP4 walkthroughs from captured, genuine app screens.
Run with the video Python environment (Pillow). Captions are burned in and exported as VTT.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageDraw,ImageFont
import argparse,json,subprocess,math
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--captures',required=True);args=p.parse_args();captures=Path(args.captures);out=root/'media/marketing';out.mkdir(exist_ok=True)
W,H,FPS=1080,1920,24
INK='#254b3d';MUTED='#647864';CREAM='#fbfaf4'
fontdir=Path('/usr/share/fonts/truetype/dejavu')
def font(size,bold=False,serif=False):return ImageFont.truetype(str(fontdir/('DejaVuSerif.ttf' if serif else 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),size)
def text(draw,value,y,size=44,color=INK,bold=False,serif=False):
 for i,line in enumerate(value.split('\n')):
  draw.text((W/2,y+i*size*1.25),line,font=font(size,bold,serif),fill=color,anchor='mt')
def wrap(draw,value,size,width):
 rows=[];line=''
 for word in value.split():
  candidate=(line+' '+word).strip()
  if draw.textlength(candidate,font=font(size))>width and line:rows.append(line);line=word
  else:line=candidate
 if line:rows.append(line)
 return '\n'.join(rows)
SPECS=[
 {'slug':'a-small-pause','title':'A small pause','duration':20,'tint':'#e6eee0','scenes':[
 (0,5,'pause-see','Between tasks,\na little pause.','Notice something nearby, if it feels comfortable.'),
 (5,11,'pause-feel','A grounding\nmoment.','Your feet on the floor. A hand resting on a chair.'),
 (11,16,'pause-hear','At your\nown pace.','You can skip a sense or stop whenever you choose.'),
 (16,20,None,'Make a little\nspace for you.','Try it free. No account needed.') ]},
 {'slug':'one-manageable-step','title':'One manageable step','duration':24,'tint':'#f4e7d9','scenes':[
 (0,6,'thought-name','When thoughts\npile up…','Name one worry. Writing is optional.'),
 (6,12,'thought-possible','What’s possible\nright now?','Some worries have an actionable part.'),
 (12,19,'thought-step','One manageable\nnext step.','Example: Check my notes, then choose one task.'),
 (19,24,None,'A little space.\nA small next step.','Try it free. No account needed.') ]},
 {'slug':'your-own-pace','title':'Your own pace','duration':24,'tint':'#eeebf4','scenes':[
 (0,5,'routine-choose','Start where\nyou are.','Choose up to two areas of support.'),
 (5,10,'routine-time','Choose a pace\nthat fits.','A 2-, 5-, or 10-minute starting routine.'),
 (10,15,'routine-reflect','A little time\nto reflect.','A few words are enough. Every activity is optional.'),
 (15,20,'routine-step','One small\nnext step.','Choose something manageable to carry into your day.'),
 (20,24,None,'Your own pace.\nYour little pause.','Try it free. No account needed.') ]}
]
logo=Image.open(root/'logo-picture.png').convert('RGBA');logo.thumbnail((90,90))
def scene(spec,item):
 start,end,name,title,caption=item
 im=Image.new('RGB',(W,H),CREAM);d=ImageDraw.Draw(im)
 d.ellipse((-180,450,1300,1900),fill=spec['tint'])
 im.paste(logo,(160,67),logo);d.text((280,110),'SteadierMind',font=font(46,True),fill=INK,anchor='lm')
 text(d,'REAL APP WALKTHROUGH · EXAMPLE CONTENT',188,21,MUTED)
 if name:
  text(d,title,240,66,serif=True)
  shot=Image.open(captures/(name+'.png')).convert('RGB').crop((80,195,820,1695))
  shot=shot.resize((620,1257),Image.Resampling.LANCZOS)
  # A rounded frame; content remains an unaltered crop of the real app.
  mask=Image.new('L',shot.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,619,1256),radius=35,fill=255)
  d.rounded_rectangle((220,430,860,1707),radius=43,fill='#fffef9',outline='#d8e0d1',width=2)
  im.paste(shot,(230,440),mask)
  d=ImageDraw.Draw(im);text(d,wrap(d,caption,35,890),1735,35)
 else:
  text(d,'✦',470,100,'#a8864d');text(d,title,690,79,serif=True)
  d.rounded_rectangle((165,1130,915,1250),radius=60,fill=INK)
  text(d,'steadiermind.com',1168,46,'#ffffff',True)
  text(d,caption,1320,35)
  text(d,'Pause. Reflect. Choose your next step.',1470,28,MUTED)
 text(d,'General wellness education · not diagnosis or treatment',1860,21,MUTED)
 return im

def ts(seconds):return f'00:00:{int(seconds):02}.000'
def render(spec):
 frames=[scene(spec,item) for item in spec['scenes']]
 frames[0].save(out/(spec['slug']+'.jpg'),quality=93)
 vtt=['WEBVTT','']
 for i,item in enumerate(spec['scenes']):
  a,b,name,title,caption=item
  vtt += [str(i+1),f'{ts(a)} --> {ts(b)}',title.replace('\n',' ')+' '+caption+(' steadiermind.com.' if name is None else ''),'']
 (out/(spec['slug']+'.vtt')).write_text('\n'.join(vtt))
 target=out/(spec['slug']+'.mp4')
 command=['ffmpeg','-nostdin','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-map','0:v','-map','1:a','-c:v','libx264','-profile:v','baseline','-level:v','4.0','-preset','veryfast','-crf','20','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-t',str(spec['duration']),'-movflags','+faststart',str(target)]
 process=subprocess.Popen(command,stdin=subprocess.PIPE)
 try:
  for n in range(spec['duration']*FPS):
   t=n/FPS;i=next(i for i,item in enumerate(spec['scenes']) if item[0]<=t<item[1]);im=frames[i]
   elapsed=t-spec['scenes'][i][0]
   if i and elapsed<.35:im=Image.blend(frames[i-1],im,elapsed/.35)
   frame=im.copy();d=ImageDraw.Draw(frame)
   d.rounded_rectangle((96,1824,984,1829),radius=3,fill='#d7dfd0');d.rounded_rectangle((96,1824,96+888*(t/spec['duration']),1829),radius=3,fill='#6a8b72')
   process.stdin.write(frame.tobytes())
 finally:process.stdin.close()
 assert process.wait()==0
 print('RENDERED',spec['slug'],spec['duration'],'seconds',flush=True)
 return {'slug':spec['slug'],'title':spec['title'],'duration':spec['duration'],'width':W,'height':H,'captions':'Burned in and WebVTT','audio':'Silent stereo AAC; designed for sound-off viewing','exampleContent':True}
with ThreadPoolExecutor(max_workers=2) as pool:catalog=list(pool.map(render,SPECS))
(out/'catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
# A standalone social-sharing card, made from the same typography and brand colors.
im=Image.new('RGB',(1200,630),CREAM);d=ImageDraw.Draw(im);d.ellipse((850,-140,1390,450),fill='#e3ebdb');d.ellipse((940,50,1110,220),fill='#ecd9ab')
d.text((75,70),'SteadierMind',font=font(34,True),fill=INK);d.text((75,175),'A little space',font=font(72,serif=True),fill=INK);d.text((75,270),'in a busy day.',font=font(72,serif=True),fill='#52705b');d.text((78,408),'Pause. Reflect. Choose one manageable next step.',font=font(25),fill=MUTED);d.text((78,525),'Free to try  ·  No account needed  ·  steadiermind.com',font=font(20),fill=INK)
im.save(out/'share-card.png')
