# -*- coding: utf-8 -*-
"""note/next-30/NN-slug/ の記事（次の30本）を検査する。使い方: python3 lint_next30.py [番号 ...]"""
import difflib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
N30 = ROOT / 'note' / 'next-30'
SER = ROOT / 'note' / 'series-30'
PLAN = (N30 / 'plan.md').read_text(encoding='utf-8')

# plan.md から、題・哲学者（本質の行の最初の名前）
SPEC = {}
for m in re.finditer(r'^#### (\d{2})　(.+?)\n(.*?)(?=^#### |^## |\Z)', PLAN, re.S | re.M):
    n = int(m.group(1))
    body = m.group(3)
    ph = re.search(r'^- 本質：([^『「―（]+)', body, re.M)
    SPEC[n] = dict(title=m.group(2).strip(), philosopher=ph.group(1).strip() if ph else '')
CAUTION = {51, 53, 55, 59, 60}
LAST = {40: ('FREE_KIERKEGAARD', '決められないのは、弱いからだろうか。キルケゴールの「自由のめまい」'),
        50: ('FREE_NIETZSCHE', 'その「すべき」は、誰の声なのか。'),
        60: ('FREE_SPINOZA', '反省するほど、動けなくなるのはなぜだろう。スピノザ「謙遜は徳ではない」')}
CAUTION_LINE = '気分の落ち込みや不安が長く続いて、暮らしに差しさわるときは、医療機関や相談窓口に相談できる。この記事は、診断や治療の代わりにはならない。'
AI_LINE = '調べものや下書きの整理には AI を使っています。数字や研究の内容は出典にあたって確かめ、最後は僕が確認して公開しています。'
TAGS = ['哲学', '哲学入門', '自己啓発', '自己理解']
BANNED = [r'二流', r'凡人', r'負け組', r'底辺', r'意識が低', r'必ず(?!しも)', r'絶対', r'確実に', r'誰でも(?!ない)', r'誰にでも',
          r'100%', r'100％', r'人生が変わ', r'人生を変え', r'劇的', r'今だけ', r'限定', r'残りわずか', r'すぐに変わ',
          r'するだけで', r'手遅れ', r'取り返しがつかない', r'一瞬で', r'間違いなく', r'治る', r'完治']
HOWTO = [r'今日の一歩', r'1分だけ', r'＿＿', r'してみてほしい', r'試してみ', r'やってみ', r'書いてみ', r'おすすめ(?!に出|欄)', r'すればいい', r'コツ']
WARN = [(r'しなさい|しろ。|するな。|べきだ|べきである', '命令・断定'), (r'違いない|はずだ。', '断定'), (r'(?<!「)みんな(?!」)|だれもが', '一般化（「みんな」）'),
        (r'効く', '「効く」')]
EXPERIENCE = [r'(僕|私)(は|も)?、?(昨日|先週|先月|去年|昨年|以前|かつて|学生の頃|学生のころ|[0-9０-９一二三四五六七八九十]+年(前|間))',
              r'僕も[^。]{0,20}(したことがある|経験がある|覚えがある)', r'僕にも覚えがある']
HEADS = ['## タイトル', '## 見出し画像の文言', '## 記事の説明', '## ハッシュタグ', '## この記事の訴求', '## 事実の確認', '## 公開するとき']


def title_of(n):
    d = next(N30.glob(f'{n:02d}-*'), None)
    if d and (d / 'article.md').exists():
        return (d / 'article.md').read_text(encoding='utf-8').split('\n', 1)[0][2:].strip()
    return SPEC.get(n, {}).get('title')


