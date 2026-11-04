from PIL import Image, ImageFilter, ImageDraw, ImageChops
import numpy as np, sys
base=Image.open(sys.argv[1]).convert('RGB'); W,H=base.size
a=np.asarray(base).astype(float)
# 1) assombrir la scène pour que le blanc gravé se lise (comme une photo de cristal sur fond sombre)
lum=a.mean(axis=2,keepdims=True)
dark=a*0.42
# garder les reflets des arêtes : là où l'original est très clair ET localement plus clair que le fond
blur=np.asarray(base.filter(ImageFilter.GaussianBlur(6))).astype(float).mean(axis=2,keepdims=True)
hl=np.clip((lum-blur-10)/20,0,1)*0.8
out=dark*(1-hl)+a*hl
img=Image.fromarray(np.clip(out,0,255).astype('uint8'))
# 2) intérieur du cristal (face avant) un peu plus sombre et froid
x0,y0,x1,y1=338,330,738,684
face=Image.new('L',(W,H),0); ImageDraw.Draw(face).rectangle((x0,y0,x1,y1),fill=150); face=face.filter(ImageFilter.GaussianBlur(6))
teinte=Image.new('RGB',(W,H),(38,40,44)); img=Image.composite(teinte,img,face)
# 3) motif de la cliente : l'encre (noir, cœur gris-bleu, vague) devient blanc gravé, le fond blanc reste transparent
m=Image.open(sys.argv[2]).convert('L'); m=m.crop(m.point(lambda v:255 if v<235 else 0).getbbox())
alpha=np.clip((246-np.asarray(m).astype(float))*14,0,255)
mm=Image.fromarray(alpha.astype('uint8'))
fw,fh=(x1-x0)*0.84,(y1-y0)*0.84; s=min(fw/mm.width,fh/mm.height)
mm=mm.resize((int(mm.width*s),int(mm.height*s)),Image.LANCZOS)
ox=x0+((x1-x0)-mm.width)//2; oy=y0+((y1-y0)-mm.height)//2
layer=Image.new('L',(W,H),0); layer.paste(mm,(ox,oy))
glow=layer.filter(ImageFilter.GaussianBlur(3)).point(lambda v:int(v*0.5))
white=Image.new('RGB',(W,H),(240,244,248))
img=Image.composite(white,img,glow); img=Image.composite(white,img,layer.point(lambda v:int(v*0.92)))
img.save(sys.argv[3],quality=92)
