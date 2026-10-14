import test from "node:test";
import assert from "node:assert/strict";
import handler,{verifyStripeSignature,signToken,verifyToken,validPaidSession,handleWebhook,handleDownload} from "../src/index.js";
const key="test-signing-key-much-longer-than-thirty-two-characters";
const now=Math.floor(Date.now()/1000),sid="cs_test_order_123";
async function signature(raw,secret,ts=now){
 const e=new TextEncoder(),k=await crypto.subtle.importKey("raw",e.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const b=new Uint8Array(await crypto.subtle.sign("HMAC",k,e.encode(String(ts)+"."+raw)));
 return "t="+ts+",v1="+[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
}
test("valid Stripe HMAC and replay window",async()=>{
 const raw=JSON.stringify({id:"evt_1",type:"test"});
 const sig=await signature(raw,"whsec_test");
 assert.equal(await verifyStripeSignature(raw,sig,"whsec_test",now),true);
 assert.equal(await verifyStripeSignature(raw+"a",sig,"whsec_test",now),false);
 assert.equal(await verifyStripeSignature(raw,sig,"whsec_no",now),false);
 assert.equal(await verifyStripeSignature(raw,await signature(raw,"whsec_test",now-301),"whsec_test",now),false);
 assert.equal(await verifyStripeSignature(raw,"wrong","whsec_test",now),false);
});
test("paid session filters wrong link, currency, total, payment state and obsolete 1980 JPY",()=>{
 const s={id:sid,payment_intent:"pi_valid",customer_details:{email:"buyer@example.com"},mode:"payment",payment_status:"paid",amount_total:2980,currency:"jpy",payment_link:"plink_expected"};
 assert.equal(validPaidSession(s,"plink_expected"),true);
 for(const patch of [{payment_link:"plink_wrong"},{currency:"usd"},{amount_total:1980},{amount_total:980},{payment_status:"unpaid"},{customer_details:{email:"bad"}}]){
 assert.equal(validPaidSession({...s,...patch},"plink_expected"),false);
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
 const env={ORDERS:{},PRIVATE_PDFS:{},STRIPE_WEBHOOK_SECRET:"whsec_test",STRIPE_SECRET_KEY:"sk_test",
 STRIPE_PRICE_ID:"price_valid",STRIPE_PAYMENT_LINK_ID:"plink_valid",DOWNLOAD_SIGNING_SECRET:key,RESEND_API_KEY:"re_test",FROM_EMAIL:"sender@example.com",PUBLIC_BASE_URL:"https://example.workers.dev"};
 const req=new Request("https://example.workers.dev/stripe/webhook",{method:"POST",headers:{"stripe-signature":"fake"},body:'{"type":"checkout.session.completed"}'});
 assert.equal((await handleWebhook(req,env)).status,400);
 assert.equal((await handler.fetch(new Request("https://example.workers.dev/health"),{})).status,503);
});
function mockDB(status="sent",initial=0){
 let downloads=initial;const expiry=now+70;
 return {db:{prepare(sql){return {bind(){return {
 async first(){return {status,expires_at:expiry,downloads};},
 async run(){if(sql.includes("downloads=downloads+1")&&status==="sent"&&downloads<5){downloads++;return{meta:{changes:1}}};return{meta:{changes:0}};}
 }}}}},getCount:()=>downloads};
}
test("download requires genuine token, nonrevoked order and an available PDF",async()=>{
 const token=await signToken(sid,now+70,key),d=mockDB("sent");
 const env={ORDERS:d.db,PRIVATE_PDFS:{get:async()=>({body:new Blob(["%PDF-1.7 mock"])})},DOWNLOAD_SIGNING_SECRET:key};
 const file=await handleDownload(token,env);
 assert.equal(file.status,200);
 assert.equal(file.headers.get("Content-Type"),"application/pdf");
 assert.equal(file.headers.get("Cache-Control"),"private, no-store");
 assert.equal(d.getCount(),1);
 assert.equal((await handleDownload(token+"x",env)).status,403);
 for(const state of ["revoked","failed","sending"]){
   assert.equal((await handleDownload(token,{...env,ORDERS:mockDB(state).db})).status,403);
 }
 assert.equal((await handleDownload(token,{...env,ORDERS:mockDB("sent",5).db})).status,403);
 assert.equal((await handleDownload(token,{...env,PRIVATE_PDFS:{get:async()=>null}})).status,503);
});
