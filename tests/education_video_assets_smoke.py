"""Audit the twelve MP4 exports, exact captions/transcripts, and source mappings."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess

root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'media/education-video-catalog.json').read_text())
scripts=json.loads((root/'docs/education-video-scripts.json').read_text())
assert len(catalog)==len(scripts)==12
assert len({item['lesson'] for item in catalog})==12
assert {item['lesson'] for item in catalog}=={item['lesson'] for item in scripts}
footer='SteadierMind provides general wellness education, not diagnosis or individualized treatment.'

def check(item):
    spec=next(s for s in scripts if s['lesson']==item['lesson'])
    slug=item['slug'];base=root/'media'
    transcript=(base/(slug+'.txt')).read_text()
    assert transcript.strip()==spec['narration'].strip()
    vtt=(base/(slug+'.vtt')).read_text()
    assert vtt.startswith('WEBVTT')
    caption_text=' '.join(line for line in vtt.splitlines() if line and line!='WEBVTT' and not line.isdigit() and '-->' not in line)
    assert caption_text==' '.join(transcript.split())
    assert item['footer']==footer and item['closing']==spec['closing']
    assert item['references']==spec['references']
    for suffix in ['.png','-storyboard.jpg']:assert (base/(slug+suffix)).stat().st_size>1000
    video=base/(slug+'.mp4')
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,sample_rate,channels','-of','json',str(video)]))
    assert abs(float(info['format']['duration'])-item['duration'])<.1
    visual=next(s for s in info['streams'] if s['codec_type']=='video')
    audio=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert (visual['codec_name'],visual['width'],visual['height'])==('h264',1920,1080)
    assert (audio['codec_name'],audio['sample_rate'],audio['channels'])==('aac','48000',2)
    subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
    return item['lesson']

with ThreadPoolExecutor(max_workers=2) as pool:
    for lesson in pool.map(check,catalog):print('PASS:',lesson,'full decode, 1080p video, stereo audio, exact script/captions, poster, storyboard, reference metadata',flush=True)
