'use strict';
// Home page only: opening veil, kinetic headline, pointer light, cursor companion, tilting cards.
(()=>{
 const root=document.documentElement;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;

 // Opening veil: lifts on its own (CSS); a click or key skips it.
 const veil=document.querySelector('.intro-veil');
 if(veil&&root.classList.contains('intro')){
  const done=()=>root.classList.add('intro-done');
  veil.addEventListener('animationend',e=>{if(e.animationName==='veil-lift')done();});
  veil.addEventListener('click',done);
  addEventListener('keydown',done,{once:true});
  setTimeout(done,3000);
 }

 // Headline: split into letters that rise one after another. Screen readers get the whole line.
 const h1=document.querySelector('.scene-hero .display');
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

 const hero=document.querySelector('.scene-hero .scene-pin');
 const light=hero&&hero.querySelector('.hero-light');
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

 // Cursor companion: a small dot that opens into a ring over anything clickable.
 const dot=document.createElement('div');
 dot.className='cursor-dot is-off';dot.setAttribute('aria-hidden','true');
 document.body.append(dot);
 let cx=-100,cy=-100,dx=-100,dy=-100,moving=0;
 const follow=()=>{
  dx+=(cx-dx)*.22;dy+=(cy-dy)*.22;
  dot.style.setProperty('--cx',dx.toFixed(1)+'px');dot.style.setProperty('--cy',dy.toFixed(1)+'px');
  moving=Math.abs(cx-dx)+Math.abs(cy-dy)>.3?requestAnimationFrame(follow):0;
 };
 addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  cx=e.clientX;cy=e.clientY;
  dot.classList.remove('is-off');
  dot.classList.toggle('is-link',!!e.target.closest('a,button,input,label,.journal-item'));
  if(!moving)moving=requestAnimationFrame(follow);
 },{passive:true});
 document.addEventListener('mouseout',e=>{if(!e.relatedTarget)dot.classList.add('is-off');});
 addEventListener('blur',()=>dot.classList.add('is-off'));

 // Cards lean toward the pointer, with a soft glint where it is.
 document.querySelectorAll('.guide-card,.science-card,.card-link').forEach(card=>{
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
