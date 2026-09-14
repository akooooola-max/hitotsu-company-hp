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
