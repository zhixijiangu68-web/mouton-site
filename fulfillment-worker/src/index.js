// Stripe -> Cloudflare Worker -> private R2, never run this on GitHub Pages.
const enc=new TextEncoder(),dec=new TextDecoder(),WEEK=604800;
function response(message,status=200){return new Response(message,{status,headers:{"Cache-Control":"no-store","Content-Type":"text/plain;charset=utf-8","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}})}
async function hmac(secret,data){const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(data)))}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function eq(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function unb64(s){if(!/^[A-Za-z0-9_-]+$/.test(s)||s.length>1024)throw Error("invalid");const a=atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4));return Uint8Array.from(a,c=>c.charCodeAt(0))}
export async function verifyStripeSignature(raw,header,secret,now=Math.floor(Date.now()/1000)){
 if(!secret||!header||raw.length>1048576)return false;
 const parts=header.split(",").map(x=>x.trim()),t=parts.find(x=>x.startsWith("t="))?.slice(2);
 const signatures=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3).toLowerCase());
 if(!t||!/^\d{10,12}$/.test(t)||Math.abs(Number(t)-now)>300||!signatures.length)return false;
 const expected=hex(await hmac(secret,t+"."+raw));return signatures.some(x=>eq(x,expected));
}
export async function signToken(sid,exp,secret){if(!/^cs_[a-zA-Z0-9_]+$/.test(sid)||!Number.isSafeInteger(exp)||!secret)throw Error("invalid");const p=b64(enc.encode(JSON.stringify({sid,exp})));return p+"."+b64(await hmac(secret,p))}
export async function verifyToken(token,secret,now=Math.floor(Date.now()/1000)){
 try{if(!secret||typeof token!=="string")return null;const p=token.split(".");if(p.length!==2||p[0].length>800||!eq(p[1],b64(await hmac(secret,p[0]))))return null;
 const v=JSON.parse(dec.decode(unb64(p[0])));return /^cs_[a-zA-Z0-9_]+$/.test(v.sid)&&Number.isSafeInteger(v.exp)&&v.exp>now?v:null
 }catch{return null}
}
function email(s){const e=s.customer_details?.email||s.customer_email||"";return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)&&e.length<=254?e:null}

