# Reproduction EXACTE du style n°2 de la planche envoyée à Ludovic (planche-client3.html)
# Mêmes valeurs CSS : filet 140px, losange 7px, Playfair 30px/21px ls 1px, Cinzel 12.5px ls 4.5px.
import json, subprocess, os
S = os.path.abspath('.')
def html(l1, l2, s1, color):
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Playfair;src:url({S}/eaead17c7dbfcd5d-s.p.woff2) format('woff2')}}
@font-face{{font-family:Cinzel;src:url({S}/a273567b21a7c318-s.p.woff2) format('woff2')}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:transparent;width:460px}}
.g{{color:{color};text-align:center;padding:10px 0}}
.pl{{font-family:Playfair,serif}}.cz{{font-family:Cinzel,serif}}
.rule{{height:1px;background:{color};margin:6px auto}}
</style></head><body>
<div class="g" id="g"><div class="rule" id="r1" style="width:140px"></div>
<div id="dm" style="width:7px;height:7px;background:{color};transform:rotate(45deg);margin:7px auto 0"></div>
<div class="pl" id="t1" style="font-size:{s1}px;margin-top:3px;letter-spacing:1px">{l1.upper()}</div>
<div class="cz" id="t2" style="font-size:12.5px;letter-spacing:4.5px;margin-top:4px">{l2}</div>
<div class="rule" id="r2" style="width:140px;margin-top:8px"></div></div>
<script>
function chars(id){{const el=document.getElementById(id).firstChild;const out=[];
for(let i=0;i<el.length;i++){{const r=document.createRange();r.setStart(el,i);r.setEnd(el,i+1);const b=r.getBoundingClientRect();out.push([el.data[i],b.left,b.top,b.width,b.height]);}}return out;}}
function box(id){{const b=document.getElementById(id).getBoundingClientRect();return [b.left,b.top,b.width,b.height];}}
document.fonts.ready.then(()=>{{const d={{t1:chars('t1'),t2:chars('t2'),r1:box('r1'),r2:box('r2'),dm:box('dm'),g:box('g'),
fs1:parseFloat(getComputedStyle(document.getElementById('t1')).fontSize),
base1:0,base2:0}};
// ligne de base : via un span de hauteur 0 aligné sur la baseline
for(const k of ['t1','t2']){{const el=document.getElementById(k);const s=document.createElement('span');s.style.display='inline-block';s.style.height='0';s.style.verticalAlign='baseline';el.appendChild(s);d['base'+k.slice(1)]=s.getBoundingClientRect().top;}}
document.title=JSON.stringify(d);}});
</script></body></html>'''

CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
specs = [("verre-1", "Claude", "MILLÉSIME 1976", 30), ("verre-2", "Ami de Claude", "MILLÉSIMÉ", 21)]
for name, l1, l2, s1 in specs:
    for color, suffix in (("#000", ""),):
        p = f'grav2/{name}.html'; open(p, 'w').write(html(l1, l2, s1, color))
        # 1) mesures
        out = subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
                              '--virtual-time-budget=3000', '--dump-dom', 'file://' + os.path.abspath(p)],
                             capture_output=True, text=True).stdout
        import re, html as H
        t = re.search(r'<title>(.*?)</title>', out, re.S).group(1)
        json.dump(json.loads(H.unescape(t)), open(f'grav2/{name}.json', 'w'))
        # 2) rendu PNG x10 (exact navigateur)
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
                        '--force-device-scale-factor=10', '--default-background-color=00000000', '--virtual-time-budget=3000',
                        '--window-size=460,160', f'--screenshot={os.path.abspath("grav2/"+name+"-raw.png")}', 'file://' + os.path.abspath(p)],
                       capture_output=True)
    print(name, 'ok')
