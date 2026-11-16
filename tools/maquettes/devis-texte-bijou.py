#!/usr/bin/env python3
"""Maquette « texte au dos sur le devis d'un bijou » (16/11/2026, collier plaque d'Alicia).

Usage : python3 tools/maquettes/devis-texte-bijou.py <dossier capture> <sortie.html>
Le dossier contient : src.html (curl d'une page /document/<id> d'un devis de bijou), les 3 feuilles CSS
du site (*.css), logo.jpg, emb-<id>.jpg (photos des emballages), recto.jpg (aperçu photo sur la plaque),
verso.jpg (plaque vierge). Le site n'est pas touché.
"""
import base64, glob, io, os, re, sys

from PIL import Image

d, sortie = sys.argv[1], sys.argv[2]
h = open(os.path.join(d, "src.html"), encoding="utf-8").read()


def uri(path, w=520, q=84):
    im = Image.open(path).convert("RGB")
    im.thumbnail((w, w))
    b = io.BytesIO()
    im.save(b, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


css = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(d, "*.css"))))
i, j = h.find("<main"), h.find("</main>") + 7
main = re.sub(r"<script\b.*?</script>", "", h[i:j], flags=re.S)
main = main.replace('src="/logo-niv-creation.jpg"', f'src="{uri(os.path.join(d, "logo.jpg"), 300)}"')
for f in glob.glob(os.path.join(d, "emb-*.jpg")):
    rid = os.path.basename(f)[4:-4]
    main = main.replace(f'src="/api/img/{rid}"', f'src="{uri(f, 200)}"')
# Les cartes « Compléter votre commande » ne servent pas ici : retirées.
main = re.sub(r'<section class="dz no-print" id="dz-plus">.*?</section>', "", main, flags=re.S)
main = re.sub(r'<button type="button" class="dz-noel">.*?</button>', "", main, flags=re.S)

# Le devis d'Alicia (exemple) à la place de celui capturé.
main = main.replace("DEV-1535", "DEV-1556").replace("02 novembre 2026", "16 novembre 2026")
main = main.replace("Manuel<br/>moreiramanuel@diocese-paris.fr", "Alicia<br/>adresse de la cliente")
lignes = (
    '<tr style="border-bottom:1px solid var(--line)"><td style="padding:8px 6px">Collier Plaque Acier — Argenté</td>'
    '<td style="padding:8px 6px;text-align:center">1</td><td style="padding:8px 6px;text-align:right">24,21 €</td><td style="padding:8px 6px;text-align:right">24,21 €</td></tr>'
    '<tr style="border-bottom:1px solid var(--line)"><td style="padding:8px 6px">Gravure de votre photo au recto (offerte)</td>'
    '<td style="padding:8px 6px;text-align:center">1</td><td style="padding:8px 6px;text-align:right">0,00 €</td><td style="padding:8px 6px;text-align:right">0,00 €</td></tr>'
    '<tr id="dvt-ligne" hidden style="border-bottom:1px solid var(--line);background:#fffaf0"><td style="padding:8px 6px" id="dvt-ligne-txt"></td>'
    '<td style="padding:8px 6px;text-align:center">1</td><td style="padding:8px 6px;text-align:right">8,00 €</td><td style="padding:8px 6px;text-align:right">8,00 €</td></tr>'
)
main = re.sub(r"<tbody>.*?</tbody>", "<tbody>" + lignes + "</tbody>", main, count=1, flags=re.S)
main = re.sub(r"<strong>Total des articles<!-- --> : <!-- -->28,11.€</strong>",
              '<strong>Total des articles : <span id="dvt-total">24,21 €</span></strong>', main)
main = re.sub(r'(<p style="margin-top:20px;[^>]*>)Noms à graver[^<]*(</p>)',
              r"\1Votre photo est gravée au recto de la plaque, comme sur l'aperçu envoyé. Emballage cadeau et livraison au choix sur cette page.\2", main)
main = re.sub(r'<div class="dz-tot"><span>Total du devis</span><b>28,11.€</b></div>',
              '<div class="dz-tot"><span>Total du devis</span><b id="dvt-tot2">24,21 €</b></div>', main)
main = main.replace("format bracelet", "format collier")

FONTS = [("playfair", "Playfair", "'Playfair Display',serif"), ("cinzel", "Cinzel", "'Cinzel',serif"),
         ("cinzel-deco", "Cinzel Décoratif", "'Cinzel Decorative',serif"), ("montserrat", "Montserrat", "'Montserrat',sans-serif"),
         ("inter", "Inter", "'Inter',sans-serif"), ("great-vibes", "Great Vibes", "'Great Vibes',cursive"),
         ("allura", "Allura", "'Allura',cursive"), ("pacifico", "Pacifico", "'Pacifico',cursive")]
