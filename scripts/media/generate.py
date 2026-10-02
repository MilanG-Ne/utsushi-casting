"""
Generates every image and video used by the demo site. All artwork is procedural:
no photographs, stock footage or people. Re-run with:

    python3 scripts/media/generate.py            # images + videos
    python3 scripts/media/generate.py --images   # images only

Requires Python 3.10+, numpy, Pillow (with AVIF/WebP) and ffmpeg (libx264).
Outputs:
    public/media/img/<name>-<width>.{avif,webp}   responsive variants
    public/media/video/<name>.mp4                  silent H.264 clips, no autoplay on the site
    content/seed/media-manifest.json               dimensions + LQIP used by the fixture source
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = ROOT / "public" / "media" / "img"
VIDEO_DIR = ROOT / "public" / "media" / "video"
MANIFEST = ROOT / "content" / "seed" / "media-manifest.json"

W, H = 1920, 1080
WIDTHS = [480, 800, 1200, 1600, 1920]


# --------------------------------------------------------------------------- helpers

def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def vertical_gradient(h: int, w: int, stops: list[tuple[float, tuple[int, int, int]]]) -> np.ndarray:
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        xs = [s[0] for s in stops]
        vs = [s[1][c] / 255.0 for s in stops]
        out[:, :, c] = np.interp(ys, xs, vs)[:, None]
    return out


def gaussian_sprite(radius: float, sharpness: float = 2.2) -> np.ndarray:
    """Soft disk (bokeh) with a halo, as a 2D float mask in [0, 1] that fades to 0 at its edges."""
    r = int(math.ceil(radius * 4.0)) + 1
    yy, xx = np.mgrid[-r : r + 1, -r : r + 1].astype(np.float32)
    dist = np.sqrt(xx**2 + yy**2)
    d = dist / max(radius, 1e-3)
    disk = 1.0 / (1.0 + np.power(d, 2 * sharpness))
    halo = np.exp(-(d**2) / 2.0) * 0.3
    window = np.clip(1 - (dist / r) ** 2, 0, 1) ** 2
    return np.clip((disk + halo) * window, 0, 1)


def add_sprite(canvas: np.ndarray, sprite: np.ndarray, cx: float, cy: float, color: tuple[float, float, float], strength: float) -> None:
    h, w = canvas.shape[:2]
    sh, sw = sprite.shape
    x0, y0 = int(round(cx - sw / 2)), int(round(cy - sh / 2))
    x1, y1 = x0 + sw, y0 + sh
    cx0, cy0, cx1, cy1 = max(x0, 0), max(y0, 0), min(x1, w), min(y1, h)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    patch = sprite[cy0 - y0 : cy1 - y0, cx0 - x0 : cx1 - x0][:, :, None]
    canvas[cy0:cy1, cx0:cx1, :] += patch * np.array(color, dtype=np.float32) * strength


def vignette(h: int, w: int, amount: float = 0.55) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx, ny = (xx / w - 0.5) * 2, (yy / h - 0.5) * 2
    d = np.sqrt(nx**2 * 0.8 + ny**2)
    return np.clip(1 - amount * np.power(d / 1.4, 2.2), 0, 1)[:, :, None]


def tonemap(img: np.ndarray) -> np.ndarray:
    # Soft filmic roll-off so additive lights never clip harshly.
    return 1 - np.exp(-img * 1.35)


def grain(img: np.ndarray, seed: int, amount: float = 0.025) -> np.ndarray:
    noise = rng(seed).normal(0, amount, img.shape[:2]).astype(np.float32)[:, :, None]
    return img + noise


def to_image(img: np.ndarray) -> Image.Image:
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB")


def ridge(w: int, base: float, amp: float, seed: int, octaves: int = 4) -> np.ndarray:
    r = rng(seed)
    xs = np.linspace(0, 1, w)
    y = np.full(w, base, dtype=np.float32)
    for o in range(octaves):
        freq = 1.5 * (2**o)
        phase = r.uniform(0, 2 * math.pi)
        y += (amp / (1.8**o)) * np.sin(xs * freq * 2 * math.pi + phase)
    return y


# --------------------------------------------------------------------------- scenes
# Each scene renders at an arbitrary size and a time t in [0, 1] so stills and video
# frames come from the same code.


class Harbour:
    """Night harbour: city lights on the horizon, their reflections rippling on water."""

    def __init__(self, w: int, h: int, seed: int = 11):
        self.w, self.h = w, h
        s = w / 1920
        self.horizon = int(h * 0.56)
        self.bg = vertical_gradient(h, w, [(0, (8, 14, 30)), (0.45, (20, 38, 62)), (0.56, (34, 52, 70)), (0.6, (10, 20, 34)), (1, (4, 8, 16))])
        r = rng(seed)
        self.lights = []
        palette = [(1.0, 0.62, 0.28), (1.0, 0.78, 0.45), (0.95, 0.9, 0.8), (0.55, 0.75, 1.0), (1.0, 0.42, 0.25)]
        for _ in range(70):
            x = r.uniform(0.02, 0.98) * w
            y = self.horizon - r.uniform(4, 150) * s * (1 if r.random() < 0.8 else 2.2)
            radius = r.uniform(6, 30) * s
            self.lights.append((x, y, radius, palette[r.integers(len(palette))], r.uniform(0.35, 1.0), r.uniform(0, 2 * math.pi)))
        self.sprites: dict[int, np.ndarray] = {}

    def sprite(self, radius: float) -> np.ndarray:
        key = round(radius)
        if key not in self.sprites:
            self.sprites[key] = gaussian_sprite(radius)
        return self.sprites[key]

    def render(self, t: float) -> np.ndarray:
        w, h, hz = self.w, self.h, self.horizon
        lights = np.zeros_like(self.bg)
        for (x, y, radius, color, strength, phase) in self.lights:
            twinkle = 0.85 + 0.15 * math.sin(phase + t * 2 * math.pi * 3)
            add_sprite(lights, self.sprite(radius), x, y, color, strength * twinkle)
        # Reflection: mirror the lights about the horizon, smear vertically, then ripple.
        refl = np.zeros_like(lights)
        depth = min(hz, h - hz)
        refl[hz : hz + depth] = lights[hz - 1 : hz - 1 - depth : -1] if hz - 1 - depth >= 0 else lights[hz - 1 :: -1][:depth]
        k = max(3, int(h * 0.03))
        csum = np.cumsum(np.pad(refl, ((k, k), (0, 0), (0, 0))), axis=0)
        refl = (csum[2 * k :] - csum[: -2 * k])[: h] / (2 * k)
        rows = np.arange(h)
        shift = (np.sin(rows * 0.11 + t * 2 * math.pi * 2) * 7 + np.sin(rows * 0.037 - t * 2 * math.pi) * 10) * (w / 1920)
        shift *= np.clip((rows - hz) / (h * 0.15), 0, 1)
        cols = (np.arange(w)[None, :] + shift[:, None].astype(np.int32)) % w
        refl = refl[rows[:, None], cols]
        fade = np.clip(1 - (rows - hz) / (h - hz), 0, 1)[:, None, None] ** 0.8
        img = self.bg + lights + refl * 0.55 * fade
        img *= vignette(h, w, 0.6)
        return tonemap(img)


class Lanterns:
    """Dusk in a mountain village: layered ridges and floating lantern light."""

    def __init__(self, w: int, h: int, seed: int = 23):
        self.w, self.h = w, h
        s = w / 1920
        self.bg = vertical_gradient(h, w, [(0, (22, 18, 48)), (0.38, (70, 40, 70)), (0.6, (150, 72, 52)), (0.75, (60, 30, 36)), (1, (14, 10, 16))])
        self.ridges = []
        for i, (base, amp, shade) in enumerate([(0.52, 0.05, (40, 26, 46)), (0.62, 0.06, (26, 16, 30)), (0.74, 0.05, (14, 9, 16))]):
            self.ridges.append((ridge(w, base, amp, seed + i), np.array(shade, dtype=np.float32) / 255.0))
        r = rng(seed)
        self.lanterns = []
        for _ in range(26):
            depth = r.uniform(0.25, 1.0)
            self.lanterns.append(
                (r.uniform(0.04, 0.96) * w, r.uniform(0.18, 0.92) * h, (8 + 34 * depth) * s, depth, r.uniform(0, 2 * math.pi), r.uniform(0.6, 1.4))
            )

    def render(self, t: float) -> np.ndarray:
        w, h = self.w, self.h
        img = self.bg.copy()
        yy = np.arange(h)[:, None]
        for line, shade in self.ridges:
            mask = (yy >= (line[None, :] * h)).astype(np.float32)[:, :, None]
            img = img * (1 - mask) + shade * mask
        glow = np.zeros_like(img)
        for (x, y, radius, depth, phase, speed) in self.lanterns:
            yt = y - t * h * 0.08 * speed * depth
            xt = x + math.sin(phase + t * 2 * math.pi * speed) * 12 * depth
            flicker = 0.82 + 0.18 * math.sin(phase * 3 + t * 2 * math.pi * 7 * speed)
            add_sprite(glow, gaussian_sprite(radius, 1.6), xt, yt, (1.0, 0.55, 0.22), 1.25 * depth * flicker)
            add_sprite(glow, gaussian_sprite(radius * 0.35, 3.0), xt, yt, (1.0, 0.85, 0.6), 0.9 * depth * flicker)
        img = img + glow
        img *= vignette(h, w, 0.5)
        return tonemap(img * 1.15)


class Stage:
    """Empty stage under a single spotlight, dust drifting through the beam."""

    def __init__(self, w: int, h: int, seed: int = 37):
        self.w, self.h = w, h
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        self.xx, self.yy = xx / w, yy / h
        self.base = vertical_gradient(h, w, [(0, (10, 9, 9)), (0.7, (16, 13, 12)), (1, (24, 18, 16))])
        r = rng(seed)
        self.dust = [(r.uniform(0.35, 0.65), r.uniform(0, 1), r.uniform(0.6, 2.4), r.uniform(0, 2 * math.pi)) for _ in range(160)]

    def render(self, t: float) -> np.ndarray:
        w, h = self.w, self.h
        cx = 0.5 + 0.03 * math.sin(t * 2 * math.pi)
        # Beam: a cone from above, widening downwards.
        half_width = 0.05 + 0.2 * self.yy
        dx = np.abs(self.xx - cx) / half_width
        beam = np.clip(1 - dx, 0, 1) ** 1.8 * (0.25 + 0.75 * self.yy) * 0.55
        # Pool of light on the floor.
        fy = (self.yy - 0.86) / 0.06
        fx = (self.xx - cx) / 0.26
        pool = np.exp(-(fx**2 + fy**2) * 1.6) * 0.9
        light = (beam + pool)[:, :, None] * np.array([1.0, 0.86, 0.68], dtype=np.float32)
        img = self.base + light
        dust_layer = np.zeros_like(img)
        sprite = gaussian_sprite(2.2 * w / 1920, 2.5)
        for (x, y, speed, phase) in self.dust:
            px = (cx + (x - 0.5) * 0.6 + 0.01 * math.sin(phase + t * 6)) * w
            py = ((y + t * 0.05 * speed) % 1.0) * h
            inside = max(0.0, 1 - abs(px / w - cx) / (0.05 + 0.2 * py / h))
            if inside > 0:
                add_sprite(dust_layer, sprite, px, py, (1.0, 0.9, 0.75), 0.6 * inside)
        img += dust_layer
        img *= vignette(h, w, 0.7)
        return tonemap(img * 1.2)


def softboxes(w: int, h: int, seed: int = 5) -> np.ndarray:
    """Film & TV: studio soft boxes and a practical lamp, out of focus."""
    img = vertical_gradient(h, w, [(0, (18, 18, 22)), (1, (8, 8, 10))])
    layer = Image.new("RGB", (w, h), (0, 0, 0))
    from PIL import ImageDraw

    d = ImageDraw.Draw(layer)
    s = w / 1920
    boxes = [((0.12, 0.18, 0.34, 0.56), (255, 236, 210)), ((0.62, 0.12, 0.86, 0.48), (210, 225, 255)), ((0.44, 0.58, 0.52, 0.66), (255, 170, 90))]
    for (x0, y0, x1, y1), col in boxes:
        d.rounded_rectangle((x0 * w, y0 * h, x1 * w, y1 * h), radius=int(18 * s), fill=col)
    layer = layer.filter(ImageFilter.GaussianBlur(38 * s))
    arr = np.asarray(layer).astype(np.float32) / 255.0
    img = img + arr * 0.7
    r = rng(seed)
    for _ in range(18):
        add_sprite(img, gaussian_sprite(r.uniform(6, 22) * s), r.uniform(0, w), r.uniform(0.55, 0.95) * h, (1.0, 0.7, 0.4), r.uniform(0.15, 0.45))
    img *= vignette(h, w, 0.6)
    return tonemap(img * 1.1)


def backdrop(w: int, h: int) -> np.ndarray:
    """Commercials: a bright seamless paper backdrop with a soft cyc curve and shadow."""
    xx = np.linspace(0, 1, w)[None, :]
    yy = np.linspace(0, 1, h)[:, None]
    warm = np.array([0.95, 0.78, 0.66], dtype=np.float32)
    deep = np.array([0.86, 0.45, 0.36], dtype=np.float32)
    mix = np.clip((yy - 0.55) / 0.3, 0, 1) ** 1.5
    img = warm * (1 - mix[..., None]) + deep * mix[..., None]
    img = np.broadcast_to(img, (h, w, 3)).copy()
    light = np.exp(-(((xx - 0.38) / 0.35) ** 2 + ((yy - 0.35) / 0.5) ** 2))[..., None] * 0.18
    shadow = np.exp(-(((xx - 0.62) / 0.12) ** 2 + ((yy - 0.84) / 0.035) ** 2))[..., None] * 0.35
    img = img + light - shadow
    return np.clip(img, 0, 1)


def waveforms(w: int, h: int, seed: int = 41) -> np.ndarray:
    """Voice: two interleaved waveforms (two languages) on a dark field."""
    img = vertical_gradient(h, w, [(0, (14, 12, 18)), (1, (6, 6, 10))])
    from PIL import ImageDraw

    layer = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = rng(seed)
    s = w / 1920
    for k, (col, off) in enumerate([((255, 110, 80), -0.06), ((236, 226, 210), 0.06)]):
        pts = []
        env_phase = r.uniform(0, 6)
        for i in range(0, w, 3):
            x = i / w
            env = 0.25 + 0.75 * abs(math.sin(x * 3.1 + env_phase)) ** 1.5
            y = 0.5 + off + env * 0.16 * math.sin(x * 140 + k * 1.7) * math.sin(x * 23 + k)
            pts.append((i, y * h))
        d.line(pts, fill=col, width=max(2, int(3 * s)))
    glow = layer.filter(ImageFilter.GaussianBlur(14 * s))
    arr = np.asarray(layer).astype(np.float32) / 255.0 * 0.9 + np.asarray(glow).astype(np.float32) / 255.0 * 1.4
    img = img + arr
    img *= vignette(h, w, 0.6)
    return tonemap(img)


# --------------------------------------------------------------------------- outputs

def lqip(im: Image.Image) -> str:
    small = im.resize((24, max(1, round(24 * im.height / im.width))), Image.LANCZOS)
    buf = io.BytesIO()
    small.save(buf, "JPEG", quality=55)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def save_variants(name: str, im: Image.Image, manifest: dict) -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    for width in WIDTHS:
        if width > im.width:
            continue
        v = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
        v.save(IMG_DIR / f"{name}-{width}.webp", "WEBP", quality=78, method=6)
        v.save(IMG_DIR / f"{name}-{width}.avif", "AVIF", quality=58, speed=4)
    manifest[name] = {"width": im.width, "height": im.height, "lqip": lqip(im)}
    print(f"image {name}")


def render_video(name: str, scene, seconds: int, fps: int = 24) -> None:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    out = VIDEO_DIR / f"{name}.mp4"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{scene.w}x{scene.h}", "-r", str(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", "-an", str(out),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames = seconds * fps
    for i in range(frames):
        t = i / frames
        frame = scene.render(t)
        # Fade in and out over half a second.
        fade = min(1.0, i / (fps * 0.5), (frames - 1 - i) / (fps * 0.5))
        frame = grain(frame * fade, seed=i, amount=0.018)
        proc.stdin.write((np.clip(frame, 0, 1) * 255).astype(np.uint8).tobytes())
    proc.stdin.close()
    proc.wait()
    print(f"video {name} ({out.stat().st_size // 1024} KB)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", action="store_true", help="only generate images")
    args = parser.parse_args()

    manifest: dict = {}
    stills = {
        "harbour-lights": Harbour(W, H).render(0.3),
        "lantern-keeper": Lanterns(W, H).render(0.35),
        "showreel-poster": Stage(W, H).render(0.25),
        "service-film-and-television": softboxes(W, H),
        "service-commercials": backdrop(W, H),
        "service-voice-and-localization": waveforms(W, H),
    }
    for i, (name, arr) in enumerate(stills.items()):
        save_variants(name, to_image(grain(arr, seed=100 + i, amount=0.02)), manifest)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")

    if not args.images:
        render_video("showreel", Stage(1280, 720), 20)
        render_video("harbour-lights", Harbour(1280, 720), 15)
        render_video("lantern-keeper", Lanterns(1280, 720), 15)


if __name__ == "__main__":
    main()
