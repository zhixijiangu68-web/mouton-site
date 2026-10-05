#!/usr/bin/env python3
"""ムートン YouTube 第1本「神は死んだ」書き出しスクリプト

assets/ に素材を置いて実行すると、edit.csv（映像設計）と telops.csv（大きなテロップ）に従って
8:01 版の動画を out/ に書き出す。必要なのは Python 3 と ffmpeg だけ。

  python3 render.py --check     素材・字幕のチェックだけ行う（書き出さない）
  python3 render.py --preview   960x540 の確認用を速く書き出す
  python3 render.py             1920x1080 / 30fps の本番を書き出す

素材の置き場所（README.md 参照）
  assets/narration.mp3          Elias 最終ナレーション（動画全体の基準）
  assets/subtitles.srt          最終字幕
  assets/bgm.mp3                BGM（任意）
  assets/clips/<名前>.mp4 等     edit.csv の clip 列の名前。動画 / 画像どちらでもよい
"""
import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
CLIPS = ASSETS / "clips"
WORK = HERE / "work"
OUT = HERE / "out"
FONTS = HERE.parent / ".fonts"

FPS = 30
XFADE = 0.8          # 映像の切り替え（クロスフェード）秒数
TAIL = 4.5           # ナレーション終了後に映像を残す秒数
END_FADE = 2.5       # 最後の黒へのフェード秒数
ZOOM = 0.05          # 1カットの間にゆっくり寄る量（5%）
MIN_SPEED = 0.7      # 素材が短いときのスローの下限（0.7倍）
BGM_DB = -27         # BGM の音量（ナレーションが主役なので小さく）
TARGET_LEN = 8 * 60 + 1

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}

FONT_SOURCES = {
    "NotoSerifJP-Black.ttf": "Noto+Serif+JP:wght@900",
    "NotoSansJP-Medium.ttf": "Noto+Sans+JP:wght@500",
}


# ── 小道具 ─────────────────────────────────────────

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("ffmpeg が失敗しました:\n" + " ".join(map(str, cmd)) + "\n" + r.stderr[-3000:])
    return r.stdout


def duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)])
    return float(json.loads(out)["format"]["duration"])


def parse_time(s):
    m, sec = s.strip().split(":")
    return int(m) * 60 + float(sec)


