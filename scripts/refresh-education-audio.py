"""Rebuild faster speech from original lossless voice assets without re-encoding video.
Requires the original production voice directory, ffmpeg, and ffprobe.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,json,subprocess,hashlib
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--voice-root',required=True);parser.add_argument('--work-dir',required=True)
args=parser.parse_args();voices=Path(args.voice_root);work=Path(args.work_dir).resolve();assert not work.is_relative_to(root);work.mkdir(parents=True,exist_ok=True)
path=root/'media/education-video-retiming.json';manifest=json.loads(path.read_text());speed=manifest['relativeSpeed']
for item in manifest['videos']:
 slug=item['slug'];folder='crisper-review' if slug=='understanding-anxiety-alarm-response' else 'two-video-revision/'+slug if slug in ['making-sense-of-physical-sensations','avoidance-and-getting-support'] else 'twelve-lessons/'+slug
 assert (voices/folder/'narration.wav').exists(),slug

def video_hash(path):
 return subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(path),'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-'],text=True).strip()
def convert(item):
 slug=item['slug'];folder='crisper-review' if slug=='understanding-anxiety-alarm-response' else 'two-video-revision/'+slug if slug in ['making-sense-of-physical-sensations','avoidance-and-getting-support'] else 'twelve-lessons/'+slug
 voice=voices/folder/'narration.wav';video=root/'media'/(slug+'.mp4');output=work/(slug+'.mp4')
 original_video_hash=video_hash(video)
 # Retain the approved soft tonal treatment; use mono speech processing before stereo encoding.
 treatment='highpass=f=65,equalizer=f=3200:t=q:w=0.8:g=-2.5,highshelf=f=5000:g=-2' if slug=='understanding-anxiety-alarm-response' else 'highpass=f=65,lowshelf=f=180:g=1,equalizer=f=3200:t=q:w=0.8:g=-3.2,highshelf=f=5000:g=-2.5'
 filters=f'atrim=duration={item["sourceDuration"]},asetpts=PTS-STARTPTS,atempo={speed},{treatment},alimiter=limit=0.9,loudnorm=I=-20:TP=-3:LRA=9,apad,atrim=duration={item["sourceDuration"]/speed:.9f}'
 subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-i',str(video),'-i',str(voice),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',filters,'-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart','-metadata',f'comment=Original lossless narration; speech tempo {speed}x with pitch preserved using atempo; approved gentle EQ; unchanged synchronized video.',str(output)],check=True)
 assert video_hash(output)==original_video_hash
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,duration','-of','json',str(output)]))
 assert abs(float(info['format']['duration'])-item['duration'])<.04
 assert max(float(s['duration']) for s in info['streams'])-min(float(s['duration']) for s in info['streams'])<.12
 video.write_bytes(output.read_bytes())
 result={**item,'duration':float(info['format']['duration']),'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'losslessVoiceSha256':hashlib.sha256(voice.read_bytes()).hexdigest(),'encodedVideoSha256':original_video_hash.split('=')[1]}
 print('PASS',slug,'lossless speech rebuilt; video stream unchanged',flush=True)
 return result
with ThreadPoolExecutor(max_workers=2) as pool:manifest['videos']=list(pool.map(convert,manifest['videos']))
manifest['audioFilter']=f'atempo={speed}';manifest['audioSource']='Original lossless mono narration, with the previously approved soft EQ and loudness treatment; encoded to stereo AAC at 192 kbps.'
path.write_text(json.dumps(manifest,indent=2)+'\n')
print('COMPLETE: rebuilt audio in all 15 videos',flush=True)
