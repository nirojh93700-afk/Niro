import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
S=sys.argv[1]
# planches décodées p00..p15 ; numéros attendus par planche (numérotation validée du gobelet)
RANGES={0:(1,10),1:(11,27),2:(28,36),3:(37,45),4:(46,51),5:(52,55),6:(56,58),7:(59,64),8:(65,70),9:(71,74),
        10:(75,79),11:(80,81),12:(82,91),13:(92,95),14:(96,101),15:(102,103)}
out={}
for pi,(a,b) in RANGES.items():
    im=Image.open(f'{S}/p{pi:02d}.png').convert('RGB'); A=np.asarray(im).astype(int); H,W,_=A.shape
    R,G,B=A[...,0],A[...,1],A[...,2]
    gold=(R>150)&(G>110)&(G<215)&(B<130)&((R-B)>70)
    lab,n=ndi.label(gold)
    badges=[]
    for i in range(1,n+1):
        ys,xs=np.where(lab==i)
        if len(xs)<80: continue
        w=xs.max()-xs.min()+1; h=ys.max()-ys.min()+1
        if w<12 or h<12 or w>120 or abs(w-h)>max(8,0.4*w): continue
        fill=len(xs)/(w*h)
        if fill<0.5: continue
        badges.append((xs.mean(),ys.mean(),max(w,h)/2))
    # tri lecture : lignes puis colonnes
    badges.sort(key=lambda t:(t[1],t[0]))
    # regrouper par ligne (tolérance), puis x
    rows=[]
    for bdg in badges:
        for r in rows:
            if abs(r[0][1]-bdg[1])<max(30,bdg[2]*2): r.append(bdg); break
        else: rows.append([bdg])
    badges=[bd for r in rows for bd in sorted(r,key=lambda t:t[0])]
    exp=b-a+1
    # masque encre
    gray=A.mean(axis=2)
    ink=gray<120
    bm=np.zeros((H,W),bool)
    yy,xx=np.mgrid[0:H,0:W]
    for (cx,cy,r) in badges: bm|=((xx-cx)**2+(yy-cy)**2)<=(r+4)**2
    ink&=~bm
    dil=ndi.binary_dilation(ink,iterations=max(6,W//70))
    cl,cn=ndi.label(dil)
    objs=ndi.find_objects(cl)
    comps=[]
    for i,sl in enumerate(objs):
        if sl is None: continue
        cnt=(ink[sl]&(cl[sl]==i+1)).sum()
        if cnt<40: continue
        comps.append((sl[1].start,sl[0].start,sl[1].stop,sl[0].stop,cnt))
    # assigner chaque composant au badge le plus proche de sa boîte
    def dist(bd,c):
        cx,cy,_=bd; x0,y0,x1,y1,_=c
        dx=max(x0-cx,0,cx-x1); dy=max(y0-cy,0,cy-y1); return (dx*dx+dy*dy)**.5
    boxes=[None]*len(badges)
    for c in comps:
        if not badges: break
        k=min(range(len(badges)),key=lambda k:dist(badges[k],c))
        x0,y0,x1,y1,_=c
        if boxes[k] is None: boxes[k]=[x0,y0,x1,y1]
        else: boxes[k]=[min(boxes[k][0],x0),min(boxes[k][1],y0),max(boxes[k][2],x1),max(boxes[k][3],y1)]
    res=[]
    for k,bd in enumerate(badges):
        num=a+k if k<exp else None
        res.append({"num":num,"badge":[round(bd[0]),round(bd[1]),round(bd[2])],"box":boxes[k]})
    out[pi]=res
    print(f'p{pi:02d} attendu {exp} badges trouvés {len(badges)}', [r["num"] for r in res])
    # contrôle visuel
    d=ImageDraw.Draw(im)
    for r in res:
        if r["box"]: d.rectangle(r["box"],outline=(220,0,0),width=2)
        d.text((r["badge"][0]+r["badge"][2]+2,r["badge"][1]-6),str(r["num"]),fill=(0,0,255))
    im.save(f'{S}/ctl{pi:02d}.png')
json.dump(out,open(f'{S}/boxes.json','w'),indent=1)