// ---- 商品カタログ（PRODUCTS。秘密ではない）----
// 1商品 = {id, paymentLinkId, priceId, amountJPY, objectKey, title, pages, filename}
// Payment Link で商品を見分けるので、Webhook のエンドポイントは1つのまま。
const LEGACY_ID="clean_science";
function legacyProduct(env){
 if(!env.STRIPE_PRICE_ID||!env.STRIPE_PAYMENT_LINK_ID||!env.PDF_OBJECT_KEY)return null;
 return [{id:LEGACY_ID,paymentLinkId:env.STRIPE_PAYMENT_LINK_ID,priceId:env.STRIPE_PRICE_ID,amountJPY:2980,objectKey:env.PDF_OBJECT_KEY,title:"清潔感の科学",pages:75,filename:"mouton-clean-science.pdf"}];
}
function validProduct(p){
 return Boolean(p&&typeof p==="object"
  &&/^[a-z0-9_]{1,40}$/.test(p.id||"")
  &&/^plink_[A-Za-z0-9]+$/.test(p.paymentLinkId||"")
  &&/^price_[A-Za-z0-9]+$/.test(p.priceId||"")
  &&Number.isSafeInteger(p.amountJPY)&&p.amountJPY>0
  &&typeof p.objectKey==="string"&&p.objectKey.length>0&&p.objectKey.length<=200&&!p.objectKey.includes("/")&&!p.objectKey.includes("..")
  &&typeof p.title==="string"&&p.title.trim().length>0&&p.title.length<=80
  &&Number.isSafeInteger(p.pages)&&p.pages>0
  &&/^[A-Za-z0-9._-]{1,80}$/.test(p.filename||""));
}
export function parseProducts(env){
 let list=env.PRODUCTS;
 if(list===undefined||list===null||list==="")list=legacyProduct(env);
 if(typeof list==="string")list=JSON.parse(list);
 if(!Array.isArray(list)||!list.length)throw Error("no products");
 const byId=new Map(),links=new Set(),prices=new Set();
 for(const p of list){
  if(!validProduct(p))throw Error("invalid product");
  if(byId.has(p.id)||links.has(p.paymentLinkId)||prices.has(p.priceId))throw Error("duplicate product");
  byId.set(p.id,p);links.add(p.paymentLinkId);prices.add(p.priceId);
 }
 return byId;
}
export function productByLink(products,link){
 if(typeof link!=="string")return null;
 for(const p of products.values())if(p.paymentLinkId===link)return p;
 return null;
}
export function validPaidSession(s,product){
 return Boolean(s&&product&&/^cs_[a-zA-Z0-9_]+$/.test(s.id||"")&&s.mode==="payment"&&s.payment_status==="paid"&&s.payment_link===product.paymentLinkId&&s.currency==="jpy"&&s.amount_total===product.amountJPY&&typeof s.payment_intent==="string"&&s.payment_intent.startsWith("pi_")&&email(s));
}
async function verifyItems(sid,env,product){
 const url="https://api.stripe.com/v1/checkout/sessions/"+encodeURIComponent(sid)+"/line_items?limit=2";
 const res=await fetch(url,{headers:{Authorization:"Bearer "+env.STRIPE_SECRET_KEY},redirect:"error"});
 if(!res.ok){console.error("mouton_stripe_http_status",res.status);throw Error("Stripe verification failed");}const data=await res.json(),rows=data.data||[];
 if(data.has_more||rows.length!==1||rows[0].price?.id!==product.priceId||rows[0].quantity!==1||rows[0].amount_total!==product.amountJPY||rows[0].currency!=="jpy"){console.error("mouton_stripe_line_items_mismatch");throw Error("wrong item");}
}
function productsOrNull(env){try{return parseProducts(env)}catch{return null}}
function ready(env){
 return Boolean(env.ORDERS&&env.PRIVATE_PDFS&&env.STRIPE_WEBHOOK_SECRET&&env.STRIPE_SECRET_KEY&&env.DOWNLOAD_SIGNING_SECRET?.length>=32&&env.RESEND_API_KEY&&env.FROM_EMAIL&&/^https:\/\/[^/]+\/?$/.test(env.PUBLIC_BASE_URL||"")&&productsOrNull(env));
}
function mailText(product,url){
 return "ご購入ありがとうございます。"+product.title+"（PDF "+product.pages+"ページ）をダウンロードできます。\n"
  +"有効期限7日・最大5回。リンクは共有しないでください。\n"+url+"\n\n"
  +"リンクが開けない、ファイルが届かないときは、https://moutonarchive.com/contact.html からご連絡ください。";
}
async function deliver(session,env){
 let phase="product_lookup";
 try{
 const product=productByLink(parseProducts(env),session.payment_link);
 phase="validate_paid_session";
 if(!product||!validPaidSession(session,product))return response("not matching paid order",422);
 phase="stripe_line_items";
 await verifyItems(session.id,env,product);phase="d1_insert";const now=Math.floor(Date.now()/1000),expires=now+WEEK,recipient=email(session);
 await env.ORDERS.prepare("INSERT OR IGNORE INTO orders(session_id,payment_intent_id,email,product_id,status,expires_at,created_at,updated_at) VALUES (?,?,?,?,'pending',?,?,?)").bind(session.id,session.payment_intent,recipient,product.id,expires,now,now).run();
 phase="d1_read";
 const order=await env.ORDERS.prepare("SELECT status,expires_at,product_id FROM orders WHERE session_id=?").bind(session.id).first();
 if(!order||order.status==="revoked")return response("unavailable",409);
 if(order.status==="sent")return response("already delivered");
 if(order.product_id!==product.id)return response("not matching paid order",422);
 phase="d1_claim";
 const claim=await env.ORDERS.prepare("UPDATE orders SET status='sending',send_claimed_at=?,updated_at=? WHERE session_id=? AND (status IN ('pending','failed') OR (status='sending' AND send_claimed_at<?))").bind(now,now,session.id,now-900).run();
 if(!claim.meta?.changes)return response("in progress");
 try{
   const token=await signToken(session.id,order.expires_at,env.DOWNLOAD_SIGNING_SECRET);
   const url=env.PUBLIC_BASE_URL.replace(/\/$/,"")+"/download/"+token;
   phase="resend_send";
   const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"mouton-"+product.id+"-"+session.id},body:JSON.stringify({from:env.FROM_EMAIL,to:[recipient],subject:"【ムートン】"+product.title+"｜PDFダウンロード",text:mailText(product,url)})});
   if(!result.ok||!(await result.json()).id)throw Error("email not accepted");
   phase="d1_mark_sent";
   await env.ORDERS.prepare("UPDATE orders SET status='sent',updated_at=? WHERE session_id=? AND status='sending'").bind(now,session.id).run();
   return response("delivered");
 }catch{
   console.error("mouton_delivery_failure",{phase});
   await env.ORDERS.prepare("UPDATE orders SET status='failed',updated_at=? WHERE session_id=? AND status='sending'").bind(now,session.id).run();
   return response("delivery failed; retry",503);
 }
 }catch{
   console.error("mouton_delivery_failure",{phase});
   throw Error("delivery processing failed");
 }
}
export async function handleWebhook(req,env){
 if(!ready(env))return response("not configured",503);
 const raw=await req.text();
 if(!(await verifyStripeSignature(raw,req.headers.get("stripe-signature"),env.STRIPE_WEBHOOK_SECRET)))return response("invalid signature",400);
 let event;try{event=JSON.parse(raw)}catch{return response("invalid JSON",400)}
 try{
   if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
     if(event.data?.object?.payment_status!=="paid")return response("waiting");
     return await deliver(event.data.object,env);
   }
   if((event.type==="charge.refunded"&&event.data?.object?.refunded===true)||event.type==="charge.dispute.created"){
     const pi=event.data?.object?.payment_intent;
     if(typeof pi==="string"&&pi.startsWith("pi_"))await env.ORDERS.prepare("UPDATE orders SET status='revoked',updated_at=? WHERE payment_intent_id=?").bind(Math.floor(Date.now()/1000),pi).run();
   }
   return response("ignored");
 }catch{return response("retry",503)}
}
export async function handleDownload(token,env){
 if(!env.ORDERS||!env.PRIVATE_PDFS||!env.DOWNLOAD_SIGNING_SECRET)return response("unavailable",503);
 const now=Math.floor(Date.now()/1000),valid=await verifyToken(token,env.DOWNLOAD_SIGNING_SECRET,now);
 if(!valid)return response("invalid download",403);
 const o=await env.ORDERS.prepare("SELECT status,expires_at,downloads,product_id FROM orders WHERE session_id=?").bind(valid.sid).first();
 if(!o||o.status!=="sent"||o.expires_at!==valid.exp||o.expires_at<=now||o.downloads>=5)return response("not available",403);
 const product=productsOrNull(env)?.get(o.product_id||LEGACY_ID)||null;
 if(!product)return response("product not configured",503);
 const file=await env.PRIVATE_PDFS.get(product.objectKey);
 if(!file)return response("PDF not uploaded",503);
 const done=await env.ORDERS.prepare("UPDATE orders SET downloads=downloads+1,updated_at=? WHERE session_id=? AND status='sent' AND expires_at>? AND downloads<5").bind(now,valid.sid,now).run();
 if(done.meta?.changes!==1)return response("limit reached",403);
 return new Response(file.body,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\""+product.filename+"\"","Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
}
export default {async fetch(req,env){
 const u=new URL(req.url);
 if(u.pathname==="/health"&&req.method==="GET")return response(ready(env)?"configured":"not configured",ready(env)?200:503);
 if(u.pathname==="/stripe/webhook"&&req.method==="POST")return handleWebhook(req,env);
 if(u.pathname.startsWith("/download/")&&req.method==="GET")return handleDownload(u.pathname.slice(10),env);
 return response("not found",404);
}};
