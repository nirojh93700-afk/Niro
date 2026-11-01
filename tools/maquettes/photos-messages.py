"""Maquette « Photos dans les messages » (01/11/2026, gérant : « fais la maquette pour ajouter les photos »).

Aucun formulaire du site ne permet de joindre une photo (Contact, bulle « Une question ? »,
« Faire une demande particulière », page « Répondre ») : les clientes écrivent « à partir de cette
photo » et rien n'arrive. La maquette ajoute un bouton « Ajouter une photo » aux quatre endroits
et montre l'alerte « À valider » du gérant avec les photos, + les deux réponses préparées.

Usage : python3 tools/maquettes/photos-messages.py <dossier> <sortie.html>
  <dossier> contient contact.html et vin.html (curl https://nivcreation.fr/contact et
  /produit/verre-a-vin-grave), css/*.css (feuilles du site) et mails-rendus.json (rendu des
  e-mails par le vrai gabarit emailLayout). Le site n'est pas touché.
"""
import base64, glob, html, io, json, os, re, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
D, OUT = sys.argv[1], sys.argv[2]


def uri(path, w=600, q=74):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


# ---------- feuilles de style du site (polices latines intégrées) ----------
css = "".join(open(f, encoding="utf-8").read() + "\n" for f in sorted(glob.glob(os.path.join(D, "css", "*.css"))))
MEDIA = os.path.join(D, "media"); os.makedirs(MEDIA, exist_ok=True)


def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        if not garder:
            return "url(data:font/woff2;base64,)"
        p = os.path.join(MEDIA, u.group(1))
        if not os.path.exists(p):
            urllib.request.urlretrieve("https://nivcreation.fr/_next/static/media/" + u.group(1), p)
        return "url(data:font/woff2;base64," + base64.b64encode(open(p, "rb").read()).decode() + ")"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)


css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"