def fmt(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


def find_clip(name):
    for p in sorted(CLIPS.glob(name + ".*")):
        if p.suffix.lower() in VIDEO_EXT | IMAGE_EXT:
            return p
    return None


def ensure_fonts():
    FONTS.mkdir(exist_ok=True)
    for fname, family in FONT_SOURCES.items():
        dest = FONTS / fname
        if dest.exists():
            continue
        # 古い UA だと Google Fonts は分割されていない TTF を返す
        req = urllib.request.Request(f"https://fonts.googleapis.com/css2?family={family}",
                                     headers={"User-Agent": "Mozilla/4.0"})
        css = urllib.request.urlopen(req).read().decode()
        url = re.search(r"url\((https://[^)]+)\)", css).group(1)
        dest.write_bytes(urllib.request.urlopen(url).read())
    return FONTS / "NotoSerifJP-Black.ttf"


# ── 字幕 ───────────────────────────────────────────

def read_srt(path):
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    cues = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = block.strip().split("\n")
        idx = next((i for i, l in enumerate(lines) if "-->" in l), None)
        if idx is None:
            continue
        a, b = [x.strip().replace(",", ".") for x in lines[idx].split("-->")]
        to_s = lambda t: sum(float(x) * m for x, m in zip(t.split(":"), (3600, 60, 1)))
        cues.append({"start": to_s(a), "end": to_s(b.split()[0]), "text": "\n".join(lines[idx + 1:]).strip()})
    return cues


def flat(s):
    return re.sub(r"\s", "", s)


def write_ass(cues, path, scale):
    def ts(t):
        cs = int(round(t * 100))
        return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"
    w, h = int(1920 * scale), int(1080 * scale)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans JP Medium,{round(50 * scale)},&H00F0F2F4,&H00F0F2F4,&H00101010,&H90000000,0,0,0,0,100,100,{2 * scale:.1f},0,1,{1.6 * scale:.1f},{2.2 * scale:.1f},2,{round(160 * scale)},{round(160 * scale)},{round(78 * scale)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    rows = []
    for c in cues:
        body = c["text"].replace("\n", "\\N")
        rows.append(f"Dialogue: 0,{ts(c['start'])},{ts(c['end'])},Default,,0,0,0,,{body}")
    path.write_text(head + "\n".join(rows) + "\n", encoding="utf-8")


def resolve_telops(cues):
    """telops.csv の phrase を字幕から探し、表示時刻を決める。"""
    telops = []
    with open(HERE / "telops.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            hit = next((i for i, c in enumerate(cues) if flat(row["phrase"]) in flat(c["text"])), None)
            if hit is None:
                telops.append({**row, "missing": True})
                continue
            c = cues[hit]
            nxt = cues[hit + 1]["start"] if hit + 1 < len(cues) else c["end"] + 3
            # 発話のあとの「間」にも少し残す。ただし次の文が始まる前に消す
            end = min(c["end"] + 2.0, max(c["end"], nxt - 0.2))
            telops.append({**row, "cue": hit, "start": c["start"], "end": end})
    return telops


# ── チェック ────────────────────────────────────────

def check(edit, narration_len):
    problems = 0

    def warn(msg):
        nonlocal problems
        problems += 1
        print("  ⚠ " + msg)

    print("■ ナレーション")
    if narration_len is None:
        warn("assets/narration.mp3 がありません")
    else:
        print(f"  長さ {fmt(narration_len)}（予定 {fmt(TARGET_LEN)}）")
        if abs(narration_len - TARGET_LEN) > 3:
            warn("予定の 8:01 と 3 秒以上違います。edit.csv の時刻を見直してください")

    print("■ 字幕")
    srt = ASSETS / "subtitles.srt"
    cues = []
    if not srt.exists():
        warn("assets/subtitles.srt がありません")
    else:
        cues = read_srt(srt)
        print(f"  {len(cues)} 行 / {fmt(cues[0]['start'])} 〜 {fmt(cues[-1]['end'])}")
        for i, c in enumerate(cues):
            n = i + 1
            d = c["end"] - c["start"]
            chars = len(flat(c["text"]))
            if d <= 0:
                warn(f"#{n} 終了が開始より前です ({fmt(c['start'])})")
            elif d < 1.0:
                warn(f"#{n} 表示が {d:.2f} 秒しかありません ({fmt(c['start'])}) 「{flat(c['text'])}」")
            elif chars / d > 8:
                warn(f"#{n} 1秒あたり {chars / d:.1f} 文字で、読み切れない可能性があります ({fmt(c['start'])})")
            for line in c["text"].split("\n"):
                if len(line) > 26:
                    warn(f"#{n} 1行 {len(line)} 文字で長すぎます（目安 26 文字）({fmt(c['start'])}) 「{line}」")
            if i and c["start"] < cues[i - 1]["end"] - 0.01:
                warn(f"#{n} 前の字幕と重なっています ({fmt(c['start'])})")
            if re.search(r"[A-Za-z0-9]", c["text"]) and re.search(r"[Ａ-Ｚａ-ｚ０-９]", c["text"]):
                warn(f"#{n} 全角と半角の英数字が混ざっています ({fmt(c['start'])})")
        if narration_len and cues[-1]["end"] > narration_len + 0.5:
            warn("最後の字幕がナレーションより後まで続いています")

        print("■ テロップ")
        for t in sorted(resolve_telops(cues), key=lambda t: t.get("start", 0)):
            if t.get("missing"):
                warn(f"「{t['phrase']}」が字幕に見つかりません（telops.csv の phrase を直してください）")
            else:
                print(f"  {fmt(t['start'])}〜{fmt(t['end'])}  {t['text']}")

    print("■ 映像素材")
    missing = {}
    for r in edit:
        if r["clip"] == "BLACK":
            continue
        p = find_clip(r["clip"])
        need = r["end"] - r["start"]
        if not p:
            missing.setdefault(r["clip"], []).append(fmt(r["start"]).split(".")[0])
        elif p.suffix.lower() in VIDEO_EXT:
            src = duration(p)
            if src * (1 / MIN_SPEED) < need:
                warn(f"{p.name} は {src:.1f} 秒。{need:.0f} 秒には 0.7倍スローでも足りず、"
                     f"最後の {need - src / MIN_SPEED:.1f} 秒は静止画になります（{fmt(r['start'])}〜）")
    for name, at in missing.items():
        warn(f"{name} がありません（{', '.join(at)} で使用。仮画面で書き出します）")
    print(f"\n問題 {problems} 件" if problems else "\n問題なし")
    return cues


# ── 書き出し ────────────────────────────────────────

def load_edit(total):
    rows = []
    with open(HERE / "edit.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            end = total if r["end"].strip() == "END" else parse_time(r["end"])
            rows.append({"start": parse_time(r["start"]), "end": end,
                         "clip": r["clip"].strip(), "effect": r["effect"].strip()})
    for a, b in zip(rows, rows[1:]):
        if abs(a["end"] - b["start"]) > 0.01:
            sys.exit(f"edit.csv の時刻が連続していません: {fmt(a['end'])} → {fmt(b['start'])}")
    return rows


def render_segment(i, r, length, scale, preset, font):
    """1カットを length 秒の無音動画にする。"""
    w, h = int(1920 * scale), int(1080 * scale)
    frames = round(length * FPS)
    dst = WORK / f"seg{i:03d}.mp4"
    p = find_clip(r["clip"]) if r["clip"] != "BLACK" else None
    zoom = ZOOM if r["effect"] == "zoom" else 0
    zp = (f"zoompan=z='1+{zoom}*on/{frames}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          f":s={w}x{h}:fps={FPS}")

    if r["clip"] == "BLACK":
        inp = ["-f", "lavfi", "-i", f"color=c=black:s={w}x{h}:r={FPS}"]
        vf = "null"
    elif p is None:
        # 素材がまだないカットは、名前入りの仮画面にする
        inp = ["-f", "lavfi", "-i", f"color=c=0x1c1c1c:s={w}x{h}:r={FPS}"]
        vf = (f"drawtext=fontfile={font}:text='{r['clip']}':fontcolor=0x777777:"
              f"fontsize={int(48 * scale)}:x=(w-text_w)/2:y=(h-text_h)/2")
    elif p.suffix.lower() in IMAGE_EXT:
        inp = ["-loop", "1", "-framerate", str(FPS), "-i", str(p)]
        big = 2  # 拡大してから寄ると、ズームがガタつかない
        vf = (f"scale={w * big}:{h * big}:force_original_aspect_ratio=increase,"
              f"crop={w * big}:{h * big},setsar=1," + zp)
    else:
        src = duration(p)
        speed = 1.0 if src >= length else max(MIN_SPEED, src / length)
        inp = ["-i", str(p)]
        vf = (f"setpts=PTS/{speed:.4f},fps={FPS},tpad=stop_mode=clone:stop_duration={length:.2f},"
              f"scale={int(w * 1.5)}:{int(h * 1.5)}:force_original_aspect_ratio=increase,"
              f"crop={int(w * 1.5)}:{int(h * 1.5)},setsar=1," + zp)
    run(["ffmpeg", "-y", "-v", "error", *inp, "-vf", vf + ",format=yuv420p", "-frames:v", str(frames),
         "-an", "-c:v", "libx264", "-preset", preset, "-crf", "16", str(dst)])
    return dst


def drawtext_escape(s):
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="チェックだけ行う")
    ap.add_argument("--preview", action="store_true", help="960x540 の確認用を速く書き出す")
    args = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg が見つかりません")

    narration = ASSETS / "narration.mp3"
    narration_len = duration(narration) if narration.exists() else None
    total = (narration_len or TARGET_LEN) + TAIL
    edit = load_edit(total)
    cues = check(edit, narration_len)
    if args.check:
        return
    if narration_len is None or not cues:
        sys.exit("\nナレーションと字幕がそろうまで書き出せません")

    scale, preset = (0.5, "ultrafast") if args.preview else (1.0, "medium")
    w, h = int(1920 * scale), int(1080 * scale)
    font = ensure_fonts()
    WORK.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)

    # 1. カットごとに書き出す（次のカットと重なる分だけ長くする）
    segs = []
    for i, r in enumerate(edit):
        last = i == len(edit) - 1
        length = r["end"] - r["start"] + (0 if last else XFADE)
        print(f"\rカット {i + 1}/{len(edit)} {r['clip']:<20}", end="", flush=True)
        segs.append(render_segment(i, r, length, scale, preset, font))
    print()

    # 2. クロスフェードでつなぎ、字幕・テロップ・最後の暗転を重ねる
    telops = [t for t in resolve_telops(cues) if not t.get("missing")]
    covered = {t["cue"] for t in telops if len(flat(cues[t["cue"]]["text"])) <= len(flat(t["text"])) + 2}
    ass = WORK / "subtitles.ass"
    write_ass([c for i, c in enumerate(cues) if i not in covered], ass, scale)

    inputs, chain = [], []
    for s in segs:
        inputs += ["-i", str(s)]
    prev = "[0:v]"
    for i in range(1, len(segs)):
        chain.append(f"{prev}[{i}:v]xfade=transition=fade:duration={XFADE}:offset={edit[i]['start']:.3f}[x{i}]")
        prev = f"[x{i}]"
    post = [f"ass={ass}:fontsdir={FONTS}"]
    for t in telops:
        a, b, fd = t["start"], t["end"], 0.8
        tf = WORK / f"telop{t['cue']}.txt"
        tf.write_text(t["text"], encoding="utf-8")
        alpha = f"if(lt(t,{a + fd:.2f}),(t-{a:.2f})/{fd},if(gt(t,{b - fd:.2f}),({b:.2f}-t)/{fd},1))"
        post.append(f"drawtext=fontfile={font}:textfile={tf}:fontsize={int(int(t['size']) * scale)}:"
                    f"fontcolor=0xF2F0EB:shadowcolor=black@0.6:shadowx={int(3 * scale)}:shadowy={int(3 * scale)}:"
                    f"x=(w-text_w)/2:y=(h-text_h)/2-{int(40 * scale)}:"
                    f"alpha='{drawtext_escape(alpha)}':enable='between(t,{a:.2f},{b:.2f})'")
    post.append(f"fade=t=out:st={total - END_FADE:.2f}:d={END_FADE}")
    chain.append(f"{prev}{','.join(post)},format=yuv420p[v]")

    # 3. 音声：ナレーションはそのまま。BGM は小さく流し、最初と最後をフェード
    n = len(segs)
    inputs += ["-i", str(narration)]
    audio = f"[{n}:a]apad=whole_dur={total:.2f}[nar]"
    bgm = ASSETS / "bgm.mp3"
    if bgm.exists():
        inputs += ["-stream_loop", "-1", "-i", str(bgm)]
        audio += (f";[{n + 1}:a]volume={BGM_DB}dB,atrim=0:{total:.2f},afade=t=in:d=4,"
                  f"afade=t=out:st={total - 6:.2f}:d=6[bg];[nar][bg]amix=inputs=2:normalize=0:duration=first[a]")
    else:
        audio += ";[nar]anull[a]"
    chain.append(audio)

    out = OUT / ("ep01-nietzsche-preview.mp4" if args.preview else "ep01-nietzsche.mp4")
    (WORK / "filter.txt").write_text(";\n".join(chain), encoding="utf-8")
    print("仕上げ中…")
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex_script", str(WORK / "filter.txt"),
         "-map", "[v]", "-map", "[a]", "-t", f"{total:.2f}", "-r", str(FPS),
         "-c:v", "libx264", "-preset", preset, "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])
    print(f"完成: {out}（{fmt(duration(out))}, {w}x{h}）")


if __name__ == "__main__":
    main()
