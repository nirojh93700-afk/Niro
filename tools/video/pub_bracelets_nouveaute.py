# -*- coding: utf-8 -*-
# Vidéo pub — nouveaux bracelets (commande fournisseur Nihao, août 2026).
import os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS
import imageio_ffmpeg, imageio

OUT="/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS,SR=1080,1920,30,44100
GOLD=(201,162,75);CREAM=(250,246,238);INK=(30,26,22);WHITE=(255,255,255)
SERIFB="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p,s):return ImageFont.truetype(p,s)
B="https://nivcreation.fr/produits/"

P=[
 ("bracelet-coeur-acier-1.jpg","Cœur Argenté","Un bracelet doux et lumineux.","Le bracelet cœur argenté, doux et lumineux."),
 ("bracelet-ange-1.jpg","Bracelet Ange","Un porte-bonheur tout en finesse.","Le bracelet ange, un porte-bonheur en finesse."),
 ("bracelet-maille-0.jpg","Maille Trombone","Une chaîne dorée, moderne.","Le bracelet maille trombone, une chaîne dorée moderne."),
]
INTRO_VO="Niv Création, les nouveaux bracelets viennent d'arriver."
CTA_VO="Découvrez toute la collection sur nivcréation point f r."
MIN,PRE,POST=2.15,0.25,0.35

def dl(f):
    dst=f"{OUT}/src_{f.replace('/','_')}"
    subprocess.run(["curl","-s","--max-time","60","-o",dst,B+f],check=True)
    return dst

