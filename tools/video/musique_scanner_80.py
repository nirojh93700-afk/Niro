#!/usr/bin/env python3
"""Vidéo 80 — « Votre chanson, gravée sur du bois », version 2 (26/11/2026, gérant : « refais-le, il faut que tu montres plus
ce qu'ils peuvent graver, des photos aussi »). Plaque et porte-clés musique à scanner, pour TikTok / Instagram.

L'histoire : la chanson (vinyle) → le lien collé → la gravure au laser → le téléphone scanne, la chanson se lance →
« Vous choisissez quoi graver » : trois plaques aux textes et écritures différents → « Et même votre photo » : trois plaques
avec une photo gravée (couple, enfant et chien, portrait) → le porte-clés qui se retourne sur la photo, les mousquetons →
la fin (logo d'origine, site). Tous les dessins viennent du MÊME calcul que la fiche (tools/video/musique_80/assets.mjs).
Photos d'exemple = les portraits déjà utilisés pour les marque-pages. Musique synthétisée ici. Aucun prix, aucun nombre.

  python3 tools/video/musique_scanner_80.py <dossier de travail> [--apercu]
"""
import base64, io, json, os, subprocess, sys, wave
import numpy as np
from PIL import Image
import imageio_ffmpeg

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
T = os.path.abspath(sys.argv[1]); os.makedirs(T + "/img", exist_ok=True)
D = os.path.join(R, "tools", "video", "musique_80")
env = dict(os.environ, NODE_PATH=subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())

def brun(fichier, haut):
    """La photo en nuances de brun, comme sur la fiche (traiter() de MusiqueFiche.jsx) : carré, 520 px."""
    im = Image.open(fichier).convert("L"); c = min(im.size)
    im = im.crop(((im.width - c) // 2, haut, (im.width - c) // 2 + c, haut + c)).resize((520, 520), Image.LANCZOS)
    L = np.asarray(im, dtype=float); L = (L - L.min()) / max(1.0, L.max() - L.min())
    a = np.power(1 - L, 0.85) * 235
    px = np.dstack([np.full_like(L, 58), np.full_like(L, 38), np.full_like(L, 20), a]).astype("uint8")
    b = io.BytesIO(); Image.fromarray(px, "RGBA").save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

PO = os.path.join(R, "docs/maquettes/assets/marque-pages/exemples/portraits")
json.dump({"couple": brun(PO + "/couple.jpg", 0), "enfant": brun(PO + "/enfant-chien.jpg", 125), "maman": brun(PO + "/femme.jpg", 5)}, open(T + "/photos.json", "w"))
subprocess.run(["node", "--import", "./tools/alias-register.mjs", os.path.join(D, "assets.mjs"), T + "/photos.json", T + "/dessins.json"], cwd=R, check=True, capture_output=True)
h = open(os.path.join(D, "film.html"), encoding="utf-8").read()
mq = ["file://" + os.path.join(R, "public/createurs/musique/mousquetons", n + ".png") for n in ["or-rose", "anthracite", "dore", "argente", "noir", "bronze", "champagne"]]
for a, b in {"__POLICES__": "file://" + os.path.join(R, "public/createurs/polices"), "__LOGO__": "file://" + os.path.join(R, "public/logo-niv-creation.jpg"),
             "__D__": open(T + "/dessins.json", encoding="utf-8").read(), "__MQ__": json.dumps(mq)}.items():
    h = h.replace(a, b)
open(T + "/film.html", "w", encoding="utf-8").write(h)
RENDU = os.path.join(R, "tools", "video", "musique_79", "rendu.cjs")
if "--apercu" in sys.argv:
    subprocess.run(["node", RENDU, T + "/film.html", T, "1.8,4.8,7.5,10.5,12.0,13.6,15.0,16.4,18.3,19.3,20.4,21.5,23.0,24.0,25.4,29.5"], env=env, check=True)
    sys.exit(0)
subprocess.run(["node", RENDU, T + "/film.html", T + "/img"], env=env, check=True)

# ---- la musique : une boîte à musique discrète, puis la chanson « se lance » au scan ----
SR, DUR, BIP, JOUE = 44100, 30.0, 10.9, 11.2
son = np.zeros(int(SR * DUR))
def note(f, t0, dur, vol, dec=3.2):
    n = int(SR * dur); i0 = int(SR * t0)
    if i0 >= len(son): return
    x = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * x) + .45 * np.sin(4 * np.pi * f * x) + .18 * np.sin(6 * np.pi * f * x)) * np.exp(-dec * x) * np.minimum(1, x / .008)
    n = min(n, len(son) - i0); son[i0:i0 + n] += vol * s[:n]
N = {"C3": 130.81, "F3": 174.61, "G3": 196.0, "A3": 220.0, "B3": 246.94, "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.0, "A4": 440.0, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25, "G5": 783.99}
ACC = [(["C4", "E4", "G4", "C5"], "C3"), (["B3", "D4", "G4", "B4"], "G3"), (["A3", "C4", "E4", "A4"], "A3"), (["A3", "C4", "F4", "A4"], "F3")]
TEMPS = .6
t, k = .3, 0
while t < BIP - .3:                                    # avant le scan : une note par temps, très doux
    notes, _ = ACC[(k // 4) % 4]; note(N[notes[k % 4]] * 2, t, 1.6, .10, 2.6); t += TEMPS; k += 1
x = np.arange(int(SR * .11)) / SR; i0 = int(SR * BIP)       # le « bip » du scan
son[i0:i0 + len(x)] += .22 * np.sin(2 * np.pi * 1320 * x) * np.minimum(1, x / .004) * np.minimum(1, (.11 - x) / .02)
MEL = ["E5", "G5", "E5", "D5", "D5", "G5", "D5", "B4", "C5", "E5", "C5", "A4", "A4", "C5", "F4", "A4"]
t, k = JOUE, 0
while t < DUR - .2:                                    # la chanson : arpèges en croches, basse, petite mélodie
    notes, basse = ACC[(k // 8) % 4]
    note(N[notes[k % 4]], t, 1.1, .16); note(N[notes[(k + 2) % 4]] * 2, t, .9, .05)
    if k % 8 == 0: note(N[basse], t, 2.3, .22, 1.6)
    if k % 2 == 0: note(N[MEL[(k // 2) % 16]], t, 1.3, .17, 2.4)
    t += TEMPS / 2; k += 1
e = np.zeros_like(son); dl = int(SR * .27); e[dl:] = son[:-dl] * .28; son += e          # un peu d'écho
fin = int(SR * 1.6); son[-fin:] *= np.linspace(1, 0, fin)
son = np.tanh(son * 1.5) * .8
with wave.open(T + "/son.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((son * 32767).astype("<i2").tobytes())

ff = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs(os.path.join(R, "docs/videos"), exist_ok=True)
grand = os.path.join(R, "docs/videos/80-musique-a-scanner-1080x1920.mp4"); petit = os.path.join(R, "docs/videos/80-musique-a-scanner-720x1280.mp4")
subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", "30", "-i", T + "/img/f%04d.jpg", "-i", T + "/son.wav", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "slow",
                "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", grand], check=True)
subprocess.run([ff, "-y", "-loglevel", "error", "-i", grand, "-vf", "scale=720:1280", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", petit], check=True)
for f in (grand, petit): print(f, round(os.path.getsize(f) / 1e6, 1), "Mo")
