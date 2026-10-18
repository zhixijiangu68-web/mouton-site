# -*- coding: utf-8 -*-
"""note 公開キット（claude.ai の非公開アーティファクト）の HTML を作る。使い方は同じフォルダの README.md。

  python3 scripts/note-kit/make_kit.py            # → $NOTE_KIT_OUT（なければ /tmp/note-kit）に index.html と files.json
  NOTE_PRIVATE_DIR=<非公開の原稿のフォルダ> python3 scripts/note-kit/make_kit.py

方針（2026-10-17、オーナー）：無料記事20本で世界観を伝え、信頼を得てから有料を出す。
有料記事の全文は公開リポジトリに入れない。「選べない」の有料の続きは、NOTE_PRIVATE_DIR/paid-choice/paid-rest.md から読む
（なければ、キットの「有料の続きをコピー」を出さない）。
"""
import html
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
NOTE = ROOT / 'note'
SER = NOTE / 'series-30'
OUT = Path(os.environ.get('NOTE_KIT_OUT', '/tmp/note-kit'))
OUT.mkdir(parents=True, exist_ok=True)
PRIVATE = Path(os.environ['NOTE_PRIVATE_DIR']) if os.environ.get('NOTE_PRIVATE_DIR') else None

SLUG = {'KIERKEGAARD': 'kierkegaard', 'NIETZSCHE': 'nietzsche', 'SPINOZA': 'spinoza'}
NAME = {'KIERKEGAARD': 'キルケゴール', 'NIETZSCHE': 'ニーチェ', 'SPINOZA': 'スピノザ'}

GROUPS = [
    dict(id='done', title='公開ずみ（10本）',
         text='公開した URL を入れてください（Claude にまとめて貼ってもらえれば、こちらで入れます）。URL がそろうと、各記事の末尾に足す「次に読む」を、カードの「「次に読む」をコピー」で貼れます。note で記事を開いて「編集」し、末尾に貼って「更新」します。有料記事を出して、そのカードに URL を入れたら、各カードの「有料記事への案内をコピー」で、最後の問いのあと（「参考」の前）に足します。'),
    dict(id='day1', title='世界観の4本（はじめての方へ・入門3本）',
         text='MOUTON の考え方と、3人の哲学者の入口。「はじめての方へ」を最後に公開すると、その日のいちばん上に来ます。入門3本は、書き込みの節とやり方を外してあります。'),
    dict(id='day2', title='目次',
         text='世界観の4本のあとに出すと、「先に読むなら」のリンクがそろいます。目次を出したら、04・11・23 の末尾に「次に読む」（目次）を足します。'),
    dict(id='day3', title='道3（15・16・17）', text='同じ日に出します（「次に読む」が次の記事を指しているため）。公開したら、目次を貼り直します（いちばん下のカード）。', indexUpdate=True),
    dict(id='day4', title='道5（27・28・29）', text='これで無料の20本がそろいます。公開したら、目次を貼り直します。', indexUpdate=True),
    dict(id='paid', title='20本のあと：有料（まだ出しません）',
         text='無料の20本で世界観を伝えたあとに出します。先に「特定商取引法に基づく表記」の記事を出します（＿＿＿＿ に氏名とメールを入れてから）。有料記事に書き込みワークは入れず、返金は「受け付けない」にします。有料記事のカードに公開した URL を入れると、無料の記事の「本文をコピー」に、その有料記事への案内が入ります（どの無料記事からどの有料記事へ案内するかは note/paid-links.md）。公開ずみの無料記事には、カードの「有料記事への案内をコピー」で足します。いちばん下の「選べない」は、16 の問いの答えを書いた有料記事で、出したら 16 のカードの「有料への案内をコピー」で、16 の末尾に案内を足します。'),
    dict(id='rest', title='30本の残り（14本）',
         text='無料の20本に入らなかった14本（2026-10-18 に、どれも「気づかせる」形に仕上げた）。出す順と間隔は、無料の20本の数字を見て決めます。同じ日に何本か出すときは、番号の大きいほうから出すと、一覧で番号順に並びます。「次に読む」は、行き先を出してから足します。'),
    dict(id='n30a', title='次の30本・A 選べない（31〜40）',
         text='有料3本のあとに出す「自分を動かしているもの」。10本を続けて出します（「次に読む」が次の記事を指し、40 はキルケゴールの入門を指しています）。どの群から出すかは、無料の20本の数字で決めます。'),
    dict(id='n30b', title='次の30本・B 誰かの物差し（41〜50）', text='50 はニーチェの入門を指しています。'),
    dict(id='n30c', title='次の30本・C 感情に振り回される（51〜60）', text='60 はスピノザの入門を指しています。'),
]
# 次の30本（note/next-30/）で、Claude が確かめた記事
REVIEWED_N30 = set(range(31, 61))
# 「気づかせる」形への書き直しを Claude が確かめた記事（ほかの30本は「確認中」で、コピーできない）
REVIEWED = set(range(1, 31))