def cover(im,w,h):
    iw,ih=im.size;s=max(w/iw,h/ih)
    im=im.resize((int(iw*s)+1,int(ih*s)+1),Image.LANCZOS);iw,ih=im.size
    return im.crop(((iw-w)//2,(ih-h)//2,(iw-w)//2+w,(ih-h)//2+h))
def wrap(d,t,f,mw):
    o=[];c=""
    for w in t.split():
        tt=(c+" "+w).strip()
        if d.textlength(tt,font=f)<=mw:c=tt
        else:o.append(c);c=w
    if c:o.append(c)
    return o
def overlay(name,sub):
    im=Image.new("RGBA",(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    band=Image.new("L",(1,H),0);p=band.load()
    for y in range(H):p[0,y]=int(215*max(0,(y-1120)/(H-1120))**1.15)
    dark=Image.new("RGBA",(W,H),(15,12,9,255));dark.putalpha(band.resize((W,H)))
    im=Image.alpha_composite(im,dark);d=ImageDraw.Draw(im)
    d.text((60,H-360),name,font=F(SERIFB,74),fill=GOLD)
    y=H-258
    for ln in wrap(d,sub,F(SANS,44),W-120):d.text((60,y),ln,font=F(SANS,44),fill=WHITE);y+=54
    d.text((60,H-90),"nivcreation.fr",font=F(SANSB,34),fill=(235,220,180))
    return im
def card(big,small,big2=None):
    im=Image.new("RGB",(W,H),CREAM);d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,14],fill=GOLD);d.rectangle([0,H-14,W,H],fill=GOLD)
    fB=F(SERIFB,100);wb=d.textlength(big,font=fB);d.text(((W-wb)//2,H//2-160),big,font=fB,fill=GOLD)
    fS=F(SANS,50);ws=d.textlength(small,font=fS);d.text(((W-ws)//2,H//2-20),small,font=fS,fill=INK)
    if big2:
        f2=F(SANSB,44);w2=d.textlength(big2,font=f2);d.text(((W-w2)//2,H//2+60),big2,font=f2,fill=(120,100,60))
    return im
def tts(text,dst):
    mp3=dst.replace(".wav",".mp3");gTTS(text,lang="fr",slow=False).save(mp3)
    subprocess.run([FF,"-y","-i",mp3,"-filter:a","atempo=1.12","-ar",str(SR),"-ac","1",dst],
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    with wave.open(dst) as w:return w.getnframes()/SR

segs=[]
di=tts(INTRO_VO,f"{OUT}/bvo_intro.wav");segs.append(("card",card("NiV CRÉATION","Nouveaux bracelets").convert("RGB"),None,max(MIN,PRE+di+0.3),f"{OUT}/bvo_intro.wav"))
ZW,ZH=int(W*1.18),int(H*1.18)
for i,(f,name,sub,vo) in enumerate(P):
    src=dl(f);im=Image.open(src).convert("RGB");zi=cover(im,ZW,ZH)
    ov=overlay(name,sub);dv=tts(vo,f"{OUT}/cvo{i}.wav")
    segs.append(("prod",zi,ov,max(MIN,PRE+dv+0.35),f"{OUT}/cvo{i}.wav"))
dc=tts(CTA_VO,f"{OUT}/bvo_cta.wav");segs.append(("card",card("nivcreation.fr","Commandez & personnalisez","Livraison rapide & suivie").convert("RGB"),None,max(MIN,PRE+dc+0.5),f"{OUT}/bvo_cta.wav"))

wri=imageio.get_writer(f"{OUT}/bracelets_silent.mp4",fps=FPS,codec="libx264",quality=8,
    macro_block_size=1,ffmpeg_params=["-pix_fmt","yuv420p"],ffmpeg_log_level="error")
cream=Image.new("RGB",(W,H),CREAM)
for kind,img,ov,dur,vo in segs:
    nf=max(1,int(round(dur*FPS)))
    for fi in range(nf):
        prog=fi/max(1,nf-1)
        if kind=="card":
            frame=img.convert("RGBA")
        else:
            z=1.18-0.18*prog
            cw,ch=int(W*z),int(H*z);x=(img.size[0]-cw)//2;y=(img.size[1]-ch)//2
            crop=img.crop((x,y,x+cw,y+ch)).resize((W,H),Image.LANCZOS).convert("RGBA")
            frame=Image.alpha_composite(crop,ov)
        frame=frame.convert("RGB")
        FA=int(0.16*FPS);a=1.0
        if fi<FA:a=fi/FA
        elif fi>nf-FA:a=max(0,(nf-fi)/FA)
        if a<1.0:frame=Image.blend(cream,frame,a)
        wri.append_data(np.asarray(frame))
wri.close()

total=sum(s[3] for s in segs)
N=int(total*SR)+SR;voice=np.zeros(N,dtype=np.float32);cur=0.0
for kind,img,ov,dur,vo in segs:
    with wave.open(vo) as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
    st=int((cur+PRE-0.08)*SR);voice[st:st+len(a)]+=a*0.98;cur+=dur
tt=np.arange(N)/SR;bpm=112;beat=60/bpm
def env(d):n=int(d*SR);return np.exp(-np.linspace(0,1,n)*6)
kick=env(0.18)*np.sin(2*np.pi*55*np.arange(int(0.18*SR))/SR)
hat=env(0.05)*np.random.RandomState(1).randn(int(0.05*SR))
bt=np.zeros(N,dtype=np.float32);t=0.0
while t<total:
    idx=int(t*SR)
    if idx+len(kick)<N:bt[idx:idx+len(kick)]+=kick*0.5
    ho=idx+int(beat/2*SR)
    if ho+len(hat)<N:bt[ho:ho+len(hat)]+=hat*0.12
    t+=beat
pad=np.zeros(N,dtype=np.float32)
for fq in (220.0,277.18,329.63):pad+=np.sin(2*np.pi*fq*tt)
pad=pad/np.max(np.abs(pad))*0.06*(0.6+0.4*np.sin(2*np.pi*0.12*tt))
mix=voice+bt*0.5+pad;fade=int(0.5*SR);mix[:fade]*=np.linspace(0,1,fade);mix[-fade:]*=np.linspace(1,0,fade)
mix=np.clip(mix,-1,1);sst=np.stack([mix,mix],1)
with wave.open(f"{OUT}/bracelets_audio.wav","wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((sst*32767).astype(np.int16).tobytes())

subprocess.run([FF,"-y","-i",f"{OUT}/bracelets_silent.mp4","-i",f"{OUT}/bracelets_audio.wav",
    "-vf","scale=720:1280","-c:v","libx264","-profile:v","main","-pix_fmt","yuv420p","-crf","26","-preset","medium",
    "-c:a","aac","-b:a","150k","-movflags","+faststart","-shortest",f"{OUT}/niv-pub-bracelets.mp4"],
    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
print("DUREE %.1fs"%total,"| taille",os.path.getsize(f"{OUT}/niv-pub-bracelets.mp4"))
