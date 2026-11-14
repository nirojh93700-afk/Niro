#!/usr/bin/env python3
"""Le créateur « support de téléphone » mis sur le SITE (14/11/2026, gérant : « OK pour remplacer et mettre en ligne »).

Part de la maquette enregistrée (artifact ARNf7BxbQxsTvkpJxgQKD7, relu avec l'outil Artifact : read + path index.html) et en tire,
sans rien redessiner :
  public/createurs/support/outil.js      le script de la maquette (formes Atomm + code), monté / démonté par la fiche React
  public/createurs/support/*.png|jpg     les 12 dessins, les 26 lettres fleuries, la planche, la photo d'exemple
  public/createurs/polices/*.woff2       les 8 écritures du site (copies de src/app/fonts), sous leurs vrais noms de famille
  public/createurs/vendor/three-r128.min.js   la vue 3D (au lieu de cdnjs)
  src/lib/supportCreateurData.js         les deux morceaux de page (aperçu, étapes) + la table des dessins et des lettres
  src/app/createur-support.css           le style de la maquette, enfermé sous .scf

  python3 tools/createurs/support-site.py <maquette index.html> <three.min.js r128>

Ce qui change par rapport à la maquette : les images ne sont plus écrites dans le script (adresses du site, passées en
données au moment où la cliente pose un élément : la vue 3D et l'aperçu gardé avec la commande en ont besoin), les photos de
la galerie et les prix viennent de la fiche du catalogue, le bouton « Ajouter au panier » est celui du site, et les écoutes
posées sur la fenêtre sont retirées quand on quitte la page.
"""
import base64, json, os, re, shutil, sys

src, three = sys.argv[1:3]
RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(RACINE, "public", "createurs")
os.makedirs(os.path.join(PUB, "support"), exist_ok=True)
os.makedirs(os.path.join(PUB, "polices"), exist_ok=True)
os.makedirs(os.path.join(PUB, "vendor"), exist_ok=True)
s = open(src, encoding="utf-8").read()
URL = "/createurs/support/"


def ecrire_image(data_uri, nom):
    m = re.match(r"data:image/(png|jpeg|webp);base64,(.*)$", data_uri, re.S)
    assert m, nom
    f = nom + "." + ("jpg" if m.group(1) == "jpeg" else m.group(1))
    open(os.path.join(PUB, "support", f), "wb").write(base64.b64decode(m.group(2)))
    return URL + f


# ---- 1. les données : formes gardées, images sorties en fichiers ----
i_script = s.rfind("<script>", 0, s.find("var D="))
a = s.find("var D=", i_script) + 6
D, fin = json.JSONDecoder().raw_decode(s, a)
for d in D["dessins"]:
    d["src"] = ecrire_image(d["src"], "dessin-%d" % d["n"])
for L, v in D["lettres"].items():
    v["src"] = ecrire_image(v["src"], "lettre-" + L)
D["planche"] = ecrire_image(D["planche"], "planche")
D["exemple"] = ecrire_image(D["exemple"], "exemple")
D["logo"] = "/logo-niv-creation.jpg"       # le fichier d'origine du site, jamais une copie
D["photos"] = []                             # remplies par la fiche (photos du catalogue)
i_fin_script = s.find("</script>", fin)
code = s[fin:i_fin_script]
assert code.rstrip().endswith("})();"), code[-40:]
code = code.rstrip()[:-len("})();")]


def rempl(c, avant, apres, n=1):
    assert c.count(avant) == n, (avant[:70], c.count(avant))
    return c.replace(avant, apres)