def series_dir(n):
    return next(SER.glob(f'{n:02d}-*'))


def section(text, heading_prefix):
    """「## 見出し」の下の本文（次の「## 」まで）"""
    m = re.search(r'^## ' + re.escape(heading_prefix) + r'[^\n]*\n(.*?)(?=^## |\Z)', text, re.S | re.M)
    return m.group(1).strip() if m else ''


def first_line(text):
    return next((l.strip() for l in text.split('\n') if l.strip()), '')


def tags_of(text):
    return re.findall(r'#(\S+)', first_line(section(text, 'ハッシュタグ')))


def body_of(article):
    return article.split('\n', 1)[1].lstrip('\n').rstrip('\n') + '\n'


ITEMS = []


def add(key, group, kind, label, folder, title, body_md, tags, desc, image, extra=None, ph_self=None, pending=False):
    nxt = None
    m = re.search(r'\n---\n\n(次に読むなら：[^\n]*\n\{[A-Z0-9_]+\})\n*$', body_md)
    if m and kind == 'series':
        nxt = '---\n\n' + m.group(1) + '\n'
        body_md = body_md[:m.start()].rstrip('\n') + '\n'
    ITEMS.append(dict(key=key, group=group, kind=kind, label=label, folder=folder, title=title,
                      body_md=body_md, tags=tags, desc=desc, image=image, extra=extra or {}, ph_self=ph_self,
                      next_md=nxt, pending=pending))


def add_free(key, group, label, d, image, ph_self=None):
    a = (d / 'article.md').read_text(encoding='utf-8')
    t = (d / '03-titles.md').read_text(encoding='utf-8')
    add(key, group, 'free', label, str(d.relative_to(ROOT)) + '/', a.split('\n', 1)[0][2:].strip(), body_of(a),
        tags_of(t), first_line(section(t, '記事の説明')), image, ph_self=ph_self)


def add_series(n, group):
    d = series_dir(n)
    a = (d / 'article.md').read_text(encoding='utf-8')
    t = (d / '03-titles.md').read_text(encoding='utf-8')
    key = 'S30_INDEX' if n == 0 else f'S30_{n:02d}'
    label = '30本・目次' if n == 0 else f'30本・{n:02d}'
    add(key, group, 'index' if n == 0 else 'series', label, f'note/series-30/{d.name}/', a.split('\n', 1)[0][2:].strip(),
        body_of(a), tags_of(t), first_line(section(t, '記事の説明')), f'note/series-30/{d.name}/cover.jpg',
        pending=(n != 0 and n not in REVIEWED))


def add_n30(n, group):
    d = next((NOTE / 'next-30').glob(f'{n:02d}-*'), None)
    if not d or not (d / 'article.md').exists() or not (d / '03-titles.md').exists():
        return
    a = (d / 'article.md').read_text(encoding='utf-8')
    t = (d / '03-titles.md').read_text(encoding='utf-8')
    cover = f'note/next-30/{d.name}/cover.jpg'
    add(f'N30_{n:02d}', group, 'series', f'次の30本・{n}', f'note/next-30/{d.name}/', a.split('\n', 1)[0][2:].strip(),
        body_of(a), tags_of(t), first_line(section(t, '記事の説明')), cover if (ROOT / cover).exists() else None,
        pending=n not in REVIEWED_N30)


