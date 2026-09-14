'use strict';
const $ = (q) => document.querySelector(q);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('.chapter')];
const manor = $('#manor');
const canvas = $('#motes');
const ctx = canvas.getContext('2d');
const fireworks = new ManorFireworks();
const ghostVideo = $("#ghost-video");
const ghostVoice = new Audio();
ghostVoice.preload="none";
ghostVoice.src="assets/ghost-follow-me.mp3";
ghostVoice.volume=.8;
let tourFrame=0, tourRunning=false, tourElapsed=0, tourLastTime=0;
let paused = reduced.matches;
let progress = 0, pointerX = 0, pointerY = 0, active = -1;
let w = 0, h = 0, animationFrame = 0, lastTime = 0, travelFrame = 0;
let sceneFrame=0, journeyDistance=1, previousChapterState="";
const hallImage=$("#hall-image"), landingImage=$("#landing-image"), balconyImage=$("#balcony-image");
function requestScene(){if(!sceneFrame)sceneFrame=requestAnimationFrame(()=>{sceneFrame=0;drawScene();});}
function sceneOpacity(el,alpha){
  el.style.opacity=String(alpha);
  el.style.visibility=alpha>0?"visible":"hidden";
  el.style.willChange=alpha>0?"opacity, transform":"auto";
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => v * v * (3 - 2 * v);

// Independent vector foreground, hinged in perspective over the painted scene.
function gateMarkup(mirrored) {
  let bars = '';
  for (let i = 0; i < 14; i++) {
    const x = 18 + i * 31;
    const y = 90 - Math.sin(i / 13 * Math.PI / 2) * 60;
    bars += `<path d="M${x} 430V${y}"/><path d="M${x-5} ${y+8}L${x} ${y-9}L${x+5} ${y+8}" fill="#101322"/>`;
    if (i % 2 === 0) bars += `<path d="M${x} 290q24-35 24-4t-24 15q-24-35-24-4t24 15"/>`;
  }
  return `<svg viewBox="0 0 440 440" preserveAspectRatio="none"><g ${mirrored?'transform="translate(440 0) scale(-1 1)"':''} stroke="#25263a" stroke-width="3.4" fill="none"><path d="M4 440V112Q210 24 434 8V440" stroke-width="9" fill="#080b1488"/><path d="M8 135Q220 43 434 31M8 323H434M8 356H434" stroke-width="6"/>${bars}<path d="M422 15V440" stroke="#9a785343" stroke-width="2"/><circle cx="410" cy="258" r="7" stroke="#a47c48"/></g></svg>`;
}
$('#gate-left').innerHTML = gateMarkup(false);
$('#gate-right').innerHTML = gateMarkup(true);

const particles = Array.from({length:44}, (_, i) => ({x:((i*73)%101)/101,y:((i*37)%97)/97,r:.6+(i%4)*.4,s:.004+(i%5)*.002,p:i*1.7}));
function resize() {
  fireworks.reset();
  const stage = $('.stage');
  w = stage.clientWidth; h = stage.clientHeight;
  journeyDistance=Math.max(1,$("#journey").offsetHeight-stage.offsetHeight);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = w*dpr; canvas.height = h*dpr;
  if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
  drawScene();
}
function drawScene() {
  progress = clamp(scrollY / journeyDistance);
  const route = progress * 950 / 550;
  const phase = route < .26 ? 0 : route < .55 ? 1 : route < .91 ? 2 : route < 1.31 ? 3 : route < 1.66 ? 4 : 5;
  const crossing = !paused && ((route > .73 && route < .91)||(route>1.12&&route<1.31)||(route>1.46&&route<1.66));
  document.body.classList.toggle('crossing',crossing);
  if (phase !== active) {
    fireworks.reset();
    active = phase;
    $('.ghost-guide').style.left=(w<700?70:[73,54,73,73,73,73][phase])+'%';
    $('.ghost-guide').style.top=(w<700?[23,20,24,20,19,16]:[40,34,39,33,34,22])[phase]+'%';
    $('#step').textContent = `0${phase+1}`;
    $('#scroll-label').textContent = phase===5 ? 'BACK TO THE ENTRANCE' : phase===2 ? 'ENTER THE MANOR' : phase===3 ? 'UP THE STAIRS' : phase===4 ? 'TO THE BALCONY' : 'SCROLL TO EXPLORE';
  }
  const chapterState=phase+":"+crossing;
  if(chapterState!==previousChapterState){
  previousChapterState=chapterState;
  chapters.forEach((el,i) => {
    el.classList.toggle('active',i===phase);
    el.inert=i!==phase||crossing;
    el.setAttribute('aria-hidden',String(i!==phase||crossing));
  });
  }
  const approach = smooth(clamp(route/.73));
  const rush = smooth(clamp((route-.69)/.12));
  const zoom = paused ? 1 : 1 + approach * (w<700?.65:1.0) + rush*3;
  manor.style.transform = `translate3d(${paused?0:pointerX*7*(1-route)}px,${paused?0:pointerY*4*(1-route)}px,0) scale(${zoom})`;
  const indoors = paused ? +(phase>=3) : smooth(clamp((route-.79)/.035));
  const upstairs=paused?+(phase>=4):smooth(clamp((route-1.20)/.12));
  const outside=paused?+(phase===5):smooth(clamp((route-1.54)/.12));
  sceneOpacity(hallImage,indoors*(1-upstairs));
  sceneOpacity(landingImage,upstairs*(1-outside));
  sceneOpacity(balconyImage,outside);
  manor.style.visibility=indoors<1?"visible":"hidden";
  manor.style.willChange=indoors<1?"transform":"auto";
  $('#landing-image').style.transform=`scale(${paused?1:1+1.6*smooth(clamp((route-1.42)/.22))})`;
  $('#balcony-image').style.transform=`scale(${paused?1:1.08-.08*smooth(clamp((route-1.59)/.13))})`;
  $('#hall-image').style.transform=`scale(${paused?1:1.12-.12*smooth(clamp((route-.83)/.17))+1.9*smooth(clamp((route-1.04)/.28))})`;
  const doorOpen = smooth(clamp((route-.815)/.13));
  $('.threshold').style.opacity=String(paused?0:smooth(clamp((route-.735)/.055))*(1-smooth(clamp((route-.94)/.04))));
  $('.door-leaf-left').style.transform=`rotateY(${-doorOpen*108}deg)`;
  $('.door-leaf-right').style.transform=`rotateY(${doorOpen*108}deg)`;
  document.querySelectorAll('.fog,.bats').forEach(el=>el.style.visibility=indoors>.5?'hidden':'visible');
  const opening = smooth(clamp(route/.35));
  $('#gate-left').style.transform = `rotateY(${-opening*105}deg) translateX(${-opening*35}%)`;
  $('#gate-right').style.transform = `rotateY(${opening*105}deg) translateX(${opening*35}%)`;
  $('.gate-frame').style.opacity = String(1-clamp((route-.15)/.22));
  $('#hall-image').style.transformOrigin=route>1?'68% 35%':'50% 55%';
  $('#progress').style.transform = `scaleX(${progress})`;
}
function drawMotes(time) {
  animationFrame = 0;
  if (!ctx) return;
  const dt = Math.min((time-lastTime)/1000 || 0,.05); lastTime=time;
  ctx.clearRect(0,0,w,h);
  for (const p of particles) {
    if (!paused) p.y = (p.y-p.s*dt+1)%1;
    const x=(p.x + Math.sin(time*.0002+p.p)*.015)*w;
    const y=p.y*h;
    ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,196,112,${.18+Math.sin(time*.001+p.p)*.12})`;
    ctx.shadowColor='#fca956';ctx.shadowBlur=9;ctx.fill();
  }
  ctx.shadowBlur=0;
  if(active===5&&!paused)fireworks.draw(ctx,dt,w,h);
  if (!paused && !document.hidden) animationFrame=requestAnimationFrame(drawMotes);
}
function startAnimation() {if(!animationFrame&&!paused&&!document.hidden){lastTime=performance.now();animationFrame=requestAnimationFrame(drawMotes);}}
function setPaused(value) {
  stopTour();cancelTravel();
  paused=value;document.body.classList.toggle('motion-paused',paused);
  $('#motion').setAttribute('aria-pressed',String(paused));
  $('#motion').title=paused?'動きを再開する':'動きを止める';
  $('.motion-label').textContent=$('#motion').title;
  $('.motion-icon').textContent=paused?'▷':'Ⅱ';
  if(paused){cancelAnimationFrame(animationFrame);animationFrame=0;if(ctx)ctx.clearRect(0,0,w,h);}else startAnimation();
  drawScene();
}
$('#motion').addEventListener('click',()=>setPaused(!paused));
reduced.addEventListener('change',e=>setPaused(e.matches));
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(animationFrame);animationFrame=0;}else startAnimation();});
function cancelTravel(){cancelAnimationFrame(travelFrame);travelFrame=0;}
function goTo(id) {
  stopTour();
  const el=document.getElementById(id);if(!el)return;
  cancelTravel();
  const destination=Math.min(el.offsetTop,document.documentElement.scrollHeight-innerHeight);
  if(paused){scrollTo({top:destination,behavior:'instant'});return;}
  const start=scrollY, started=performance.now(), duration=id==='hall'?3800:['landing','balcony'].includes(id)?3000:1500;
  function travel(now){
    const t=clamp((now-started)/duration);
    scrollTo({top:start+(destination-start)*smooth(t),behavior:'instant'});
    if(t<1)travelFrame=requestAnimationFrame(travel);else travelFrame=0;
  }
  travelFrame=requestAnimationFrame(travel);
}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goTo(a.hash.slice(1));}));
$('#next').addEventListener('click',()=>goTo(['garden','door','hall','landing','balcony','entrance'][active]));
function interruptTravel(event) {
  if(event?.target?.closest?.('#auto-tour'))return;
  stopTour();cancelTravel();
}
addEventListener('wheel',interruptTravel,{passive:true});
addEventListener('touchstart',interruptTravel,{passive:true});
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Escape'].includes(e.key))interruptTravel(e);});
// Each view gets a short still moment; the finale leaves eight seconds for fireworks.
const tourStops=[
  ['entrance','entrance',2200],['entrance','garden',2600],['garden','garden',1800],
  ['garden','door',2600],['door','door',1200],['door','hall',4200],['hall','hall',1800],
  ['hall','landing',3800],['landing','landing',1800],['landing','balcony',3800],['balcony','balcony',8000]
];
function stopTour() {
  cancelAnimationFrame(tourFrame);tourFrame=0;tourRunning=false;
  document.body.classList.remove('tour-running');
  ghostVideo.pause();ghostVoice.pause();ghostVoice.currentTime=0;
  $('#auto-tour').setAttribute('aria-pressed','false');
  $('.tour-label').textContent='ゴーストの導き';$('.tour-icon').textContent='▷';
  $('#auto-tour').title='ゴーストが入口から夜景まで案内します';
}
function startTour() {
  stopTour();cancelTravel();
  if(dialog.open)dialog.close();
  tourRunning=true;tourElapsed=0;tourLastTime=performance.now();
  ghostVideo.currentTime=0;
  if(!paused)ghostVideo.play().catch(()=>{});
  ghostVoice.currentTime=0;ghostVoice.play().catch(()=>{});
  if(manorMusic.playing&&manorMusic.master){
    const now=manorMusic.context.currentTime;
    manorMusic.master.gain.cancelScheduledValues(now);
    manorMusic.master.gain.setTargetAtTime(.055,now,.1);
    manorMusic.master.gain.setTargetAtTime(.19,now+3,.4);
  }
  pointerX=0;pointerY=0;
  document.body.classList.add('tour-running');
  $('#auto-tour').setAttribute('aria-pressed','true');
  $('.tour-label').textContent='案内を止める';$('.tour-icon').textContent='Ⅱ';
  $('#auto-tour').title='ゴーストの案内を止める';
  scrollTo({top:0,behavior:'instant'});drawScene();
  function tick(now) {
    if(!tourRunning)return;
    // A hidden tab resumes where it left off, instead of skipping whole rooms.
    if(!document.hidden)tourElapsed+=Math.min(now-tourLastTime,80);
    tourLastTime=now;
    let elapsed=tourElapsed, segment=null;
    for(const stop of tourStops){if(elapsed<stop[2]){segment=stop;break;}elapsed-=stop[2];}
    if(!segment){stopTour();return;}
    const [from,to,duration]=segment;
    const limit=document.documentElement.scrollHeight-innerHeight;
    const begin=Math.min(document.getElementById(from).offsetTop,limit);
    const end=Math.min(document.getElementById(to).offsetTop,limit);
    const t=paused?1:smooth(clamp(elapsed/duration));
    scrollTo({top:begin+(end-begin)*t,behavior:'instant'});
    tourFrame=requestAnimationFrame(tick);
  }
  tourFrame=requestAnimationFrame(tick);
}
$('#auto-tour').addEventListener('click',()=>{if(tourRunning){stopTour();manorMusic.stop();}else{manorMusic.play();startTour();}});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ghostVideo.pause();ghostVoice.pause();}
  else if(tourRunning){if(!paused)ghostVideo.play().catch(()=>{});if(ghostVoice.currentTime<ghostVoice.duration)ghostVoice.play().catch(()=>{});}
});
addEventListener('scroll',requestScene,{passive:true});
addEventListener('resize',resize);
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!tourRunning){pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;requestScene();}},{passive:true});
const dialog=$('#invitation');
$('#invitation-open').addEventListener('click',()=>dialog.showModal());
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
$('#restart').addEventListener('click',()=>{dialog.close();goTo('entrance');});
resize();setPaused(paused);
