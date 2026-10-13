/* Per-lesson editorial references. Live verification is still pending. */
(function () {
  const sources={
    anxiety:['NIMH: Anxiety Disorders','https://www.nimh.nih.gov/health/topics/anxiety-disorders'],
    panic:['NHS: Anxiety, fear and panic','https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anxiety-fear-panic/'],
    reframe:['NHS: Reframing unhelpful thoughts','https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/'],
    worry:['NHS: Tackling your worries','https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/'],
    uncertainty:['Centre for Clinical Interventions: Worry and Rumination','https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination'],
    esteem:['NHS: Raising low self-esteem','https://www.nhs.uk/mental-health/self-help/tips-and-support/raise-low-self-esteem/'],
    habits:['NHLBI: Healthy Sleep Habits','https://www.nhlbi.nih.gov/health/sleep/healthy-sleep-habits'],
    sleep:['NHS: Sleep','https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/'],
    insomnia:['NHLBI: Insomnia treatment','https://www.nhlbi.nih.gov/health/insomnia/treatment'],
    guideline:['AASM: Behavioral and psychological treatments for chronic insomnia in adults (2021)','https://doi.org/10.5664/jcsm.8986'],
    stress:['NHS: Stress','https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/'],
    care:['NIMH: Caring for Your Mental Health','https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health'],
    boundaries:['Centre for Clinical Interventions: Assertiveness','https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Assertiveness']
  };
  const mapping={alarm:['anxiety','panic'],sensations:['panic','anxiety'],support:['panic','anxiety'],facts:['reframe'],loops:['worry'],uncertainty:['uncertainty'],smallsteps:['esteem'],selftalk:['esteem','reframe'],setbacks:['esteem','care'],winddown:['habits'],bedtimeworry:['worry','sleep'],sleepexpectations:['insomnia','guideline'],stresssignals:['stress','care'],boundaries:['boundaries'],restsupport:['care']};
  steadierMindLessons.forEach(lesson=>{lesson.sources=mapping[lesson.id].map(key=>sources[key]);lesson.sourceVerification='pending';});
  document.addEventListener('DOMContentLoaded',()=>{
    const target=document.getElementById('educationalSourceList');
    steadierMindLessons.forEach(lesson=>{
      const group=document.createElement('details'),title=document.createElement('summary');group.className='learning-path';title.textContent=lesson.title;group.append(title);
      lesson.sources.forEach(([name,url])=>{const p=document.createElement('p'),a=document.createElement('a');a.href=url;a.textContent=name;a.target='_blank';a.rel='noopener noreferrer';p.append(a);group.append(p);});target.append(group);
    });
  });
})();
