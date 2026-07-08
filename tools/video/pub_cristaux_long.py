# -*- coding: utf-8 -*-
# Vidéo LONGUE cristaux — vraies photos du site + musique + voix + fondus enchaînés
import os, subprocess, wave, asyncio
os.environ.setdefault('SSL_CERT_FILE','/root/.ccr/ca-bundle.crt')
os.environ.setdefault('REQUESTS_CA_BUNDLE','/root/.ccr/ca-bundle.crt')
import edge_tts
VOICE='fr-FR-DeniseNeural'
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

OUT="/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS,SR=1080,1920,30,44100
GOLD=(201,162,75);CREAM=(250,246,238);INK=(26,18,10);WHITE=(255,255,255);SOFT=(235,220,180)
SERIFB="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p,s):return ImageFont.truetype(p,s)
B="https://nivcreation.fr/produits/"

# (fichier, titre, sous-titre, voix off)  — vraies photos du site
P=[
 ("cristal-v-couple.jpg","Votre photo dans le cristal","Un souvenir gravé en 3D, pour toujours.",
  "Et si votre plus belle photo devenait un objet précieux, gravé au cœur du cristal."),
 ("cristal-v-femme.jpg","Gravure laser 3D","La lumière révèle chaque détail.",
  "Grâce à la gravure laser en trois dimensions, chaque détail prend vie dans la lumière."),
 ("cristal-h-demo-couple.jpg","Format horizontal","Vos souvenirs en grand.",
  "En vertical ou en horizontal, choisissez le format qui met votre souvenir en valeur."),
 ("cristal-h-famille.jpg","Toute la famille","Réunie dans un seul bloc.",
  "Réunissez toute la famille dans un seul bloc de cristal optique."),
 ("cristal-v-enfant-chien.jpg","Même vos animaux","Les compagnons qu'on n'oublie pas.",
  "Vos enfants, vos animaux, les êtres qui comptent, gravés avec émotion."),
 ("cristal-h-amis.jpg","Entre amis","Les moments qui restent.",
  "Les moments partagés entre amis méritent eux aussi de rester."),
 ("porte-cles-coeur-demo.jpg","Porte-clés cristal","Votre souvenir toujours avec vous.",
  "Emportez votre souvenir partout, avec le porte-clés en cristal lumineux."),
 ("cristal-v-jeunes.jpg","Un cadeau unique","Personnalisé, fait main en France.",
  "Un cadeau unique, entièrement personnalisé, fait main en France."),
]
INTRO_VO="Niv Création présente le cristal photo, gravé en trois dimensions."
CTA_VO="Créez le vôtre, dès aujourd'hui, sur nivcréation point f r."
MIN,PRE=2.55,0.25
XF=0.45  # durée du fondu enchaîné entre segments (s)

def dl(f):
    dst=f"{OUT}/lsrc_{f}"
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
def overlay(title,sub):
    im=Image.new("RGBA",(W,H),(0,0,0,0))
    band=Image.new("L",(1,H),0);p=band.load()
    for y in range(H):p[0,y]=int(225*max(0,(y-1040)/(H-1040))**1.08)
    dark=Image.new("RGBA",(W,H),(14,10,6,255));dark.putalpha(band.resize((W,H)))
    im=Image.alpha_composite(im,dark);d=ImageDraw.Draw(im)
    # filet doré
    d.line([(60,H-392),(180,H-392)],fill=GOLD,width=5)
    d.text((60,H-368),title,font=F(SERIFB,66),fill=GOLD)
    y=H-268
    for ln in wrap(d,sub,F(SANS,44),W-120):d.text((60,y),ln,font=F(SANS,44),fill=WHITE);y+=54
    d.text((60,H-84),"nivcreation.fr",font=F(SANSB,34),fill=SOFT)
    return im