# 1日目（公開する順：見せたい順の逆。「はじめての方へ」が最後）
for k in ('SPINOZA', 'NIETZSCHE', 'KIERKEGAARD'):
    add_free(f'FREE_{k}', 'day1', f'無料の入門・{NAME[k]}', NOTE / f'free-{SLUG[k]}', f'images/og/{SLUG[k]}.jpg',
             ph_self=f'PAID_{k}')
add_free('START', 'day1', 'はじめての方へ（世界観）', NOTE / 'start', 'note/profile/header.jpg')
# 2〜4日目（道の中も、見せたい順の逆）
# 30本は「気づかせる」形に書き直している途中なので、書き直しがすんでから並べる
SERIES_READY = True
for n in (1, 2, 3, 4, 9, 10, 11, 21, 22, 23):
    add_series(n, 'done')
add_series(0, 'day2')
for n in (17, 16, 15):
    add_series(n, 'day3')
for n in (29, 28, 27):
    add_series(n, 'day4')
# 30本の残り（無料の20本に入らなかった14本。番号の順）
for n in (5, 6, 7, 8, 12, 13, 14, 18, 19, 20, 24, 25, 26, 30):
    add_series(n, 'rest')
# 次の30本（群の中は、見せたい順の逆）
for g, lo in (('n30a', 31), ('n30b', 41), ('n30c', 51)):
    for n in range(lo + 9, lo - 1, -1):
        add_n30(n, g)
# 特定商取引法に基づく表記（有料より先に出す。＿＿＿＿ はオーナーが入れる）
_legal = (NOTE / 'legal' / 'tokushoho.md').read_text(encoding='utf-8').split('## 特定商取引法に基づく表記\n', 1)[1].lstrip('\n')
add('LEGAL', 'paid', 'legal', '特定商取引法に基づく表記（有料より先に）', 'note/legal/', '特定商取引法に基づく表記', _legal, [], '', None)
# 有料（20本のあと）
for k in ('KIERKEGAARD', 'NIETZSCHE', 'SPINOZA'):
    d = NOTE / f'paid-{SLUG[k]}'
    listing = (d / 'listing.md').read_text(encoding='utf-8')
    title = re.search(r'^\| タイトル \| (.+?) \|$', listing, re.M).group(1)
    price = re.search(r'^\| 価格 \| (.+?) \|$', listing, re.M).group(1)
    line = re.search(r'^\| 有料ライン \| (.+?) \|$', listing, re.M).group(1).replace('**', '')
    free = (d / 'free-part.md').read_text(encoding='utf-8')
    teaser = section(listing, '有料ラインの直前に置く案内')
    _cl = re.search(r'```text\n(.*?)\n```', section(listing, '最後に足す結び'), re.S)
    add(f'PAID_{k}', 'paid', 'paid', f'有料・{NAME[k]}', f'note/paid-{SLUG[k]}/', title, body_of(free),
        tags_of(listing), first_line(section(listing, '記事の説明')), f'images/og/paid-{SLUG[k]}.jpg',
        extra=dict(price=price, line=line, teaser=teaser + '\n',
                   refund='公開の設定で「受け付けない」を選ぶ（決定）。購入ボタンの下に「返金不可」と出る。',
                   law='先に「特定商取引法に基づく表記」の記事を出し、この記事の末尾からリンクする（いちばん上のカード）。',
                   work='書き込みワークは入れない。手元の原稿からワークの節を外して貼る。ファイルも添付しない。',
                   fee='カード払いなら、1本の手取りは約2,548円（事務手数料5%＝149円、その残りの10%＝283円）。振込1回ごとに270円。',
                   ai='「AI学習対価還元プログラム」は初期設定で ON（有料記事も対象）。Claude の案は、公開の設定でこの記事だけ OFF（オーナーが決める）。',
                   closing=_cl.group(1) + '\n',
                   closing_note='手元の原稿の「おわりに」のあと（「参考」の前）に、下の「最後の結びをコピー」で足す。満足して閉じず、次があることを暗示する結び（2026-10-18、オーナーの方針）。'))

