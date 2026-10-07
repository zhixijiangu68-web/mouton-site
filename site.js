'use strict';
// Shared behaviour: navigation theme and menu, scroll scenes.
(()=>{
 const nav=document.querySelector('.site-nav');
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');

 // Load each scene's art shortly before it scrolls into view.
 const sceneEls=[...document.querySelectorAll('[data-scene]')];
 if('IntersectionObserver' in window){
  const near=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('near');near.unobserve(e.target);}}),{rootMargin:'150% 0px'});
  sceneEls.forEach(s=>near.observe(s));
 }else sceneEls.forEach(s=>s.classList.add('near'));

 // Items marked data-rise fade up the first time they scroll into view.
 const risers=[...document.querySelectorAll('[data-rise]')];
 if(risers.length&&'IntersectionObserver' in window&&!reduce.matches){
  const rise=new IntersectionObserver(entries=>{
   let i=0;
   entries.forEach(e=>{if(e.isIntersecting){e.target.style.setProperty('--rise-i',i++);e.target.classList.add('risen');rise.unobserve(e.target);}});
  },{rootMargin:'0px 0px -8% 0px'});
  risers.forEach(r=>rise.observe(r));
 }else risers.forEach(r=>r.classList.add('risen'));

 // Menu (small screens)
 if(nav){
  const toggle=nav.querySelector('.menu-toggle');
  const links=nav.querySelector('.site-links');
  // While the full-screen menu is open, the page behind it is inert so focus stays in the menu.
  const behind=[...document.body.children].filter(el=>el!==nav&&el.tagName!=='SCRIPT');
  const setOpen=open=>{
   nav.classList.toggle('menu-open',open);
   document.body.classList.toggle('menu-locked',open);
   behind.forEach(el=>{el.inert=open;});
   toggle.setAttribute('aria-expanded',String(open));
   toggle.textContent=open?'Close':'Menu';
  };
  window.matchMedia('(max-width: 860px)').addEventListener('change',e=>{if(!e.matches)setOpen(false);});
  toggle.addEventListener('click',()=>setOpen(!nav.classList.contains('menu-open')));
  links.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('menu-open')){setOpen(false);toggle.focus();}});
 }

 const zones=[...document.querySelectorAll('[data-nav]')];
 const navLinks=nav?[...nav.querySelectorAll('.site-links a[href*="#"]')]:[];
 const scenes=[...document.querySelectorAll('[data-scene]')];
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>v<.5?2*v*v:1-Math.pow(-2*v+2,2)/2;

 // Section positions are measured once (and again when the layout changes), so
 // scrolling only reads scrollY and never forces the browser to recompute layout.
 let layout={zones:[],targets:[],scenes:[],navProbe:0,vh:0};
 const measure=()=>{
  const y=window.scrollY;
  const box=el=>{const r=el.getBoundingClientRect();return {top:r.top+y,bottom:r.bottom+y,height:r.height};};
  layout={
   vh:window.innerHeight,
   navProbe:nav?nav.offsetHeight/2:0,
   zones:zones.map(z=>({el:z,...box(z)})),
   targets:navLinks.map(a=>{const t=document.getElementById(a.hash.slice(1));return t?{a,...box(t)}:null;}).filter(Boolean),
   scenes:scenes.map(s=>({el:s,...box(s),hero:s.classList.contains('scene-hero'),overlap:s.classList.contains('overlap'),reveal:s.hasAttribute('data-reveal'),nextOverlap:s.hasAttribute('data-next-overlap')})),
  };
 };

 let lastTheme='',lastSolid=null,lastCurrent;
 function updateNav(y){
  if(!nav)return;
  const probe=y+layout.navProbe;
  let theme='light',solid='';
  for(const z of layout.zones)if(z.top<=probe&&z.bottom>probe){theme=z.el.dataset.nav;solid=z.el.dataset.navSolid||'';}
  if(theme!==lastTheme){nav.dataset.theme=theme;lastTheme=theme;}
  if(solid!==lastSolid){if(solid)nav.dataset.solid=solid;else delete nav.dataset.solid;lastSolid=solid;}
  const line=y+layout.vh*.4;
  let current=null;
  for(const t of layout.targets)if(t.top<=line&&t.bottom>line)current=t.a;
  if(current!==lastCurrent){navLinks.forEach(a=>{if(a===current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});lastCurrent=current;}
 }

 function updateScenes(y){
  const vh=layout.vh;
  for(const s of layout.scenes){
   const top=s.top-y,bottom=s.bottom-y;
   if(bottom<-vh||top>vh*1.5)continue;
   const el=s.el;
   // p: 0 when the scene pins, 1 when it lets go.
   const p=clamp(-top/Math.max(1,s.height-vh));
   el.style.setProperty('--p',p.toFixed(4));
   // Copy fades in once the scene pins, and out as the next scene covers it
   // (or as it scrolls away when nothing overlaps it).
   // Overlapping scenes spend their first stretch dissolving in over the previous one.
   const intro=s.overlap?vh*.7:0;
   const pinned=-top-intro;
   const tIn=s.hero?1:ease(clamp(pinned/(vh*.3)));
   const t2In=s.hero?1:ease(clamp((pinned-vh*.12)/(vh*.3)));
   const leave=s.nextOverlap?clamp((2*vh-bottom)/(vh*.3)):clamp((1.25*vh-bottom)/(vh*.4));
   const tOut=1-ease(leave);
   el.style.setProperty('--t',Math.min(tIn,tOut).toFixed(3));
   el.style.setProperty('--t2',Math.min(t2In,tOut).toFixed(3));
   if(s.reveal){
    // Halftone dissolve: dots grow until the image covers the screen.
    const e=intro?clamp(-top/intro):clamp(1-top/vh);
    const dot=ease(e)*7.5;
    el.style.setProperty('--dot',dot.toFixed(2));
    el.classList.toggle('revealed',dot>=7.2);
    el.classList.toggle('pending',dot<.05);
   }
  }
 }

 // Keyboard focus moving into a scene brings that scene fully into view first.
 document.addEventListener('focusin',e=>{
  if(reduce.matches)return;
  const scene=e.target.closest&&e.target.closest('.scene.overlap');
  if(!scene||!scene.classList.contains('pending')&&!scene.style.getPropertyValue('--t').startsWith('0.'))return;
  const y=scene.getBoundingClientRect().top+window.scrollY+window.innerHeight*1.15;
  window.scrollTo({top:y,behavior:'auto'});
 });

 // In-page links to an overlapping scene land after its dissolve, not before it.
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href*="#"]');
  if(reduce.matches||!a||a.pathname!==location.pathname)return;
  const target=document.getElementById(a.hash.slice(1));
  if(!target||!target.classList.contains('overlap'))return;
  e.preventDefault();
  const y=target.getBoundingClientRect().top+window.scrollY+window.innerHeight*1.15;
  window.scrollTo({top:y,behavior:reduce.matches?'auto':'smooth'});
  history.pushState(null,'',a.hash);
 });

 let ticking=false,dirty=true;
 const update=()=>{
  ticking=false;
  if(dirty){measure();dirty=false;}
  const y=window.scrollY;
  if(!reduce.matches)updateScenes(y);
  updateNav(y);
 };
 const request=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
 const remeasure=()=>{dirty=true;request();};
 window.addEventListener('scroll',request,{passive:true});
 window.addEventListener('resize',remeasure);
 if('ResizeObserver' in window)new ResizeObserver(remeasure).observe(document.body);
 if(document.fonts)document.fonts.ready.then(remeasure);
 if(reduce.matches)scenes.forEach(s=>{s.style.setProperty('--t',1);s.style.setProperty('--t2',1);s.classList.add('revealed');});
 update();
 const smooth=()=>setTimeout(()=>document.documentElement.classList.add('smooth'),0);
 if(document.readyState==='complete')smooth();else window.addEventListener('load',smooth,{once:true});
 // Opening the page at an overlapping scene's anchor lands after its dissolve too.
 const start=location.hash&&document.getElementById(location.hash.slice(1));
 if(start&&start.classList.contains('overlap')&&!reduce.matches){
  const land=()=>window.scrollTo({top:start.getBoundingClientRect().top+window.scrollY+window.innerHeight*1.15,behavior:'auto'});
  // Wait for the browser's own jump to the anchor, then move past the dissolve.
  if(document.readyState==='complete')setTimeout(land,0);else window.addEventListener('load',()=>setTimeout(land,0),{once:true});
 }
})();