fbtn = "".join(f'<button type="button" class="dvo-f" data-f="{k}" style="font-family:{fam}">{lab}</button>' for k, lab, fam in FONTS)

bloc = f'''
<section class="dvo no-print" id="dvt">
  <h3>Option de votre bijou <span>facultatif</span></h3>
  <p class="dvo-lead">Cochez si vous voulez ajouter un texte : le total se met à jour, et vous payez tout en une fois.</p>
  <label class="dvo-opt">
    <input type="checkbox" id="dvt-on" />
    <span class="dvo-ic">Aa</span>
    <span class="dvo-txt"><b>Un texte gravé au dos de la plaque</b><small>Un prénom, une date, un petit mot. Votre photo reste au recto.</small></span>
    <span class="dvo-px">+8,00 €</span>
  </label>
  <div class="dvo-champs" id="dvt-champs" hidden>
    <label class="dvo-l" for="dvt-txt">Votre texte <span id="dvt-n">0 / 30</span></label>
    <input type="text" id="dvt-txt" maxlength="30" placeholder="Ex : Papa · 16.11.2026" />
    <span class="dvo-l">Écriture</span>
    <div class="dvo-fonts">{fbtn}</div>
    <div class="dvt-faces">
      <figure><img src="{uri(os.path.join(d, "recto.jpg"), 360)}" alt="Recto : votre photo" /><figcaption>Recto · votre photo</figcaption></figure>
      <figure><div class="dvt-verso"><img src="{uri(os.path.join(d, "verso.jpg"), 360)}" alt="" /><span id="dvt-ap">Votre texte</span></div><figcaption>Verso · votre texte</figcaption></figure>
    </div>
    <p class="dvo-manque" id="dvt-manque">Écrivez votre texte, ou décochez l'option.</p>
  </div>
</section>'''
main = main.replace('<section class="dz no-print" id="dz-emb">', bloc + '<section class="dz no-print" id="dz-emb">', 1)

atelier = f'''
<main class="dvt-vue" id="vue-atelier" hidden><section class="section"><div class="container" style="max-width:720px">
  <p class="dvt-qui">Ce que tu reçois dans Gestion, une fois qu'Alicia a payé (exemple : elle a écrit « Papa · 16.11.2026 » en Great Vibes) :</p>
  <div class="dvt-fiche">
    <div class="dvt-fh"><b>Commande #0ABC1234</b><span>Alicia · payée 32,21 € + livraison · Devis DEV-1556</span></div>
    <div class="dvt-ov"><b>🧾 Vendu en plus — à ne pas oublier</b><ul><li>✒️ Texte gravé au dos de la plaque : <b>+8,00 €</b></li><li>📦 Emballage : celui qu'elle a choisi sur la page du devis</li></ul></div>
    <div class="dvt-art"><b>Collier Plaque Acier — Argenté</b> <span>× 1</span></div>
    <table class="dvt-tg"><thead><tr><th>Face</th><th>À graver</th></tr></thead><tbody>
      <tr><td>Recto</td><td><div class="dvt-ph"><img src="{uri(os.path.join(d, "recto.jpg"), 200)}" alt="" /><span>Photo de la cliente (celle de l'aperçu envoyé)<br/><u>⬇ Télécharger la photo</u></span></div></td></tr>
      <tr><td>Verso</td><td>Texte : <b class="dvt-gv">Papa · 16.11.2026</b><br/><small>Écriture : Great Vibes · choisi par la cliente sur le devis</small></td></tr>
    </tbody></table>
    <p class="dvt-pied">Le texte, l'écriture et la photo arrivent aussi dans l'e-mail 🛎️ de la commande, comme une commande faite sur la fiche du collier.</p>
  </div>
</div></section></main>'''

barre = '''<nav class="dvt-bar"><button type="button" data-v="page" class="on">Page du devis (Alicia)</button><button type="button" data-v="atelier">Ce que tu reçois (fiche atelier)</button></nav>'''