def card(big,small,big2=None,dark=False):
    bg=INK if dark else CREAM
    im=Image.new("RGB",(W,H),bg);d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,14],fill=GOLD);d.rectangle([0,H-14,W,H],fill=GOLD)
    # halo doré
    if dark:
        halo=Image.new("L",(W,H),0);hd=ImageDraw.Draw(halo)
        hd.ellipse([W//2-460,H//2-560,W//2+460,H//2-40],fill=70)
        halo=halo.filter(ImageFilter.GaussianBlur(120))
        gold=Image.new("RGB",(W,H),GOLD);im=Image.composite(gold,im,halo)
        d=ImageDraw.Draw(im)
    fB=F(SERIFB,96)
    lines=wrap(d,big,fB,W-140);y=H//2-150-((len(lines)-1)*56)
    for ln in lines:
        wb=d.textlength(ln,font=fB);d.text(((W-wb)//2,y),ln,font=fB,fill=GOLD);y+=112
    fS=F(SANS,50);ws=d.textlength(small,font=fS)
    d.text(((W-ws)//2,y+18),small,font=fS,fill=(WHITE if dark else INK))
    if big2:
        f2=F(SANSB,44);w2=d.textlength(big2,font=f2)
        d.text(((W-w2)//2,y+96),big2,font=f2,fill=SOFT if dark else (120,100,60))
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

# ----- préparer segments : chaque segment = (frames list en RGB uint8, wav voix, dur) -----
segs=[]  # dict kind
ZW,ZH=int(W*1.20),int(H*1.20)
di=tts(INTRO_VO,f"{OUT}/L_i.wav")
segs.append({"kind":"card","img":card("NiV CRÉATION","Le cristal photo, gravé en 3D",dark=True).convert("RGB"),"ov":None,"dur":max(MIN,PRE+di+0.35),"vo":f"{OUT}/L_i.wav"})
for i,(f,title,sub,vo) in enumerate(P):
    src=dl(f);im=Image.open(src).convert("RGB");zi=cover(im,ZW,ZH)
    ov=overlay(title,sub);dv=tts(vo,f"{OUT}/L{i}.wav")
    # zoom : alterne zoom-in / zoom-out pour varier
    segs.append({"kind":"prod","img":zi,"ov":ov,"dur":max(MIN,PRE+dv+0.4),"vo":f"{OUT}/L{i}.wav","dir":i%2})
dc=tts(CTA_VO,f"{OUT}/L_c.wav")
segs.append({"kind":"card","img":card("nivcreation.fr","Votre souvenir dans le cristal","Fait main · en France",dark=True).convert("RGB"),"ov":None,"dur":max(MIN,PRE+dc+0.55),"vo":f"{OUT}/L_c.wav"})

def render_seg(s):
    """retourne liste de frames (np uint8 HxWx3) pour le segment, SANS fondu (géré au montage)."""
    nf=max(1,int(round(s["dur"]*FPS)));frames=[]
    for fi in range(nf):
        prog=fi/max(1,nf-1)
        if s["kind"]=="card":
            frame=s["img"]
        else:
            if s.get("dir",0)==0: z=1.20-0.16*prog      # zoom in
            else:                 z=1.04+0.16*prog       # zoom out
            cw,ch=int(W*z),int(H*z)
            x=(s["img"].size[0]-cw)//2;y=(s["img"].size[1]-ch)//2
            crop=s["img"].crop((x,y,x+cw,y+ch)).resize((W,H),Image.LANCZOS).convert("RGBA")
            frame=Image.alpha_composite(crop,s["ov"]).convert("RGB")
        frames.append(np.asarray(frame,dtype=np.uint8))
    return frames

# rendu avec fondus enchaînés (crossfade) entre segments
wri=imageio.get_writer(f"{OUT}/cxl_silent.mp4",fps=FPS,codec="libx264",quality=8,
    macro_block_size=1,ffmpeg_params=["-pix_fmt","yuv420p"],ffmpeg_log_level="error")
xf=int(XF*FPS)
prev_tail=None
allframes_seglist=[render_seg(s) for s in segs]
for si,frames in enumerate(allframes_seglist):
    if prev_tail is not None:
        # fondu entre la fin du précédent (prev_tail) et le début de celui-ci
        n=min(xf,len(prev_tail),len(frames))
        for k in range(n):
            a=k/max(1,n)
            f=(prev_tail[len(prev_tail)-n+k].astype(np.float32)*(1-a)+frames[k].astype(np.float32)*a)
            wri.append_data(f.astype(np.uint8))
        body=frames[n:]
    else:
        body=frames
    # garder la queue pour le prochain fondu
    if si<len(allframes_seglist)-1:
        prev_tail=body[-xf:] if len(body)>=xf else body[:]
        body=body[:-xf] if len(body)>=xf else []
    for fr in body:
        wri.append_data(fr)
wri.close()

# durée réelle de la vidéo produite
probe=subprocess.run([FF,"-i",f"{OUT}/cxl_silent.mp4"],stderr=subprocess.PIPE).stderr.decode()
# audio : voix alignée sur le TEMPS DE MONTAGE (chaque segment décalé de -XF à cause du fondu)
# temps de départ voix du segment i = somme(dur[0..i-1]) - i*XF + PRE
starts=[];acc=0.0
for i,s in enumerate(segs):
    starts.append(acc+PRE-0.06);acc+=s["dur"]-XF
total=acc+XF+0.3
N=int(total*SR)+SR;voice=np.zeros(N,dtype=np.float32)
for s,st in zip(segs,starts):
    with wave.open(s["vo"]) as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
    i0=int(st*SR);voice[i0:i0+len(a)]+=a*0.98
# musique douce : nappe + beat léger
tt=np.arange(N)/SR;bpm=100;beat=60/bpm
def env(d,k=6):n=int(d*SR);return np.exp(-np.linspace(0,1,n)*k)
kick=env(0.20)*np.sin(2*np.pi*52*np.arange(int(0.20*SR))/SR)
hat=env(0.045,9)*np.random.RandomState(3).randn(int(0.045*SR))
bt=np.zeros(N,dtype=np.float32);t=0.0
while t<total:
    idx=int(t*SR)
    if idx+len(kick)<N:bt[idx:idx+len(kick)]+=kick*0.42
    ho=idx+int(beat/2*SR)
    if ho+len(hat)<N:bt[ho:ho+len(hat)]+=hat*0.10
    t+=beat
pad=np.zeros(N,dtype=np.float32)
for fq in (196.0,246.94,293.66,392.0):pad+=np.sin(2*np.pi*fq*tt)
pad=pad/np.max(np.abs(pad))*0.05*(0.6+0.4*np.sin(2*np.pi*0.1*tt))
music=(bt+pad).astype(np.float32)
# duck la musique quand la voix parle
vabs=np.abs(voice)
env_v=np.convolve(vabs,np.ones(int(0.05*SR))/int(0.05*SR),mode='same')
duck=1.0-0.62*np.clip(env_v/ (np.max(env_v)+1e-6),0,1)
mix=voice+music*duck
mix=mix/max(1.0,np.max(np.abs(mix))*1.02)
fade=int(0.6*SR);mix[:fade]*=np.linspace(0,1,fade);mix[-fade:]*=np.linspace(1,0,fade)
sst=np.stack([mix,mix],1)
with wave.open(f"{OUT}/cxl_audio.wav","wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((sst*32767).astype(np.int16).tobytes())

subprocess.run([FF,"-y","-i",f"{OUT}/cxl_silent.mp4","-i",f"{OUT}/cxl_audio.wav",
    "-vf","scale=720:1280","-c:v","libx264","-profile:v","main","-pix_fmt","yuv420p","-crf","25","-preset","medium",
    "-c:a","aac","-b:a","160k","-movflags","+faststart","-shortest",f"{OUT}/niv-cristaux-long.mp4"],
    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
print("DUREE ~%.1fs"%total,"| taille",os.path.getsize(f"{OUT}/niv-cristaux-long.mp4"))
