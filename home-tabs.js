'use strict';
// Four in-page tabs on the Japanese homepage. Deep links and no-JS content remain usable.
(()=>{
  const home=document.querySelector('[data-home-tabs]');
  if(!home)return;
  const tabList=home.querySelector('[role="tablist"]');
  const tabs=[...home.querySelectorAll('[data-home-tab]')];
  const panels=[...home.querySelectorAll('[data-home-panel]')];
  if(tabs.length!==4||panels.length!==4)return;
  const valid=new Set(tabs.map(t=>t.dataset.homeTab));
  // Each tab points to an anchor inside its own panel; #think remains the cover's topic card.
  const defaultAnchors={reading:'reading',quiz:'today-q',topics:'guides',journal:'journal'};
  const tabForHash=()=>{
    const hash=decodeURIComponent(location.hash.slice(1));
    if(!hash)return null;
    const el=document.getElementById(hash);
    const container=el?.closest('[data-home-panel]');
    return container&&valid.has(container.dataset.homePanel)?container.dataset.homePanel:null;
  };
  function activate(name,{focus=false,updateUrl=false,scroll=false}={}){
    if(!valid.has(name))return;
    for(const tab of tabs){
      const selected=tab.dataset.homeTab===name;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    }
    for(const panel of panels)panel.hidden=panel.dataset.homePanel!==name;
    if(updateUrl){
      const anchor=defaultAnchors[name];
      try{history.replaceState(history.state,'','#'+anchor)}catch{}
    }
    if(focus)tabs.find(t=>t.dataset.homeTab===name)?.focus({preventScroll:true});
    if(scroll)tabList.scrollIntoView({behavior:'auto',block:'start'});
  }
  // Keep existing header, article buttons and bookmarked #section URLs working.
  function openHash(shouldScroll=false){
    const name=tabForHash();
    if(name)activate(name,{scroll:shouldScroll});
  }
  for(const tab of tabs){
    tab.addEventListener('click',()=>activate(tab.dataset.homeTab,{updateUrl:true,scroll:true}));
  }
  tabList.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    const index=tabs.indexOf(document.activeElement);
    if(index<0)return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
      (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    activate(tabs[next].dataset.homeTab,{focus:true,updateUrl:true,scroll:true});
  });
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[href]');
    if(!a)return;
    let url;
    try{url=new URL(a.href,location.href)}catch{return}
    // Same-document links only; preserve native navigation and scrolling.
    if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;
    const id=decodeURIComponent(url.hash.slice(1));
    const target=document.getElementById(id);
    const targetPanel=target?.closest('[data-home-panel]');
    if(targetPanel)activate(targetPanel.dataset.homePanel);
  });
  window.addEventListener('hashchange',()=>openHash(true));
  const initial=tabForHash()||'reading';
  activate(initial);
  if(location.hash&&tabForHash()){
    // The browser may have attempted the anchor before inactive panels were hidden.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'start'});
    }));
  }
})();
