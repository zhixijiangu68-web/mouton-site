"""Turn book/source/*.md into first manuscript drafts (book/manuscript/).

Mechanical clean-up only: web-only lines, English labels on callouts,
links between articles, citation markup. Run once; the manuscript is then
edited by hand, so this script refuses to overwrite existing files.
Usage: python3 book/scripts/draft.py
"""
import pathlib
import re

BOOK = pathlib.Path(__file__).resolve().parents[1]

ORDER = [
    'identity', 'self-image', 'influence',
    'comparison', 'disliked-priority', 'boundaries', 'freedom',
    'fear', 'goggins', 'hill',
    'system-goal', 'social-media-time', 'doing-nothing',
    'refined-taste', 'denim-leather', 'music-life',
    'nietzsche',
]
LABEL = re.compile(r"^[A-Z0-9][A-Z0-9 /,.&'’-]*$")

for n, slug in enumerate(ORDER, 1):
    out = BOOK / 'manuscript' / f'{n:02d}-{slug}.md'
    if out.exists():
        continue
    text = (BOOK / 'source' / f'{slug}.md').read_text()
    text = text.replace('リンクをコピー', '')
    # Citations: ^[\[1\]](#ref-1)^ and [\[1\]](#ref-1) -> ［1］
    text = re.sub(r'\^?\[\\\[(\d+)\\\]\]\(#ref-\d+\)\^?', r'［\1］', text)
    # Links to other articles keep their text only.
    text = re.sub(r'\[([^\]]+)\]\([\w-]+\.html\)', r'\1', text)
    lines, quote_next = [], False
    for line in text.split('\n'):
        if LABEL.match(line.strip()) and line.strip():
            quote_next = True  # the callout text follows the label
            continue
        if quote_next and line.strip():
            line, quote_next = '> ' + line, False
        lines.append(line)
    text = re.sub(r'\n{3,}', '\n\n', '\n'.join(lines)).strip() + '\n'
    out.write_text(text)
    print(out.name)
