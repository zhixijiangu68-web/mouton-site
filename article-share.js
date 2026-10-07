'use strict';
const isEn=document.documentElement.lang==='en';
const shareUrl=()=>{const url=new URL(window.location.href);url.hash='';url.search='';return url.href;};
const shareTitle=(document.querySelector('meta[property="og:title"]')?.content||document.title).replace(/\s*—\s*(ムートン|Mouton)$/,'');
document.querySelectorAll('.article-share').forEach(group=>{
 // Post to X, and on phones offer the system share sheet.
 const post=document.createElement('a');
 post.className='copy-link share-x';
 post.href='https://x.com/intent/post?'+new URLSearchParams({text:shareTitle,url:shareUrl(),via:'kodoku__alone'});
 post.target='_blank';
 post.rel='noopener noreferrer';
 post.textContent=isEn?'Post on X':'Xでポスト';
 group.querySelector('.copy-link').after(post);
 if(navigator.share&&matchMedia('(pointer: coarse)').matches){
  const native=document.createElement('button');
  native.type='button';
  native.className='copy-link share-native';
  native.textContent=isEn?'Share':'共有';
  native.addEventListener('click',()=>navigator.share({title:shareTitle,url:shareUrl()}).catch(()=>{}));
  post.after(native);
 }
});
document.querySelectorAll('.article-share').forEach(group=>{
 const button=group.querySelector('.copy-link');
 const status=group.querySelector('.copy-status');
 const fallback=group.querySelector('.copy-fallback');
 const input=group.querySelector('.copy-url');
 button.addEventListener('click',async()=>{
  const url={href:shareUrl()};
  button.disabled=true;
  status.textContent='';
  fallback.hidden=true;
  try {
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(url.href);
   status.textContent=isEn?'Link copied':'リンクをコピーしました';
  } catch {
   status.textContent=isEn?'Could not copy automatically. Please copy the link below.':'自動コピーができませんでした。下のリンクをコピーしてください。';
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
 button.setAttribute('aria-label',isEn?'Back to top':'ページの先頭へ戻る');
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

// On wide screens, keep the table of contents beside the article and mark the
// section being read.
(()=>{
 const toc=document.querySelector('.reading-toc nav');
 const wide=window.matchMedia('(min-width: 1400px)');
 if(!toc||!('IntersectionObserver' in window))return;
 const side=document.createElement('aside');
 side.className='toc-side';
 side.setAttribute('aria-label',isEn?'Contents (side)':'目次（サイド）');
 const label=document.createElement('p');
 label.className='toc-side-label';
 label.textContent=isEn?'Contents':'目次';
 const list=toc.querySelector('ol').cloneNode(true);
 side.append(label,list);
 document.body.append(side);
 const links=[...list.querySelectorAll('a')];
 const headings=links.map(a=>document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
 const cover=document.querySelector('.cover');
 let current=null;
 const setCurrent=id=>{
  if(id===current)return;current=id;
  links.forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 };
 const io=new IntersectionObserver(()=>{
  const mid=window.innerHeight*.45;
  let pick=null;
  for(const h of headings){if(h.getBoundingClientRect().top<mid)pick=h;else break;}
  setCurrent(pick?pick.id:null);
 },{rootMargin:'0px 0px -55% 0px',threshold:[0,1]});
 headings.forEach(h=>io.observe(h));
 // Show the side list once the cover has scrolled away.
 const showSide=on=>side.classList.toggle('visible',on&&wide.matches);
 if(cover)new IntersectionObserver(([e])=>showSide(!e.isIntersecting)).observe(cover);else showSide(true);
 wide.addEventListener('change',()=>showSide(!cover||cover.getBoundingClientRect().bottom<0));
})();

// Tables that scroll sideways on small screens can be reached and scrolled with the keyboard.
(()=>{
 const wraps=[...document.querySelectorAll('.table-wrap')];
 const update=()=>wraps.forEach((w,i)=>{
  if(w.scrollWidth>w.clientWidth+1){w.tabIndex=0;w.setAttribute('role','region');w.setAttribute('aria-label',isEn?'Table '+(i+1)+' (scrolls sideways)':'表'+(i+1)+'（横にスクロールできます）');}
  else{w.removeAttribute('tabindex');w.removeAttribute('role');w.removeAttribute('aria-label');}
 });
 update();
 window.addEventListener('resize',update);
})();