# 16 から派生した有料記事（note だけで売る。2026-10-18）。有料の続きは NOTE_PRIVATE_DIR の非公開の原稿から読む（公開リポジトリには入れない）
_pc = NOTE / 'paid-choice'
_pl = (_pc / 'listing.md').read_text(encoding='utf-8')
_rest_path = PRIVATE / 'paid-choice' / 'paid-rest.md' if PRIVATE else None
_rest = _rest_path.read_text(encoding='utf-8') if _rest_path and _rest_path.exists() else None
if _rest is None:
    print('注意：「選べない」の有料の続き（NOTE_PRIVATE_DIR/paid-choice/paid-rest.md）がないので、キットに続きを入れない', file=sys.stderr)
add('PAID_CHOICE', 'paid', 'paid', '有料・選べない（16 の続き。note だけ）', 'note/paid-choice/',
    re.search(r'^\| タイトル \| (.+?) \|$', _pl, re.M).group(1), body_of((_pc / 'free-part.md').read_text(encoding='utf-8')),
    tags_of(_pl), first_line(section(_pl, '記事の説明')), 'note/paid-choice/cover.jpg',
    extra=dict(price=re.search(r'^\| 価格 \| (.+?) \|$', _pl, re.M).group(1).replace('下の「価格の案」', '出品シートの「価格の案」'),
               line=re.search(r'^\| 有料ライン \| (.+?) \|$', _pl, re.M).group(1).replace('**', ''),
               teaser=section(_pl, '有料ラインの直前に置く案内') + '\n', **({'rest': _rest} if _rest else {}),
               refund='公開の設定で「受け付けない」を選ぶ（3本と同じ）。購入ボタンの下に「返金不可」と出る。',
               law='先に「特定商取引法に基づく表記」の記事を出し、この記事の末尾からリンクする（このグループのいちばん上のカード）。',
               work='書き込みワークは入れていない。ファイルも添付しない。',
               closing_note='有料の続きの最後に入っている（満足して閉じず、次があることを暗示する結び。2026-10-18、オーナーの方針）。',
               fee='案の ¥980 をカードで売ると、手取りは約838円（事務手数料5%＝49円、その残りの10%＝93円）。振込1回ごとに270円。',
               ai='「AI学習対価還元プログラム」は初期設定で ON（有料記事も対象）。Claude の案は、公開の設定でこの記事だけ OFF（オーナーが決める）。'))
# 16 の末尾に足す、有料記事への案内（有料を出したあと）

# 無料の記事から有料記事への案内（2026-10-18、オーナー：「無料の記事に有料記事のリンクを貼りたい」。note/paid-links.md）
_PAID_KEY = {'キルケゴール': 'PAID_KIERKEGAARD', 'ニーチェ': 'PAID_NIETZSCHE', 'スピノザ': 'PAID_SPINOZA', '選べない': 'PAID_CHOICE'}
PAID_OF = {}
for _m in re.finditer(r'^\| ([0-9・]+) \| (\S+) \| .+ \|$', (NOTE / 'paid-links.md').read_text(encoding='utf-8'), re.M):
    for _n in _m.group(1).split('・'):
        assert int(_n) not in PAID_OF, _n
        PAID_OF[int(_n)] = _PAID_KEY[_m.group(2)]
assert set(PAID_OF) == set(range(1, 61)), sorted(set(range(1, 61)) - set(PAID_OF))
_PAID_TITLE = {}
for _k, _d in (('PAID_KIERKEGAARD', 'paid-kierkegaard'), ('PAID_NIETZSCHE', 'paid-nietzsche'), ('PAID_SPINOZA', 'paid-spinoza'), ('PAID_CHOICE', 'paid-choice')):
    _t = re.search(r'^\| タイトル \| (.+?) \|$', (NOTE / _d / 'listing.md').read_text(encoding='utf-8'), re.M).group(1)
    _PAID_TITLE[_k] = _t.split('——', 1)


def _section_block(path):
    """paid-section.md の、最初の区切り線と次の区切り線のあいだ"""
    return path.read_text(encoding='utf-8').split('\n---\n', 2)[1].strip('\n')


