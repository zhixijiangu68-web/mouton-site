'use strict';
document.querySelectorAll('.article-share').forEach(group=>{
 const button=group.querySelector('.copy-link');
 const status=group.querySelector('.copy-status');
 const fallback=group.querySelector('.copy-fallback');
 const input=group.querySelector('.copy-url');
 button.addEventListener('click',async()=>{
  const url=new URL(window.location.href);
  url.hash='';url.search='';
  button.disabled=true;
  status.textContent='';
  fallback.hidden=true;
  try {
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(url.href);
   status.textContent='リンクをコピーしました';
  } catch {
   status.textContent='自動コピーができませんでした。下のリンクをコピーしてください。';
   input.value=url.href;
   fallback.hidden=false;
   input.focus();
   input.select();
  } finally { button.disabled=false; }
 });
});

// Thin bar at the top showing how far through the article the reader is.
(()=>{
 const article=document.querySelector('article');
 if(!article)return;
 const bar=document.createElement('div');
 bar.className='reading-progress';
 bar.setAttribute('aria-hidden','true');
 const fill=document.createElement('span');
 bar.appendChild(fill);
 document.body.prepend(bar);
 let ticking=false;
 const update=()=>{
  ticking=false;
  const rect=article.getBoundingClientRect();
  const total=rect.height-window.innerHeight;
  const ratio=total>0?Math.min(1,Math.max(0,-rect.top/total)):1;
  fill.style.transform='scaleX('+ratio+')';
 };
 const request=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
 window.addEventListener('scroll',request,{passive:true});
 window.addEventListener('resize',request);
 update();
})();

// Button to jump back to the top once the reader is well into the page.
(()=>{
 const button=document.createElement('button');
 button.type='button';
 button.className='to-top';
 button.setAttribute('aria-label','ページの先頭へ戻る');
 button.textContent='↑';
 button.tabIndex=-1;
 document.body.appendChild(button);
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 button.addEventListener('click',()=>{
  window.scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});
  const heading=document.querySelector('h1');
  if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
 });
 let ticking=false;
 const update=()=>{
  ticking=false;
  const visible=window.scrollY>window.innerHeight*1.5;
  button.classList.toggle('visible',visible);
  button.tabIndex=visible?0:-1;
 };
 window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
 update();
})();
