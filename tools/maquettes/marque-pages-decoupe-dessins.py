import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
S=sys.argv[1]; OUT=sys.argv[2]
auto=json.load(open(f'{S}/boxes.json'))
MANUAL={0:{1:(0,0,400,450),2:(350,70,760,250),3:(130,215,580,475),4:(190,445,560,615),5:(610,240,760,920),6:(0,540,230,1000),
          7:(205,680,420,1260),8:(400,690,620,1150),9:(390,980,760,1349),10:(0,990,260,1349)},
        1:{11:(0,0,180,290),12:(110,85,260,200),13:(210,0,640,80),14:(285,85,760,170),15:(400,190,650,270),16:(305,185,400,330),
           17:(185,180,305,340),18:(80,200,190,305),19:(500,280,660,360),20:(650,180,760,560),21:(655,480,760,587),22:(500,370,660,520),
           23:(405,375,500,587),24:(255,380,420,587),25:(140,355,260,587),26:(0,280,150,587),27:(380,255,500,395)},
        2:{28:(0,0,320,100),29:(0,110,330,215),30:(0,235,320,330),31:(0,340,330,440),32:(0,455,320,560),33:(0,565,330,660),34:(0,675,320,760),35:(340,0,590,760),36:(590,0,760,760)},
        3:{37:(55,30,200,200),38:(205,30,370,200),39:(55,205,200,400),40:(205,205,370,400),41:(380,10,740,400),42:(10,410,370,790),43:(380,410,740,790),44:(10,800,370,1200),45:(380,800,740,1200)},
        12:{88:(40,635,200,730),89:(215,635,395,740),90:(395,635,545,730),91:(560,635,745,735)}}
GRID={3,4,5,6,7,8,9}
WANT=set(range(1,75))|set(range(88,95))|set(range(96,104))
rows_ct=[]
for pi,res in auto.items():
    pi=int(pi); im=Image.open(f'{S}/p{pi:02d}.png').convert('RGB'); A=np.asarray(im).astype(int); H,W,_=A.shape
    gray=A.mean(axis=2)
    bm=np.zeros((H,W),bool); yy,xx=np.mgrid[0:H,0:W]
    for r in res:
        cx,cy,rad=r['badge']; bm|=((xx-cx)**2+(yy-cy)**2)<=(rad+5)**2
    ink=(gray<150)&~bm
    # boîtes graines
    seeds={}
    if pi in MANUAL: seeds=dict(MANUAL[pi])
    elif pi in GRID:
        bds=[(r['num'],r['badge'][0],r['badge'][1]) for r in res]
        xs=sorted(set(round(b[1]/40) for b in bds)); 
        for num,bx,by in bds:
            right=min([b[1] for b in bds if b[1]>bx+40 and abs(b[2]-by)<60]+[W+30])-25
            below=min([b[2] for b in bds if b[2]>by+40]+[H+30])-25
            seeds[num]=(max(0,bx-30),max(0,by-30),right,below)
    else:
        for r in res:
            if r['box']: seeds[r['num']]=tuple(r['box'])
    seeds={k:v for k,v in seeds.items() if k in WANT}
    if not seeds: continue
    lab,n=ndi.label(ndi.binary_dilation(ink,iterations=2))
    objs=ndi.find_objects(lab)
    owner=np.zeros(n+1,int)
    for i,sl in enumerate(objs):
        if sl is None: continue
        m=(lab[sl]==i+1)&ink[sl]
        if m.sum()<6: continue
        ys,xs=np.nonzero(m); ys=ys+sl[0].start; xs=xs+sl[1].start
        best,bk=0,0
        for k,(x0,y0,x1,y1) in seeds.items():
            c=((xs>=x0)&(xs<x1)&(ys>=y0)&(ys<y1)).sum()
            if c>best or (c==best and c>0 and (x1-x0)*(y1-y0)<(seeds[bk][2]-seeds[bk][0])*(seeds[bk][3]-seeds[bk][1])): best,bk=c,k
        if best>=0.5*len(xs): owner[i+1]=bk
    for k in seeds:
        mask=np.isin(lab,np.nonzero(owner==k)[0])&ink
        if mask.sum()<30: print('VIDE',k); continue
        ys,xs=np.nonzero(mask); x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        # alpha = noirceur, limitée aux pixels possédés (dilatés légèrement pour garder l'antialiasing)
        own=ndi.binary_dilation(mask,iterations=2)
        alpha=np.clip((235-gray)/(235-40),0,1)*own
        sub=alpha[y0:y1,x0:x1]
        rgba=np.zeros((y1-y0,x1-x0,4),np.uint8); rgba[...,3]=(sub*255).astype(np.uint8)
        Image.fromarray(rgba,'RGBA').save(f'{OUT}/{k:03d}.png')
        rows_ct.append((k,Image.open(f'{OUT}/{k:03d}.png')))
# planche de contrôle
rows_ct.sort(key=lambda t:t[0]); T=150; cols=15; n=len(rows_ct); R=(n+cols-1)//cols
c=Image.new('RGB',(cols*(T+8),R*(T+26)),'white'); d=ImageDraw.Draw(c)
for i,(k,im) in enumerate(rows_ct):
    im=im.copy(); im.thumbnail((T,T)); bg=Image.new('RGB',im.size,(232,214,180)); bg.paste(Image.new('RGB',im.size,(40,30,20)),mask=im.split()[3])
    x=(i%cols)*(T+8); y=(i//cols)*(T+26); c.paste(bg,(x+(T-im.width)//2,y+(T-im.height)//2)); d.text((x+4,y+T+6),f'n° {k}',fill=(0,0,0))
c.save(f'{S}/controle-dessins.jpg',quality=85); print(n,'dessins', c.size)