def paid_plan(it):
    k = it['key']
    if k.startswith(('S30_', 'N30_')) and k != 'S30_INDEX':
        n = int(k[4:])
        pk = PAID_OF[n]
        if n == 16:
            block = _section_block(NOTE / 'paid-choice' / 'link-from-16.md').replace('{PAID_URL}', '{URL_PAID_CHOICE}')
        else:
            main, sub = _PAID_TITLE[pk]
            block = f'この悩みに近い有料記事：\n**{main}**\n{sub}\n{{URL_{pk}}}'
        return dict(block='---\n\n' + block, atMd='## 参考\n', atHtml='<h2>参考</h2>', mode='before', where='最後の問いのあと、「参考」の前')
    if k.startswith('FREE_'):
        return dict(block=_section_block(NOTE / f'free-{SLUG[k[5:]]}' / 'paid-section.md'), atMd='## この悩みの続き\n\n',
                    atHtml='<h2>この悩みの続き</h2>', mode='after', where='「この悩みの続き」の見出しのすぐ下')
    if k == 'START':
        return dict(block=_section_block(NOTE / 'start' / 'paid-section.md'), atMd='人生は短い。', atHtml='<p>人生は短い。',
                    mode='before', where='「人生は短い。」の前')
    if k == 'S30_INDEX':
        return dict(block=_section_block(SER / '00-index' / 'paid-section.md'), atMd='---\n\nどの記事も', atHtml='<hr><p>どの記事も',
                    mode='before', where='最後の区切り線の前')
    return None


_gorder = [g['id'] for g in GROUPS]
ITEMS.sort(key=lambda i: _gorder.index(i['group']))
KEYS = {i['key'] for i in ITEMS}
ORDER = [i['key'] for i in ITEMS]


def canon(ph, item):
    if ph == 'PAID_URL':
        return item['ph_self']
    for pat, rep in ((r'URL_S30_(\w+)', r'S30_\1'), (r'URL_N30_(\w+)', r'N30_\1'), (r'URL_FREE_(\w+)', r'FREE_\1'), (r'URL_START', 'START'),
                     (r'PAID_URL_(\w+)', r'PAID_\1'), (r'URL_PAID_(\w+)', r'PAID_\1')):
        if re.fullmatch(pat, ph):
            return re.sub(pat, rep, ph)
    raise ValueError(ph)


def inline(s, item, refs):
    out = []
    pos = 0
    for m in re.finditer(r'\{([A-Z0-9_]+)\}|(https?://[^\s<>（）]+)|\*\*(.+?)\*\*', s):
        out.append(html.escape(s[pos:m.start()], quote=False))
        if m.group(1):
            k = canon(m.group(1), item)
            assert k in KEYS, (item['key'], k)
            refs.add(k)
            out.append(f'<a class="ph" data-ph="{k}"></a>')
        elif m.group(2):
            u = html.escape(m.group(2))
            out.append(f'<a href="{u}">{u}</a>')
        else:
            out.append('<b>' + inline(m.group(3), item, refs) + '</b>')
        pos = m.end()
    out.append(html.escape(s[pos:], quote=False))
    return ''.join(out)


def md_html(md, item, refs):
    blocks = [b for b in re.split(r'\n\s*\n', md.strip('\n')) if b.strip()]
    out = []
    for b in blocks:
        lines = b.split('\n')
        if b.startswith('### '):
            out.append(f'<h3>{inline(b[4:].strip(), item, refs)}</h3>')
        elif b.startswith('## '):
            out.append(f'<h2>{inline(b[3:].strip(), item, refs)}</h2>')
        elif b.strip() == '---':
            out.append('<hr>')
        elif all(l.startswith('>') for l in lines):
            inner = '<br>'.join(inline(re.sub(r'^>\s?', '', l), item, refs) for l in lines)
            out.append(f'<blockquote><p>{inner}</p></blockquote>')
        elif re.match(r'^(- |\d+\. )', lines[0]):
            tag = 'ul' if lines[0].startswith('- ') else 'ol'
            items, cur = [], None
            for l in lines:
                m = re.match(r'^(?:- |\d+\. )(.*)$', l)
                if m and ((tag == 'ul') == l.startswith('- ')):
                    cur = [m.group(1)]
                    items.append(cur)
                else:
                    cur.append(l)
            lis = ''.join('<li>' + '<br>'.join(inline(x, item, refs) for x in it) + '</li>' for it in items)
            # 空行で分かれた番号つきリスト（参考文献など）は、ひとつのリストにつなぐ
            first_num = int(re.match(r'^(\d+)\.', lines[0]).group(1)) if tag == 'ol' else 0
            if out and out[-1].startswith(f'<{tag}>') and tag == 'ol' and first_num > 1:
                out[-1] = out[-1][:-len(f'</{tag}>')] + lis + f'</{tag}>'
            else:
                out.append(f'<{tag}>{lis}</{tag}>')
        else:
            out.append('<p>' + '<br>'.join(inline(l, item, refs) for l in lines) + '</p>')
    return ''.join(out)


