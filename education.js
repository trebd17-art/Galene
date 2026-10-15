/* Learning progress uses the app's existing device-local snapshot and export. */
(function () {
  'use strict';
  const $=id=>document.getElementById(id), lessons=window.steadierMindLessons, paths=window.steadierMindLearningPaths;
  let current=null,choice=null;
  const lessonVideos={
    alarm:{slug:'understanding-anxiety-alarm-response',title:'Understanding Anxiety’s Alarm Response',length:'1 minute 42 second'},
    sensations:{slug:'making-sense-of-physical-sensations',title:'Making Sense of Physical Sensations',length:'1 minute 47 second'},
    support:{slug:'avoidance-and-getting-support',title:'Avoidance and Getting Support',length:'1 minute 53 second'}
  };
  function renderVideo(lesson){
    const video=$('learningVideo'),details=lessonVideos[lesson.id];
    video.pause();$('learningAlarmVideo').hidden=!details;
    if(!details)return;
    $('learningVideoTitle').textContent=details.title;
    $('learningVideoDescription').textContent=`Watch the ${details.length} animation, or read the lesson below. Captions are included in the video.`;
    const base=`media/${details.slug}`;
    $('learningVideoDownload').href=base+'.mp4';
    $('learningVideoDownload').textContent='Download video (MP4)';
    $('learningVideoTranscript').href=base+'.txt';
    if((video.dataset.lesson||'alarm')!==lesson.id){
      video.querySelector('source').src=base+'.mp4';
      video.querySelector('track').src=base+'.vtt';
      video.poster=base+'.png';video.dataset.lesson=lesson.id;video.load();
    }
  }
  const progress=()=>steadierMindGameProgress.learning || {completed:[],last:null};
  function node(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
  function button(text,fn,cls){const e=node('button',text,cls);e.type='button';e.onclick=fn;return e;}
  function saveProgress(next){
    const previous=steadierMindGameProgress.learning;steadierMindGameProgress.learning=next;
    if(saveSteadierMindData())return true;
    if(previous)steadierMindGameProgress.learning=previous;else delete steadierMindGameProgress.learning;
    return false;
  }
  function renderLibrary(){
    const p=progress();$('learningCount').textContent=`${p.completed.length} of ${lessons.length} lessons completed`;
    $('learningProgress').value=p.completed.length;
    $('learningPaths').replaceChildren();
    paths.forEach(path=>{
      const group=node('details','','learning-path'),summary=node('summary',`${path.icon} ${path.name}`);
      group.append(summary,node('p',path.intro));
      const members=lessons.filter(lesson=>lesson.path===path.id);
      group.append(node('p',`${members.filter(lesson=>p.completed.includes(lesson.id)).length} of 3 completed`,'learning-meta'));
      members.forEach(lesson=>group.append(button(`${p.completed.includes(lesson.id)?'✓ ':''}${lesson.title} · About 2 min`,()=>openLesson(lesson.id),'learning-lesson-link')));
      $('learningPaths').append(group);
    });
    $('learningContinue').textContent=p.completed.length===lessons.length?'Explore lessons again':'Continue learning';
  }
  function section(title,text){const block=node('section','','learning-block');block.append(node('h3',title),node('p',text));return block;}
  window.openLearningTopic=function(id){
    const path=paths.find(item=>item.id===id);if(!path){showScreen('education');return;}
    const members=lessons.filter(lesson=>lesson.path===path.id),p=progress();
    $('learningTopicTitle').textContent=path.name;
    $('learningTopicIntro').textContent=path.intro;
    $('learningTopicCount').textContent=`${members.filter(lesson=>p.completed.includes(lesson.id)).length} of ${members.length} lessons completed`;
    $('learningTopicLessons').replaceChildren(...members.map(lesson=>button(`${p.completed.includes(lesson.id)?'✓ ':''}${lesson.title} · About 2 min`,()=>openLesson(lesson.id),'learning-lesson-link')));
    showScreen('educationTopic');$('learningTopicTitle').focus({preventScroll:true});
  };
  window.backToLearningTopic=function(){openLearningTopic(current?.path);};
  function renderLesson(){
    if(!current)return;const lesson=current,path=paths.find(item=>item.id===lesson.path);
    renderVideo(lesson);
    $('learningLessonBack').textContent=`← Back to ${path.name}`;
    $('learningLessonPath').textContent=`${path.name} · About 2 min`;
    $('learningLessonTitle').textContent=lesson.title;
    const body=$('learningLessonBody');body.replaceChildren();
    body.append(section('One idea',lesson.idea),section('An everyday example',lesson.example),section('Try it, if you like',lesson.practice));
    const more=node('details','','learning-more');more.append(node('summary','Learn more'),node('p',lesson.more));body.append(more);
    const question=node('fieldset','','learning-question');question.append(node('legend','A quick learning question (optional)'),node('p',lesson.question));
    lesson.options.forEach((answer,index)=>{
      const b=button(answer,()=>{choice=index;renderLesson();},'secondary');b.disabled=choice!==null;b.setAttribute('aria-pressed',String(choice===index));question.append(b);
    });
    if(choice!==null){const explanation=node('p',`${choice===lesson.answer?'That fits.':'Consider: '+lesson.options[lesson.answer]} ${lesson.explanation}`);explanation.setAttribute('role','status');question.append(explanation,button('Try the question again',()=>{choice=null;renderLesson();},'learning-text-button'));}
    body.append(question);
    const sources=node('details','','learning-more');sources.append(node('summary','Sources and further reading'));
    sources.append(node('p','These original summaries offer general wellness education. Explore the public health guidance below for more detail.'));
    (lesson.sources || path.sources).forEach(([title,url])=>{const p=node('p',''),a=node('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);sources.append(p);});sources.append(node('p','Live source verification is pending; no verified review date is recorded.','learning-note'));body.append(sources);
    const complete=progress().completed.includes(lesson.id);$('learningComplete').textContent=complete?'Lesson completed ✓':'Mark lesson complete';$('learningComplete').disabled=complete;
    $('learningTool').textContent={grounding:'Try grounding',worry:'Open Worry Release',sleep:'Open Sleep Wind-down',reflection:'Open Daily Reflection'}[lesson.tool];
    $('learningNext').textContent=lessons.indexOf(lesson)===lessons.length-1?'Back to learning paths':'Next lesson';
  }
  window.openLesson=function(id){
    const legacy={'Anxiety Basics':'alarm','Overthinking':'facts','Confidence':'smallsteps','Sleep':'winddown'};
    const lesson=lessons.find(item=>item.id===(legacy[id]||id));if(!lesson)return;
    current=lesson;choice=null;
    const saved=saveProgress({...progress(),last:lesson.id});renderLesson();showScreen('educationLesson');
    $('learningLessonStatus').textContent=saved?'':'Your place could not be saved. You can still read this lesson.';
    $('learningLessonTitle').focus({preventScroll:true});
  };
  window.continueLearning=function(){const p=progress(),last=lessons.find(lesson=>lesson.id===p.last);const next=last&&!p.completed.includes(last.id)?last:lessons.find(lesson=>!p.completed.includes(lesson.id))||lessons[0];openLesson(next.id);};
  window.completeLearningLesson=function(){
    if(!current||progress().completed.includes(current.id))return;
    const p=progress();
    const points=mindPoints,count=completedActivities;mindPoints+=5;completedActivities++;
    if(!saveProgress({...p,completed:[...p.completed,current.id]})){mindPoints=points;completedActivities=count;$('learningLessonStatus').textContent='We could not save your completion. Please try again.';return;}
    updateXP();renderLesson();renderLibrary();$('learningLessonStatus').textContent='Lesson completed. Your progress is saved on this device.';
  };
  window.nextLearningLesson=function(){if(!current)return;const next=lessons[lessons.indexOf(current)+1];if(next)openLesson(next.id);else showScreen('education');};
  window.openLearningTool=function(){
    if(!current)return;const back=()=>{showScreen('educationLesson');renderLesson();};
    if(current.tool==='grounding')openGroundingSession(back,false,'Back to lesson',back);
    else if(current.tool==='worry')openWorrySession(back);
    else if(current.tool==='sleep')openSleepSession(back);
    else showScreen('journal');
  };
  const navigate=showScreen;window.showScreen=function(screen){if(screen!=='educationLesson')$('learningVideo').pause();const result=navigate.apply(this,arguments);if(screen==='education')renderLibrary();return result;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)$('learningVideo').pause();});
  document.addEventListener('DOMContentLoaded',renderLibrary);
})();
