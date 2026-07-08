# -*- coding: utf-8 -*-
# Vidéo "procédure de gravure étape par étape" — images IA (Pollinations) déjà générées
import os, subprocess, wave, asyncio
os.environ.setdefault('SSL_CERT_FILE','/root/.ccr/ca-bundle.crt')
os.environ.setdefault('REQUESTS_CA_BUNDLE','/root/.ccr/ca-bundle.crt')
import edge_tts
VOICE='fr-FR-DeniseNeural'
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, imageio

OUT="/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS,SR=1080,1920,30,44100
GOLD=(201,162,75);CREAM=(250,246,238);INK=(30,26,22);WHITE=(255,255,255)
SERIFB="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p,s):return ImageFont.truetype(p,s)

# (fichier local, numéro, titre, sous-titre, voix off)
P=[
 ("etape1.jpg","1","Votre photo","Envoyez-nous votre plus belle photo.",
  "Première étape. Vous nous envoyez votre plus belle photo."),
 ("etape2.jpg","2","Modélisation 3D","Nous la transformons en trois dimensions.",
  "Ensuite, nous la transformons en trois dimensions."),
 ("etape3.jpg","3","Gravure laser","Le laser la grave au cœur du cristal.",
  "Puis, le laser vient la graver au cœur du cristal."),
 ("etape4.jpg","4","Votre cristal","Un souvenir gravé pour toujours.",
  "Et voilà votre souvenir, gravé pour toujours dans le cristal."),
]
INTRO_VO="Niv Création. Comment votre photo devient un cristal."
CTA_VO="Créez le vôtre sur nivcréation point f r."
MIN,PRE,POST=2.6,0.25,0.45

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
def overlay(num,title,sub):
    im=Image.new("RGBA",(W,H),(0,0,0,0))
    band=Image.new("L",(1,H),0);p=band.load()
    for y in range(H):p[0,y]=int(220*max(0,(y-1060)/(H-1060))**1.1)
    dark=Image.new("RGBA",(W,H),(15,12,9,255));dark.putalpha(band.resize((W,H)))
    im=Image.alpha_composite(im,dark);d=ImageDraw.Draw(im)
    # pastille numéro (rond doré) en haut
    r=54;cx,cy=110,150
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=GOLD)
    fn=F(SERIFB,64);wn=d.textlength(num,font=fn)
    d.text((cx-wn/2,cy-46),num,font=fn,fill=INK)
    d.text((cx+r+28,cy-40),"ÉTAPE",font=F(SANSB,40),fill=(235,220,180))
    # titre + sous-titre en bas
    d.text((60,H-370),title,font=F(SERIFB,78),fill=GOLD)
    y=H-262
    for ln in wrap(d,sub,F(SANS,46),W-120):d.text((60,y),ln,font=F(SANS,46),fill=WHITE);y+=56
    d.text((60,H-84),"nivcreation.fr",font=F(SANSB,34),fill=(235,220,180))
    return im
def card(big,small,big2=None):
    im=Image.new("RGB",(W,H),CREAM);d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,14],fill=GOLD);d.rectangle([0,H-14,W,H],fill=GOLD)
    fB=F(SERIFB,96)
    lines=wrap(d,big,fB,W-140);y=H//2-150-((len(lines)-1)*56)
    for ln in lines:
        wb=d.textlength(ln,font=fB);d.text(((W-wb)//2,y),ln,font=fB,fill=GOLD);y+=112
    fS=F(SANS,50);ws=d.textlength(small,font=fS);d.text(((W-ws)//2,y+20),small,font=fS,fill=INK)
    if big2:
        f2=F(SANSB,44);w2=d.textlength(big2,font=f2);d.text(((W-w2)//2,y+100),big2,font=f2,fill=(120,100,60))
    return im
def tts(text,dst):
    mp3=dst.replace(".wav",".mp3")
    async def _g():
        c=edge_tts.Communicate(text, VOICE, rate="+10%", proxy=os.environ.get("HTTPS_PROXY"))
        await c.save(mp3)
    asyncio.run(_g())
    subprocess.run([FF,"-y","-i",mp3,"-ar",str(SR),"-ac","1",dst],
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    with wave.open(dst) as w:return w.getnframes()/SR

# préparer segments
segs=[]
di=tts(INTRO_VO,f"{OUT}/proc_i.wav")
segs.append(("card",card("NiV CRÉATION","De votre photo au cristal").convert("RGB"),None,max(MIN,PRE+di+0.4),f"{OUT}/proc_i.wav"))
ZW,ZH=int(W*1.18),int(H*1.18)
for i,(f,num,title,sub,vo) in enumerate(P):
    im=Image.open(f"{OUT}/{f}").convert("RGB");zi=cover(im,ZW,ZH)
    ov=overlay(num,title,sub);dv=tts(vo,f"{OUT}/proc{i}.wav")
    segs.append(("prod",zi,ov,max(MIN,PRE+dv+0.4),f"{OUT}/proc{i}.wav"))
dc=tts(CTA_VO,f"{OUT}/proc_c.wav")
segs.append(("card",card("nivcreation.fr","Votre souvenir dans le cristal","Fait main · en France").convert("RGB"),None,max(MIN,PRE+dc+0.5),f"{OUT}/proc_c.wav"))

# rendu
wri=imageio.get_writer(f"{OUT}/proc_silent.mp4",fps=FPS,codec="libx264",quality=8,
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

# audio : voix seule (net et propre)
total=sum(s[3] for s in segs)
N=int(total*SR)+SR;voice=np.zeros(N,dtype=np.float32);cur=0.0
for kind,img,ov,dur,vo in segs:
    with wave.open(vo) as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
    st=int((cur+PRE-0.08)*SR);voice[st:st+len(a)]+=a*0.98;cur+=dur
mix=np.clip(voice,-1,1);fade=int(0.5*SR)
mix[:fade]*=np.linspace(0,1,fade);mix[-fade:]*=np.linspace(1,0,fade)
sst=np.stack([mix,mix],1)
with wave.open(f"{OUT}/proc_audio.wav","wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((sst*32767).astype(np.int16).tobytes())

subprocess.run([FF,"-y","-i",f"{OUT}/proc_silent.mp4","-i",f"{OUT}/proc_audio.wav",
    "-vf","scale=720:1280","-c:v","libx264","-profile:v","main","-pix_fmt","yuv420p","-crf","26","-preset","medium",
    "-c:a","aac","-b:a","150k","-movflags","+faststart","-shortest",f"{OUT}/niv-procedure-gravure.mp4"],
    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
print("DUREE %.1fs"%total,"| taille",os.path.getsize(f"{OUT}/niv-procedure-gravure.mp4"))
