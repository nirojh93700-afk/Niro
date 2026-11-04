from PIL import Image, ImageFilter
import numpy as np, sys
img=Image.open(sys.argv[1]).convert('RGB'); W,H=img.size
x0,y0,x1,y1=338,330,738,684
m=Image.open(sys.argv[2]).convert('L'); m=m.crop(m.point(lambda v:255 if v<235 else 0).getbbox())
alpha=np.clip((246-np.asarray(m).astype(float))*14,0,255)
mm=Image.fromarray(alpha.astype('uint8'))
s=min((x1-x0)*0.84/mm.width,(y1-y0)*0.84/mm.height)
mm=mm.resize((int(mm.width*s),int(mm.height*s)),Image.LANCZOS)
ox=x0+((x1-x0)-mm.width)//2; oy=y0+((y1-y0)-mm.height)//2
layer=Image.new('L',(W,H),0); layer.paste(mm,(ox,oy))
# gravure givrée : une fine ombre grise (profondeur dans le verre) puis le blanc givré
ombre=layer.filter(ImageFilter.GaussianBlur(2.2)).point(lambda v:int(v*0.55))
dec=Image.new('L',(W,H),0); dec.paste(ombre.crop((0,0,W-2,H-2)),(2,2))
img=Image.composite(Image.new('RGB',(W,H),(120,112,100)),img,dec)
img=Image.composite(Image.new('RGB',(W,H),(252,252,250)),img,layer.point(lambda v:int(v*0.95)))
img.save(sys.argv[3],quality=92)
