"""Verify every retimed export, subtitle timeline, unchanged script, and scene timing."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,re,subprocess,tempfile,math
from array import array
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'media/education-video-retiming.json').read_text())
revision=manifest['sourceRevision'];speed=manifest['relativeSpeed']
assert speed==1.15
assert manifest['audioFilter']=='atempo=1.15'
assert 'lossless' in manifest['audioSource']
assert len(manifest['videos'])==15

def source(name):return subprocess.check_output(['git','show',f'{revision}:media/{name}'],cwd=root)
def times(text):
    return [int(h)*3600+int(m)*60+float(s) for h,m,s in re.findall(r'(\d{2}):(\d{2}):(\d{2}\.\d{3})',text)]
def check(item):
    slug=item['slug'];video=root/'media'/(slug+'.mp4')
    assert hashlib.sha256(video.read_bytes()).hexdigest()==item['outputSha256']
    old_vtt=source(slug+'.vtt').decode();new_vtt=(root/'media'/(slug+'.vtt')).read_text()
    assert re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}','TIME',old_vtt)==re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}','TIME',new_vtt)
    old_times,new_times=times(old_vtt),times(new_vtt)
    assert all(abs(before/speed-after)<=.00051 for before,after in zip(old_times,new_times))
    assert all(start<end for start,end in zip(new_times[::2],new_times[1::2]))
    assert max(new_times)<=item['duration']+.05
    assert (root/'media'/(slug+'.txt')).read_bytes()==source(slug+'.txt')
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,codec_name,profile,width,height,sample_rate,channels,duration','-of','json',str(video)]))
    duration=float(info['format']['duration']);assert abs(duration-item['sourceDuration']/speed)<.12
    visual=next(s for s in info['streams'] if s['codec_type']=='video');audio=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert (visual['codec_name'],visual['profile'],visual['width'],visual['height'])==('h264','Constrained Baseline',1920,1080)
    assert (audio['codec_name'],audio['sample_rate'],audio['channels'])==('aac','48000',2)
    assert abs(float(visual['duration'])-float(audio['duration']))<.12
    decoded=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-threads','2','-i',str(video),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
    assert 'Error' not in decoded.stderr
    peak=float(re.search(r'max_volume: ([-\d.]+) dB',decoded.stderr)[1])
    mean=float(re.search(r'mean_volume: ([-\d.]+) dB',decoded.stderr)[1])
    assert peak < -.5 and mean > -40,(slug,peak,mean)
    samples=array('f');samples.frombytes(subprocess.check_output(['ffmpeg','-nostdin','-v','error','-ss','5','-i',str(video),'-t','3','-vn','-ac','2','-ar','24000','-f','f32le','-']))
    left,right=samples[::2],samples[1::2]
    energy_left=sum(x*x for x in left);energy_right=sum(x*x for x in right)
    correlation=sum(a*b for a,b in zip(left,right))/math.sqrt(energy_left*energy_right)
    # AAC can introduce tiny independent quantization noise; the speech must remain centered.
    assert correlation>.999, (slug,correlation)

    # Compare corresponding rendered frames: captions and scene illustrations must move together.
    with tempfile.TemporaryDirectory() as directory:
        original=Path(directory)/'source.mp4';original.write_bytes(source(slug+'.mp4'))
        assert hashlib.sha256(original.read_bytes()).hexdigest()==item['sourceSha256']
        for t in [12,37]:
            result=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-threads','1','-ss',str(t),'-i',str(original),'-threads','1','-ss',str(t/speed),'-i',str(video),'-filter_complex_threads','1','-filter_complex','[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]psnr','-an','-frames:v','1','-f','null','-'],capture_output=True,text=True,check=True)
            average=re.search(r'average:([\d.]+)',result.stderr)
            assert average and float(average[1])>30,(slug,t,result.stderr[-500:])
    return slug
with ThreadPoolExecutor(max_workers=2) as pool:
    for slug in pool.map(check,manifest['videos']):print('PASS:',slug,'full decode, 1.15x duration, pitch-preserving filter, scaled captions, unchanged script, matched visual frames',flush=True)
