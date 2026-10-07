'use strict';
// ○× quiz loop. Questions come from quizzes.json (built from src/_data/quizzes.json).
//   <div class="qloop" data-qloop data-exclude="slug" data-prefer="a,b"></div>  inline loop
//   <div class="qloop" data-qloop data-run="10"></div>                           10-question run (quiz.html)
//   <button data-qloop-open>                                                    opens the loop in a sheet
// What a reader has answered is kept in localStorage, only in their browser.
(()=>{
 const holders=[...document.querySelectorAll('[data-qloop]')];
 const openers=[...document.querySelectorAll('[data-qloop-open]')];
 if(!holders.length&&!openers.length)return;
 const root=document.documentElement.dataset.root||'';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const store={
  get(k,d){try{const v=localStorage.getItem('mouton.'+k);return v?JSON.parse(v):d;}catch{return d;}},
  set(k,v){try{localStorage.setItem('mouton.'+k,JSON.stringify(v));}catch{}},
 };
 const track=(name,params)=>{if(typeof window.gtag==='function')window.gtag('event',name,params);};
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let bank=null;
 // Days in a row with at least one answer, counting today or yesterday as the latest.
 const dayStreak=()=>{
  const days=new Set(store.get('days',[]));
  const d=new Date();if(!days.has(d.toLocaleDateString('sv')))d.setDate(d.getDate()-1);
  let n=0;while(days.has(d.toLocaleDateString('sv'))){n++;d.setDate(d.getDate()-1);}
  return n;
 };
 const load=()=>bank||(bank=fetch(root+'quizzes.json').then(r=>r.json()));

 // Pick a question: unanswered first, preferred articles first, never the current article.
 function pick(list,{exclude=[],prefer=[],skip=new Set()}){
  const answered=new Set(Object.keys(store.get('answered',{})));
  const pool=list.filter(q=>!exclude.includes(q.slug)&&!skip.has(q.id));
  const fresh=pool.filter(q=>!answered.has(q.id));
  const from=fresh.length?fresh:pool;
  const pref=from.filter(q=>prefer.includes(q.slug));
  const src=pref.length?pref:from;
  return src[Math.floor(Math.random()*src.length)];
 }

 function mount(el){
  const exclude=(el.dataset.exclude||'').split(',').filter(Boolean);
  const prefer=(el.dataset.prefer||'').split(',').filter(Boolean);
  const run=+el.dataset.run||0;
  const compact=el.hasAttribute('data-compact');
  const seen=new Set();
  let score=0,count=0,streak=0;
  const wrong=[];
  el.innerHTML='<p class="qloop-loading">…</p>';
  load().then(list=>{
   const total=list.length;
   const show=()=>{
    const q=pick(list,{exclude,prefer,skip:seen});
    if(!q)return;
    seen.add(q.id);count++;
    const answered=store.get('answered',{});
    const done=Object.keys(answered).length;
    el.innerHTML=
     `<div class="qloop-top"><span class="qloop-label">${run?`Q${count} / ${run}`:'QUIZ'}</span>`
     +(streak>1?`<span class="qloop-streak">${streak}問連続正解</span>`:'')
     +(dayStreak()>1?`<span class="qloop-streak">${dayStreak()}日連続</span>`:'')
     +`<span class="qloop-count">${run?`正解 ${score}`:`解いた問題 ${done} / ${total}`}</span></div>`
     +`<p class="qloop-q">${esc(q.q)}</p>`
     +`<div class="qloop-choices" role="group" aria-label="答えを選ぶ"><button type="button" class="qloop-choice" data-v="1" aria-label="○（正しい）">○</button><button type="button" class="qloop-choice" data-v="0" aria-label="×（まちがい）">×</button></div>`
     +`<div class="qloop-result" aria-live="polite"></div>`;
    el.querySelectorAll('.qloop-choice').forEach(b=>b.addEventListener('click',()=>answer(q,b)));
   };
   const answer=(q,btn)=>{
    const right=(btn.dataset.v==='1')===q.a;
    el.querySelectorAll('.qloop-choice').forEach(b=>{
     b.disabled=true;
     if((b.dataset.v==='1')===q.a)b.classList.add('is-answer');
    });
    btn.classList.add(right?'is-right':'is-wrong');
    el.closest('.scene-hero')?.classList.add('is-quizzing');
    if(right){score++;streak++;}else{streak=0;wrong.push(q);}
    const answered=store.get('answered',{});answered[q.id]=right?1:0;store.set('answered',answered);
    const today=new Date().toLocaleDateString('sv');
    const days=store.get('days',[]);if(days[days.length-1]!==today){days.push(today);store.set('days',days.slice(-60));}
    const best=store.get('bestStreak',0);
    const newBest=right&&streak>best&&streak>1;
    if(newBest)store.set('bestStreak',streak);
    track('quiz_answer',{correct:right,article:q.slug,where:run?'challenge':location.pathname});
    const last=run&&count>=run;
    el.querySelector('.qloop-result').innerHTML=
     `<p class="qloop-verdict ${right?'is-right':'is-wrong'}">${right?'正解':'ざんねん'}${right&&streak>1?`<span class="qloop-pop">${streak}問連続${newBest?'・自己ベスト':''}</span>`:''}</p>`
     +`<p class="qloop-head">${esc(q.head)}</p>${compact?'':`<p class="qloop-why">${esc(q.why)}</p>`}`
     +`<div class="qloop-actions">`
     +(last?`<button type="button" class="qloop-next">結果を見る <span aria-hidden="true">→</span></button>`:`<button type="button" class="qloop-next">次の問題 <span aria-hidden="true">→</span></button>`)
     +(compact?`<a class="qloop-read" href="${root}${q.slug}.html">理由を記事で読む <span aria-hidden="true">→</span></a></div>`:`<a class="qloop-read" href="${root}${q.slug}.html">「${esc(q.title)}」を読む</a></div>`);
    const next=el.querySelector('.qloop-next');
    next.addEventListener('click',()=>{track('quiz_next',{where:run?'challenge':location.pathname});last?finish():show();});
    el.querySelector('.qloop-read').addEventListener('click',()=>track('quiz_read',{article:q.slug,where:run?'challenge':location.pathname}));
    if(!reduce)el.querySelector('.qloop-result').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});
    next.focus({preventScroll:true});
   };
   const finish=()=>{
    const url='https://moutonarchive.com/quiz.html';
    const text=`ムートンの○×クイズ、${run}問中${score}問正解でした。`;
    const share=`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    const msg=score===run?'全問正解。':score>=run*.7?'かなり詳しい。':score>=run*.4?'半分くらい。意外な答えがあったはず。':'意外な答えが多かったはず。';
    track('quiz_finish',{score,run});
    el.innerHTML=`<span class="qloop-label">RESULT</span><p class="qloop-score"><b>${score}</b> / ${run}</p><p class="qloop-msg">${msg}</p>`
     +`<div class="qloop-actions"><button type="button" class="qloop-next qloop-again">もう一度 <span aria-hidden="true">→</span></button><a class="qloop-read" href="${share}" target="_blank" rel="noopener noreferrer">結果を X でシェア <span aria-hidden="true">↗</span></a></div>`
     +(wrong.length?`<div class="qloop-review"><p>まちがえた問題の答えは、ここに書いてある。</p><ul>${[...new Map(wrong.map(q=>[q.slug,q])).values()].map(q=>`<li><a href="${root}${q.slug}.html">${esc(q.title)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul></div>`:'');
    el.querySelector('.qloop-again').addEventListener('click',()=>{score=0;count=0;streak=0;wrong.length=0;show();});
   };
   show();
  }).catch(()=>{el.innerHTML='<p class="qloop-loading">クイズを読み込めませんでした。</p>';});
 }
 holders.forEach(mount);

 // Sheet: one loop in a dialog, opened from a button anywhere on the page.
 if(openers.length){
  const dlg=document.createElement('dialog');
  dlg.className='qloop-sheet';
  dlg.innerHTML='<div class="qloop-sheet-bar"><p>○×クイズ</p><button type="button" class="qloop-close" aria-label="閉じる">×</button></div><div class="qloop" data-exclude=""></div>';
  document.body.appendChild(dlg);
  let mounted=false;
  dlg.querySelector('.qloop-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  openers.forEach(b=>b.addEventListener('click',()=>{
   if(!mounted){mount(dlg.querySelector('.qloop'));mounted=true;}
   dlg.showModal();track('quiz_sheet_open',{where:location.pathname});
  }));
 }
})();
