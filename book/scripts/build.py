"""Build the EPUB (book/dist/kijun.epub) from book/manuscript/.

Parts and the foreword/afterword are level-1 headings; each essay's own
headings are shifted down one level so it nests under its part.
Usage: python3 book/scripts/build.py
"""
import pathlib
import re
import subprocess
import tempfile

BOOK = pathlib.Path(__file__).resolve().parents[1]
M = BOOK / 'manuscript'

PARTS = {
    'part1': ['01-identity', '02-self-image', '03-influence'],
    'part2': ['04-comparison', '05-disliked-priority', '06-boundaries', '07-freedom'],
    'part3': ['08-fear', '09-goggins', '10-hill'],
    'part4': ['11-system-goal', '12-social-media-time', '13-doing-nothing'],
    'part5': ['14-refined-taste', '15-denim-leather', '16-music-life'],
    'part6': ['17-nietzsche'],
}


def shift(text):
    # One level down; a chapter's 参考文献 heading becomes a plain bold line
    # so it doesn't clutter the table of contents.
    text = re.sub(r'^## 参考文献$', '**参考文献**', text, flags=re.M)
    return re.sub(r'^(#+) ', r'#\1 ', text, flags=re.M)


pieces = [(M / '00-hajimeni.md').read_text()]
for part, chapters in PARTS.items():
    pieces.append((M / f'{part}.md').read_text())
    pieces += [shift((M / f'{c}.md').read_text()) for c in chapters]
pieces.append((M / '99-owarini.md').read_text())

dist = BOOK / 'dist'
dist.mkdir(exist_ok=True)
with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False) as f:
    f.write('\n\n'.join(pieces))
args = ['pandoc', f.name, str(BOOK / 'metadata.yaml'),
        '-f', 'markdown', '-t', 'epub3', '--split-level=2', '--toc', '--toc-depth=2',
        '--css', str(BOOK / 'epub.css'), '-o', str(dist / 'kijun.epub')]
cover = BOOK / 'cover' / 'cover.jpg'
if cover.exists():
    args += ['--epub-cover-image', str(cover)]
subprocess.run(args, check=True)
# A Markdown copy of the whole manuscript, for proofreading in one file.
(dist / 'kijun.md').write_text('\n\n'.join(pieces))
print('wrote', dist / 'kijun.epub')