def lint(n):
    d = next(N30.glob(f'{n:02d}-*'), None)
    fails, warns, info = [], [], {}
    if not d or not (d / 'article.md').exists():
        return ['article.md がない'], [], {}
    t = (d / 'article.md').read_text(encoding='utf-8')
    title = t.split('\n', 1)[0][2:].strip()
    if title != SPEC[n]['title']:
        fails.append(f'題が plan.md と違う：{title}')
    cut = t.find('\n## 参考')
    body = t[:cut if cut != -1 else len(t)]
    chars = len(re.sub(r'\s', '', re.sub(r'[#>*`\-]', '', body)))
    info['chars'] = chars
    if not 600 <= chars <= 1100:
        (fails if not 500 <= chars <= 1300 else warns).append(f'本文 {chars}字（600〜1,100）')
    for h in ('## このまま続くと', '## 周りを見ると', '## 参考'):
        if h not in t:
            fails.append(f'「{h}」がない')
    sec = re.search(r'\n## (?!このまま|周りを|参考)[^\n]+\n(.*?)\n## このまま続くと', t, re.S)
    if not sec:
        fails.append('本質の節がない')
    else:
        ph = SPEC[n]['philosopher']
        key = ph.split('（')[0].replace('・', '').strip()[:3]
        if key and key not in sec.group(1).replace('・', ''):
            fails.append(f'本質の節に哲学者（{ph}）の名前がない')
        if not re.search(r'\n\*\*[^\n]+\*\*\n', '\n' + sec.group(1) + '\n'):
            fails.append('本質の太字の一行がない')
    body_nt = body.split('\n', 1)[1] if '\n' in body else body
    for p in HOWTO:
        for mm in re.finditer(p, body_nt):
            fails.append(f'やり方・ワークの言葉：…{body[max(0, mm.start() - 10): mm.end() + 10]}…')
    for p in BANNED:
        for mm in re.finditer(p, t):
            fails.append(f'禁止表現「{mm.group(0)}」…{t[max(0, mm.start() - 12): mm.end() + 12]}…'.replace('\n', ' '))
    for p, why in WARN:
        for mm in re.finditer(p, body):
            warns.append(f'{why}：…{body[max(0, mm.start() - 12): mm.end() + 12]}…'.replace('\n', ' '))
    for p in EXPERIENCE:
        for mm in re.finditer(p, t):
            fails.append(f'書き手の体験の疑い：…{t[max(0, mm.start() - 10): mm.end() + 14]}…'.replace('\n', ' '))
    paras = [l for l in body.strip().split('\n') if l.strip()]
    last = paras[-2] if paras[-1] == CAUTION_LINE else paras[-1]
    if not re.search(r'(だろうか|だろう|ろうか|のか|ないか)。$', last):
        warns.append(f'最後の一行が問いでない：{last[:40]}')
    if n in CAUTION and CAUTION_LINE not in t:
        fails.append('注意の一文がない')
    if n not in CAUTION and CAUTION_LINE in t:
        warns.append('注意の一文がある（指示はなし）')
    if AI_LINE not in t:
        fails.append('AI の一文がない')
    # 次に読む
    if n in LAST:
        key, ttl = LAST[n]
        want_ph, want_t = '{URL_' + key + '}', ttl
    else:
        want_ph, want_t = '{URL_N30_%02d}' % (n + 1), title_of(n + 1)
    m = re.search(r'次に読むなら：\*\*(.+?)\*\*\n(\{[A-Z0-9_]+\})\s*$', t)
    if not m:
        fails.append('「次に読むなら」の形が違う')
    else:
        if m.group(2) != want_ph:
            fails.append(f'次のプレースホルダー {m.group(2)}（{want_ph} のはず）')
        if m.group(1) != want_t:
            fails.append(f'次の題が違う：{m.group(1)}')
    others = set(re.findall(r'\{[A-Z0-9_]+\}', t)) - {want_ph}
    if others:
        fails.append(f'想定外のプレースホルダー {others}')
    # 参考
    refs = [l for l in t.split('\n## 参考', 1)[1].split('\n') if re.match(r'^\d+\.\s', l)] if '\n## 参考' in t else []
    cited = set(re.findall(r'\[(\d+)\]', body))
    have = {re.match(r'^(\d+)\.', r).group(1) for r in refs}
    for c in sorted(cited - have, key=int):
        fails.append(f'[{c}] に対応する参考がない')
    for h in sorted(have - cited, key=int):
        warns.append(f'参考 {h} が本文にない')
    info['refs'] = refs
    if re.search(r'<[a-zA-Z/][^>]*>', t) or re.search(r'^\|.*\|\s*$', t, re.M):
        fails.append('HTML か表が残っている')
    # 03-titles
    tf = d / '03-titles.md'
    if not tf.exists():
        fails.append('03-titles.md がない')
        return fails, warns, info
    tt = tf.read_text(encoding='utf-8')
    for h in HEADS:
        if h not in tt:
            fails.append(f'03-titles に「{h}」がない')
    if 'オーナーが経験' in tt:
        fails.append('03-titles に「経験を足せる場所」がある（載せない決まり）')
    m = re.search(r'## タイトル\n+([^\n]+)', tt)
    if m and m.group(1).strip() != title:
        fails.append('03-titles のタイトルが article.md と違う')
    big = re.search(r'^- 大：(.+)$', tt, re.M)
    small = re.search(r'^- 小：(.+)$', tt, re.M)
    if not big or not small:
        fails.append('見出し画像の大・小がない')
    else:
        info['cover'] = (big.group(1).strip(), small.group(1).strip())
        if len(big.group(1).strip().replace('／', '')) > 16:
            warns.append(f'大が {len(big.group(1).strip().replace("／", ""))}字（16字まで）')
        if cover_repeats_title(title, big.group(1).strip()):
            warns.append(f'見出し画像の大が、題のくり返しに近い：{big.group(1).strip()}')
        if len(small.group(1).strip()) > 20:
            warns.append(f'小が {len(small.group(1).strip())}字（20字まで）')
    m = re.search(r'## 記事の説明[^\n]*\n+([^\n]+)', tt)
    if m and not 70 <= len(m.group(1).strip()) <= 130:
        warns.append(f'説明が {len(m.group(1).strip())}字')
    m = re.search(r'## ハッシュタグ\n+([^\n]+)', tt)
    if not m or re.findall(r'#(\S+)', m.group(1)) != TAGS:
        fails.append('ハッシュタグが4つの決まりと違う')
    if want_ph not in tt:
        warns.append(f'03-titles の「公開するとき」に {want_ph} がない')
    return fails, warns, info


