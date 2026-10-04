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
