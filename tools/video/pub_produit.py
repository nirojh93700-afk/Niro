# -*- coding: utf-8 -*-
# Générateur GÉNÉRIQUE de vidéo produit — 1 vidéo par produit à partir de products.json
# Usage : python pub_produit.py <slug> [<slug2> ...]
#         python pub_produit.py --all
# Vraies couleurs du site, durée adaptée au nombre de photos, musique + voix + fondus.
import os, sys, json, subprocess, wave, asyncio, re
os.environ.setdefault('SSL_CERT_FILE','/root/.ccr/ca-bundle.crt')
os.environ.setdefault('REQUESTS_CA_BUNDLE','/root/.ccr/ca-bundle.crt')
import edge_tts
VOICE='fr-FR-DeniseNeural'
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, imageio

OUT="/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
VID=f"{OUT}/produits_video"; os.makedirs(VID,exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
W,H,FPS,SR=1080,1920,30,44100
# Couleurs EXACTES du site (src/app/globals.css)
GOLD=(194,161,78)       # --gold  #c2a14e
GOLD_DARK=(169,137,53)  # --gold-dark #a98935
CREAM=(250,246,239)     # --cream #faf6ef
PAPER=(255,253,249)     # --paper #fffdf9
INK=(43,38,32)          # --ink #2b2620
INK_SOFT=(90,82,71)     # --ink-soft #5a5247
WHITE=(255,255,255);SOFT=(235,220,180)
SERIFB="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p,s):return ImageFont.truetype(p,s)
SITE="https://nivcreation.fr"
MIN,PRE=2.5,0.25
XF=0.45

PRODUCTS={p["slug"]:p for p in json.load(open(f"{OUT}/products.json"))}

def imgurl(path):
    return SITE+path if path.startswith("/") else path
def dl(path,slug,i):
    dst=f"{VID}/_{slug}_{i}.jpg"
    r=subprocess.run(["curl","-s","--max-time","60","-o",dst,imgurl(path)])
    if os.path.getsize(dst)<2000: return None
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
    for y in range(H):p[0,y]=int(230*max(0,(y-1020)/(H-1020))**1.05)
    dark=Image.new("RGBA",(W,H),(INK[0],INK[1],INK[2],255));dark.putalpha(band.resize((W,H)))
    im=Image.alpha_composite(im,dark);d=ImageDraw.Draw(im)
    d.line([(60,H-392),(180,H-392)],fill=GOLD,width=5)
    fT=F(SERIFB,62)
    ty=H-392+24
    for ln in wrap(d,title,fT,W-120)[:2]:d.text((60,ty),ln,font=fT,fill=GOLD);ty+=70
    y=max(ty+6,H-262)
    for ln in wrap(d,sub,F(SANS,42),W-120)[:2]:d.text((60,y),ln,font=F(SANS,42),fill=WHITE);y+=52
    d.text((60,H-84),"nivcreation.fr",font=F(SANSB,34),fill=SOFT)
    return im
def card(big,small,big2=None):
    im=Image.new("RGB",(W,H),CREAM)
    grad=Image.new("L",(1,H),0);gp=grad.load()
    for y in range(H):gp[0,y]=int(255*(1-y/H))
    im=Image.composite(Image.new("RGB",(W,H),PAPER),im,grad.resize((W,H)))
    d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,12],fill=GOLD);d.rectangle([0,H-12,W,H],fill=GOLD_DARK)
    fB=F(SERIFB,84)
    lines=wrap(d,big,fB,W-150);y=H//2-160-((len(lines)-1)*52)
    for ln in lines:
        wb=d.textlength(ln,font=fB);d.text(((W-wb)//2,y),ln,font=fB,fill=GOLD_DARK);y+=100
    d.line([(W//2-70,y+6),(W//2+70,y+6)],fill=GOLD,width=4)
    fS=F(SANS,48);ws=d.textlength(small,font=fS)
    d.text(((W-ws)//2,y+28),small,font=fS,fill=INK)
    if big2:
        f2=F(SANSB,42);w2=d.textlength(big2,font=f2)
        d.text(((W-w2)//2,y+104),big2,font=f2,fill=INK_SOFT)
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

def clean(t):
    t=re.sub(r"\s+"," ",t or "").strip()
    return t
def euro(p):
    if p is None: return ""
    s=("%.2f"%float(p)).replace(".",",")
    return s+" €"

# petites accroches courtes par photo (variées) à partir des bullets / tagline
def photo_captions(prod, n):
    caps=[]  # (titre, sous-titre, voix)
    name=prod["name"]
    tl=clean(prod["tagline"])
    bl=[clean(b) for b in prod.get("bullets",[]) if clean(b)]
    # titre court = 2-3 mots depuis le nom
    short=name
    # 1re photo : nom + tagline
    caps.append((name, tl[:80], tl or f"Découvrez {name}."))
    # photos suivantes : puiser dans les bullets
    pool=bl[:]
    fallback=[
      ("Personnalisable","Gravé selon vos envies.","Entièrement personnalisable, gravé selon vos envies."),
      ("Fait main","En France, avec soin.","Fait main en France, avec le plus grand soin."),
      ("Un cadeau unique","Qui fait toujours plaisir.","Un cadeau unique qui fait toujours plaisir."),
      ("Gravure laser","Nette et durable.","Une gravure laser nette et durable."),
    ]
    fi=0
    for k in range(1,n):
        if pool:
            b=pool.pop(0)
            # séparer "Label : valeur"
            if " : " in b:
                lab,val=b.split(" : ",1)
                caps.append((lab.strip().capitalize(), val.strip()[:80], f"{lab.strip()} : {val.strip()}"))
            else:
                caps.append((short, b[:80], b))
        else:
            t,su,vo=fallback[fi%len(fallback)];fi+=1
            caps.append((t,su,vo))
    return caps

def build(slug):
    prod=PRODUCTS.get(slug)
    if not prod: print("SKIP inconnu",slug); return None
    imgs=prod["images"][:7]
    # télécharger
    locs=[]
    for i,p in enumerate(imgs):
        dst=dl(p,slug,i)
        if dst: locs.append(dst)
    if not locs: print("SKIP aucune photo",slug); return None
    n=len(locs)
    caps=photo_captions(prod,n)
    price=euro(prod["price"])
    livr="Livraison offerte" if prod["freeShipping"] else "Sur nivcreation.fr"
    ZW,ZH=int(W*1.20),int(H*1.20)
    segs=[]
    # intro
    intro_vo=f"Niv Création vous présente : {prod['name']}."
    di=tts(intro_vo,f"{VID}/{slug}_i.wav")
    segs.append({"kind":"card","img":card(prod["name"],clean(prod["type"]) or "Personnalisé, fait main").convert("RGB"),"ov":None,"dur":max(MIN,PRE+di+0.35),"vo":f"{VID}/{slug}_i.wav"})
    # photos
    for i,loc in enumerate(locs):
        im=Image.open(loc).convert("RGB");zi=cover(im,ZW,ZH)
        title,sub,vo=caps[i]
        ov=overlay(title,sub);dv=tts(vo,f"{VID}/{slug}_{i}.wav")
        segs.append({"kind":"prod","img":zi,"ov":ov,"dur":max(MIN,PRE+dv+0.4),"vo":f"{VID}/{slug}_{i}.wav","dir":i%2})
    # outro
    cta_vo=(f"{prod['name']}, disponible dès maintenant sur nivcréation point f r." if not price
            else f"À partir de {price.replace('€','euros').replace(',',' euro ')}, sur nivcréation point f r.")
    dc=tts(cta_vo,f"{VID}/{slug}_c.wav")
    segs.append({"kind":"card","img":card(price or prod["name"], livr, "nivcreation.fr").convert("RGB"),"ov":None,"dur":max(MIN,PRE+dc+0.55),"vo":f"{VID}/{slug}_c.wav"})

    def render_seg(s):
        nf=max(1,int(round(s["dur"]*FPS)));frames=[]
        for fi in range(nf):
            prog=fi/max(1,nf-1)
            if s["kind"]=="card":
                frame=s["img"]
            else:
                z=(1.20-0.16*prog) if s.get("dir",0)==0 else (1.04+0.16*prog)
                cw,ch=int(W*z),int(H*z)
                x=(s["img"].size[0]-cw)//2;y=(s["img"].size[1]-ch)//2
                crop=s["img"].crop((x,y,x+cw,y+ch)).resize((W,H),Image.LANCZOS).convert("RGBA")
                frame=Image.alpha_composite(crop,s["ov"]).convert("RGB")
            frames.append(np.asarray(frame,dtype=np.uint8))
        return frames

    silent=f"{VID}/{slug}_silent.mp4"
    wri=imageio.get_writer(silent,fps=FPS,codec="libx264",quality=8,
        macro_block_size=1,ffmpeg_params=["-pix_fmt","yuv420p"],ffmpeg_log_level="error")
    xf=int(XF*FPS);prev=None
    allf=[render_seg(s) for s in segs]
    for si,frames in enumerate(allf):
        if prev is not None:
            m=min(xf,len(prev),len(frames))
            for k in range(m):
                a=k/max(1,m)
                fr=(prev[len(prev)-m+k].astype(np.float32)*(1-a)+frames[k].astype(np.float32)*a)
                wri.append_data(fr.astype(np.uint8))
            body=frames[m:]
        else: body=frames
        if si<len(allf)-1:
            prev=body[-xf:] if len(body)>=xf else body[:]
            body=body[:-xf] if len(body)>=xf else []
        for fr in body: wri.append_data(fr)
    wri.close()

    # audio
    starts=[];acc=0.0
    for s in segs: starts.append(acc+PRE-0.06);acc+=s["dur"]-XF
    total=acc+XF+0.3
    N=int(total*SR)+SR;voice=np.zeros(N,dtype=np.float32)
    for s,st in zip(segs,starts):
        with wave.open(s["vo"]) as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
        i0=int(st*SR);voice[i0:i0+len(a)]+=a*0.98
    tt=np.arange(N)/SR;bpm=102;beat=60/bpm
    def env(d,k=6):nn=int(d*SR);return np.exp(-np.linspace(0,1,nn)*k)
    kick=env(0.20)*np.sin(2*np.pi*54*np.arange(int(0.20*SR))/SR)
    seed=abs(hash(slug))%9999
    hat=env(0.045,9)*np.random.RandomState(seed).randn(int(0.045*SR))
    bt=np.zeros(N,dtype=np.float32);t=0.0
    while t<total:
        idx=int(t*SR)
        if idx+len(kick)<N:bt[idx:idx+len(kick)]+=kick*0.40
        ho=idx+int(beat/2*SR)
        if ho+len(hat)<N:bt[ho:ho+len(hat)]+=hat*0.09
        t+=beat
    pad=np.zeros(N,dtype=np.float32)
    for fq in (196.0,246.94,293.66,392.0):pad+=np.sin(2*np.pi*fq*tt)
    pad=pad/np.max(np.abs(pad))*0.045*(0.6+0.4*np.sin(2*np.pi*0.1*tt))
    music=(bt+pad).astype(np.float32)
    vabs=np.abs(voice);env_v=np.convolve(vabs,np.ones(int(0.05*SR))/int(0.05*SR),mode='same')
    duck=1.0-0.62*np.clip(env_v/(np.max(env_v)+1e-6),0,1)
    mix=voice+music*duck;mix=mix/max(1.0,np.max(np.abs(mix))*1.02)
    fade=int(0.6*SR);mix[:fade]*=np.linspace(0,1,fade);mix[-fade:]*=np.linspace(1,0,fade)
    sst=np.stack([mix,mix],1)
    aud=f"{VID}/{slug}_audio.wav"
    with wave.open(aud,"wb") as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((sst*32767).astype(np.int16).tobytes())

    final=f"{VID}/niv-{slug}.mp4"
    subprocess.run([FF,"-y","-i",silent,"-i",aud,
        "-vf","scale=720:1280","-c:v","libx264","-profile:v","main","-pix_fmt","yuv420p","-crf","25","-preset","medium",
        "-c:a","aac","-b:a","150k","-movflags","+faststart","-shortest",final],
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    # nettoyage temporaires
    for f in os.listdir(VID):
        if f.startswith("_"+slug+"_") or f.startswith(slug+"_"):
            try:os.remove(f"{VID}/{f}")
            except:pass
    print(f"OK {slug}  ~{total:.1f}s  {os.path.getsize(final)//1024}Ko  ({n} photos)")
    return final

if __name__=="__main__":
    args=sys.argv[1:]
    if args==["--all"]:
        args=list(PRODUCTS.keys())
    for slug in args:
        try: build(slug)
        except Exception as e: print("ERREUR",slug,repr(e))
