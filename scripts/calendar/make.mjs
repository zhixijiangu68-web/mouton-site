// promo/x-posts.md の順番表と投稿文から、「いつ・どこで・何をするか」のカレンダー（promo/calendar.html）を作る。
// 使い方: node scripts/calendar/make.mjs（順番表や投稿文を直したら、作り直してコミットする）
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const md = readFileSync(root + "promo/x-posts.md", "utf8");
const lines = md.split("\n");

// --- 投稿文（### か #### の見出しごと） ---
function parseSection(start) {
  const sec = { type: "", body: "", reply: "", followup: "", options: [] };
  let label = "";
  let inOptions = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{2,4} /.test(line)) break;
    if (line.startsWith("```")) {
      const buf = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) buf.push(lines[i]);
      const text = buf.join("\n").trim();
      if (label.startsWith("リプライ")) sec.reply = text;
      else if (label.startsWith("翌朝の答え合わせ")) sec.followup = text;
      else if (!sec.body) sec.body = text;
      inOptions = false;
      continue;
    }
    const m = line.match(/^型：\*\*(.+?)\*\*(.*)$/);
    if (m) { sec.type = m[1]; sec.typeNote = m[2].replace(/^（|）$/g, ""); continue; }
    if (line.startsWith("投票の選択肢")) { inOptions = true; label = line; continue; }
    if (inOptions && line.startsWith("- ")) { sec.options.push(line.slice(2)); continue; }
    if (line.trim()) { label = line.trim(); inOptions = false; }
  }
  return sec;
}

const sections = {};
lines.forEach((line, i) => {
  const m = line.match(/^#{3,4} ([A-Z0-9]+-?[A-Z0-9]*) (.*)$/);
  if (!m) return;
  const id = m[1];
  const dated = /^\d+\/\d+/.test(m[2]);
  // 日付つきの見出し（10/8 以降の新しい型）を優先する
  if (sections[id] && !dated) return;
  const sec = parseSection(i);
  const parts = m[2].split("｜");
  sec.angle = parts.length >= 3 ? parts[parts.length - 1] : "";
  sections[id] = sec;
});

// --- 順番表 ---
const tableStart = lines.findIndex((l) => l.startsWith("## 順番表"));
const slots = [];
for (let i = tableStart; i < lines.length; i++) {
  const line = lines[i];
  if (i > tableStart && line.startsWith("## ")) break;
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  const d = cells[0]?.match(/^(\d+)\/(\d+)/);
  if (!d || cells.length < 7) continue;
  const id = cells[2];
  const sec = sections[id] || {};
  const url = (sec.reply || sec.body || "").match(/https:\/\/moutonarchive\.com\/[^\s]+/)?.[0] || "";
  slots.push({
    date: `2026-${d[1].padStart(2, "0")}-${d[2].padStart(2, "0")}`,
    slot: cells[1],
    id,
    kind: cells[3],
    article: cells[4],
    done: cells[5] === "✓",
    memo: cells[6],
    form: sec.type || "",
    formNote: sec.typeNote || "",
    angle: sec.angle || "",
    body: sec.body || "",
    reply: sec.reply || "",
    followup: sec.followup || "",
    options: sec.options || [],
    slug: url.match(/\.com\/([^.]+)\.html/)?.[1] || "",
  });
  if (!sections[id]) console.warn(`投稿文が見つからない: ${id}`);
  // 順番表の「メモ」の型を正とする（旧型の案は見出しに型が書いていない）
  const s = slots[slots.length - 1];
  const memoForm = s.memo.match(/^(本文リンク|リプリンク|投票)/)?.[1];
  if (memoForm) s.form = memoForm;
  if (s.form === "本文リンク" && !/https:\/\//.test(s.body) && url) {
    s.body += "\n\n" + url.replace("utm_content=reply", "utm_content=body");
    s.reply = "";
  }
}

const data = { generated: new Date().toISOString().slice(0, 10), slots };
const template = readFileSync(new URL("./template.html", import.meta.url), "utf8");
const html = template.replace("/*DATA*/null", () => JSON.stringify(data).replace(/</g, "\\u003c"));
writeFileSync(root + "promo/calendar.html", html);
console.log(`promo/calendar.html を作りました（${slots.length}枠）`);