// GA4: record clicks on affiliate links (Amazon / Rakuten) with the page and product,
// so we can see which article sends readers to a shop. No-op when GA4 is off.
document.addEventListener('click',e=>{
 const a=e.target.closest&&e.target.closest('a[rel~="sponsored"]');
 if(!a||typeof window.gtag!=='function')return;
 const card=a.closest('.product-card');
 const name=card?.querySelector('.product-name')?.firstChild?.textContent.trim()||a.textContent.trim();
 window.gtag('event','affiliate_click',{shop:/rakuten/.test(a.hostname)?'rakuten':'amazon',product:name.slice(0,100),article:location.pathname,transport_type:'beacon'});
});

// Guides: a small bar that jumps to the products, so readers who arrive from X
// don't have to scroll to the end. Shows after the intro, hides once the products are on screen.
(()=>{
 const cards=document.querySelectorAll('.product-card');
 if(!cards.length||!('IntersectionObserver' in window))return;
 const target=document.getElementById('section-mine')||cards[0];
 const bar=document.createElement('a');
 bar.className='jump-products';bar.href='#'+(target.id||(target.id='products'));
 bar.innerHTML='この記事で紹介している商品を見る <span aria-hidden="true">↓</span>';
 bar.addEventListener('click',()=>{if(typeof window.gtag==='function')window.gtag('event','jump_to_products',{article:location.pathname});});
 document.body.appendChild(bar);
 const seen=new Set();let past=false;
 const sync=()=>bar.classList.toggle('is-on',past&&!seen.size);
 const io=new IntersectionObserver(es=>{es.forEach(e=>e.isIntersecting?seen.add(e.target):seen.delete(e.target));sync();});
 [target,...cards].forEach(el=>io.observe(el));
 addEventListener('scroll',()=>{past=scrollY>innerHeight*.9;sync();},{passive:true});
})();