# le bouton du panier est celui du site
code = rempl(code, "$('ajouter').addEventListener('click',function(){if(!pret())return;this.textContent='Ajouté au panier ✓ (maquette)'});", "")
code = rempl(code, "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "/createurs/vendor/three-r128.min.js")
# un élément posé garde l'adresse de son image (url) et la porte en données (src) : vue 3D et aperçu de la commande
code = rempl(code, "function ajouter(o){o.id=++S.seq;o.s=o.s||1;",
             "function enDonnees(u,cb){fetch(u).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){var f=new FileReader();f.onload=function(){cb(f.result)};f.onerror=function(){cb(u)};f.readAsDataURL(b)}).catch(function(){cb(u)})}\n"
             "function ajouter(o){if(typeof o.src==='string'&&o.src.charAt(0)==='/'){var u=o.src;enDonnees(u,function(d){if(d!==u)o.url=u;o.src=d;ajouter0(o)});return}ajouter0(o)}\n"
             "function ajouter0(o){o.id=++S.seq;o.s=o.s||1;")
code, n = re.subn(r"\bwindow\.addEventListener\(", "ECOUTE(window,", code)
assert n == 5, n
assert "document.addEventListener(" not in code
code = rempl(code, "function fichier(){", "function fichier(){return;")
code = rempl(code, "window.scEtat=function(){", "window.scSite={S:S,dessiner:function(){dessiner()},total:total,pret:pret,voirCreation:voirCreation};\nwindow.scEtat=function(){")

# le bouton « OK ✓ » des champs (téléphone)
i_ok = s.find("<script>", i_fin_script)
ok = s[i_ok + 8:s.find("</script>", i_ok)]
ok, n = re.subn(r"\bdocument\.addEventListener\(", "ECOUTE(document,", ok)
assert n >= 3, n

js = ("/* GÉNÉRÉ par tools/createurs/support-site.py à partir de la maquette enregistrée : ne pas modifier à la main. */\n"
      "(function(){\nvar DONNEES=" + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";\n"
      "var ECOUTES=[];function ECOUTE(c,t,f,o){c.addEventListener(t,f,o);ECOUTES.push([c,t,f,o])}\n"
      "function outil(OPTS){\nDONNEES.photos=OPTS.photos||[];if(OPTS.prix)DONNEES.prix=OPTS.prix;\nvar D=DONNEES" + code + "\n}\n"
      "function boutonOk(){\n" + ok + "\n}\n"
      "window.NivSupport={monter:function(OPTS){outil(OPTS||{});boutonOk();\n"
      " return function(){ECOUTES.forEach(function(e){try{e[0].removeEventListener(e[1],e[2],e[3])}catch(_){}});ECOUTES=[];\n"
      "  [].forEach.call(document.querySelectorAll('.niv-ok'),function(b){b.remove()});try{delete window.__nivOk;delete window.scSite;delete window.scEtat;delete window.scDemo}catch(_){}\n"
      "  document.documentElement.style.removeProperty('--sc-top')}}};\n})();\n")
open(os.path.join(PUB, "support", "outil.js"), "w", encoding="utf-8").write(js)
shutil.copy(three, os.path.join(PUB, "vendor", "three-r128.min.js"))

# ---- 2. les écritures : les fichiers du site, sous leurs noms de famille ----
POLICES = [("Playfair Display", "playfair-display-ef05b3.woff2", "500 700"), ("Inter", "inter-260c81.woff2", "400 700"), ("Cinzel", "cinzel-e7ed1a.woff2", "400 600"),
           ("Cinzel Decorative", "cinzel-decorative-281359.woff2", "400"), ("Cinzel Decorative", "cinzel-decorative-280e13.woff2", "700"),
           ("Montserrat", "montserrat-311d35.woff2", "400 600"), ("Great Vibes", "great-vibes-51c0e8.woff2", "400"), ("Allura", "allura-9ff526.woff2", "400"),
           ("Pacifico", "pacifico-d150e6.woff2", "400")]
faces = ""
for fam, f, poids in POLICES:
    shutil.copy(os.path.join(RACINE, "src", "app", "fonts", f), os.path.join(PUB, "polices", f))
    faces += "@font-face{font-family:'%s';src:url(/createurs/polices/%s) format('woff2');font-weight:%s;font-style:normal;font-display:swap}\n" % (fam, f, poids)

# ---- 3. le style de la maquette, enfermé sous .scf ----
i_css = s.find("<style>", s.find("<style>", s.find("<link rel=\"stylesheet\"")) + 10)
css = s[i_css + 7:s.find("</style>", i_css)]


def enfermer(css):
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0: break
        sel = css[i:j].strip()
        if sel.startswith("@media") or sel.startswith("@supports"):
            k, prof = j + 1, 1
            while prof:
                prof += {"{": 1, "}": -1}.get(css[k], 0); k += 1
            out.append(sel + "{" + enfermer(css[j + 1:k - 1]) + "}")
            i = k; continue
        k = css.find("}", j)
        corps = css[j:k + 1]
        i = k + 1
        if sel.startswith("@keyframes"):
            k2 = css.find("}}", j) + 2
            out.append(css[css.rfind("@keyframes", 0, j + 1):k2]); i = k2; continue
        if sel.startswith("@"): continue
        sels = [x.strip() for x in sel.split(",")]
        gardes = []
        for x in sels:
            if x in (":root", "body") or x.startswith(".sc-bandeau") or x.startswith("main>nav") or x.startswith(".sc-atelier") or x.startswith(".sc-agrid") \
               or x.startswith(".sc-feuille") or x.startswith(".sc-fnom") or x.startswith(".sc-legende") or x.startswith(".sc-points") or x.startswith(".sc-avalider"):
                continue
            gardes.append(".scf " + x)
        if gardes: out.append(",".join(gardes) + corps)
    return "\n".join(out)


css_site = ("/* GÉNÉRÉ par tools/createurs/support-site.py (style de la maquette du support de téléphone, enfermé sous .scf) : ne pas modifier à la main. */\n"
            + faces + enfermer(css) + "\n.scf .sc-cache{display:none}\n")
open(os.path.join(RACINE, "src", "app", "createur-support.css"), "w", encoding="utf-8").write(css_site)

# ---- 4. les deux morceaux de page ----
i_main = s.find("<main>")
g0 = s.find('<div class="sc-left">', i_main) + len('<div class="sc-left">')
g1 = s.find('<div class="product-info">', g0)
gauche = s[g0:s.rfind("</div>", g0, g1)].strip()
gauche = re.sub(r'(<div class="sc-mur" aria-hidden="true"><img src=")data:[^"]+(")', r"\1/logo-niv-creation.jpg\2", gauche)
assert "data:" not in gauche, "image restée dans l'aperçu"
e0 = s.find('<div class="prc" id="prc">', g1)
e1 = s.find('<div class="pd-totbox">', e0)
etapes = s[e0:e1].strip()
assert etapes.startswith('<div class="prc" id="prc">') and etapes.endswith("</div>")
etapes = etapes[len('<div class="prc" id="prc">'):-len("</div>")].strip()
assert etapes.count('id="resume"') == 1 and "data:" not in etapes

donnees = ("// GÉNÉRÉ par tools/createurs/support-site.py à partir de la maquette enregistrée : ne pas modifier à la main.\n"
           "// Les deux morceaux de page que le script du créateur anime (aperçu à gauche, étapes à droite) et la table des images.\n"
           "export const SUP_GAUCHE = " + json.dumps(gauche, ensure_ascii=False) + ";\n"
           "export const SUP_ETAPES = " + json.dumps(etapes, ensure_ascii=False) + ";\n"
           "export const SUP_DESSINS = " + json.dumps({str(d["n"]): {"src": d["src"], "r": d["r"]} for d in D["dessins"]}, ensure_ascii=False) + ";\n"
           "export const SUP_LETTRES = " + json.dumps({L: {"src": v["src"], "r": v["r"], "b": v["b"]} for L, v in D["lettres"].items()}, ensure_ascii=False) + ";\n"
           "export const SUP_EXEMPLE = " + json.dumps(D["exemple"]) + ";\n"
           "export const SUP_POLICES_FICHIERS = " + json.dumps([{"famille": fam, "fichier": f, "poids": poids} for fam, f, poids in POLICES], ensure_ascii=False) + ";\n")
open(os.path.join(RACINE, "src", "lib", "supportCreateurData.js"), "w", encoding="utf-8").write(donnees)
print("outil.js", round(len(js.encode()) / 1024), "Ko ·", len(D["dessins"]), "dessins ·", len(D["lettres"]), "lettres · css", round(len(css_site) / 1024), "Ko · prix maquette", D["prix"])
