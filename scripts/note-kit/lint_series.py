# -*- coding: utf-8 -*-
"""note/series-30/NN-slug/ の記事を検査する。使い方: python3 lint_series.py [番号 ...]"""
import glob
import html
import difflib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from plan_data import A

ROOT = Path(__file__).resolve().parents[2]
SER = ROOT / 'note' / 'series-30'

BANNED = [
    r'二流', r'凡人', r'負け組', r'底辺', r'意識が低', r'必ず(?!しも)', r'絶対', r'確実に', r'誰でも', r'誰にでも',
    r'100%', r'100％', r'人生が変わ', r'人生を変え', r'劇的', r'今だけ', r'限定', r'残りわずか', r'すぐに変わ',
    r'するだけで', r'止められない', r'とめることはできない', r'すべてここ', r'運がいい', r'治る', r'完治', r'間違いなく',
    r'一瞬で', r'手遅れ', r'終止符',
]
WARN_PATTERNS = [
    (r'効く', '「効く」は医療・断定に読めることがある'),
    (r'しなさい|しろ。|するな。|べきだ|べきである', '命令・断定の言い回し'),
    (r'あなたは[^。]{0,20}(だ|である)。', '「あなたは〜だ」の断定の疑い'),
    (r'違いない|はずだ。', '断定（違いない／はずだ）'),
    (r'みんな|だれもが', '「みんな」「だれもが」の一般化'),
]
EXPERIENCE = [
    r'(僕|私)(は|も)?、?(昨日|先週|先月|去年|昨年|一昨年|以前|かつて|学生の頃|学生のころ|新卒|[0-9０-９一二三四五六七八九十]+年(前|間))',
    r'僕も[^。]{0,20}(したことがある|経験がある|覚えがある)',
    r'僕にも覚えがある',
    r'(僕|私)(は|も)[^。]{0,12}(転職|退職|独立|起業)した',
]
REQUIRED_TITLES = ['## タイトル', '## 見出し画像の文言', '## 記事の説明', '## ハッシュタグ', '## この記事の訴求', '## 事実の確認', '## 公開するとき']
# 無料の20本（各道の最初の3本）の境目：次の番号がまだ出ていないので、目次へ
LAUNCH_NEXT = {4: 'INDEX', 11: 'INDEX', 17: 'INDEX', 23: 'INDEX', 29: 'INDEX'}
REL_PLACEHOLDER = {'FH': '{URL_FREE_HABIT}', 'K': '{URL_FREE_KIERKEGAARD}', 'N': '{URL_FREE_NIETZSCHE}', 'S': '{URL_FREE_SPINOZA}'}


def known_refs():
    lines = []
    for p in glob.glob(str(ROOT / 'src' / 'articles' / '*.html')):
        for m in re.finditer(r'<p id="ref-\d+">(.*?)</p>', Path(p).read_text(encoding='utf-8'), re.S):
            lines.append(html.unescape(re.sub(r'<[^>]+>', '', m.group(1))))
    for p in glob.glob(str(ROOT / 'note' / 'free-*' / 'article.md')):
        t = Path(p).read_text(encoding='utf-8')
        if '## 参考' in t:
            lines += [l for l in t.split('## 参考', 1)[1].split('\n') if re.match(r'^\d+\.', l.strip())]
    return lines


KNOWN = known_refs()


def ref_key(line):
    m = re.match(r'^\s*\d+\.\s*([^,（(、]+?)[,、 ]', line)
    y = re.search(r'\((\d{4})[a-z]?\)|（(\d{4})）|(\d{4})', line)
    sur = m.group(1).strip() if m else None
    year = next((g for g in (y.groups() if y else []) if g), None)
    return sur, year


def is_known(line):
    sur, year = ref_key(line)
    if not sur or not year:
        return False
    return any(sur.split()[-1] in k and year in k for k in KNOWN)


