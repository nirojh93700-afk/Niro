# -*- coding: utf-8 -*-
# Série de pubs GRATUITES (0 crédit) : même style que pub_gratuite.py (vertical
# 1080×1920, zoom dynamique, beat 112 BPM, voix FR accélérée, sous-titres), mais
# PARAMÉTRÉ : une liste de produits (slugs) par vidéo, 2 photos par produit →
# vidéos plus longues. Usage :
#   python3 tools/video/pub_series.py config.json
# config.json = [{ "name": "fichier", "title": "…", "subtitle": "…", "intro": "voix intro",
#                  "products": [{ "slug": "…", "name": "…", "sub": "…", "vo": "…" }] }, …]
import os, sys, json, re, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS
import imageio_ffmpeg, imageio

OUT = os.environ.get("VIDEO_OUT", "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad/videos")
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SR = 1080, 1920, 30, 44100
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p, s): return ImageFont.truetype(p, s)
SITE = "https://nivcreation.fr"
PHOTOS_PER_PRODUCT = 2
MIN, PRE, POST = 2.6, 0.25, 0.35   # segments un peu plus longs que la version courte

# ---- photos depuis products.js (2 premières photos de chaque produit) ----
PRODUCTS_JS = open(os.path.join(os.path.dirname(__file__), "..", "..", "src", "lib", "products.js"), encoding="utf-8").read()
def images_of(slug):
    m = re.search(r'slug:\s*"' + re.escape(slug) + r'".*?images:\s*\[(.*?)\]', PRODUCTS_JS, re.S)
    if not m: raise SystemExit("produit introuvable : " + slug)
    return re.findall(r'"([^"]+)"', m.group(1))

def dl(url, key):
    dst = f"{OUT}/src_{key}"
    if not os.path.exists(dst):
        full = url if url.startswith("http") else SITE + url
        subprocess.run(["curl", "-sL", "--max-time", "60", "-o", dst, full], check=True)
    return dst

def cover(im, w, h):
    iw, ih = im.size; s = max(w / iw, h / ih)
    im = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS); iw, ih = im.size
    return im.crop(((iw - w) // 2, (ih - h) // 2, (iw - w) // 2 + w, (ih - h) // 2 + h))
def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o
def overlay(name, sub, tag=""):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1120) / (H - 1120)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)
    if tag:
        ft = F(SANSB, 34); tw = d.textlength(tag, font=ft)
        d.rounded_rectangle([60, 120, 60 + tw + 44, 182], radius=31, fill=GOLD)
        d.text((82, 133), tag, font=ft, fill=WHITE)
    d.text((60, H - 360), name, font=F(SERIFB, 74), fill=GOLD)
    y = H - 258
    for ln in wrap(d, sub, F(SANS, 44), W - 120): d.text((60, y), ln, font=F(SANS, 44), fill=WHITE); y += 54
    d.text((60, H - 90), "nivcreation.fr", font=F(SANSB, 34), fill=(235, 220, 180))
    return im
