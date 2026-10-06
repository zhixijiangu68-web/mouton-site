"""Extract philosophy articles from src/articles/ into plain Markdown drafts.

The output (book/source/) is a starting point for the manuscript; the
manuscript itself (book/manuscript/) is edited by hand afterwards.
Usage: python3 book/scripts/extract.py
"""
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'book' / 'source'

for path in sorted((ROOT / 'src' / 'articles').glob('*.html')):
    text = path.read_text()
    _, front, body = text.split('---', 2)
    if not re.search(r'^category:\s*philosophy\s*$', front, re.M):
        continue
    headline = re.search(r'^headline:\s*"(.*)"', front, re.M).group(1)
    deck = re.search(r'<p class="deck">(.*?)</p>', body, re.S)
    article = re.search(r'<article[^>]*>(.*)</article>', body, re.S).group(1)
    # Web-only parts: share buttons, includes, template variables.
    article = re.sub(r'<div class="article-share">.*?</div></div>', '', article, flags=re.S)
    article = re.sub(r'\{%.*?%\}|\{\{.*?\}\}', '', article, flags=re.S)
    article = re.sub(r'<h1.*?</h1>|<div class="(?:meta|eyebrow)">.*?</div>|<p class="(?:reading-time|deck)">.*?</p>'
                     r'|<details class="reading-toc">.*?</details>', '', article, flags=re.S)
    md = subprocess.run(
        ['pandoc', '-f', 'html', '-t', 'markdown-raw_html-native_divs-native_spans-fenced_divs-bracketed_spans-header_attributes-link_attributes',
         '--wrap=none'],
        input=article, capture_output=True, text=True, check=True).stdout
    head = f'# {headline}\n\n'
    if deck:
        head += '> ' + re.sub(r'<[^>]+>', '', deck.group(1)).strip() + '\n\n'
    (OUT / f'{path.stem}.md').write_text(head + md)
    print(path.stem)