def lint(a):
    d = SER / f"{a['n']:02d}-{a['slug']}"
    fails, warns, info = [], [], {}
    art = d / 'article.md'
    tit = d / '03-titles.md'
    if not art.exists():
        return ['article.md がない'], [], {}
    t = art.read_text(encoding='utf-8')
    lines = t.split('\n')
    if not lines[0].startswith('# '):
        fails.append('1行目が「# タイトル」ではない')
    title = lines[0][2:].strip()
    info['title'] = title
    if len(title) > 48:
        warns.append(f'題が長い（{len(title)}字）')
    cut = len(t)
    for marker in ('\n## 参考', '\n---\n\n## 続き', '\n## 続き'):
        i = t.find(marker)
        if i != -1:
            cut = min(cut, i)
    body = t[:cut]
    n_chars = len(re.sub(r'\s', '', re.sub(r'[#>*`\-]', '', body)))
    info['chars'] = n_chars
    new_form = '## このまま続くと' in t
    info['form'] = '気づかせる' if new_form else '前の形'
    if new_form:
        # 「気づかせる」形（2026-10-17、BRAND.md）：ワーク・やり方なし、千字前後、問いで終わる
        if not 450 <= n_chars <= 1600:
            fails.append(f'本文の字数 {n_chars}（目安 千字前後）')
        for h in ('## このまま続くと', '## 周りを見ると', '## 参考'):
            if h not in t:
                fails.append(f'「{h}」がない')
        for p, why in ((r'今日の一歩|1分だけ|＿＿', 'ワーク'), (r'してみてほしい|試してみ|やってみ|書いてみ', 'やり方のすすめ')):
            for mm in re.finditer(p, body):
                fails.append(f'{why}が残っている：…{body[max(0, mm.start() - 10): mm.end() + 10]}…')
        paras = [l for l in body.strip().split('\n') if l.strip()]
        last = paras[-2] if paras[-1].startswith('気分の落ち込み') else paras[-1]
        if not re.search(r'[か。]$', last) or not re.search(r'(だろうか|だろう|ろうか|のか|ないか)。$', last):
            warns.append(f'最後の一行が問いになっていない：{last[:40]}')
    else:
        if not 1800 <= n_chars <= 5200:
            (fails if not 1400 <= n_chars <= 6500 else warns).append(f'本文の字数 {n_chars}（目安 2,500〜3,500）')
        for h in ('## 今日の一歩', '## 1分だけ、書いてみる', '## 続き'):
            if h not in t:
                fails.append(f'「{h}」がない')
        m = re.search(r'## 1分だけ、書いてみる\n+(?:[^\n]*\n)*?1\. [^\n]*＿＿＿＿[^\n]*\n2\. [^\n]*＿＿＿＿', t)
        if not m:
            fails.append('「1分だけ、書いてみる」に、空欄（＿＿＿＿）つきの番号リスト2行がない')
        if '紙かスマホのメモに。' not in t:
            warns.append('「紙かスマホのメモに。」の行がない')
    nxt = LAUNCH_NEXT.get(a['n']) or (f"{a['n']+1:02d}" if a['n'] < 30 else 'INDEX')
    if f'{{URL_S30_{nxt}}}' not in t:
        fails.append(f'次の記事のプレースホルダー {{URL_S30_{nxt}}} がない')
    if new_form:
        a = dict(a, related=None)  # 「気づかせる」形は、次の1本のリンクだけ
    if a['related']:
        if REL_PLACEHOLDER[a['related']] not in t:
            fails.append(f"近い記事のプレースホルダー {REL_PLACEHOLDER[a['related']]} がない")
    else:
        for ph in REL_PLACEHOLDER.values():
            if ph in t:
                fails.append(f'「なし」のはずなのに {ph} がある')
    allowed = {f'{{URL_S30_{nxt}}}'} | ({REL_PLACEHOLDER[a['related']]} if a['related'] else set())
    for ph in set(re.findall(r'\{[A-Z0-9_]+\}', t)):
        if ph not in allowed:
            fails.append(f'想定外のプレースホルダー {ph}')
    for p in BANNED:
        for mm in re.finditer(p, t):
            ctx = t[max(0, mm.start() - 12): mm.end() + 12].replace('\n', ' ')
            fails.append(f'禁止表現「{mm.group(0)}」…{ctx}…')
    for p, why in WARN_PATTERNS:
        for mm in re.finditer(p, t):
            ctx = t[max(0, mm.start() - 12): mm.end() + 12].replace('\n', ' ')
            warns.append(f'{why}：…{ctx}…')
    for p in EXPERIENCE:
        for mm in re.finditer(p, t):
            ctx = t[max(0, mm.start() - 10): mm.end() + 16].replace('\n', ' ')
            fails.append(f'実体験の主張の疑い：…{ctx}…')
    if len(re.findall(r'ください', t)) > 1:
        warns.append('「ください」が2回以上')
    if re.search(r'<[a-zA-Z/][^>]*>', t) or '{%' in t:
        fails.append('HTML タグ／テンプレートの記号が残っている')
    if re.search(r'^\|.*\|\s*$', t, re.M):
        fails.append('表がある（note には表がない）')
    # 参考
    refs = []
    if '\n## 参考' in t:
        sec = t.split('\n## 参考', 1)[1].split('\n---')[0]
        refs = [l.strip() for l in sec.split('\n') if re.match(r'^\d+\.\s', l.strip())]
    cited = set(re.findall(r'\[(\d+)\]', body))
    have = {re.match(r'^(\d+)\.', r).group(1) for r in refs}
    for c in sorted(cited - have, key=int):
        fails.append(f'本文の [{c}] に対応する参考がない')
    for h in sorted(have - cited, key=int):
        warns.append(f'参考 {h} が本文で使われていない')
    info['refs'] = [(r, 'known' if is_known(r) else 'NEW') for r in refs]
    if re.search(r'(専門家|相談)', t) is None and a['caution'] and '専門家' in a['caution']:
        fails.append('注意（専門家に相談を）の一文がない')
    # 03-titles
    if not tit.exists():
        fails.append('03-titles.md がない')
    else:
        tt = tit.read_text(encoding='utf-8')
        for h in REQUIRED_TITLES:
            if h not in tt:
                fails.append(f'03-titles.md に「{h}」がない')
        m = re.search(r'## タイトル\n+([^\n]+)', tt)
        if m and m.group(1).strip() != title:
            fails.append('03-titles.md のタイトルが article.md の1行目と違う')
        big = re.search(r'^- 大：(.+)$', tt, re.M)
        if big and cover_repeats_title(title, big.group(1).strip()):
            warns.append(f'見出し画像の大が、題のくり返しに近い：{big.group(1).strip()}')
        m = re.search(r'## 記事の説明[^\n]*\n+([^\n]+)', tt)
        if m:
            L = len(m.group(1).strip())
            info['desc'] = L
            if not 70 <= L <= 130:
                warns.append(f'記事の説明が {L}字（80〜120字）')
        m = re.search(r'## ハッシュタグ\n+([^\n]+)', tt)
        if m:
            tags = re.findall(r'#(\S+)', m.group(1))
            if tags != ['哲学', '哲学入門', '自己啓発', '自己理解']:
                fails.append(f'ハッシュタグが決まり（#哲学 #哲学入門 #自己啓発 #自己理解）と違う：{tags}')
    return fails, warns, info


