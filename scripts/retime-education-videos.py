"""Pitch-preserving retime from an explicit Git revision; never compound previous runs.
Usage: python scripts/retime-education-videos.py --source-ref REF --work-dir PATH
Requires ffmpeg with libx264 and atempo, and ffprobe. Work directory stays outside the site.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, subprocess, json, re, hashlib

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--source-ref',required=True);parser.add_argument('--work-dir',required=True);parser.add_argument('--speed',type=float,default=1.15);parser.add_argument('--reuse-rendered-video',action='store_true')
args=parser.parse_args()
assert 1 < args.speed <= 2
work=Path(args.work_dir).resolve();assert not work.is_relative_to(root)
work.mkdir(parents=True,exist_ok=True)
revision=subprocess.check_output(['git','rev-parse',args.source_ref],cwd=root,text=True).strip()
def original(name):return subprocess.check_output(['git','show',f'{revision}:{name}'],cwd=root)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,duration','-of','json',str(path)]))
def timestamp(seconds):
    milliseconds=round(seconds*1000);hours,remainder=divmod(milliseconds,3600000);minutes,remainder=divmod(remainder,60000);seconds,ms=divmod(remainder,1000)
    return f'{hours:02}:{minutes:02}:{seconds:02}.{ms:03}'
def retime_vtt(text):
    def convert(match):
        h,m,s=match.group(0).split(':');return timestamp((int(h)*3600+int(m)*60+float(s))/args.speed)
    return re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}',convert,text)
files=subprocess.check_output(['git','ls-tree','-r','--name-only',revision,'media'],cwd=root,text=True).splitlines()
slugs=sorted(Path(file).stem for file in files if file.endswith('.mp4'))
assert len(slugs)==15

def convert(slug):
    source=work/(slug+'-source.mp4');source.write_bytes(original(f'media/{slug}.mp4'))
    vtt=original(f'media/{slug}.vtt').decode();(work/(slug+'-source.vtt')).write_text(vtt)
    old_duration=float(probe(source)['format']['duration'])
    output=work/(slug+'.mp4');log=work/(slug+'.log')
    print('START',slug,flush=True)
    audio_filter=f'atempo={args.speed},apad,atrim=duration={old_duration/args.speed:.9f}'
    ready=work/(slug+'-ready.mp4')
    if args.reuse_rendered_video and output.exists():
        tag=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags=comment','-of','json',str(output)]))
        assert revision[:12] in tag['format']['tags']['comment']
        command=['ffmpeg','-nostdin','-hide_banner','-y','-i',str(output),'-i',str(source),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',audio_filter]
    else:
        command=['ffmpeg','-nostdin','-hide_banner','-y','-i',str(source),'-map','0:v:0','-map','0:a:0',
          '-vf',f'setpts=(PTS-STARTPTS)/{args.speed}', '-af',audio_filter,
          '-c:v','libx264','-preset','veryfast','-crf','18','-profile:v','baseline','-level:v','4.0',
          '-pix_fmt','yuv420p','-r','30','-threads','2','-filter_threads','1']
    command += ['-c:a','aac','-b:a','128k','-ar','48000','-ac','2','-movflags','+faststart',
          '-metadata',f'comment=Narration tempo {args.speed}x relative to {revision[:12]}; pitch preserved; visual and subtitle timelines synchronized.',str(ready)]
    with log.open('a') as stream:subprocess.run(command,stdout=stream,stderr=stream,check=True)
    ready.replace(output)
    info=probe(output);duration=float(info['format']['duration']);assert abs(duration-old_duration/args.speed)<.12,(slug,duration,old_duration)
    stream_durations=[float(s['duration']) for s in info['streams']];assert max(stream_durations)-min(stream_durations)<.12
    (root/'media'/(slug+'.mp4')).write_bytes(output.read_bytes())
    (root/'media'/(slug+'.vtt')).write_text(retime_vtt(vtt))
    print('DONE',slug,f'{old_duration:.3f}s -> {duration:.3f}s',flush=True)
    return {'slug':slug,'sourceDuration':old_duration,'duration':duration,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest()}
results=[]
with ThreadPoolExecutor(max_workers=2) as pool:
    for future in as_completed([pool.submit(convert,slug) for slug in slugs]):
        results.append(future.result());(work/'progress.json').write_text(json.dumps(results,indent=2)+'\n')
manifest={'sourceRevision':revision,'relativeSpeed':args.speed,'audioFilter':f'atempo={args.speed}','visualFilter':f'setpts=(PTS-STARTPTS)/{args.speed}','videos':sorted(results,key=lambda item:item['slug'])}
(root/'media/education-video-retiming.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('COMPLETE',len(results),'videos',flush=True)
