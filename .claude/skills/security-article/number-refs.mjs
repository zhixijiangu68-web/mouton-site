// 記事の下書きの [[key]] を、出てくる順の参考文献の番号に置き換える（security-article スキル）。
// 使い方：node number-refs.mjs <下書き.html> <refs.tsv> <出力 src/articles/<slug>.html>
// refs.tsv は1行1件、タブ区切りで「key 説明 URL リンクの文字」。下書きの参考文献の <ol> の中に REFS と書いておく。
// 判定表（front matter の claims）の refs: [key, ...] も番号にする。番号は、判定表より前の本文 → 判定表 → 残りの本文 の順。
import fs from 'node:fs';
const [src, tsv, out] = process.argv.slice(2);
let s = fs.readFileSync(src, 'utf8');
const refs = new Map(fs.readFileSync(tsv,'utf8').trim().split('\n').map(l => { const [k,d,u,lab] = l.split('\t'); return [k,{d,u,lab}]; }));
const end = s.indexOf('---', 4);
let fm = s.slice(0, end), body = s.slice(end);
// order: body refs up to verdictTable, then claims refs, then rest of body
const vt = body.indexOf('{% verdictTable');
const order = [];
const add = k => { if (!refs.has(k)) throw new Error('unknown ref ' + k); if (!order.includes(k)) order.push(k); };
for (const m of body.slice(0, vt).matchAll(/\[\[(\w+)\]\]/g)) add(m[1]);
for (const m of fm.matchAll(/refs: \[([^\]]*)\]/g)) m[1].split(',').map(x=>x.trim()).forEach(add);
for (const m of body.slice(vt).matchAll(/\[\[(\w+)\]\]/g)) add(m[1]);
const num = k => order.indexOf(k) + 1;
fm = fm.replace(/refs: \[([^\]]*)\]/g, (_, l) => `refs: [${l.split(',').map(x=>num(x.trim())).join(', ')}]`);
body = body.replace(/\[\[(\w+)\]\]/g, (_, k) => `<a href="#ref-${num(k)}">[${num(k)}]</a>`);
const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const li = order.map((k,i) => { const r = refs.get(k); return `<li id="ref-${i+1}">${esc(r.d)}<a href="${r.u}">${esc(r.lab)}</a></li>`; }).join('\n');
body = body.replace('REFS', li);
fs.writeFileSync(out, fm + body);
const unused = [...refs.keys()].filter(k => !order.includes(k));
console.log('used', order.length, 'unused', unused.join(' '));
