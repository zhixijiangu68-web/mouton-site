'use strict';
// Home page only: opening veil, kinetic headline, pointer light and subtle card tilt.
(()=>{
 const root=document.documentElement;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;

 // Opening veil: lifts on its own (CSS); a click or key skips it.
 const veil=document.querySelector('.intro-veil');
 if(veil&&root.classList.contains('intro')){
  const done=()=>root.classList.add('intro-done');
  veil.addEventListener('animationend',e=>{if(e.animationName==='veil-dissolve')done();});
  veil.addEventListener('click',done);
  addEventListener('keydown',done,{once:true});
  // The 6.1s crossfade finishes on its own; timeout is only a safety fallback.
  setTimeout(done,8000);
 }

 // Headline: split into letters that rise one after another. Screen readers get the whole line.
 const h1=document.querySelector('.cover .cover-title');
 if(h1){
  h1.setAttribute('aria-label',h1.textContent.trim());
  let c=0;
  const walk=node=>{
   for(const child of [...node.childNodes]){
    if(child.nodeType===3){
     const frag=document.createDocumentFragment();
     for(const ch of child.textContent){
      const s=document.createElement('span');
      s.className='char';s.setAttribute('aria-hidden','true');s.style.setProperty('--c',c++);s.textContent=ch;
      s.style.setProperty('--dx',((Math.random()-.5)*14).toFixed(2));s.style.setProperty('--dy',(-2-Math.random()*6).toFixed(2));s.style.setProperty('--dr',((Math.random()-.5)*140).toFixed(0));
      frag.append(s);
     }
     child.replaceWith(frag);
    }else if(child.nodeType===1)walk(child);
   }
  };
  walk(h1);
 }

 const hero=document.querySelector('.cover');
 const light=hero&&hero.querySelector('.hero-light');
 if(hero&&!reduce){
  let scheduled=false;
  const update=()=>{
   scheduled=false;
   hero.style.setProperty('--p',Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight))).toFixed(3));
  };
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
  update();
 }
 if(hero&&light&&!reduce){
  // The light follows the pointer; without one it drifts slowly on its own.
  let tx=72,ty=28,x=72,y=28,active=false,raf=0,visible=true,t0=performance.now();
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*100;ty=(e.clientY-r.top)/r.height*100;active=true;});
  hero.addEventListener('pointerleave',()=>{active=false;});
  const tick=now=>{
   if(!active){const t=(now-t0)/1000;tx=60+22*Math.sin(t*.35);ty=32+14*Math.sin(t*.5+1);}
   x+=(tx-x)*.08;y+=(ty-y)*.08;
   light.style.setProperty('--lx',x.toFixed(2)+'%');light.style.setProperty('--ly',y.toFixed(2)+'%');
   raf=visible?requestAnimationFrame(tick):0;
  };
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(tick);}).observe(hero);
 }

 if(!finePointer||reduce)return;

 // Cards lean toward the pointer, with a soft glint where it is.
 document.querySelectorAll('.reading3-card,.guide-card,.science-card,.card-link').forEach(card=>{
  card.classList.add('tilt');
  card.addEventListener('pointermove',e=>{
   const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
   card.classList.add('tilting');
   card.style.setProperty('--ry',((px-.5)*8).toFixed(2)+'deg');
   card.style.setProperty('--rx',((.5-py)*8).toFixed(2)+'deg');
   card.style.setProperty('--mx',(px*100).toFixed(1)+'%');
   card.style.setProperty('--my',(py*100).toFixed(1)+'%');
  });
  card.addEventListener('pointerleave',()=>{
   card.classList.remove('tilting');
   card.style.removeProperty('--rx');card.style.removeProperty('--ry');
  });
 });
})();
