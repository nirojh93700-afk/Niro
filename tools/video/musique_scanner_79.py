#!/usr/bin/env python3
"""Vidéo 79 — « Votre chanson, gravée sur du bois » (26/11/2026), plaque et porte-clés musique à scanner, pour TikTok / Instagram.

Une histoire en six temps : la chanson (vinyle) → le lien collé → la gravure au laser sur la plaque → le téléphone scanne et
la chanson se lance (les barres de son s'animent) → le porte-clés, ses mousquetons, la photo → la fin (logo d'origine, site).
Les dessins de la plaque viennent du MÊME calcul que la fiche (tools/video/musique_79/assets.mjs). Musique : petite mélodie
synthétisée ici (aucun morceau existant). Aucun prix, aucun nombre.

  python3 tools/video/musique_scanner_79.py <dossier de travail> [--apercu]
"""
import json, os, subprocess, sys, wave
import numpy as np
import imageio_ffmpeg

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
T = os.path.abspath(sys.argv[1]); os.makedirs(T + "/img", exist_ok=True)
D = os.path.join(R, "tools", "video", "musique_79")
env = dict(os.environ, NODE_PATH=subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())
subprocess.run(["node", "--import", "./tools/alias-register.mjs", os.path.join(D, "assets.mjs"), T + "/dessins.json"], cwd=R, check=True, capture_output=True)
d = json.load(open(T + "/dessins.json"))
vb = [float(x) for x in d["viewBox"].split()]
pad, g = -vb[0], d["g"]
h = open(os.path.join(D, "film.html"), encoding="utf-8").read()
mq = ["file://" + os.path.join(R, "public/createurs/musique/mousquetons", n + ".png") for n in ["or-rose", "anthracite", "dore", "argente", "noir", "bronze", "champagne"]]
for a, b in {"__POLICES__": "file://" + os.path.join(R, "public/createurs/polices"), "__IMG__": "file://" + os.path.join(R, "public/produits/musique"),
             "__LOGO__": "file://" + os.path.join(R, "public/logo-niv-creation.jpg"), "__VIDE__": d["vide"], "__PLEIN__": d["plein"], "__MQ__": json.dumps(mq),
             "__QX__": str((g["qr"]["x"] + pad) / vb[2]), "__QY__": str((g["qr"]["y"] + pad) / vb[3]), "__QW__": str(g["qr"]["t"] / vb[2]), "__QH__": str(g["qr"]["t"] / vb[3])}.items():
    h = h.replace(a, b)
open(T + "/film.html", "w", encoding="utf-8").write(h)
if "--apercu" in sys.argv:
    subprocess.run(["node", os.path.join(D, "rendu.cjs"), T + "/film.html", T, "2.6,6.5,9.2,11.2,13.2,15.0,19.6"], env=env, check=True)
    sys.exit(0)
subprocess.run(["node", os.path.join(D, "rendu.cjs"), T + "/film.html", T + "/img"], env=env, check=True)

# ---- la musique : une boîte à musique discrète, puis la chanson « se lance » au scan (14,0 s) ----
SR, DUR, JOUE = 44100, 25.0, 14.0
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
while t < JOUE - .4:                                   # avant le scan : une note par temps, très doux
    notes, _ = ACC[(k // 4) % 4]; note(N[notes[k % 4]] * 2, t, 1.6, .10, 2.6); t += TEMPS; k += 1
x = np.arange(int(SR * .11)) / SR; i0 = int(SR * 13.6)     # le « bip » du scan
son[i0:i0 + len(x)] += .22 * np.sin(2 * np.pi * 1320 * x) * np.minimum(1, x / .004) * np.minimum(1, (.11 - x) / .02)
MEL = ["E5", "G5", "E5", "D5", "D5", "G5", "D5", "B4", "C5", "E5", "C5", "A4", "A4", "C5", "F4", "A4"]
t, k = JOUE, 0
while t < DUR - .2:                                    # la chanson : arpèges en croches, basse, petite mélodie
    notes, basse = ACC[(k // 8) % 4]
    note(N[notes[k % 4]], t, 1.1, .16); note(N[notes[(k + 2) % 4]] * 2, t + TEMPS / 2 * 0, .9, .05)
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
grand = os.path.join(R, "docs/videos/79-musique-a-scanner-1080x1920.mp4"); petit = os.path.join(R, "docs/videos/79-musique-a-scanner-720x1280.mp4")
subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", "30", "-i", T + "/img/f%04d.jpg", "-i", T + "/son.wav", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "slow",
                "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", grand], check=True)
subprocess.run([ff, "-y", "-loglevel", "error", "-i", grand, "-vf", "scale=720:1280", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", petit], check=True)
for f in (grand, petit): print(f, round(os.path.getsize(f) / 1e6, 1), "Mo")
