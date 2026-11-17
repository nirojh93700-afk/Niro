# Outils communs aux vidéos 64 et 65 (17/11/2026) : polices, courbes, cartes photo, badge « EXEMPLE » effacé, encodage.
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import imageio_ffmpeg

W, H, FPS = 1080, 1920, 30
FF = imageio_ffmpeg.get_ffmpeg_exe()
ENCRE = (40, 28, 18); OR = (201, 162, 75); OR_CLAIR = (232, 200, 120); CREME = (245, 236, 220)


def polices(fd):
    def font(n, s, w):
        f = ImageFont.truetype(os.path.join(fd, n + ".ttf"), s)
        try: f.set_variation_by_axes([w])
        except Exception: pass
        return f
    return (lambda s, w=700: font("PlayfairDisplay", s, w)), (lambda s, w=600: font("Inter", s, w))


def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def easeio(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]


def sans_badge(img):
    """Efface la pastille « EXEMPLE » du coin haut gauche (photos d'exemple du site) en la remplaçant par le fond voisin."""
    import cv2
    a = np.array(img.convert("RGB"))
    h, w = a.shape[:2]
    y1, x1 = int(h * 0.075), int(w * 0.28)
    zone = a[:y1, :x1]
    gris = zone.mean(axis=2)
    masque = np.zeros((h, w), np.uint8)
    masque[:y1, :x1] = ((gris < 120) | ((zone.max(axis=2) - zone.min(axis=2)) > 60)).astype(np.uint8) * 255
    if masque.sum() == 0: return img
    ys, xs = np.nonzero(masque)
    m2 = np.zeros_like(masque); m2[max(0, ys.min() - 6):ys.max() + 7, max(0, xs.min() - 6):xs.max() + 7] = 255
    out = cv2.inpaint(a, m2, 9, cv2.INPAINT_TELEA)
    return Image.fromarray(out)


def arrondi(img, r):
    m = Image.new("L", img.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width, img.height), r, fill=255)
    o = img.convert("RGBA"); o.putalpha(m); return o


def coller(base, img, cx, cy, ang=0, a=1.0, sc=1.0, ombre=True):
    if sc != 1: img = img.resize((max(1, int(img.width * sc)), max(1, int(img.height * sc))), Image.LANCZOS)
    r = img.rotate(ang, resample=Image.BICUBIC, expand=True) if ang else img
    if a < 1: r = r.copy(); r.putalpha(r.getchannel("A").point(lambda v: int(v * a)))
    if ombre:
        s = Image.new("RGBA", r.size, (0, 0, 0, 0)); s.putalpha(r.getchannel("A").point(lambda v: int(v * .35 * a)))
        base.alpha_composite(s.filter(ImageFilter.GaussianBlur(22)), (int(cx - r.width / 2 + 8), int(cy - r.height / 2 + 28)))
    base.alpha_composite(r, (int(cx - r.width / 2), int(cy - r.height / 2)))


def encoder(image, total, out_dir, nom):
    out = os.path.join(out_dir, f"{nom}-1080x1920.mp4"); leger = os.path.join(out_dir, f"{nom}-720x1280.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(int(total * FPS)): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True)
    return out, leger