def nettoie(part):
    part = re.sub(r"<script\b.*?</script>", "", part, flags=re.S)
    def src(m):
        p = os.path.join(PUB, m.group(1).lstrip("/"))
        return f'src="{uri(p)}"' if os.path.exists(p) else 'src=""'
    part = re.sub(r'src="(/[^"]+)"', src, part)
    part = re.sub(r'\s(?:srcSet|srcset)="[^"]*"', "", part)
    for pat in (r'<button[^>]*>💬 Une question \?</button>', r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
        part = re.sub(pat, "", part)
    return re.sub(r'href="/[^"]*"', 'href="#"', part)


contact = open(os.path.join(D, "contact.html"), encoding="utf-8").read()
b0 = contact.find(">", contact.find("<body")) + 1
header = nettoie(contact[b0:contact.find("<main")])
footer = nettoie(contact[contact.find("</main>") + 7:contact.rfind("</body>")])
main_contact = nettoie(contact[contact.find("<main"):contact.find("</main>") + 7])
vin = open(os.path.join(D, "vin.html"), encoding="utf-8").read()
main_vin = nettoie(vin[vin.find("<main"):vin.find("</main>") + 7])

# ---------- le bloc « Ajouter une photo » (le même partout) ----------
def pj(cle, exemple=None, compact=False):
    vign = ""
    if exemple:
        vign = "".join(f'<div class="pj-th"><img src="{e}" alt=""><button type="button" aria-label="Retirer">✕</button></div>' for e in exemple)
    return f'''<div class="pj{' pj-c' if compact else ''}" data-pj="{cle}">
  <label class="pj-add"><input type="file" accept="image/*" multiple hidden>
    <span class="pj-ic">📷</span><span><b>Ajouter une photo</b> <i>(facultatif)</i><small>Photo, logo, dessin ou capture d'écran · jusqu'à 3 · 10 Mo max</small></span></label>
  <div class="pj-list">{vign}</div>
</div>'''


EX1 = uri(os.path.join(ROOT, "docs/maquettes/assets/marque-pages/exemples/portraits/couple.jpg"), 300)
EX2 = uri(os.path.join(PUB, "produits/cristal-v-enfant-chien.jpg"), 300)

# ① page Contact : la photo sous « Votre message »
main_contact = main_contact.replace(
    '</textarea></div><button type="submit"',
    '</textarea></div>' + pj("contact").replace('<div class="pj"', '<div class="field pj"', 1) + '<button type="submit"', 1)

# ② fiche verre à vin : la case « Faire une demande particulière » ouverte, avec la photo
form_demande = f'''<form class="dm-form" onsubmit="return false">
  <textarea rows="4" placeholder="Ex. : votre propre image ou dessin, logo d'entreprise, citation ou phrase, date, gravure des deux côtés, format ou quantité particulière…">Bonjour, je voudrais graver la photo de mon chien sur deux verres, avec son nom en dessous.</textarea>
  {pj("demande", [EX2])}
  <div class="dm-row"><input type="text" placeholder="Votre nom" value="Camille"><input type="email" placeholder="Votre e-mail" value="camille@exemple.fr"></div>
  <button type="submit" class="dm-send">Envoyer ma demande</button>
</form>'''
main_vin = re.sub(r'<div style="margin-top:10px"><button type="button"[^>]*>Faire une demande particulière</button></div>',
                  lambda m: form_demande, main_vin, count=1)

# ③ bulle « Une question ? » ouverte sur la fiche
bulle = f'''<div class="qw" role="dialog" aria-label="Poser une question">
  <div class="qw-h"><strong>Une question ?</strong><span>×</span></div>
  <p class="qw-p">Délai, gravure, taille, livraison… écrivez-nous, une vraie personne vous répond.</p>
  <input placeholder="Votre prénom" value="Laure"><input placeholder="Votre e-mail" value="laure@exemple.fr">
  <textarea placeholder="Votre question">Bonjour, est-ce que mon chien aura bien les yeux bleus sur le verre ? Voici sa photo.</textarea>
  {pj("bulle", [EX2], compact=True)}
  <button type="button" class="qw-send">Envoyer ma question</button>
</div>
<button type="button" class="qw-btn">💬 Une question ?</button>'''

# ④ page « Répondre à l'atelier »
reponse = f'''<main class="rp-wrap"><div class="rp-card">
  <div class="rp-eb">Niv Création — votre réponse</div>
  <h1 class="rp-h1">Répondre à l'atelier</h1>
  <div class="rp-who">Votre échange avec l'atelier · Alixia</div>
  <div class="rp-q"><div class="rp-qt">Notre message du 01/11</div>Bonjour Alixia, Merci pour vos deux messages et pour la description de votre projet d'anniversaire…</div>
  <textarea class="rp-ta" placeholder="Écrivez votre réponse ici…">Voici la photo de référence et les photos à mettre dans les chiffres.</textarea>
  {pj("reponse", [EX1, EX2])}
  <button class="rp-send">Envoyer ma réponse</button>
  <div class="rp-safe">Votre message et vos photos sont transmis directement à l'atelier et rangés dans votre dossier.<br>Nous vous répondons par e-mail.</div>
</div></main>'''

# ⑤ ⑥ ⑦ e-mails (vrai gabarit), affichés dans un cadre isolé du CSS du site
mails = json.load(open(os.path.join(D, "mails-rendus.json"), encoding="utf-8"))
LOGO = uri(os.path.join(PUB, "logo-niv-creation.jpg"), 600, 82)


def cadre(h):
    h = h.replace("https://nivcreation.fr/logo-niv-creation.jpg", LOGO).replace("PHOTO1", EX1).replace("PHOTO2", EX2)
    doc = f'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0">{h}</body>'
    return f'<iframe class="mail" srcdoc="{html.escape(doc, quote=True)}" title="E-mail"></iframe>'


ENTETE = {
    "alixia": ("alic57545voiture@gmail.com", "Votre projet d'anniversaire « 40 » en cristal"),
    "laure": ("galasa16@orange.fr", "Les yeux de votre chien sur le verre à vin"),
}


def entete_mail(k):
    a, s = ENTETE[k]
    return f'<div class="mh"><div><span>À</span> {a}</div><div><span>Objet</span> {s}</div><div><span>Envoi</span> par le site (Gestion → Messages clients), après votre « envoie »</div></div>'


VUES = [
    ("contact", "① Page Contact", "Sous « Votre message », un bouton pour ajouter jusqu'à 3 photos. Touchez-le pour essayer avec une de vos photos.",
     header + main_contact + footer),
    ("demande", "② Demande particulière", "Sur chaque fiche, la case « Faire une demande particulière » (ouverte ici, verre à vin) reçoit aussi les photos.",
     header + main_vin + footer),
    ("bulle", "③ « Une question ? »", "La bulle en bas à gauche : la photo se joint en un geste, sans quitter la fiche.",
     header + main_vin + footer + bulle),
    ("reponse", "④ Page « Répondre »", "Le bouton « Répondre à ce message » de nos e-mails : la cliente y joint ses photos, qui arrivent dans son dossier.",
     reponse),
    ("alerte", "⑤ Votre alerte", "L'alerte « [À valider] » que vous recevez : les photos en vignettes, un toucher = en grand. L'agent les regarde avant de préparer sa réponse.",
     cadre(mails["alerte"])),
    ("alixia", "⑥ Mail à Alixia", "Réponse préparée — RIEN n'est parti. Elle ne peut pas encore joindre de photo sur le site : on lui demande de répondre directement à l'e-mail.",
     entete_mail("alixia") + cadre(mails["alixia"])),
    ("laure", "⑦ Mail à Laure", "Réponse préparée — RIEN n'est parti.",
     entete_mail("laure") + cadre(mails["laure"])),
]

CSS_PJ = r'''
:root{--mq-gold:#a98935;--mq-ink:#1a1206;--mq-cream:#fbf7ee;--mq-line:#e7d3a1}
body{background:#fbf7ee}
.mq-bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:90;background:#1a1206;color:#f3e8d3;padding:10px 16px 0;font-family:Inter,system-ui,sans-serif}
.mq-t{font-size:13px;letter-spacing:.06em;color:#e2c67e;margin:0 0 8px}
.mq-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}
.mq-tabs button{flex:0 0 auto;border:1px solid #5a4a2a;background:transparent;color:#f3e8d3;border-radius:999px;padding:8px 13px;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;min-height:36px}
.mq-tabs button[aria-selected=true]{background:#c9a24b;border-color:#c9a24b;color:#1a1206}
.mq-note{background:#fff7e3;border-bottom:1px solid #e7d3a1;color:#5c4718;padding:10px 16px;font:14px/1.45 Inter,system-ui,sans-serif}
.mq-note b{color:#1a1206}
.mq-v[hidden]{display:none!important}
/* bloc photo */
.pj{margin:10px 0 4px}
.pj-add{display:flex;align-items:center;gap:12px;border:1.5px dashed #c9a24b;background:#fffaf0;border-radius:12px;padding:12px 14px;cursor:pointer;color:#3a2d12;font-size:14.5px;line-height:1.35;text-align:left}
.pj-add:hover{background:#fbf1dc}
.pj-add i{font-style:normal;color:#8a7a56;font-weight:400}
.pj-add small{display:block;color:#8a7a56;font-size:12.5px;margin-top:2px}
.pj-ic{font-size:22px;flex:0 0 auto}
.pj-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.pj-list:empty{display:none}
.pj-th{position:relative;width:82px;height:82px;border-radius:10px;overflow:hidden;border:1px solid #e6d7b8;background:#f3e8d3}
.pj-th img{width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.pj-th button{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(26,18,6,.75);color:#fff;font-size:12px;line-height:24px;padding:0;cursor:pointer}
.pj-full .pj-add{display:none}
.pj-c .pj-add{padding:9px 11px;font-size:13.5px}
.pj-c .pj-th{width:64px;height:64px}
/* demande particulière ouverte */
.dm-form{margin-top:12px;display:grid;gap:8px}
.dm-form textarea,.dm-form input{width:100%;box-sizing:border-box;border-radius:9px;border:1px solid #e7d3a1;padding:10px 12px;font:inherit;font-size:.9rem;background:#fff}
.dm-row{display:flex;gap:8px;flex-wrap:wrap}.dm-row input{flex:1 1 140px}
.dm-send{border:none;background:var(--gold-dark,#a98935);color:#fff;font-weight:600;border-radius:9px;padding:10px 16px;cursor:pointer;font-size:.9rem}
/* bulle */
.qw{position:fixed;bottom:74px;left:16px;z-index:61;width:min(360px,calc(100vw - 32px));box-sizing:border-box;background:#fff;border:1px solid #ece3d2;border-radius:16px;box-shadow:0 12px 34px rgba(0,0,0,.22);padding:16px;display:grid;gap:8px;max-height:calc(100vh - 190px);overflow:auto}
.qw-h{display:flex;justify-content:space-between;align-items:center}.qw-h strong{font-family:Georgia,serif;font-weight:normal;font-size:1.15rem;color:#a98935}.qw-h span{font-size:20px;color:#7a7268}
.qw-p{margin:0;font-size:.85rem;color:#7a7268}
.qw input,.qw textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #dcd2bf;border-radius:9px;font:inherit;font-size:.95rem;background:#fff}
.qw textarea{min-height:76px}
.qw .pj{margin:0}
.qw-send{padding:11px 16px;border-radius:9px;border:none;background:#c9a24b;color:#fff;font-weight:700;font:inherit;cursor:pointer}
.qw-btn{position:fixed;bottom:20px;left:20px;z-index:60;padding:12px 18px;border-radius:999px;background:#fff;color:#241a0c;border:1px solid #c9a24b;font-weight:600;font:inherit;box-shadow:0 4px 16px rgba(0,0,0,.18)}
/* page Répondre */
.rp-wrap{min-height:70vh;background:#fbf7ee;padding:28px 16px 42px;font-family:Arial,Helvetica,sans-serif;color:#1a1206}
.rp-card{max-width:560px;width:100%;box-sizing:border-box;margin:0 auto;background:#fff;border:1px solid #ece3d2;border-radius:16px;padding:26px 22px 30px}
.rp-eb{font-size:11px;letter-spacing:2px;color:#a98935;text-transform:uppercase}
.rp-h1{font-family:Georgia,serif;font-weight:normal;font-size:22px;margin:6px 0 4px}
.rp-who{font-size:13px;color:#8a7a56;margin-bottom:16px}
.rp-q{background:#fbf7ee;border:1px solid #ece3d2;border-left:3px solid #dcc88f;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.55;color:#5c5140;margin-bottom:16px}
.rp-qt{font-size:11px;letter-spacing:1.5px;color:#a98935;text-transform:uppercase;margin-bottom:6px}
.rp-ta{width:100%;box-sizing:border-box;min-height:110px;border:1px solid #dcc88f;border-radius:10px;padding:12px;font:inherit;font-size:15px;background:#fffdf8}
.rp-send{margin-top:14px;width:100%;background:#c9a24b;border:none;color:#fff;font-size:16px;font-weight:bold;padding:14px;border-radius:999px;cursor:pointer}
.rp-safe{margin-top:12px;font-size:12px;color:#8a7a56;text-align:center;line-height:1.6}
/* e-mails */
.mh{max-width:640px;margin:16px auto 0;padding:0 16px;font:14px/1.6 Inter,system-ui,sans-serif;color:#3a2d12}
.mh span{display:inline-block;min-width:54px;color:#8a7a56}
.mail{display:block;width:100%;max-width:680px;margin:12px auto 30px;border:0;height:900px;background:#f1e9da}
'''

JS = r'''
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.mq-tabs button')),vues=[].slice.call(document.querySelectorAll('.mq-v'));
  function show(id){tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.v===id)});vues.forEach(function(v){v.hidden=v.dataset.v!==id});
    try{localStorage.setItem('mq-pj',id)}catch(e){}
    var v=document.querySelector('.mq-v[data-v="'+id+'"]');
    if(id==='demande'){var f=v.querySelector('.dm-form');if(f)setTimeout(function(){f.scrollIntoView({block:'center'})},30)}else window.scrollTo(0,0);
    [].forEach.call(v.querySelectorAll('iframe.mail'),taille)}
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.v)})});
  var d='contact';try{d=localStorage.getItem('mq-pj')||d}catch(e){}if(!document.querySelector('.mq-v[data-v="'+d+'"]'))d='contact';show(d);
  function taille(f){try{var h=f.contentDocument&&f.contentDocument.body;if(h&&h.scrollHeight)f.style.height=(h.scrollHeight+20)+'px'}catch(e){}}
  [].forEach.call(document.querySelectorAll('iframe.mail'),function(f){f.addEventListener('load',function(){taille(f)})});
  window.addEventListener('resize',function(){[].forEach.call(document.querySelectorAll('iframe.mail'),taille)});
  function maj(box){var n=box.querySelectorAll('.pj-th').length;box.classList.toggle('pj-full',n>=3)}
  [].forEach.call(document.querySelectorAll('.pj'),function(box){
    var inp=box.querySelector('input[type=file]'),list=box.querySelector('.pj-list');
    box.addEventListener('click',function(e){if(e.target.closest('.pj-th button')){e.preventDefault();e.target.closest('.pj-th').remove();maj(box)}});
    inp.addEventListener('change',function(){var n=box.querySelectorAll('.pj-th').length;[].slice.call(inp.files).forEach(function(f){
      if(n>=3||!/^image\//.test(f.type))return;n++;
      var r=new FileReader();r.onload=function(){var d=document.createElement('div');d.className='pj-th';d.innerHTML='<img alt=""><button type="button" aria-label="Retirer">✕</button>';d.firstChild.src=r.result;list.appendChild(d);maj(box)};r.readAsDataURL(f)});inp.value=''});
    maj(box)});
})();
'''

barre = '<div class="mq-bar"><p class="mq-t">MAQUETTE · PHOTOS DANS LES MESSAGES · rien n\'est en ligne</p><div class="mq-tabs" role="tablist">' + \
    "".join(f'<button type="button" role="tab" data-v="{k}">{t}</button>' for k, t, _, _ in VUES) + "</div></div>"
corps = "".join(f'<section class="mq-v" data-v="{k}" hidden><div class="mq-note"><b>{t.split(" ", 1)[1]}</b> — {n}</div>{c}</section>' for k, t, n, c in VUES)
page = f'<title>Photos dans les messages</title><style>{css}{CSS_PJ}</style>{barre}{corps}<script>{JS}</script>'
open(OUT, "w", encoding="utf-8").write(page)
print(OUT, round(len(page) / 1e6, 2), "Mo")
