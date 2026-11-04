from PIL import Image, ImageFilter
import numpy as np, sys
base=Image.open(sys.argv[1]).convert('RGB'); W,H=base.size
x0,y0,x1,y1=338,330,738,684   # face avant du cristal sur la photo
src=np.asarray(Image.open(sys.argv[2]).convert('L')).astype(float)
alpha=np.clip((246-src)*14,0,255)
h,w=alpha.shape
yy,xx=np.mgrid[0:h,0:w]
vague=((xx<200)&(yy>=880))|(yy>950)
texte=alpha*(~vague); vg=alpha*vague
def crop(a):
    ys,xs=np.nonzero(a>20); return Image.fromarray(a[ys.min():ys.max()+1, xs.min():xs.max()+1].astype('uint8'))
T=crop(texte); V=crop(vg)
fw,fh=x1-x0,y1-y0
# écriture : centrée en largeur, un peu au-dessus du milieu
s=min(fw*0.80/T.width, fh*0.55/T.height); T=T.resize((int(T.width*s),int(T.height*s)),Image.LANCZOS)
tx=x0+(fw-T.width)//2; ty=y0+int(fh*0.36)-T.height//2
# vague : tout en bas à gauche du cristal
sv=min(fw*0.55/V.width, fh*0.50/V.height); V=V.resize((int(V.width*sv),int(V.height*sv)),Image.LANCZOS)
m=int(fw*0.04); vx=x0+m; vy=y1-m-V.height
layer=Image.new('L',(W,H),0); layer.paste(T,(tx,ty)); 
lv=Image.new('L',(W,H),0); lv.paste(V,(vx,vy)); layer=Image.fromarray(np.maximum(np.asarray(layer),np.asarray(lv)))
ombre=layer.filter(ImageFilter.GaussianBlur(2.2)).point(lambda v:int(v*0.55))
dec=Image.new('L',(W,H),0); dec.paste(ombre.crop((0,0,W-2,H-2)),(2,2))
img=Image.composite(Image.new('RGB',(W,H),(120,112,100)),base,dec)
img=Image.composite(Image.new('RGB',(W,H),(252,252,250)),img,layer.point(lambda v:int(v*0.95)))
img.save(sys.argv[3],quality=92)