def md_tokens(md, item):
    return re.sub(r'\{([A-Z0-9_]+)\}', lambda m: '{{' + canon(m.group(1), item) + '}}', md)


# 目次の材料（出した記事だけを「いま読める」に載せるため、ページの中で組み立てる）
idx_item = next((i for i in ITEMS if i['key'] == 'S30_INDEX'), None)
if idx_item:
    # 目次の各記事の「不安」の一行（はじめの目次記事から。index-anxiety.json）
    ENTRY = {}
    for key, anxiety in json.loads((HERE / 'index-anxiety.json').read_text(encoding='utf-8')).items():
        n = int(key)
        nd = next(SER.glob(f'{n:02d}-*'))
        ENTRY[n] = dict(n=n, title=(nd / 'article.md').read_text(encoding='utf-8').split('\n', 1)[0][2:].strip(),
                        anxiety=anxiety)
    assert len(ENTRY) == 30
    cur = idx_item['body_md']
    intro_md, rest = cur.split('\n## 道1', 1)
    intro_md = re.sub(r'いま読めるのは、そのうちの\d+本。残りの\d+本も、', 'いま読めるのは、そのうちの%%NNOW%%本。残りの%%NREST%%本も、',
                      intro_md).rstrip('\n') + '\n'
    assert '%%NNOW%%' in intro_md
    paths_part, after = ('## 道1' + rest).split('\n## 先に読むなら', 1)
    after_md = '## 先に読むなら' + after.rstrip('\n') + '\n'
    PATHS = []
    for sec in re.split(r'\n(?=## 道\d)', paths_part.strip('\n')):
        header = sec.split('\n', 1)[0][3:].strip()
        nums = sorted({int(x) for x in re.findall(r'^(?:\*\*|- )(\d{2})　', sec, re.M)})
        PATHS.append(dict(header=header, nums=nums))
    idx_refs = set()
    INDEX = dict(
        introMd=md_tokens(intro_md, idx_item), introHtml=md_html(intro_md, idx_item, set()),
        afterMd=md_tokens(after_md, idx_item), afterHtml=md_html(after_md, idx_item, idx_refs),
        afterRefs=sorted(idx_refs, key=ORDER.index), paths=PATHS, entries=ENTRY,
    )

else:
    INDEX = {}

