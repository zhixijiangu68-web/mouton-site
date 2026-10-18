import test from "node:test";
import assert from "node:assert/strict";
import handler,{verifyStripeSignature,signToken,verifyToken,validPaidSession,parseProducts,productByLink,handleWebhook,handleDownload} from "../src/index.js";
const key="test-signing-key-much-longer-than-thirty-two-characters";
const now=Math.floor(Date.now()/1000),sid="cs_test_order_123";
async function signature(raw,secret,ts=now){
 const e=new TextEncoder(),k=await crypto.subtle.importKey("raw",e.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const b=new Uint8Array(await crypto.subtle.sign("HMAC",k,e.encode(String(ts)+"."+raw)));
 return "t="+ts+",v1="+[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
}

// ---- 商品カタログ（テスト用）----
const KIERKEGAARD={id:"philosophy_kierkegaard",paymentLinkId:"plink_kierkegaard",priceId:"price_kierkegaard",amountJPY:2980,objectKey:"mouton-philosophy-01-kierkegaard.pdf",title:"決められないのは、考えが足りないからではない。",pages:21,filename:"mouton-philosophy-01-kierkegaard.pdf"};
const NIETZSCHE={id:"philosophy_nietzsche",paymentLinkId:"plink_nietzsche",priceId:"price_nietzsche",amountJPY:2980,objectKey:"mouton-philosophy-02-nietzsche.pdf",title:"人の目が気になるのは、弱いからではない。",pages:21,filename:"mouton-philosophy-02-nietzsche.pdf"};
const CLEAN={id:"clean_science",paymentLinkId:"plink_clean",priceId:"price_clean",amountJPY:2980,objectKey:"clean-science-2026-10-75p.pdf",title:"清潔感の科学",pages:75,filename:"mouton-clean-science.pdf"};
const PRODUCTS=[KIERKEGAARD,NIETZSCHE,CLEAN];

// ---- D1 のメモリ版（orders 表を session_id で持つ）----
function memoryDB(opts={}){
 const rows=new Map();
 const db={prepare(sql){return {bind(...args){return {
  async first(){
   if(opts.failOn&&sql.includes(opts.failOn))throw Error("d1 failure");
   if(sql.startsWith("SELECT"))return rows.get(args[0])?{...rows.get(args[0])}:null;
   throw Error("unexpected first: "+sql);
  },
  async run(){
   if(opts.failOn&&sql.includes(opts.failOn))throw Error("d1 failure");
   if(sql.startsWith("INSERT OR IGNORE INTO orders")){
    const [session_id,payment_intent_id,email,product_id,expires_at,created_at,updated_at]=args;
    if(rows.has(session_id))return {meta:{changes:0}};
    rows.set(session_id,{session_id,payment_intent_id,email,product_id,status:"pending",expires_at,downloads:0,send_claimed_at:0,created_at,updated_at});
    return {meta:{changes:1}};
   }
   if(sql.includes("SET status='sending'")){
    const [claimed,updated,session_id,stale]=args,r=rows.get(session_id);
    if(!r||!(["pending","failed"].includes(r.status)||(r.status==="sending"&&r.send_claimed_at<stale)))return {meta:{changes:0}};
    Object.assign(r,{status:"sending",send_claimed_at:claimed,updated_at:updated});return {meta:{changes:1}};
   }
   if(sql.includes("SET status='sent'")||sql.includes("SET status='failed'")){
    const to=sql.includes("'sent'")?"sent":"failed",[updated,session_id]=args,r=rows.get(session_id);
    if(!r||r.status!=="sending")return {meta:{changes:0}};
    Object.assign(r,{status:to,updated_at:updated});return {meta:{changes:1}};
   }
   if(sql.includes("SET status='revoked'")){
    const [updated,pi]=args;let n=0;
    for(const r of rows.values())if(r.payment_intent_id===pi){Object.assign(r,{status:"revoked",updated_at:updated});n++;}
    return {meta:{changes:n}};
   }
   if(sql.includes("downloads=downloads+1")){
    const [updated,session_id,t]=args,r=rows.get(session_id);
    if(!r||r.status!=="sent"||!(r.expires_at>t)||r.downloads>=5)return {meta:{changes:0}};
    r.downloads++;r.updated_at=updated;return {meta:{changes:1}};
   }
   throw Error("unexpected run: "+sql);
  }
 }}}}};
 return {db,rows};
}

// ---- fetch の差し替え（Stripe と Resend）----
function withFetch(impl,fn){
 const original=globalThis.fetch;globalThis.fetch=impl;
 return Promise.resolve().then(fn).finally(()=>{globalThis.fetch=original;});
}
function stripeAndResend({priceId="price_kierkegaard",amount=2980,stripeStatus=200,resendStatus=200}={}){
 const calls=[];
 const impl=async(url,init={})=>{
  calls.push({url:String(url),init});
  if(String(url).includes("/line_items")){
   if(stripeStatus!==200)return new Response("{}",{status:stripeStatus});
   return new Response(JSON.stringify({data:[{price:{id:priceId},quantity:1,amount_total:amount,currency:"jpy"}],has_more:false}),{status:200});
  }
  if(String(url).includes("api.resend.com/emails")){
   if(resendStatus!==200)return new Response("{}",{status:resendStatus});
   return new Response(JSON.stringify({id:"em_1"}),{status:200});
  }
  throw Error("unexpected fetch: "+url);
 };
 return {impl,calls};
}
function baseEnv(db,extra={}){
 return {ORDERS:db,PRIVATE_PDFS:{get:async()=>({body:new Blob(["%PDF-1.7 mock"])})},STRIPE_WEBHOOK_SECRET:"whsec_test",STRIPE_SECRET_KEY:"sk_test",
  DOWNLOAD_SIGNING_SECRET:key,RESEND_API_KEY:"re_test",FROM_EMAIL:"sender@example.com",PUBLIC_BASE_URL:"https://example.workers.dev",PRODUCTS:JSON.stringify(PRODUCTS),...extra};
}
function session(patch={}){
 return {id:sid,payment_intent:"pi_valid",customer_details:{email:"buyer@example.com"},mode:"payment",payment_status:"paid",amount_total:2980,currency:"jpy",payment_link:"plink_kierkegaard",...patch};
}
async function webhook(env,event,secret="whsec_test"){
 const raw=JSON.stringify(event);
 const req=new Request("https://example.workers.dev/stripe/webhook",{method:"POST",headers:{"stripe-signature":await signature(raw,secret)},body:raw});
 return handleWebhook(req,env);
}
const completed=(s=session())=>({id:"evt_1",type:"checkout.session.completed",data:{object:s}});

test("valid Stripe HMAC and replay window",async()=>{
 const raw=JSON.stringify({id:"evt_1",type:"test"});
 const sig=await signature(raw,"whsec_test");
 assert.equal(await verifyStripeSignature(raw,sig,"whsec_test",now),true);
 assert.equal(await verifyStripeSignature(raw+"a",sig,"whsec_test",now),false);
 assert.equal(await verifyStripeSignature(raw,sig,"whsec_no",now),false);
 assert.equal(await verifyStripeSignature(raw,await signature(raw,"whsec_test",now-301),"whsec_test",now),false);
 assert.equal(await verifyStripeSignature(raw,"wrong","whsec_test",now),false);
});

test("product catalog: JSON string or object, legacy single-product fallback, and rejects bad shapes",()=>{
 assert.equal(parseProducts({PRODUCTS:JSON.stringify(PRODUCTS)}).size,3);
 assert.equal(parseProducts({PRODUCTS:PRODUCTS}).size,3);
 const legacy=parseProducts({STRIPE_PRICE_ID:"price_legacy",STRIPE_PAYMENT_LINK_ID:"plink_legacy",PDF_OBJECT_KEY:"clean-science-2026-10-75p.pdf"});
 assert.equal(legacy.size,1);
 assert.deepEqual(legacy.get("clean_science").objectKey,"clean-science-2026-10-75p.pdf");
 assert.throws(()=>parseProducts({}),/no products/);
 assert.throws(()=>parseProducts({PRODUCTS:"[]"}),/no products/);
 assert.throws(()=>parseProducts({PRODUCTS:[KIERKEGAARD,{...NIETZSCHE,paymentLinkId:"plink_kierkegaard"}]}),/duplicate/);
 assert.throws(()=>parseProducts({PRODUCTS:[KIERKEGAARD,{...NIETZSCHE,priceId:"price_kierkegaard"}]}),/duplicate/);
 assert.throws(()=>parseProducts({PRODUCTS:[KIERKEGAARD,{...NIETZSCHE,id:"philosophy_kierkegaard"}]}),/duplicate/);
 for(const bad of [{paymentLinkId:"price_x"},{priceId:"plink_x"},{amountJPY:0},{amountJPY:"2980"},{objectKey:"../secret.pdf"},{objectKey:"dir/file.pdf"},{filename:"日本語.pdf"},{title:""},{pages:0},{id:"Bad-Id"}]){
  assert.throws(()=>parseProducts({PRODUCTS:[{...KIERKEGAARD,...bad}]}),/invalid product/);
 }
 assert.equal(productByLink(parseProducts({PRODUCTS}),"plink_nietzsche").id,"philosophy_nietzsche");
 assert.equal(productByLink(parseProducts({PRODUCTS}),"plink_unknown"),null);
});

test("paid session filters wrong link, currency, total, payment state and another product's link",()=>{
 const s=session();
 assert.equal(validPaidSession(s,KIERKEGAARD),true);
 assert.equal(validPaidSession(s,NIETZSCHE),false);
 for(const patch of [{payment_link:"plink_wrong"},{currency:"usd"},{amount_total:1980},{amount_total:980},{payment_status:"unpaid"},{customer_details:{email:"bad"}}]){
  assert.equal(validPaidSession({...s,...patch},KIERKEGAARD),false);
 }
});

test("signed download token expires and cannot be tampered with",async()=>{
 const t=await signToken(sid,now+70,key);
 assert.deepEqual(await verifyToken(t,key,now),{sid,exp:now+70});
 assert.equal(await verifyToken(t+"a",key,now),null);
 assert.equal(await verifyToken(t,"wrong",now),null);
 assert.equal(await verifyToken(t,key,now+71),null);
});

test("webhook cannot process unsigned events, and non-configured handler is unhealthy",async()=>{
 const env=baseEnv(memoryDB().db);
 const req=new Request("https://example.workers.dev/stripe/webhook",{method:"POST",headers:{"stripe-signature":"fake"},body:'{"type":"checkout.session.completed"}'});
 assert.equal((await handleWebhook(req,env)).status,400);
 assert.equal((await handler.fetch(new Request("https://example.workers.dev/health"),{})).status,503);
 assert.equal((await handler.fetch(new Request("https://example.workers.dev/health"),env)).status,200);
 assert.equal((await handler.fetch(new Request("https://example.workers.dev/health"),{...env,PRODUCTS:"[]"})).status,503);
 assert.equal((await handler.fetch(new Request("https://example.workers.dev/health"),{...env,PRODUCTS:JSON.stringify([{...KIERKEGAARD,objectKey:"../x"}])})).status,503);
});

test("delivers the product that matches the Payment Link, records product_id, emails the buyer",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db),f=stripeAndResend();
 const res=await withFetch(f.impl,()=>webhook(env,completed()));
 assert.equal(res.status,200);assert.equal(await res.text(),"delivered");
 const row=rows.get(sid);
 assert.equal(row.status,"sent");assert.equal(row.product_id,"philosophy_kierkegaard");assert.equal(row.email,"buyer@example.com");
 assert.equal(f.calls.length,2);
 assert.ok(f.calls[0].url.includes("/checkout/sessions/"+sid+"/line_items"));
 const mail=JSON.parse(f.calls[1].init.body);
 assert.deepEqual(mail.to,["buyer@example.com"]);
 assert.ok(mail.subject.includes(KIERKEGAARD.title));
 assert.ok(mail.text.includes("/download/"));
 assert.ok(mail.text.includes("21ページ"));
 assert.equal(f.calls[1].init.headers["Idempotency-Key"],"mouton-philosophy_kierkegaard-"+sid);
});

