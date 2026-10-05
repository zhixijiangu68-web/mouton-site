'use strict';
// Shared behaviour: navigation theme and menu, images with fallbacks, scroll scenes.
(()=>{
 const nav=document.querySelector('.site-nav');
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');

 // Load each data-img (then data-fallback); keep the placeholder art if none exists.
 document.querySelectorAll('[data-img]').forEach(el=>{
  const sources=[el.dataset.img,el.dataset.fallback].filter(Boolean);
  const tryNext=()=>{
   const src=sources.shift();
   if(!src){el.classList.add('is-placeholder');return;}
   const img=new Image();
   img.onload=()=>{el.style.setProperty('--img','url("'+src+'")');el.classList.add('has-image');};
   img.onerror=tryNext;
   img.src=src;
  };
  tryNext();
 });

 // Menu (small screens)
 if(nav){
  const toggle=nav.querySelector('.menu-toggle');
  const links=nav.querySelector('.site-links');
  const setOpen=open=>{
   nav.classList.toggle('menu-open',open);
   document.body.classList.toggle('menu-locked',open);
   toggle.setAttribute('aria-expanded',String(open));
   toggle.textContent=open?'Close':'Menu';
  };
  toggle.addEventListener('click',()=>setOpen(!nav.classList.contains('menu-open')));
  links.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('menu-open')){setOpen(false);toggle.focus();}});
 }

 const zones=[...document.querySelectorAll('[data-nav]')];
 const navLinks=nav?[...nav.querySelectorAll('.site-links a[href*="#"]')]:[];
 const scenes=[...document.querySelectorAll('[data-scene]')];
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>v<.5?2*v*v:1-Math.pow(-2*v+2,2)/2;

 function updateNav(){
  if(!nav)return;
  const probe=nav.offsetHeight/2;
  let theme='light',solid='';
  for(const z of zones){
   const r=z.getBoundingClientRect();
   if(r.top<=probe&&r.bottom>probe){theme=z.dataset.nav;solid=z.dataset.navSolid||'';}
  }
  nav.dataset.theme=theme;
  if(solid)nav.dataset.solid=solid;else delete nav.dataset.solid;
  let current=null;
  for(const a of navLinks){
   const target=document.getElementById(a.hash.slice(1));
   if(!target)continue;
   const r=target.getBoundingClientRect();
   if(r.top<=window.innerHeight*.4&&r.bottom>window.innerHeight*.4)current=a;
  }
  navLinks.forEach(a=>{if(a===current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 }

 function updateScenes(){
  const vh=window.innerHeight;
  for(const s of scenes){
   const r=s.getBoundingClientRect();
   if(r.bottom<-vh||r.top>vh*1.5)continue;
   // p: 0 when the scene pins, 1 when it lets go.
   const p=clamp(-r.top/Math.max(1,r.height-vh));
   s.style.setProperty('--p',p.toFixed(4));
   // Copy fades in once the scene pins, and out as the next scene covers it
   // (or as it scrolls away when nothing overlaps it).
   const hero=s.classList.contains('scene-hero');
   // Overlapping scenes spend their first stretch dissolving in over the previous one.
   const intro=s.classList.contains('overlap')?vh*.7:0;
   const pinned=-r.top-intro;
   const tIn=hero?1:ease(clamp(pinned/(vh*.3)));
   const t2In=hero?1:ease(clamp((pinned-vh*.12)/(vh*.3)));
   const leave=s.hasAttribute('data-next-overlap')?clamp((2*vh-r.bottom)/(vh*.3)):clamp((1.25*vh-r.bottom)/(vh*.4));
   const tOut=1-ease(leave);
   s.style.setProperty('--t',Math.min(tIn,tOut).toFixed(3));
   s.style.setProperty('--t2',Math.min(t2In,tOut).toFixed(3));
   if(s.hasAttribute('data-reveal')){
    // Halftone dissolve: dots grow until the image covers the screen.
    const e=intro?clamp(-r.top/intro):clamp(1-r.top/vh);
    const dot=ease(e)*7.5;
    s.style.setProperty('--dot',dot.toFixed(2));
    s.classList.toggle('revealed',dot>=7.2);
    s.classList.toggle('pending',dot<.05);
   }
  }
 }

 // In-page links to an overlapping scene land after its dissolve, not before it.
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href*="#"]');
  if(!a||a.pathname!==location.pathname)return;
  const target=document.getElementById(a.hash.slice(1));
  if(!target||!target.classList.contains('overlap'))return;
  e.preventDefault();
  const y=target.getBoundingClientRect().top+window.scrollY+window.innerHeight*1.15;
  window.scrollTo({top:y,behavior:reduce.matches?'auto':'smooth'});
  history.pushState(null,'',a.hash);
 });

 let ticking=false;
 const update=()=>{ticking=false;if(!reduce.matches)updateScenes();updateNav();};
 const request=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
 window.addEventListener('scroll',request,{passive:true});
 window.addEventListener('resize',request);
 if(reduce.matches)scenes.forEach(s=>{s.style.setProperty('--t',1);s.style.setProperty('--t2',1);s.classList.add('revealed');});
 update();
})();
