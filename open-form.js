(function(){
  'use strict';
  const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover: hover) and (pointer: fine)');
  let motion=!reduced.matches,userMotionChoice=false,wakeMark=function(){};
  const motionButton=document.querySelector('[data-motion-toggle]'),canvas=document.getElementById('curiosity-mark');
  function setMotion(value){motion=value;root.dataset.motion=motion?'running':'paused';if(motionButton){motionButton.setAttribute('aria-pressed',String(!motion));motionButton.textContent=motion?'Motion on':'Motion off';}if(!motion){document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));}wakeMark();}
  motionButton?.addEventListener('click',()=>{userMotionChoice=true;setMotion(!motion);});
  reduced.addEventListener('change',e=>{if(!userMotionChoice)setMotion(!e.matches);});
  root.classList.add('motion-ready');
  ['.work-head','.featured-project','.project-index','.learning-head','.about-grid','.experience','.play-inner','.footer-hello'].forEach(selector=>document.querySelectorAll(selector).forEach(e=>e.setAttribute('data-reveal','')));
  document.querySelectorAll('.mini').forEach((e,i)=>{e.setAttribute('data-reveal','');e.style.setProperty('--reveal-delay',(i%3)*35+'ms');});
  const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveals.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('[data-reveal]').forEach(e=>reveals.observe(e));
  document.querySelectorAll('.project-index details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.project-index details[open]').forEach(other=>{if(other!==detail)other.open=false;});}));
  const capsule=document.querySelector('.availability-capsule');
  if(capsule){document.addEventListener('click',e=>{if(!capsule.contains(e.target))capsule.open=false;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&capsule.open){capsule.open=false;capsule.querySelector('summary').focus();}});}
  const picker=document.getElementById('project-picker');
  if(picker){
    document.querySelector('[data-open-project-picker]').addEventListener('click',()=>picker.showModal());
    picker.querySelector('[data-close-project-picker]').addEventListener('click',()=>picker.close());
    picker.addEventListener('click',e=>{if(e.target===picker){const b=picker.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)picker.close();}});
    picker.querySelectorAll('.picker-list a').forEach(a=>a.addEventListener('click',()=>picker.close()));
    picker.querySelectorAll('[data-picker-section]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();picker.close();document.getElementById(a.dataset.pickerSection).scrollIntoView({behavior:motion?'smooth':'instant',block:'start'});}));
    const choices=Array.from(picker.querySelectorAll('[data-picker-view-button]'));
    function chooseCollection(button){picker.dataset.pickerView=button.dataset.pickerViewButton;choices.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));picker.querySelector('.picker-columns').scrollTop=0;}
    choices.forEach((button,index)=>{button.addEventListener('click',()=>chooseCollection(button));button.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=choices[(index+1)%choices.length];chooseCollection(next);next.focus();}});});
  }
  document.querySelectorAll('[data-tilt]').forEach(cover=>{
    let rect=null;
    function clear(){cover.classList.remove('is-tracking');cover.style.setProperty('--tilt-x','0deg');cover.style.setProperty('--tilt-y','0deg');rect=null;}
    cover.addEventListener('pointerenter',()=>{if(fine.matches&&motion){rect=cover.getBoundingClientRect();cover.classList.add('is-tracking');}});
    cover.addEventListener('pointermove',e=>{if(!fine.matches||!motion)return;if(!rect)rect=cover.getBoundingClientRect();const x=Math.max(-.5,Math.min(.5,(e.clientX-rect.left)/rect.width-.5)),y=Math.max(-.5,Math.min(.5,(e.clientY-rect.top)/rect.height-.5));cover.style.setProperty('--tilt-y',(x*9).toFixed(2)+'deg');cover.style.setProperty('--tilt-x',(-y*7).toFixed(2)+'deg');});
    cover.addEventListener('pointerleave',clear);cover.addEventListener('pointercancel',clear);
  });
  document.querySelectorAll('.round-link').forEach(link=>{
    link.classList.add('magnetic');let frame=0,tx=0,ty=0,x=0,y=0,rect=null;
    function tick(){x+=(tx-x)*.18;y+=(ty-y)*.18;link.style.setProperty('--mag-x',x.toFixed(2)+'px');link.style.setProperty('--mag-y',y.toFixed(2)+'px');frame=Math.abs(tx-x)+Math.abs(ty-y)>.1?requestAnimationFrame(tick):0;}
    link.addEventListener('pointerenter',()=>rect=link.getBoundingClientRect());
    link.addEventListener('pointermove',e=>{if(!fine.matches||!motion)return;if(!rect)rect=link.getBoundingClientRect();tx=(e.clientX-rect.left-rect.width/2)*.17;ty=(e.clientY-rect.top-rect.height/2)*.17;if(!frame)frame=requestAnimationFrame(tick);});
    link.addEventListener('pointerleave',()=>{tx=ty=0;rect=null;if(!frame)frame=requestAnimationFrame(tick);});
  });
  document.querySelectorAll('[data-pet-select]').forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.petSelect;document.querySelector('.pet-cover').dataset.petMode=selected;
    document.querySelectorAll('[data-pet-select]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    document.querySelectorAll('[data-pet-panel]').forEach(panel=>{panel.hidden=panel.dataset.petPanel!==selected;panel.classList.remove('is-entering');if(!panel.hidden&&motion){void panel.offsetWidth;panel.classList.add('is-entering');}});
  }));
  /* The AgentTape preview and both previews' autoplay live in previews.js. */
  if(canvas){
    const ctx=canvas.getContext('2d');let points=[],width=210,height=210,markFrame=0,visible=false,settleFrames=0,pointer={x:-1000,y:-1000},angle=0,targetAngle=Math.max(0,Math.min(scrollY,innerHeight))*.0012,angularVelocity=0,lastMarkTime=0;
    function resizeMark(){
      const box=canvas.getBoundingClientRect();if(!box.width)return;width=box.width;height=box.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);points=[];
      for(let arm=0;arm<6;arm++)for(let k=0;k<11;k++)for(let side=-1;side<=1;side++){const a=arm*Math.PI/3,r=18+k*5.2,off=side*(3.3+(k/10)*1.5),bx=Math.cos(a)*r-Math.sin(a)*off,by=Math.sin(a)*r+Math.cos(a)*off;points.push({bx,by,x:bx,y:by,vx:0,vy:0,r:1.3+(k/10)*.6});}
      wakeMark();
    }
    function draw(now){
      markFrame=0;if(!visible||document.hidden){lastMarkTime=0;return;}
      // A damped angular spring carries momentum past the target, then settles.
      // Integrate in seconds so 60 Hz and 120 Hz displays feel alike.
      let remaining=lastMarkTime?Math.min((now-lastMarkTime)/1000,1/30):1/60;
      lastMarkTime=now;
      if(motion){
        while(remaining>0){
          const dt=Math.min(remaining,1/120);
          angularVelocity+=((targetAngle-angle)*70-angularVelocity*9)*dt;
          angle+=angularVelocity*dt;
          remaining-=dt;
        }
      }else{angle=0;angularVelocity=0;}
      ctx.clearRect(0,0,width,height);ctx.fillStyle='#294ce2';
      let energy=motion?Math.abs(targetAngle-angle)*100+Math.abs(angularVelocity)*10:0;
      const c=Math.cos(angle),s=Math.sin(angle),scale=width/210;
      for(const p of points){const tx=(p.bx*c-p.by*s)*scale,ty=(p.bx*s+p.by*c)*scale;if(motion){let fx=(tx-p.x)*.025,fy=(ty-p.y)*.025;const dx=p.x+width/2-pointer.x,dy=p.y+height/2-pointer.y,dist=Math.hypot(dx,dy);if(dist<55&&dist>.1){const force=(55-dist)/55;fx+=dx/dist*force*1.8;fy+=dy/dist*force*1.8;}p.vx=(p.vx+fx)*.86;p.vy=(p.vy+fy)*.86;p.x+=p.vx;p.y+=p.vy;energy+=Math.abs(p.vx)+Math.abs(p.vy);}else{p.x=tx;p.y=ty;p.vx=p.vy=0;}ctx.beginPath();ctx.arc(p.x+width/2,p.y+height/2,p.r*scale,0,Math.PI*2);ctx.fill();}
      settleFrames=energy<.08?settleFrames+1:0;if(motion&&settleFrames<10)markFrame=requestAnimationFrame(draw);
    }
    wakeMark=function(){settleFrames=0;if(!markFrame&&visible&&!document.hidden){lastMarkTime=0;markFrame=requestAnimationFrame(draw);}};
    canvas.addEventListener('pointermove',e=>{if(!fine.matches||!motion)return;const box=canvas.getBoundingClientRect();pointer={x:e.clientX-box.left,y:e.clientY-box.top};wakeMark();});canvas.addEventListener('pointerleave',()=>{pointer={x:-1000,y:-1000};wakeMark();});
    new ResizeObserver(resizeMark).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wakeMark();else if(markFrame){cancelAnimationFrame(markFrame);markFrame=0;lastMarkTime=0;angularVelocity=0;}},{threshold:0}).observe(canvas);
    let scrollFrame=0;addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;targetAngle=Math.max(0,Math.min(scrollY,innerHeight))*.0012;if(visible)wakeMark();});},{passive:true});resizeMark();
  }
  const learning=document.getElementById('learning');
  if(learning)new IntersectionObserver(entries=>learning.classList.toggle('is-in-view',entries[0].isIntersecting),{threshold:0}).observe(learning);
  const navLinks=Array.from(document.querySelectorAll('.site-header nav a[href^="#"]'));
  const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)navLinks.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -65% 0px',threshold:0});
  ['work','learning','about'].forEach(id=>{const section=document.getElementById(id);if(section)sections.observe(section);});
  document.addEventListener('visibilitychange',()=>{wakeMark();});setMotion(motion);
})();