test("a second product uses its own price, title and key; unknown link is rejected",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db),f=stripeAndResend({priceId:"price_nietzsche"});
 const res=await withFetch(f.impl,()=>webhook(env,completed(session({payment_link:"plink_nietzsche"}))));
 assert.equal(await res.text(),"delivered");
 assert.equal(rows.get(sid).product_id,"philosophy_nietzsche");
 assert.ok(JSON.parse(f.calls[1].init.body).subject.includes(NIETZSCHE.title));
 const other=await withFetch(f.impl,()=>webhook(env,completed(session({id:"cs_other",payment_link:"plink_unknown"}))));
 assert.equal(other.status,422);
 assert.equal(rows.has("cs_other"),false);
});

test("Stripe 401 or a line item of another product → 503 retry, nothing written",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db);
 const r1=await withFetch(stripeAndResend({stripeStatus:401}).impl,()=>webhook(env,completed()));
 assert.equal(r1.status,503);assert.equal(await r1.text(),"retry");
 const r2=await withFetch(stripeAndResend({priceId:"price_nietzsche"}).impl,()=>webhook(env,completed()));
 assert.equal(r2.status,503);assert.equal(await r2.text(),"retry");
 assert.equal(rows.size,0);
});

test("D1 insert failure → 503 retry",async()=>{
 const {db}=memoryDB({failOn:"INSERT"}),env=baseEnv(db);
 const r=await withFetch(stripeAndResend().impl,()=>webhook(env,completed()));
 assert.equal(r.status,503);assert.equal(await r.text(),"retry");
});