mycss = '''
body{background:var(--cream,#fbf7ee)}
.dvt-bar{position:sticky;top:0;z-index:5;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:10px 16px;background:#1a1206}
.dvt-bar button{border:1px solid #c9a24b;background:transparent;color:#f3e8d3;border-radius:999px;padding:8px 14px;font:600 .88rem system-ui,sans-serif;cursor:pointer}
.dvt-bar button.on{background:#c9a24b;color:#1a1206}
#dvt-txt{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d8c393;border-radius:10px;font-size:1rem}
.dvt-faces{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.dvt-faces figure{margin:0;text-align:center}
.dvt-faces img{width:100%;border-radius:12px;display:block}
.dvt-faces figcaption{font-size:.8rem;color:var(--ink-soft);margin-top:6px}
.dvt-verso{position:relative}
.dvt-verso span{position:absolute;left:24%;right:24%;top:46%;transform:translateY(-50%);text-align:center;color:#2a2a2c;font-size:1.25rem;line-height:1.2;overflow-wrap:anywhere;text-shadow:0 1px 0 rgba(255,255,255,.35)}
.dvt-qui{font-size:.92rem;color:var(--ink-soft);margin:0 0 12px}
.dvt-fiche{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 18px;box-shadow:var(--shadow)}
.dvt-fh{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}.dvt-fh span{font-size:.85rem;color:var(--ink-soft)}
.dvt-ov{border:2px solid #b3261e;border-radius:12px;padding:10px 14px;background:#fff6f5;margin-bottom:14px}
.dvt-ov ul{margin:6px 0 0;padding-left:18px;font-size:.9rem}
.dvt-art{margin:6px 0 8px}.dvt-art span{color:var(--ink-soft)}
.dvt-tg{width:100%;border-collapse:collapse;font-size:.9rem}
.dvt-tg th,.dvt-tg td{border:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}
.dvt-tg th{background:#f3e8d3}
.dvt-ph{display:flex;gap:10px;align-items:center}.dvt-ph img{width:70px;border-radius:8px}
.dvt-ph u{color:#7c6120}
.dvt-gv{font-family:'Great Vibes',cursive;font-size:1.4rem;font-weight:400}
.dvt-pied{font-size:.85rem;color:var(--ink-soft);margin:12px 0 0}
@media (max-width:420px){.dvt-verso span{font-size:1rem}}
'''

js = '''
<script>
(function(){
  var euro=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var noms={playfair:'Playfair','cinzel':'Cinzel','cinzel-deco':'Cinzel Décoratif',montserrat:'Montserrat',inter:'Inter','great-vibes':'Great Vibes',allura:'Allura',pacifico:'Pacifico'};
  var on=document.getElementById('dvt-on'),champs=document.getElementById('dvt-champs'),txt=document.getElementById('dvt-txt'),
      ap=document.getElementById('dvt-ap'),n=document.getElementById('dvt-n'),manque=document.getElementById('dvt-manque'),
      ligne=document.getElementById('dvt-ligne'),lt=document.getElementById('dvt-ligne-txt'),police='playfair',emb=0;
  var fb=[].slice.call(document.querySelectorAll('.dvo-f'));
  function maj(){
    var t=txt.value.trim(),opt=on.checked&&t?8:0;
    champs.hidden=!on.checked; n.textContent=txt.value.length+' / 30';
    ap.textContent=t||'Votre texte'; manque.hidden=!!t;
    var b=fb.filter(function(x){return x.dataset.f===police})[0]; ap.style.fontFamily=b?b.style.fontFamily:'';
    fb.forEach(function(x){x.classList.toggle('on',x.dataset.f===police)});
    ligne.hidden=!opt; lt.textContent='Option : texte gravé au dos « '+t+' » (écriture '+noms[police]+')';
    document.getElementById('dvt-total').textContent=euro(24.21+opt);
    document.getElementById('dvt-tot2').textContent=euro(24.21+opt+emb);
  }
  on.addEventListener('change',maj); txt.addEventListener('input',maj);
  fb.forEach(function(x){x.addEventListener('click',function(){police=x.dataset.f;maj()})});
  [].slice.call(document.querySelectorAll('.dz-emb')).forEach(function(l){
    var inp=l.querySelector('input');
    l.addEventListener('click',function(e){ e.preventDefault();
      var p=parseFloat((l.querySelector('.dz-pr').textContent.match(/\\+([\\d,]+)/)||[0,'0'])[1].replace(',','.'));
      if(inp.checked){inp.checked=false;emb=0}else{document.querySelectorAll('.dz-emb input').forEach(function(z){z.checked=false});inp.checked=true;emb=p}
      maj();});
  });
  document.querySelectorAll('.dvt-bar button').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('.dvt-bar button').forEach(function(z){z.classList.toggle('on',z===b)});
    document.getElementById('vue-page').hidden=b.dataset.v!=='page';
    document.getElementById('vue-atelier').hidden=b.dataset.v!=='atelier'; window.scrollTo(0,0);});});
  maj();
})();
</script>'''

main = main.replace("<main>", '<main class="dvt-vue" id="vue-page">', 1)
fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;600&family=Cinzel&family=Cinzel+Decorative&family=Montserrat&family=Great+Vibes&family=Allura&family=Pacifico&display=swap">'
out = (f"<title>Texte au dos sur le devis</title>{fonts}<style>{css}{mycss}</style>"
       f"{barre}{main}{atelier}{js}")
open(sortie, "w", encoding="utf-8").write(out)
print(sortie, len(out))