def card(big, small, big2=None):
    im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    fB = F(SERIFB, 100 if len(big) < 14 else 76); wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50); y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140): ws = d.textlength(ln, font=fS); d.text(((W - ws) // 2, y), ln, font=fS, fill=INK); y += 62
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2); d.text(((W - w2) // 2, y + 30), big2, font=f2, fill=(120, 100, 60))
    return im
def tts(text, dst):
    mp3 = dst.replace(".wav", ".mp3"); gTTS(text, lang="fr", slow=False).save(mp3)
    subprocess.run([FF, "-y", "-i", mp3, "-filter:a", "atempo=1.12", "-ar", str(SR), "-ac", "1", dst],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    with wave.open(dst) as w: return w.getnframes() / SR
def silence(dur, dst):
    n = int(dur * SR)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b"\x00\x00" * n)
    return dur

def render(cfg):
    name = cfg["name"]
    segs = []  # (kind, image, overlay, dur, vo_wav)
    di = tts(cfg.get("intro", "Niv Création, vos plus beaux cadeaux personnalisés."), f"{OUT}/{name}_vo_intro.wav")
    segs.append(("card", card("NiV CRÉATION", cfg.get("subtitle", "L'atelier français de gravure")).convert("RGB"), None, max(MIN, PRE + di + 0.3), f"{OUT}/{name}_vo_intro.wav"))
    ZW, ZH = int(W * 1.18), int(H * 1.18)
    for i, p in enumerate(cfg["products"]):
        imgs = images_of(p["slug"])[:PHOTOS_PER_PRODUCT]
        for j, url in enumerate(imgs):
            src = dl(url, f"{p['slug']}_{j}{os.path.splitext(url.split('?')[0])[1] or '.jpg'}")
            im = Image.open(src).convert("RGB"); zi = cover(im, ZW, ZH)
            if j == 0:
                dv = tts(p["vo"], f"{OUT}/{name}_vo{i}.wav"); vo = f"{OUT}/{name}_vo{i}.wav"
                dur = max(MIN, PRE + dv + POST)
            else:
                vo = f"{OUT}/{name}_sil{i}.wav"; dur = silence(2.2, vo)
            segs.append(("prod", zi, overlay(p["name"], p["sub"], p.get("tag", "")), dur, vo, j))
    dc = tts(cfg.get("cta", "Découvrez tout sur nivcréation point f r."), f"{OUT}/{name}_vo_cta.wav")
    segs.append(("card", card("nivcreation.fr", "Commandez & personnalisez", "Fait main · en France").convert("RGB"), None, max(MIN, PRE + dc + 0.5), f"{OUT}/{name}_vo_cta.wav"))

    silent = f"{OUT}/{name}_silent.mp4"
    wri = imageio.get_writer(silent, fps=FPS, codec="libx264", quality=8, macro_block_size=1, ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM)
    for seg in segs:
        kind, img, ov, dur, vo = seg[:5]; alt = seg[5] if len(seg) > 5 else 0
        nf = max(1, int(round(dur * FPS)))
        for fi in range(nf):
            prog = fi / max(1, nf - 1)
            if kind == "card":
                frame = img.convert("RGBA")
            else:
                z = (1.18 - 0.18 * prog) if alt == 0 else (1.0 + 0.18 * prog)  # 2e photo : zoom inverse
                cw, ch = int(W * z), int(H * z); x = (img.size[0] - cw) // 2; y = (img.size[1] - ch) // 2
                crop = img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS).convert("RGBA")
                frame = Image.alpha_composite(crop, ov)
            frame = frame.convert("RGB")
            FA = int(0.16 * FPS); a = 1.0
            if fi < FA: a = fi / FA
            elif fi > nf - FA: a = max(0, (nf - fi) / FA)
            if a < 1.0: frame = Image.blend(cream, frame, a)
            wri.append_data(np.asarray(frame))
    wri.close()

    total = sum(s[3] for s in segs)
    N = int(total * SR) + SR; voice = np.zeros(N, dtype=np.float32); cur = 0.0
    for seg in segs:
        dur, vo = seg[3], seg[4]
        with wave.open(vo) as w: a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        st = int((cur + PRE - 0.08) * SR); voice[st:st + len(a)] += a * 0.98; cur += dur
    tt = np.arange(N) / SR; bpm = 112; beat = 60 / bpm
    def env(d): n = int(d * SR); return np.exp(-np.linspace(0, 1, n) * 6)
    kick = env(0.18) * np.sin(2 * np.pi * 55 * np.arange(int(0.18 * SR)) / SR)
    hat = env(0.05) * np.random.RandomState(1).randn(int(0.05 * SR))
    bt = np.zeros(N, dtype=np.float32); t = 0.0
    while t < total:
        idx = int(t * SR)
        if idx + len(kick) < N: bt[idx:idx + len(kick)] += kick * 0.5
        ho = idx + int(beat / 2 * SR)
        if ho + len(hat) < N: bt[ho:ho + len(hat)] += hat * 0.12
        t += beat
    pad = np.zeros(N, dtype=np.float32)
    for fq in (220.0, 277.18, 329.63): pad += np.sin(2 * np.pi * fq * tt)
    pad = pad / np.max(np.abs(pad)) * 0.06 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * tt))
    mix = voice + bt * 0.5 + pad; fade = int(0.5 * SR); mix[:fade] *= np.linspace(0, 1, fade); mix[-fade:] *= np.linspace(1, 0, fade)
    mix = np.clip(mix, -1, 1); sst = np.stack([mix, mix], 1)
    audio = f"{OUT}/{name}_audio.wav"
    with wave.open(audio, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((sst * 32767).astype(np.int16).tobytes())
    final = f"{OUT}/{name}.mp4"
    subprocess.run([FF, "-y", "-i", silent, "-i", audio, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
                    "-crf", "26", "-preset", "medium", "-c:a", "aac", "-b:a", "150k", "-movflags", "+faststart", "-shortest", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print("%s : %.1f s | %d Ko" % (name, total, os.path.getsize(final) // 1024))
    return final

if __name__ == "__main__":
    cfgs = json.load(open(sys.argv[1], encoding="utf-8"))
    for c in cfgs: render(c)