def cover_repeats_title(title, big):
    """見出し画像の大きな文字が、題のくり返しになっていないか（2026-10-18、オーナー：コピーを先に。題は画像の下に出る）"""
    norm = lambda s: re.sub(r'[。、「」『』？！／\s]', '', s)
    t, b = norm(title), norm(big)
    return b in t or difflib.SequenceMatcher(None, t, b).ratio() > 0.6


def main():
    nums = [int(x) for x in sys.argv[1:]] or [a['n'] for a in A]
    total_f = 0
    new_refs = {}
    for a in A:
        if a['n'] not in nums:
            continue
        f, w, info = lint(a)
        total_f += len(f)
        status = 'FAIL' if f else ('warn' if w else 'ok')
        print(f"[{status}] {a['n']:02d} {a['slug']}  {info.get('form','')}  {info.get('chars','-')}字  refs={len(info.get('refs',[]))}")
        for x in f:
            print('   FAIL ', x)
        for x in w:
            print('   warn ', x)
        for r, k in info.get('refs', []):
            if k == 'NEW':
                new_refs.setdefault(r, []).append(a['n'])
    if new_refs:
        print('\n--- サイト・既存記事にない出典（検索で確かめる）---')
        for r, ns in sorted(new_refs.items()):
            print(f"  {','.join(f'{n:02d}' for n in ns)}: {r[:170]}")
    sys.exit(1 if total_f else 0)


if __name__ == '__main__':
    main()
