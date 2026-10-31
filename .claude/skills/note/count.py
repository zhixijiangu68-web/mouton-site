# note の本文の字数を数える（2026-10-22 の決まり：数えるのは本文だけ。見出し記号・参考文献・空白を除く）。
#   python3 count.py note/<slug>/article.md
# 除くもの：1行目の題、「## 参考文献」から下、URL だけの行、【本人が書く】の行、健康の注記の行、見出し記号（# の並び）、空白。
import re, sys
for path in sys.argv[1:]:
    lines = open(path, encoding='utf-8').read().split('\n')
    title = lines[0].lstrip('# ').strip()
    body = []
    for l in lines[1:]:
        if re.match(r'^#+\s*参考文献', l):
            break
        s = l.strip()
        if s.startswith('http') or s.startswith('【本人が書く') or s.startswith('この記事は一般的な情報'):
            continue
        body.append(re.sub(r'^#+\s*', '', s))
    n = len(re.sub(r'\s', '', ''.join(body)))
    ok = 2000 <= n <= 4000
    print(f'{path}: 本文 {n}字（2,000〜4,000字 {"OK" if ok else "NG"}）／題 {len(title)}字')