test("Resend failure marks failed and a later redelivery succeeds",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db);
 const r1=await withFetch(stripeAndResend({resendStatus:500}).impl,()=>webhook(env,completed()));
 assert.equal(r1.status,503);assert.equal(await r1.text(),"delivery failed; retry");
 assert.equal(rows.get(sid).status,"failed");
 const r2=await withFetch(stripeAndResend().impl,()=>webhook(env,completed()));
 assert.equal(await r2.text(),"delivered");
 assert.equal(rows.get(sid).status,"sent");
});

test("redelivery of a sent order does not email twice; in-progress claims are respected",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db),f=stripeAndResend();
 await withFetch(f.impl,()=>webhook(env,completed()));
 const again=await withFetch(f.impl,()=>webhook(env,completed()));
 assert.equal(await again.text(),"already delivered");
 assert.equal(f.calls.filter(c=>c.url.includes("resend")).length,1);
 rows.get(sid).status="sending";rows.get(sid).send_claimed_at=now;
 assert.equal(await (await withFetch(f.impl,()=>webhook(env,completed()))).text(),"in progress");
 rows.get(sid).send_claimed_at=now-1000;
 assert.equal(await (await withFetch(f.impl,()=>webhook(env,completed()))).text(),"delivered");
});

test("full refund revokes the order and the download stops; partial refund is ignored",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db);
 await withFetch(stripeAndResend().impl,()=>webhook(env,completed()));
 const token=await signToken(sid,rows.get(sid).expires_at,key);
 assert.equal((await handleDownload(token,env)).status,200);
 const partial=await webhook(env,{id:"evt_r0",type:"charge.refunded",data:{object:{refunded:false,payment_intent:"pi_valid"}}});
 assert.equal(await partial.text(),"ignored");assert.equal(rows.get(sid).status,"sent");
 const full=await webhook(env,{id:"evt_r1",type:"charge.refunded",data:{object:{refunded:true,payment_intent:"pi_valid"}}});
 assert.equal(await full.text(),"ignored");assert.equal(rows.get(sid).status,"revoked");
 assert.equal((await handleDownload(token,env)).status,403);
});

