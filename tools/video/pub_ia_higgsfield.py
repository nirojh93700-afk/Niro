# -*- coding: utf-8 -*-
import os, subprocess, wave, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS
import imageio_ffmpeg

OUT="/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
os.makedirs(OUT,exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H=1080,1920; SR=44100
GOLD=(201,162,75); CREAM=(250,246,238); INK=(30,26,22); WHITE=(255,255,255)
SERIFB="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p,s): return ImageFont.truetype(p,s)

CLIPS=[
 ("https://d8j0ntlcm91z4.cloudfront.net/user_3F2hsegx8v1W2TPuElER4iU9L02/hf_20260626_202426_c47b10c7-2d2a-493e-a580-df0c6b52c97e.mp4","Collier Couple Cœur","Votre amour, gravé pour toujours.","Le collier couple cœur, votre amour gravé."),
 ("https://d8j0ntlcm91z4.cloudfront.net/user_3F2hsegx8v1W2TPuElER4iU9L02/hf_20260626_202428_80601b43-ea61-4746-b6c5-73030c273d34.mp4","Collier Géométrique","Élégant et personnalisé.","Le collier géométrique, élégant et personnalisé."),
 ("https://d8j0ntlcm91z4.cloudfront.net/user_3F2hsegx8v1W2TPuElER4iU9L02/hf_20260626_202429_e59e7016-b41e-4a34-8b80-31eb81bb073c.mp4","Bracelet Cœur","Un bijou tendre à graver.","Le bracelet cœur, un bijou tendre à graver."),
 ("https://d8j0ntlcm91z4.cloudfront.net/user_3F2hsegx8v1W2TPuElER4iU9L02/hf_20260626_202431_f6bb231b-3f33-48f9-881c-ae4d16c8a049.mp4","Numéro de Table","Sublimez votre mariage.","Le numéro de table, pour sublimer votre mariage."),
 ("https://d8j0ntlcm91z4.cloudfront.net/user_3F2hsegx8v1W2TPuElER4iU9L02/hf_20260626_202432_48d18077-23b4-42bc-b8bf-5fca600a4ca8.mp4","Étiquette de Serviette","Le détail qui change tout.","L'étiquette de serviette, le détail qui change tout."),
]
INTRO_VO="Niv Création, vos plus beaux cadeaux personnalisés."
CTA_VO="Découvrez tout sur nivcréation point f r."

def dl(url,dst):
    subprocess.run(["curl","-s","--max-time","90","-o",dst,url],check=True)

# ---- overlays ----
def wrap(d,t,f,mw):
    out=[];cur=""
    for w in t.split():
        tt=(cur+" "+w).strip()
        if d.textlength(tt,font=f)<=mw:cur=tt
        else:out.append(cur);cur=w
    if cur:out.append(cur)
    return out

def overlay_product(name,sub):
    im=Image.new("RGBA",(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    # bandeau bas dégradé sombre
    band=Image.new("L",(1,H),0);p=band.load()
    for y in range(H):p[0,y]=int(210*max(0,(y-1150)/(H-1150))**1.2)
    band=band.resize((W,H))
    dark=Image.new("RGBA",(W,H),(15,12,9,255));dark.putalpha(band)
    im=Image.alpha_composite(im,dark);d=ImageDraw.Draw(im)
    fN=F(SERIFB,74);fS=F(SANS,42);fB=F(SANSB,34)
    d.text((60,H-360),name,font=fN,fill=GOLD)
    y=H-260
    for ln in wrap(d,sub,fS,W-120):
        d.text((60,y),ln,font=fS,fill=WHITE);y+=54
    d.text((60,H-90),"nivcreation.fr",font=fB,fill=(235,220,180))
    return im

def card(big,small,big2=None):
    im=Image.new("RGBA",(W,H),CREAM+(255,));d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,14],fill=GOLD+(255,));d.rectangle([0,H-14,W,H],fill=GOLD+(255,))
    fB=F(SERIFB,104);fS=F(SANS,50)
    wb=d.textlength(big,font=fB);d.text(((W-wb)//2,H//2-160),big,font=fB,fill=GOLD)
    ws=d.textlength(small,font=fS);d.text(((W-ws)//2,H//2-30),small,font=fS,fill=INK)
    if big2:
        f2=F(SANSB,44);w2=d.textlength(big2,font=f2);d.text(((W-w2)//2,H//2+60),big2,font=f2,fill=(120,100,60))
    return im

# ---- voix (accélérée pour être plus vive) ----
def tts(text,dst_wav):
    mp3=dst_wav.replace(".wav",".mp3")
    gTTS(text,lang="fr",slow=False).save(mp3)
    subprocess.run([FF,"-y","-i",mp3,"-filter:a","atempo=1.12","-ar",str(SR),"-ac","1",dst_wav],
                   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    with wave.open(dst_wav) as w:return w.getnframes()/SR

segments=[]  # (video_path, duration, vo_wav or None)
PAD=0.45; MIN=2.4

# intro card
Image.alpha_composite(Image.new("RGBA",(W,H),(0,0,0,0)),card("NiV CRÉATION","L'atelier français de gravure")).convert("RGB").save(f"{OUT}/intro.png")
d_intro=tts(INTRO_VO,f"{OUT}/vo_intro.wav")
seg_intro=max(MIN,PAD+d_intro+0.4)
subprocess.run([FF,"-y","-loop","1","-i",f"{OUT}/intro.png","-t",f"{seg_intro:.2f}","-r","30",
   "-vf","scale=1080:1920","-c:v","libx264","-pix_fmt","yuv420p",f"{OUT}/seg_intro.mp4"],
   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
segments.append((f"{OUT}/seg_intro.mp4",seg_intro,f"{OUT}/vo_intro.wav"))

# clips produits
for i,(url,name,sub,vo) in enumerate(CLIPS):
    raw=f"{OUT}/clip{i}.mp4";dl(url,raw)
    ov=f"{OUT}/ov{i}.png";overlay_product(name,sub).save(ov)
    dvo=tts(vo,f"{OUT}/vo{i}.wav")
    dur=max(MIN,PAD+dvo+0.4)
    seg=f"{OUT}/seg{i}.mp4"
    subprocess.run([FF,"-y","-ss","0.3","-i",raw,"-i",ov,"-t",f"{dur:.2f}",
       "-filter_complex","[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v];[v][1:v]overlay=0:0[o]",
       "-map","[o]","-r","30","-c:v","libx264","-pix_fmt","yuv420p","-an",seg],
       stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    segments.append((seg,dur,f"{OUT}/vo{i}.wav"))

# cta card
card("nivcreation.fr","Commandez et personnalisez","Fait main · en France").convert("RGB").save(f"{OUT}/cta.png")
d_cta=tts(CTA_VO,f"{OUT}/vo_cta.wav")
seg_cta=max(MIN,PAD+d_cta+0.6)
subprocess.run([FF,"-y","-loop","1","-i",f"{OUT}/cta.png","-t",f"{seg_cta:.2f}","-r","30",
   "-vf","scale=1080:1920","-c:v","libx264","-pix_fmt","yuv420p",f"{OUT}/seg_cta.mp4"],
   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
segments.append((f"{OUT}/seg_cta.mp4",seg_cta,f"{OUT}/vo_cta.wav"))

# ---- concat vidéo ----
with open(f"{OUT}/list.txt","w") as f:
    for s,_,_ in segments: f.write(f"file '{s}'\n")
subprocess.run([FF,"-y","-f","concat","-safe","0","-i",f"{OUT}/list.txt",
   "-c:v","libx264","-pix_fmt","yuv420p","-r","30",f"{OUT}/video_silent.mp4"],
   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)

# ---- audio : voix placée + beat rythmé ----
total=sum(d for _,d,_ in segments)
N=int(total*SR)+SR
voice=np.zeros(N,dtype=np.float32);cur=0.0
for s,dur,vw in segments:
    if vw:
        with wave.open(vw) as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
        st=int((cur+PAD-0.1)*SR);voice[st:st+len(a)]+=a*0.98
    cur+=dur
# beat ~112 BPM
bpm=112;beat=60.0/bpm;tt=np.arange(N)/SR;beat_track=np.zeros(N,dtype=np.float32)
def env(dur,sr):n=int(dur*sr);return np.exp(-np.linspace(0,1,n)*6)
kick=env(0.18,SR)*np.sin(2*np.pi*55*np.arange(int(0.18*SR))/SR)
hat_n=int(0.05*SR);hat=env(0.05,SR)*(np.random.RandomState(1).randn(hat_n))
t=0.0;bi=0
while t<total:
    idx=int(t*SR)
    if idx+len(kick)<N: beat_track[idx:idx+len(kick)]+=kick*0.5
    ho=idx+int(beat/2*SR)
    if ho+len(hat)<N: beat_track[ho:ho+len(hat)]+=hat*0.12
    t+=beat;bi+=1
# nappe chaleureuse douce
pad=np.zeros(N,dtype=np.float32)
for fq in (220.0,277.18,329.63):
    pad+=np.sin(2*np.pi*fq*tt)
pad=pad/np.max(np.abs(pad))*0.06*(0.6+0.4*np.sin(2*np.pi*0.12*tt))
mix=voice+beat_track*0.5+pad
fade=int(0.5*SR);mix[:fade]*=np.linspace(0,1,fade);mix[-fade:]*=np.linspace(1,0,fade)
mix=np.clip(mix,-1,1);st=np.stack([mix,mix],1)
with wave.open(f"{OUT}/audio.wav","wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype(np.int16).tobytes())

# ---- mux + version légère ----
subprocess.run([FF,"-y","-i",f"{OUT}/video_silent.mp4","-i",f"{OUT}/audio.wav",
   "-c:v","libx264","-profile:v","main","-pix_fmt","yuv420p","-crf","24","-preset","medium",
   "-c:a","aac","-b:a","160k","-movflags","+faststart","-shortest",f"{OUT}/niv-pub-ia.mp4"],
   stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
print("DUREE %.1fs"%total)
print("FINAL:",os.path.getsize(f"{OUT}/niv-pub-ia.mp4"),"octets")