data = []
files = {}
for i, it in enumerate(ITEMS, 1):
    refs = set()
    body_html = md_html(it['body_md'], it, refs)
    extra = dict(it['extra'])
    if 'teaser' in extra:
        extra['teaser_html'] = md_html(extra['teaser'], it, refs)
    if 'closing' in extra:
        closing = extra.pop('closing')
        extra.update(closing_html=md_html(closing, it, set()), closing_md=md_tokens(closing, it))
    if 'rest' in extra:
        rest = extra.pop('rest')
        extra.update(rest_html=md_html(rest, it, set()), rest_md=md_tokens(rest, it), rest_chars=len(re.sub(r'\s', '', rest)))
    paid = {}
    pp = None if it['pending'] else paid_plan(it)
    if pp:
        prefs = set()
        block = pp['block'].strip('\n') + '\n\n'
        phtml = md_html(block, it, prefs)
        assert prefs and all(p.startswith('PAID_') for p in prefs), (it['key'], prefs)
        paid = dict(paid=dict(keys=sorted(prefs, key=ORDER.index), md=md_tokens(block, it), html=phtml,
                              atMd=pp['atMd'], atHtml=pp['atHtml'], mode=pp['mode'], where=pp['where']))
        # 差しこむ場所が本文にあるか（目次は、ページの中で組み立てる本文の「あと」の部分で確かめる）
        src_md = INDEX['afterMd'] if it['key'] == 'S30_INDEX' else md_tokens(it['body_md'], it)
        src_html = INDEX['afterHtml'] if it['key'] == 'S30_INDEX' else md_html(it['body_md'], it, set())
        assert src_md.count(pp['atMd']) == 1 and src_html.count(pp['atHtml']) == 1, (it['key'], pp['atMd'])
    img = f"img/{it['key'].lower().replace('_', '-')}.jpg" if it['image'] else ''
    if img:
        files[img] = it['image']
    nxt = {}
    if it['next_md']:
        nrefs = set()
        nxt = dict(nextMd=md_tokens(it['next_md'], it), nextHtml=md_html(it['next_md'], it, nrefs))
        assert len(nrefs) == 1, it['key']
        nxt['nextKey'] = nrefs.pop()
    if it['pending']:
        # 確かめていない書き直しは、本文を載せない
        body_html, refs, nxt = '', set(), {}
        it = dict(it, body_md='', tags=[], desc='')
    data.append(dict(
        order=i, key=it['key'], group=it['group'], kind=it['kind'], label=it['label'], folder=it['folder'],
        title=it['title'], md=md_tokens(it['body_md'], it), html=body_html, tags=it['tags'], desc=it['desc'],
        img=img, imgName=f"mouton-{it['key'].lower().replace('_', '-')}.jpg",
        refs=sorted(refs, key=ORDER.index), extra=extra, chars=len(re.sub(r'\s', '', it['body_md'])),
        pending=it['pending'], **nxt, **paid,
    ))

prof = (NOTE / 'profile' / 'profile.md').read_text(encoding='utf-8')
profile = dict(
    name=re.search(r'## 名前\n\n\*\*`(.+?)`\*\*', prof).group(1),
    id=re.search(r'## note ID[^\n]*\n\n\*\*`(.+?)`\*\*', prof).group(1),
    idAlt=re.search(r'使われていたら `(.+?)`', prof).group(1),
    bio=re.search(r'## 自己紹介[^\n]*\n\n```\n(.+?)\n```', prof, re.S).group(1),
    site=re.search(r'^- サイト：`(.+?)`', prof, re.M).group(1),
    x=re.search(r'^- X：`(.+?)`', prof, re.M).group(1),
    icon='img/profile-icon.png', header='img/profile-header.jpg',
)
files['img/profile-icon.png'] = 'note/profile/icon.png'
files['img/profile-header.jpg'] = 'note/profile/header.jpg'
# マガジン（note/magazines/magazines.json）
MAGS = json.loads((NOTE / 'magazines' / 'magazines.json').read_text(encoding='utf-8'))
for _m in MAGS:
    _m['img'] = f"img/magazine-{_m['id']}.jpg"
    files[_m['img']] = f"note/magazines/{_m['id']}.jpg"


def blob(x):
    return json.dumps(x, ensure_ascii=False).replace('</', '<\\/')


template = (HERE / 'kit_template.html').read_text(encoding='utf-8')
page = (template.replace('/*KIT_DATA*/[]', blob(data)).replace('/*KIT_PROFILE*/{}', blob(profile))
        .replace('/*KIT_GROUPS*/[]', blob(GROUPS)).replace('/*KIT_INDEX*/{}', blob(INDEX))
        .replace('/*KIT_MAGS*/[]', blob(MAGS)))
assert '/*KIT_' not in page
(OUT / 'index.html').write_text(page, encoding='utf-8')
(OUT / 'files.json').write_text(json.dumps(files, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(data), 'items', (OUT / 'index.html').stat().st_size, 'bytes')
for x in data:
    print(f"{x['order']:2d} {x['group']:5s} {x['key']:18s} refs={','.join(x['refs'])} next={x.get('nextKey', '-')} paid={','.join(x['paid']['keys']) if x.get('paid') else '-'}{' （確認中）' if x['pending'] else ''}")
print('index after refs:', INDEX.get('afterRefs'))