test("download serves the file of the order's product, counts to 5, and refuses an unconfigured product",async()=>{
 const {db,rows}=memoryDB(),env=baseEnv(db);
 const gets=[];env.PRIVATE_PDFS={get:async(k)=>{gets.push(k);return {body:new Blob(["%PDF-1.7 mock"])}}};
 await withFetch(stripeAndResend({priceId:"price_nietzsche"}).impl,()=>webhook(env,completed(session({payment_link:"plink_nietzsche"}))));
 const token=await signToken(sid,rows.get(sid).expires_at,key);
 const file=await handleDownload(token,env);
 assert.equal(file.status,200);
 assert.equal(file.headers.get("Content-Type"),"application/pdf");
 assert.equal(file.headers.get("Content-Disposition"),'attachment; filename="mouton-philosophy-02-nietzsche.pdf"');
 assert.deepEqual(gets,["mouton-philosophy-02-nietzsche.pdf"]);
 for(let i=0;i<4;i++)assert.equal((await handleDownload(token,env)).status,200);
 assert.equal((await handleDownload(token,env)).status,403);
 assert.equal((await handleDownload(token+"x",env)).status,403);
 rows.get(sid).downloads=0;
 const r=await handleDownload(token,{...env,PRODUCTS:JSON.stringify([KIERKEGAARD])});
 assert.equal(r.status,503);assert.equal(await r.text(),"product not configured");
 assert.equal(gets.length,5);
});

test("rows written before the migration (no product_id) still download the legacy product",async()=>{
 const {db,rows}=memoryDB(),expiry=now+70;
 rows.set(sid,{session_id:sid,payment_intent_id:"pi_old",email:"old@example.com",product_id:undefined,status:"sent",expires_at:expiry,downloads:0,send_claimed_at:0,created_at:now,updated_at:now});
 const gets=[];
 const env={ORDERS:db,PRIVATE_PDFS:{get:async(k)=>{gets.push(k);return {body:new Blob(["%PDF-1.7 mock"])}}},DOWNLOAD_SIGNING_SECRET:key,PRODUCTS:JSON.stringify(PRODUCTS)};
 const token=await signToken(sid,expiry,key);
 assert.equal((await handleDownload(token,env)).status,200);
 assert.deepEqual(gets,["clean-science-2026-10-75p.pdf"]);
});
