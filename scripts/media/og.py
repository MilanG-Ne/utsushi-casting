"""
Open Graph cards (1200x630 JPEG) per page and language, plus the square logo used in
Organization structured data. Run after generate.py:

    python3 scripts/media/og.py

Requires Pillow, fontTools + brotli (to read the WOFF2 display font) and the Noto CJK
fonts for Japanese text.
"""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "media" / "og"
IMG = ROOT / "public" / "media" / "img"
PAPER, INK, MUTED, ACCENT = (246, 242, 235), (23, 20, 15), (77, 70, 61), (176, 48, 27)
NOTO_SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"
NOTO_SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc"
W, H = 1200, 630


def fraunces_path() -> str:
    font = TTFont(ROOT / "app" / "fonts" / "fraunces-latin-wght.woff2")
    font.flavor = None
    tmp = Path(tempfile.gettempdir()) / "fraunces-og.ttf"
    font.save(tmp)
    return str(tmp)


FRAUNCES = fraunces_path()


def display_font(lang: str, size: int) -> ImageFont.FreeTypeFont:
    if lang == "ja":
        return ImageFont.truetype(NOTO_SERIF, size, index=0)
    f = ImageFont.truetype(FRAUNCES, size)
    try:
        f.set_variation_by_axes([400])
    except Exception:
        pass
    return f


def sans_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(NOTO_SANS, size, index=0)


def wrap(draw: ImageDraw.ImageDraw, text: str, font, width: int, lang: str) -> list[str]:
    units = list(text) if lang == "ja" else text.split(" ")
    joiner = "" if lang == "ja" else " "
    lines, current = [], ""
    for unit in units:
        trial = f"{current}{joiner if current else ''}{unit}"
        if draw.textlength(trial, font=font) <= width or not current:
            current = trial
        else:
            lines.append(current)
            current = unit
    if current:
        lines.append(current)
    # Keep Japanese punctuation off the start of a line.
    if lang == "ja":
        for i in range(1, len(lines)):
            while lines[i] and lines[i][0] in "、。」』）・ー":
                lines[i - 1] += lines[i][0]
                lines[i] = lines[i][1:]
    return [l for l in lines if l]


def brand_mark(draw: ImageDraw.ImageDraw, x: int, y: int, s: int) -> None:
    k = s / 32
    w = max(2, int(2.6 * k))
    for pts in [[(3, 10), (3, 3), (10, 3)], [(22, 3), (29, 3), (29, 10)], [(29, 22), (29, 29), (22, 29)], [(10, 29), (3, 29), (3, 22)]]:
        draw.line([(x + px * k, y + py * k) for px, py in pts], fill=ACCENT, width=w, joint="curve")
    r = 4.4 * k
    draw.ellipse((x + 16 * k - r, y + 16 * k - r, x + 16 * k + r, y + 16 * k + r), fill=ACCENT)


def card(entry: dict) -> Image.Image:
    lang = entry["lang"]
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    text_w = 1040
    if entry.get("image"):
        photo = Image.open(IMG / f"{entry['image']}-1200.webp").convert("RGB")
        pw = 470
        scale = H / photo.height
        photo = photo.resize((int(photo.width * scale), H), Image.LANCZOS)
        left = (photo.width - pw) // 2
        im.paste(photo.crop((left, 0, left + pw, H)), (W - pw, 0))
        text_w = W - pw - 160
    brand_mark(d, 80, 72, 44)
    d.text((140, 74), "Utsushi Casting" if lang == "en" else "ウツシ・キャスティング", font=display_font(lang, 30), fill=INK)
    d.text((80, 200), entry["eyebrow"].upper() if lang == "en" else entry["eyebrow"], font=sans_font(22), fill=MUTED)
    size = 64 if entry.get("image") else 72
    font = display_font(lang, size)
    lines = wrap(d, entry["title"], font, text_w, lang)
    while len(lines) > 4 and size > 40:
        size -= 6
        font = display_font(lang, size)
        lines = wrap(d, entry["title"], font, text_w, lang)
    y = 250
    for line in lines:
        d.text((80, y), line, font=font, fill=INK)
        y += int(size * (1.3 if lang == "ja" else 1.12))
    d.line((80, H - 70, 200, H - 70), fill=ACCENT, width=4)
    d.text((80, H - 58), "utsushi-casting · fictional studio" if lang == "en" else "架空のスタジオ（ポートフォリオ用デモ）", font=sans_font(18), fill=MUTED)
    return im


def logo() -> None:
    im = Image.new("RGB", (512, 512), PAPER)
    brand_mark(ImageDraw.Draw(im), 96, 96, 320)
    im.save(ROOT / "public" / "media" / "logo.png", optimize=True)
    im.resize((180, 180), Image.LANCZOS).save(ROOT / "public" / "apple-touch-icon.png", optimize=True)


def main() -> None:
    data = json.loads(subprocess.run(["pnpm", "-s", "tsx", "scripts/media/og-data.ts"], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    OUT.mkdir(parents=True, exist_ok=True)
    for entry in data:
        card(entry).save(OUT / f"{entry['key']}-{entry['lang']}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
        print(f"og {entry['key']}-{entry['lang']}")
    logo()


if __name__ == "__main__":
    main()