def cover_repeats_title(title, big):
    """見出し画像の大きな文字が、題のくり返しになっていないか（2026-10-18、オーナー：コピーを先に。題は画像の下に出る）"""
    norm = lambda s: re.sub(r'[。、「」『』？！／\s]', '', s)
    t, b = norm(title), norm(big)
    return b in t or difflib.SequenceMatcher(None, t, b).ratio() > 0.6


def main():
    nums = [int(x) for x in sys.argv[1:]] or list(range(31, 61))
    allrefs = {}
    for n in nums:
        f, w, i = lint(n)
        mark = 'ok' if not f and not w else ('warn' if not f else 'FAIL')
        cov = ' / '.join(i.get('cover', ('', '')))
        print(f"[{mark}] {n} {i.get('chars', '-')}字  {cov}")
        for x in f:
            print('   fail ', x)
        for x in w:
            print('   warn ', x)
        for r in i.get('refs', []):
            k = re.sub(r'^\d+\.\s*', '', r)
            k = re.split(r'[,（(]', k)[0].strip() + ' ' + (re.search(r'\((\d{4})', r).group(1) if re.search(r'\((\d{4})', r) else '')
            allrefs.setdefault(k, []).append(n)
    dup = {k: v for k, v in allrefs.items() if len(v) > 1}
    if dup:
        print('\n--- 2本以上で使っている出典 ---')
        for k, v in sorted(dup.items()):
            print(f'  {k}: {v}')


main()
