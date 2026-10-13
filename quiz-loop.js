'use strict';
// ○× quiz loop. Questions come from quizzes.json (built from src/_data/quizzes.json).
//   <div class="qloop" data-qloop data-exclude="slug" data-prefer="a,b"></div>  inline loop
//   <div class="qloop" data-qloop data-run="10"></div>                           10-question run (quiz.html)
//   <button data-qloop-open>                                                    opens the loop in a sheet
// English pages (/en/) use en/quizzes.json and English labels.
// What a reader has answered is kept in localStorage, only in their browser.
(()=>{
 const holders=[...document.querySelectorAll('[data-qloop]')];
 const openers=[...document.querySelectorAll('[data-qloop-open]')];
 if(!holders.length&&!openers.length)return;
 const root=document.documentElement.dataset.root||'';
 const en=document.documentElement.lang==='en';
 // English pages sit in en/, next to their articles and en/quizzes.json.
 const base=en?'':root;
 const T=en?{
  choose:'Your answer',o:'True',x:'False',inRow:n=>`${n} in a row`,days:n=>`${n} days in a row`,solved:(d,t)=>`Answered ${d} / ${t}`,score:n=>`Correct ${n}`,
  right:'Correct',wrongV:'Not quite',best:' · personal best',next:'Next question',result:'See result',read:t=>`Read "${t}"`,why:'Why? Read the article',
  again:'Try again',combo:n=>`${n} in a row!`,recent:(r,t)=>`Last ${t}: ${r} right`,share:'Share your score on X',review:'The answers to the ones you missed are here.',fail:'Could not load the quiz.',title:'True or false',close:'Close',
  shareText:(s,r)=>`I got ${s} out of ${r} on Mouton's true-or-false quiz.`,shareUrl:'https://moutonarchive.com/en/quiz.html',
  msg:(s,r)=>s===r?'A perfect score.':s>=r*.7?'You know your stuff.':s>=r*.4?'About half. Some answers probably surprised you.':'A lot of surprising answers, probably.',
 }:{
  choose:'答えを選ぶ',o:'○（正しい）',x:'×（まちがい）',inRow:n=>`${n}問連続正解`,days:n=>`${n}日連続`,solved:(d,t)=>`解いた問題 ${d} / ${t}`,score:n=>`正解 ${n}`,
  right:'正解',wrongV:'ざんねん',best:'・自己ベスト',next:'次の問題',result:'結果を見る',read:t=>`「${t}」を読む`,why:'理由を記事で読む',
  again:'もう一度',combo:n=>`${n}連続正解！`,recent:(r,t)=>`直近${t}問で${r}問正解`,share:'結果を X でシェア',review:'まちがえた問題の答えは、ここに書いてある。',fail:'クイズを読み込めませんでした。',title:'○×クイズ',close:'閉じる',
  shareText:(s,r)=>`ムートンの○×クイズ、${r}問中${s}問正解でした。`,shareUrl:'https://moutonarchive.com/quiz.html',
  msg:(s,r)=>s===r?'全問正解。':s>=r*.7?'かなり詳しい。':s>=r*.4?'半分くらい。意外な答えがあったはず。':'意外な答えが多かったはず。',
 };
 const K=k=>en?k+'En':k;
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
 // Only well-formed questions are used, so a bad entry can't break the page or inject a link.
 const SLUG=/^[a-z0-9-]+$/;
 const valid=q=>q&&typeof q.q==='string'&&typeof q.a==='boolean'&&SLUG.test(q.slug)&&q.id!=null;
 // One retry on a failed request; a failure is not cached, so the next open tries again.
 const get=url=>fetch(url,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});
 const load=()=>bank||(bank=get(base+'quizzes.json').catch(()=>new Promise(ok=>setTimeout(ok,800)).then(()=>get(base+'quizzes.json')))
  .then(list=>{const ok=Array.isArray(list)?list.filter(valid):[];if(!ok.length)throw new Error('empty');return ok;})
  .catch(e=>{bank=null;throw e;}));

 // Pick a question: unanswered first, preferred articles first, never the current article.
 function pick(list,{exclude=[],prefer=[],skip=new Set()}){
  const answered=new Set(Object.keys(store.get(K('answered'),{})));
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
  // The last 10 answers in this loop, shown as dots (green = right, red = wrong).
  const hist=[];
  const dots=()=>hist.length?`<span class="qloop-dots" aria-label="${T.recent(hist.filter(Boolean).length,hist.length)}">${hist.map(r=>`<i class="${r?'r':'w'}"></i>`).join('')}</span>`:'';
  el.innerHTML='<p class="qloop-loading">…</p>';
  load().then(list=>{
   const total=list.length;
   const show=()=>{
    let q=pick(list,{exclude,prefer,skip:seen});
    // Every question has been shown in this loop: start the round over.
    if(!q){seen.clear();q=pick(list,{exclude,prefer,skip:seen});}
    if(!q){el.innerHTML=`<p class="qloop-loading">${T.fail}</p>`;return;}
    seen.add(q.id);count++;
    const done=Object.keys(store.get(K('answered'),{})).length;
    el.innerHTML=
     `<div class="qloop-top"><span class="qloop-label">${run?`Q${count} / ${run}`:'QUIZ'}</span>`
     +(streak>1?`<span class="qloop-streak">${T.inRow(streak)}</span>`:'')
     +(dayStreak()>1?`<span class="qloop-streak">${T.days(dayStreak())}</span>`:'')
     +`<span class="qloop-count">${run?T.score(score):T.solved(done,total)}</span>${dots()}</div>`
     +`<p class="qloop-q">${esc(q.q)}</p>`
     +`<div class="qloop-choices" role="group" aria-label="${T.choose}"><button type="button" class="qloop-choice" data-v="1" aria-label="${T.o}">○</button><button type="button" class="qloop-choice" data-v="0" aria-label="${T.x}">×</button></div>`
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
    // A short buzz on phones that support it (not on reduced motion).
    if(!reduce&&navigator.vibrate)try{navigator.vibrate(right?12:[8,50,8]);}catch{}
    if(right){score++;streak++;}else{streak=0;wrong.push(q);}
    hist.push(right);if(hist.length>10)hist.shift();
    // A big stamp over the card, and a burst at 3, 5, 10 in a row.
    el.classList.add('qloop-host');
    const stamp=document.createElement('span');
    stamp.className=`qloop-stamp ${right?'is-right':'is-wrong'}`;stamp.setAttribute('aria-hidden','true');
    stamp.textContent=right?'○':'×';
    el.appendChild(stamp);setTimeout(()=>stamp.remove(),reduce?0:900);
    el.classList.toggle('is-hot',streak>=3);
    if(!reduce&&right&&[3,5,10,20].includes(streak)){
     const burst=document.createElement('span');burst.className='qloop-burst';burst.setAttribute('aria-hidden','true');
     burst.innerHTML=Array.from({length:14},(_,i)=>`<i style="--a:${i*360/14}deg;--d:${60+Math.random()*50}px"></i>`).join('')+`<b>${T.combo(streak)}</b>`;
     el.appendChild(burst);setTimeout(()=>burst.remove(),1300);
    }
    const answered=store.get(K('answered'),{});answered[q.id]=right?1:0;store.set(K('answered'),answered);
    const today=new Date().toLocaleDateString('sv');
    const days=store.get('days',[]);if(days[days.length-1]!==today){days.push(today);store.set('days',days.slice(-60));}
    const best=store.get(K('bestStreak'),0);
    const newBest=right&&streak>best&&streak>1;
    if(newBest)store.set(K('bestStreak'),streak);
    track('quiz_answer',{correct:right,article:q.slug,where:run?'challenge':location.pathname});
    const last=run&&count>=run;
    el.querySelector('.qloop-result').innerHTML=
     `<p class="qloop-verdict ${right?'is-right':'is-wrong'}">${right?T.right:T.wrongV}${right&&streak>1?`<span class="qloop-pop">${T.inRow(streak)}${newBest?T.best:''}</span>`:''}</p>`
     +`<p class="qloop-head">${esc(q.head||'')}</p>${compact||!q.why?'':`<p class="qloop-why">${esc(q.why)}</p>`}`
     +`<div class="qloop-actions">`
     +`<button type="button" class="qloop-next">${last?T.result:T.next} <span aria-hidden="true">→</span></button>`
     +(compact?`<a class="qloop-read" href="${base}${q.slug}.html">${T.why} <span aria-hidden="true">→</span></a></div>`:`<a class="qloop-read" href="${base}${q.slug}.html">${esc(T.read(q.title||q.slug))}</a></div>`);
    const next=el.querySelector('.qloop-next');
    next.addEventListener('click',()=>{track('quiz_next',{where:run?'challenge':location.pathname});last?finish():show();});
    el.querySelector('.qloop-read').addEventListener('click',()=>track('quiz_read',{article:q.slug,where:run?'challenge':location.pathname}));
    if(!reduce)el.querySelector('.qloop-result').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});
    next.focus({preventScroll:true});
   };
   const finish=()=>{
    const share=`https://x.com/intent/post?text=${encodeURIComponent(T.shareText(score,run))}&url=${encodeURIComponent(T.shareUrl)}`;
    const msg=T.msg(score,run);
    track('quiz_finish',{score,run});
    el.innerHTML=`<span class="qloop-label">RESULT</span><p class="qloop-score"><b>${score}</b> / ${run}</p><p class="qloop-msg">${msg}</p>`
     +`<div class="qloop-actions"><button type="button" class="qloop-next qloop-again">${T.again} <span aria-hidden="true">→</span></button><a class="qloop-read" href="${share}" target="_blank" rel="noopener noreferrer">${T.share} <span aria-hidden="true">↗</span></a></div>`
     +(wrong.length?`<div class="qloop-review"><p>${T.review}</p><ul>${[...new Map(wrong.map(q=>[q.slug,q])).values()].map(q=>`<li><a href="${base}${q.slug}.html">${esc(q.title||q.slug)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul></div>`:'');
    el.querySelector('.qloop-again').addEventListener('click',()=>{score=0;count=0;streak=0;wrong.length=0;show();});
   };
   show();
  }).catch(()=>{el.innerHTML=`<p class="qloop-loading">${T.fail}</p>`;});
 }
 holders.forEach(mount);

 // Sheet: one loop in a dialog, opened from a button anywhere on the page.
 if(openers.length){
  const dlg=document.createElement('dialog');
  dlg.className='qloop-sheet';
  dlg.innerHTML=`<div class="qloop-sheet-bar"><p>${T.title}</p><button type="button" class="qloop-close" aria-label="${T.close}">×</button></div><div class="qloop" data-exclude=""></div>`;
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
