#!/usr/bin/env python3
"""Maquette « Le site refait » (13/11/2026) — RIEN en ligne, le site n'est pas touché.

Le gérant : « fais un vrai audit du site… refaire le site organisé correctement, toutes les mises en page, l'accueil…
une vraie maquette, sans toucher au site ». Une seule page, sept vues : accueil, catégorie (les 8 univers), fiche produit,
« Créez le vôtre », panier, avis, et « Ce qui change » (les constats de l'audit et ce que la maquette y répond).
Tout vient du site en ligne : les créations, leurs prix du jour, leurs photos, les textes de la fiche, de vrais avis.
Le logo est le fichier d'origine, à sa taille. Mêmes couleurs, mêmes polices (Playfair Display, Inter).

  python3 tools/maquettes/site-refait.py <catalogue.json> <dossier des petites photos> <dossier des grandes photos> <sortie>

<catalogue.json>  = les pages /boutique/<univers> du site lues le jour même (univers → rayons → cartes : slug, nom, prix, photo).
<petites photos>  = une photo carrée de 360 px par création (WebP), nommée d'après son adresse (« collier-coeur-grave.webp »).
<grandes photos>  = hero.webp, fiche-1…5.webp, carafe_gravee.webp, deco-noel-cristal-exemple.webp.
"""
import base64, json, os, re, sys

fcat, dpetit, dgrand, out = sys.argv[1:5]
ici = os.path.dirname(os.path.abspath(__file__))
racine = os.path.dirname(os.path.dirname(ici))
os.makedirs(out, exist_ok=True)


def uri(chemin, mime="image/webp"):
    return "data:%s;base64,%s" % (mime, base64.b64encode(open(chemin, "rb").read()).decode())


cat = json.load(open(fcat, encoding="utf-8"))
ORDRE = ["bijoux", "cristal", "verres", "enfants", "mariage", "maison", "papeterie", "cadeaux"]
COURT = {"bijoux": "Bijoux", "cristal": "Cristal photo 3D", "verres": "Verres & carafes", "enfants": "Bébé & Enfant", "mariage": "Mariage",
         "maison": "Maison & Déco", "papeterie": "Papeterie", "cadeaux": "Petits cadeaux"}
TUILE = {"bijoux": "collier-3coeurs", "cristal": "cristal-photo-3d-vertical", "verres": "verre-a-whisky-grave", "enfants": "couverts-enfants-personnalises",
         "mariage": "numero-table-arches-bohemes", "maison": "veilleuse-arbre-de-vie-prenom", "papeterie": "marque-page-bois-pompon", "cadeaux": "porte-cles-cuir-a-graver"}
IMG, UNIV = {}, []
for u in ORDRE:
    rayons = []
    for r in cat[u]["rayons"]:
        cartes = []
        for c in r["cartes"]:
            p = c["ptxt"].split("</span>")[0].replace("\xa0", " ").strip()
            c["f"] = re.sub(r"[^a-z0-9]+", "-", c["slug"].lower()) + ".webp"  # le nom de la petite photo
            IMG[c["f"]] = uri(os.path.join(dpetit, c["f"]))
            cartes.append({"s": c["slug"], "n": c["nom"], "p": c["prix"], "t": p, "v": c["vieux"].replace("\xa0", " "), "g": c["tag"], "f": c["f"],
                           "o": "Prêt à offrir" in c["ptxt"]})
        rayons.append({"n": r["nom"], "c": cartes})
    UNIV.append({"id": u, "n": cat[u]["titre"], "k": COURT[u], "i": cat[u]["intro"], "r": rayons, "tuile": TUILE[u]})

G = {n: uri(os.path.join(dgrand, n + ".webp")) for n in ["hero", "fiche-1", "fiche-2", "fiche-3", "fiche-4", "fiche-5", "carafe_gravee", "deco-noel-cristal-exemple"]}
dclv = os.path.join(racine, "docs/maquettes/assets/creez-le-votre")
CLV = {n: uri(os.path.join(dclv, n + ".webp")) for n in ["fleur-1", "arbre", "empile-1", "deco-1", "prenom-1", "support", "maison"]}
LOGO = uri(os.path.join(racine, "docs/maquettes/assets/logo-source.jpg"), "image/jpeg")  # le fichier d'origine, octet pour octet

# Les outils de création (maquettes déjà faites) : [image, nom, phrase, prix]
OUTILS = [["maison", "La maisonnette", "Une petite maison ajourée, à suspendre ou à illuminer", "dès 19,90 €"],
          ["fleur-1", "La fleur à prénom", "Une fleur qui ne fane pas, le prénom sur la tige", "16,90 €"],
          ["arbre", "L'arbre de vie", "Un cœur par prénom de la famille", "dès 24,90 €"],
          ["empile-1", "La suspension à prénoms", "Un prénom par forme, à accrocher", "dès 12,90 €"],
          ["deco-1", "La décoration à suspendre", "46 formes, des prénoms et des dessins", "dès 9,90 €"],
          ["prenom-1", "La décoration à prénom", "Une grande initiale et son prénom", "dès 12,90 €"],
          ["support", "Le support de téléphone", "En bois, gravé ou ajouré", "dès 12,90 €"]]
# De vrais avis publiés sur le site (page /avis, lue le 13/11/2026)
AVIS = [["Yohan", 5, "Vraiment ravi sur tout : la qualité, la finition, les délais et surtout l'écoute. Merci beaucoup.", "Collier Couple Puzzle géométrique"],
        ["Céline", 5, "Belle expérience, un visuel avant envoi, une réponse rapide et un envoi rapide. J'ai adoré et un joli rendu.", "Verre à whisky portrait personnalisé"],
        ["Jocelyne", 5, "Vraiment parfait, suis ravie de ma commande.", "Bracelet Empreinte Pied de Bébé"],
        ["Florent", 4, "Modèle simple, la plaque acier est nette aux angles et la gravure ne brille pas trop, c'est discret. Bon achat.", "Bracelet cordon à plaque gravée"],
        ["Caroline D.", 4, "Conforme aux photos, le doré est doux. Le message au verso est petit mais j'arrive à le lire sans lunettes.", "Collier Cœur à graver recto-verso"],
        ["Solène", 3, "Finition argentée propre, les plaques sont fines et les petits caractères tiennent la route. Par contre la chaîne est trop courte pour moi.", "Collier Cœur & 2 plaques à graver"]]

DONNEES = json.dumps({"univ": UNIV, "outils": OUTILS, "avis": AVIS, "note": "4,8", "nbAvis": 313}, ensure_ascii=False, separators=(",", ":"))
IMAGES = json.dumps({"p": IMG, "g": G, "c": CLV, "logo": LOGO}, separators=(",", ":"))

CSS = r"""
:root{--cream:#fbf7ee;--paper:#fdfaf3;--sand:#f3e8d3;--sand2:#eadbbf;--ink:#1a1206;--ink2:#241a0c;--ink3:#3a2e1c;--muted:#6b5f4b;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;
--on-ink:#d9ccb0;--red:#7a1512;--line:#e6dcc6;--r:20px;--r2:14px;--r3:28px;--sh:0 6px 22px rgba(43,30,10,.09);--wrap:1180px;color-scheme:light}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--cream);color:var(--ink);font:400 16px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%}
img{display:block;max-width:100%}
button{font:inherit;color:inherit}
a{color:inherit}
h1,h2,h3{font-family:"Playfair Display",Georgia,serif;font-weight:600;line-height:1.08;margin:0;text-wrap:balance}
h1 em,h2 em{font-style:italic;font-weight:500;color:var(--gold-t)}
.ink h1 em,.ink h2 em{color:var(--gold-l)}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 16px}
@media (min-width:900px){.wrap{padding:0 28px}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:0 24px;border-radius:999px;border:0;font-weight:600;font-size:.98rem;text-decoration:none;cursor:pointer;white-space:nowrap}
.btn.or{background:linear-gradient(135deg,var(--gold-l),var(--gold));color:var(--ink);box-shadow:0 8px 20px rgba(201,162,75,.32)}
.btn.encre{background:var(--ink);color:#fff}
.btn.filet{background:transparent;border:1.5px solid currentColor}
.btn.large{width:100%}
.btn:disabled{opacity:.45;cursor:default;box-shadow:none}
.puce{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:var(--r2);border:0;background:var(--sand);font-weight:600;font-size:.9rem;white-space:nowrap;cursor:pointer;text-decoration:none}
.puce.on,.puce[aria-pressed=true]{background:var(--ink);color:#fff}
.rail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
.rail::-webkit-scrollbar{display:none}
.rail>*{flex:none;scroll-snap-align:start}

/* la barre de la maquette (elle ne fait pas partie du site) */
.mq{background:#111;color:#fff;font-size:.8rem}
.mq .wrap{display:flex;align-items:center;gap:10px;padding-top:8px;padding-bottom:8px}
.mq b{color:var(--gold-l);white-space:nowrap}
.mq .rail{gap:6px}
.mq button{min-height:36px;padding:0 13px;border-radius:999px;border:1px solid #444;background:none;color:#ddd;font-weight:600;font-size:.78rem;cursor:pointer;white-space:nowrap}
.mq button.on{background:var(--gold);border-color:var(--gold);color:#111}

/* l'en-tête : le logo d'origine au milieu, à sa taille ; le menu rangé */
.promo{background:var(--ink2);color:var(--on-ink);font-size:.82rem;text-align:center;padding:7px 16px}
.promo button{background:none;border:0;color:var(--gold-l);font-weight:600;text-decoration:underline;cursor:pointer;padding:0}
header.site{position:sticky;top:0;z-index:40;background:rgba(251,247,238,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.h1r{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:8px 0}
.h1r .g,.h1r .d{display:flex;align-items:center;gap:2px}
.h1r .d{justify-content:flex-end}
.ico{position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:0;background:none;border-radius:50%;cursor:pointer;text-decoration:none}
.ico svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.ico i{position:absolute;right:3px;top:3px;min-width:17px;height:17px;border-radius:9px;background:var(--gold);color:var(--ink);font:700 .66rem/17px Inter,sans-serif;text-align:center;padding:0 4px}
.logo{display:block;height:64px;border-radius:10px;cursor:pointer}
.cherche{display:none}
nav.menu{display:none}
@media (min-width:1000px){
 .logo{height:92px}
 .cherche{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font-size:.9rem;width:250px;cursor:text;white-space:nowrap}
 .cherche svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
 .seulTel{display:none!important}
 nav.menu{display:flex;justify-content:center;gap:4px;border-top:1px solid var(--line);position:relative}
 nav.menu button.m{white-space:nowrap;min-height:48px;padding:0 15px;border:0;background:none;font-weight:600;font-size:.95rem;cursor:pointer;border-bottom:2px solid transparent}
 nav.menu button.m:hover,nav.menu button.m[aria-expanded=true]{border-bottom-color:var(--gold)}
 nav.menu button.m.or{color:var(--gold-t)}
 nav.menu button.m.rouge{color:#a32a1f}
 .pan{position:absolute;left:0;right:0;top:100%;background:var(--paper);border-bottom:1px solid var(--line);box-shadow:0 18px 30px rgba(43,30,10,.12);padding:22px 0 26px}
 .pan[hidden]{display:none}
 .pan .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px 26px}
 .pan.trois .wrap{grid-template-columns:repeat(3,minmax(0,1fr))}
}
.pu{display:flex;gap:12px;align-items:flex-start;text-decoration:none;cursor:pointer;background:none;border:0;padding:0;text-align:left}
.pu img{width:62px;height:62px;border-radius:12px;object-fit:cover;flex:none}
.pu b{display:block;font-size:.98rem}
.pu span{display:block;font-size:.8rem;color:var(--muted);line-height:1.35}
.pl h4{margin:0 0 8px;font:600 .98rem Inter,sans-serif}
.pl button{display:block;min-height:34px;border:0;background:none;padding:0;font-size:.92rem;color:var(--ink3);cursor:pointer;text-align:left}
.pl button:hover{color:var(--gold-t)}

/* le menu du téléphone : un panneau, tout y est rangé */
.tiroir{position:fixed;inset:0;z-index:60;background:rgba(26,18,6,.45)}
.tiroir[hidden]{display:none}
.tiroir>div{position:absolute;left:0;top:0;bottom:0;width:min(88vw,380px);background:var(--paper);overflow-y:auto;padding:14px 16px 28px}
.tiroir .haut{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.tiroir .haut b{font:600 1.3rem "Playfair Display",serif}
.tiroir .champ{display:flex;align-items:center;gap:8px;min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);margin-bottom:14px}
.tiroir .champ svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
.tu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:14px}
.tu button{display:flex;align-items:center;gap:9px;min-height:60px;padding:6px;border:1px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;text-align:left;font-weight:600;font-size:.84rem;line-height:1.2}
.tu img{width:46px;height:46px;border-radius:10px;object-fit:cover;flex:none}
.tl button{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:52px;border:0;border-top:1px solid var(--line);background:none;font-weight:600;font-size:1rem;cursor:pointer;text-align:left;padding:0 2px}
.tl button.or{color:var(--gold-t)}
.tl button.rouge{color:#a32a1f}
.tl small{font-weight:400;color:var(--muted);font-size:.8rem}
.tl .petit{min-height:44px;font-weight:500;font-size:.92rem}

/* la barre du bas, sur téléphone */
.bas{position:fixed;left:0;right:0;bottom:0;z-index:45;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(253,250,243,.97);backdrop-filter:blur(8px);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom,0px)}
.bas button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:56px;border:0;background:none;font-weight:600;font-size:.66rem;color:var(--muted);cursor:pointer}
.bas button svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.bas button.on{color:var(--ink)}
.bas button.or{color:var(--gold-t)}
.bas button i{position:absolute;top:5px;left:calc(50% + 6px);min-width:16px;height:16px;border-radius:8px;background:var(--gold);color:var(--ink);font:700 .62rem/16px Inter,sans-serif;font-style:normal;padding:0 4px}
main{padding-bottom:70px}
@media (min-width:1000px){.bas{display:none}main{padding-bottom:0}}

/* les blocs */
.sec{padding:38px 0}
.sec.sable{background:var(--sand)}
.sec h2{font-size:clamp(1.65rem,4.6vw,2.5rem)}
.sec .chapo{color:var(--muted);margin:8px 0 0;max-width:60ch}
.tete{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:18px}
.tete a{font-weight:600;font-size:.9rem;color:var(--gold-t);white-space:nowrap;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ink{background:var(--ink2);color:#fff}
.hero{background:radial-gradient(120% 90% at 80% 10%,rgba(201,162,75,.22),transparent 60%),var(--ink2);color:#fff;padding:26px 0 30px}
.hero .wrap{display:grid;gap:22px;align-items:center}
.hero h1{font-size:clamp(2.2rem,8vw,4.2rem)}
.hero p{color:var(--on-ink);margin:12px 0 18px;max-width:44ch}
.hero .btns{display:flex;flex-wrap:wrap;gap:10px}
.cadre{margin:0;padding:6px;border:1px solid var(--gold);border-radius:6px;position:relative;cursor:pointer}
.cadre img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:3px;outline:1px solid rgba(226,198,126,.5);outline-offset:-6px}
.cadre figcaption{position:absolute;left:16px;bottom:16px;background:rgba(26,18,6,.82);padding:7px 12px;border-radius:8px;font-size:.84rem}
.cadre figcaption b{display:block;font:600 1rem "Playfair Display",serif;color:var(--gold-l)}
@media (min-width:900px){.hero{padding:46px 0}.hero .wrap{grid-template-columns:1fr 1.05fr;gap:48px}.cadre img{aspect-ratio:4/3}}
.ruban{background:linear-gradient(90deg,var(--gold-d),var(--gold-l),var(--gold-d));color:var(--ink);font:700 .72rem/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;overflow:hidden;white-space:nowrap}
.ruban div{display:inline-block;padding:11px 0;animation:ruban 60s linear infinite}
.ruban span{margin:0 22px}
@keyframes ruban{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.ruban div{animation:none}}

/* les univers : des tuiles photo */
.univ{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media (min-width:700px){.univ{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}
.ut{position:relative;display:block;border:0;padding:0;border-radius:var(--r);overflow:hidden;cursor:pointer;background:var(--sand2);aspect-ratio:1/1}
.ut img{width:100%;height:100%;object-fit:cover}
.ut span{position:absolute;left:0;right:0;bottom:0;padding:26px 12px 11px;background:linear-gradient(transparent,rgba(26,18,6,.82));color:#fff;font-weight:600;font-size:.95rem;text-align:left;line-height:1.2}
.ut small{display:block;font-weight:400;font-size:.76rem;color:var(--on-ink)}

/* la carte d'une création */
.uc{position:relative;min-width:0}
.uc>button.l{display:block;width:100%;border:0;background:none;padding:0;text-align:left;cursor:pointer}
.uc .ph{position:relative;border-radius:var(--r);overflow:hidden;background:var(--sand);aspect-ratio:1/1}
.uc .ph img{width:100%;height:100%;object-fit:cover}
.uc .rm{position:absolute;left:8px;top:8px;white-space:nowrap;background:#a32a1f;color:#fff;font-weight:700;font-size:.7rem;padding:3px 8px;border-radius:999px}
.uc .et{display:inline-block;margin-top:9px;font-size:.7rem;font-weight:700;color:var(--gold-t);background:var(--sand);padding:2px 8px;border-radius:999px}
.uc .nm{display:block;margin-top:6px;font-weight:600;font-size:.92rem;line-height:1.25}
.uc .px{display:block;margin-top:2px;font:600 1.02rem "Playfair Display",serif;color:var(--gold-t)}
.uc .px s{font:400 .82rem Inter,sans-serif;color:var(--muted);margin-right:6px}
.uc .po{display:block;font-size:.74rem;color:var(--muted)}
.coeur{position:absolute;right:6px;top:6px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.92);font-size:1.15rem;line-height:1;cursor:pointer;color:var(--ink3)}
.coeur.on{color:#b3261e}
.grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}
@media (min-width:700px){.grille{grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 18px}}
@media (min-width:1000px){.grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
.deuxl{display:grid;gap:18px}
.deuxl .rail>.uc{width:calc(50% - 6px)}
@media (min-width:900px){.deuxl{gap:0}.deuxl .rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;overflow:visible}.deuxl .rail>.uc{width:auto}.deuxl .rail+.rail{display:none}}

/* créez le vôtre */
.clv{background:var(--ink2);color:#fff;border-radius:var(--r3);padding:24px 18px 20px;background-image:radial-gradient(90% 80% at 100% 0,rgba(201,162,75,.2),transparent 60%)}
.clv p{color:var(--on-ink);margin:8px 0 16px;max-width:52ch}
.oc{width:150px;border:0;background:var(--paper);color:var(--ink);border-radius:16px;padding:10px;text-align:left;cursor:pointer}
.oc img{width:100%;aspect-ratio:1/1;object-fit:contain;background:linear-gradient(#fbf7ee,#f3e8d3);border-radius:12px}
.oc b{display:block;margin-top:8px;font-size:.86rem;line-height:1.2}
.oc span{display:block;font:600 .92rem "Playfair Display",serif;color:var(--gold-t)}
@media (min-width:900px){.clv{padding:34px 34px 28px}.oc{width:170px}}

/* en ce moment */
.moment{display:grid;gap:12px}
@media (min-width:800px){.moment{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}
.mo{display:grid;grid-template-columns:104px 1fr;gap:14px;align-items:center;border-radius:var(--r);padding:12px;cursor:pointer;border:0;text-align:left;color:#fff}
.mo img{width:104px;height:104px;border-radius:14px;object-fit:cover}
.mo b{display:block;font:600 1.12rem/1.2 "Playfair Display",serif}
.mo span{display:block;font-size:.84rem;opacity:.86;margin-top:4px;line-height:1.35}
.mo u{display:inline-block;margin-top:8px;font-weight:600;font-size:.84rem;color:var(--gold-l)}
.mo.noel{background:linear-gradient(135deg,#8c1b16,#5a0e0c)}
.mo.lim{background:var(--ink2)}
.mo.neuf{background:var(--sand);color:var(--ink)}
.mo.neuf u{color:var(--gold-t)}

/* trouver un cadeau */
.etape{display:flex;align-items:center;gap:10px;margin:18px 0 10px;font:600 1.15rem "Playfair Display",serif}
.etape i{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font:700 .9rem Inter,sans-serif;font-style:normal}
.ft{position:relative;width:132px;aspect-ratio:4/5;border:2px solid transparent;border-radius:16px;overflow:hidden;padding:0;cursor:pointer;background:var(--sand2)}
.ft img{width:100%;height:100%;object-fit:cover}
.ft span{position:absolute;left:0;right:0;bottom:0;padding:24px 10px 9px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:#fff;font-weight:600;font-size:.86rem;text-align:left}
.ft[aria-pressed=true]{border-color:var(--gold)}
.ft[aria-pressed=true]::after{content:"✓";position:absolute;right:7px;top:7px;width:24px;height:24px;border-radius:50%;background:var(--gold);color:var(--ink);font-weight:700;font-size:.82rem;line-height:24px;text-align:center}
@media (min-width:900px){.finder .rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));overflow:visible}.ft{width:auto}}

/* avis et confiance */
.note{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.note b{font:600 2.4rem "Playfair Display",serif}
.et5{color:var(--gold);letter-spacing:2px}
.av{width:min(82vw,330px);background:#fff;border-radius:var(--r);padding:16px;box-shadow:var(--sh)}
.av p{margin:6px 0 10px;font-size:.93rem}
.av small{color:var(--muted);font-size:.8rem}
.conf{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:22px}
@media (min-width:800px){.conf{grid-template-columns:repeat(4,minmax(0,1fr))}}
.conf div{background:var(--paper);border:1px solid var(--line);border-radius:var(--r2);padding:12px;font-size:.82rem;color:var(--muted);line-height:1.35}
.conf b{display:block;color:var(--ink);font-size:.9rem;margin-bottom:2px}
.paie{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;font-size:.72rem;font-weight:700}
.paie span{border:1px solid var(--line);background:#fff;border-radius:7px;padding:5px 9px}
.ecrin{background:radial-gradient(100% 120% at 0 0,rgba(201,162,75,.22),transparent 60%),var(--ink2);color:#fff;padding:40px 0;text-align:center}
.ecrin p{color:var(--on-ink);max-width:54ch;margin:10px auto 18px}

/* le pied de page */
footer.site{background:var(--ink);color:var(--on-ink);padding:30px 0 26px;font-size:.9rem}
footer .nl{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding-bottom:22px;border-bottom:1px solid #3a2e1c}
footer .nl b{color:#fff;font:600 1.2rem "Playfair Display",serif}
footer .nl form{display:flex;gap:8px}
footer .nl input{flex:1;min-width:0;min-height:48px;border-radius:999px;border:1px solid #4a3d28;background:#241a0c;color:#fff;padding:0 16px;font:inherit}
footer details{border-bottom:1px solid #3a2e1c}
footer summary{display:flex;justify-content:space-between;align-items:center;min-height:52px;font-weight:600;color:#fff;cursor:pointer;list-style:none}
footer summary::-webkit-details-marker{display:none}
footer summary::after{content:"+";font-size:1.2rem;color:var(--gold-l)}
footer details[open] summary::after{content:"−"}
footer details div{display:grid;gap:2px;padding-bottom:12px}
footer details button{min-height:36px;border:0;background:none;color:var(--on-ink);text-align:left;padding:0;cursor:pointer;font-size:.9rem}
footer .fin{display:grid;gap:14px;padding-top:22px}
footer .fin img{height:74px;border-radius:10px}
footer .fin small{color:#9a8c70;line-height:1.5}
@media (min-width:900px){footer .nl{grid-template-columns:minmax(0,1fr) 420px;align-items:center}footer .cols{display:grid;grid-template-columns:repeat(4,1fr);gap:26px;padding-top:8px}
 footer details{border:0}footer summary{pointer-events:none}footer summary::after{content:""}footer .fin{grid-template-columns:auto 1fr;align-items:center}}

/* la page d'un univers */
.fil{font-size:.82rem;color:var(--muted);padding:14px 0 6px}
.fil button{border:0;background:none;padding:0;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;font-size:inherit}
.ut1{padding:4px 0 16px}
.ut1 h1{font-size:clamp(2rem,6.4vw,3.2rem)}
.ut1 p{color:var(--muted);margin:8px 0 0;max-width:62ch}
.barre{display:grid;gap:10px;padding:10px 0 16px}
.filtres{display:flex;gap:8px;flex-wrap:wrap}
.filtres select{min-height:44px;border-radius:var(--r2);border:1px solid var(--line);background:#fff;padding:0 34px 0 14px;font:600 .88rem Inter,sans-serif;color:var(--ink);appearance:none;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%231a1206' stroke-width='1.6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center}
.rayon{padding:8px 0 30px}
.rayon h2{font-size:1.5rem;margin-bottom:14px}
.rayon h2 small{font:400 .84rem Inter,sans-serif;color:var(--muted);margin-left:8px}
.plus{display:block;margin:20px auto 0}
.guide{display:flex;gap:14px;align-items:center;background:var(--sand);border-radius:var(--r);padding:14px 16px;margin:0 0 30px;cursor:pointer;border:0;width:100%;text-align:left}
.guide b{display:block}
.guide span{font-size:.86rem;color:var(--muted)}
.guide i{margin-left:auto;font-style:normal;font-size:1.3rem;color:var(--gold-t)}

/* la fiche produit */
.fp{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;padding-bottom:26px}
.fp>*{min-width:0}
@media (min-width:900px){.fp{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:44px;align-items:start}.fp .gal{position:sticky;top:170px}}
.gal .rail{gap:8px;margin:0 -16px;padding:0 16px}
.gal .rail img{width:86vw;max-width:520px;aspect-ratio:1/1;object-fit:cover;border-radius:var(--r)}
.gal .pts{display:flex;justify-content:center;gap:6px;margin-top:10px}
.gal .pts i{width:7px;height:7px;border-radius:50%;background:var(--sand2)}
.gal .pts i.on{background:var(--ink)}
.gal .vig{display:none}
@media (min-width:900px){.gal .rail{margin:0;padding:0;overflow:hidden}.gal .rail img{width:100%;max-width:none}.gal .rail img:not(.on){display:none}.gal .pts{display:none}
 .gal .vig{display:flex;gap:8px;margin-top:10px}.gal .vig button{width:74px;height:74px;border-radius:12px;overflow:hidden;border:2px solid transparent;padding:0;cursor:pointer}.gal .vig button.on{border-color:var(--gold)}.gal .vig img{width:100%;height:100%;object-fit:cover}}
.fi h1{font-size:clamp(1.7rem,5.6vw,2.4rem)}
.fi .acc{color:var(--muted);margin:8px 0 10px}
.fi .prix{display:flex;align-items:baseline;gap:10px;margin:10px 0 4px}
.fi .prix b{font:600 1.9rem "Playfair Display",serif}
.fi .prix s{color:var(--muted)}
.fi .prix i{font-style:normal;background:#a32a1f;color:#fff;font-weight:700;font-size:.74rem;padding:3px 8px;border-radius:999px}
.bloc{border-top:1px solid var(--line);padding:16px 0}
.bloc h3{font-size:1.12rem;margin-bottom:10px;display:flex;align-items:center;gap:9px}
.bloc h3 i{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--ink);color:#fff;font:700 .8rem Inter,sans-serif;font-style:normal}
.bloc h3 small{font:400 .8rem Inter,sans-serif;color:var(--muted);margin-left:auto}
.coul{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.coul button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 4px;min-height:74px;border:1.5px solid var(--line);border-radius:14px;background:#fff;font-weight:600;font-size:.84rem;cursor:pointer}
.coul button i{width:28px;height:28px;border-radius:50%;border:1px solid rgba(0,0,0,.18)}
.coul button.on{border-color:var(--gold-d);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.champ label{display:flex;justify-content:space-between;font-weight:600;font-size:.9rem;margin:10px 0 5px}
.champ label small{font-weight:400;color:var(--muted)}
.champ input,.champ select{display:block;width:100%;min-height:48px;border:1.5px solid var(--line);border-radius:12px;background:#fff;padding:0 14px;font:inherit;color:var(--ink)}
.apercu{margin-top:12px;background:radial-gradient(circle at 50% 40%,#f1dca6,#c9a24b);border-radius:16px;min-height:120px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px;text-align:center}
.apercu div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0}
.apercu small{font-size:.68rem;color:rgba(26,18,6,.7);font-weight:600}
.apercu span{font-size:1.25rem;color:#3a2a08;overflow-wrap:anywhere;line-height:1.15}
.emb{display:grid;gap:8px}
.emb button{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:52px;padding:8px 14px;border:1.5px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;text-align:left}
.emb button b{font-size:.92rem}
.emb button small{display:block;font-size:.78rem;color:var(--muted)}
.emb button em{font-style:normal;font-weight:700;color:var(--gold-t);white-space:nowrap}
.emb button.on{border-color:var(--gold-d);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.total{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#fff8e6,#f6e7bd);border:1px solid #e7d3a1;border-radius:16px;padding:14px 16px;margin:6px 0 12px}
.total b{font:600 1.5rem "Playfair Display",serif}
.liens{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 0;font-size:.86rem}
.liens button{border:0;background:none;padding:0;min-height:36px;color:var(--ink3);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.rea{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px;font-size:.8rem;color:var(--muted)}
.rea div{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:10px 12px;line-height:1.3}
.rea b{display:block;color:var(--ink);font-size:.86rem}
details.acc2{border-top:1px solid var(--line)}
details.acc2 summary{display:flex;justify-content:space-between;align-items:center;min-height:56px;font-weight:600;cursor:pointer;list-style:none}
details.acc2 summary::-webkit-details-marker{display:none}
details.acc2 summary::after{content:"+";font-size:1.3rem;color:var(--gold-t)}
details.acc2[open] summary::after{content:"−"}
details.acc2 div{padding:0 0 16px;color:var(--ink3);font-size:.94rem}
details.acc2 ul{margin:0;padding-left:18px}
.achat{position:fixed;left:0;right:0;bottom:calc(56px + env(safe-area-inset-bottom,0px));z-index:44;background:rgba(253,250,243,.98);border-top:1px solid var(--line);padding:9px 16px;display:flex;align-items:center;gap:12px;transform:translateY(130%);transition:transform .25s}
.achat.vu{transform:none}
.achat b{font:600 1.2rem "Playfair Display",serif;white-space:nowrap}
.achat small{display:block;font-size:.72rem;color:var(--muted)}
.achat .btn{flex:1;min-height:46px}
@media (min-width:1000px){.achat{display:none}}

/* créez le vôtre, panier, avis, ce qui change */
.og{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (min-width:800px){.og{grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}}
.og .oc{width:auto;border:1px solid var(--line)}
.og .oc small{display:block;font-size:.78rem;color:var(--muted);line-height:1.3;margin:2px 0 4px}
.pas{display:grid;gap:10px;margin:18px 0 26px}
@media (min-width:800px){.pas{grid-template-columns:repeat(3,1fr)}}
.pas div{display:flex;gap:12px;align-items:flex-start;background:var(--sand);border-radius:var(--r2);padding:14px}
.pas i{flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font:700 .9rem Inter,sans-serif;font-style:normal}
.pas b{display:block}
.pas span{font-size:.86rem;color:var(--muted)}
.pn{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;padding-bottom:30px}
.pn>*{min-width:0}
@media (min-width:900px){.pn{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:40px;align-items:start}}
.lg{display:grid;grid-template-columns:84px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}
.lg img{width:84px;height:84px;border-radius:14px;object-fit:cover}
.lg b{display:block;line-height:1.25}
.lg small{display:block;color:var(--muted);font-size:.82rem;line-height:1.4}
.lg .bas2{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
.qt{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;background:#fff}
.qt button{width:40px;height:40px;border:0;background:none;font-size:1.1rem;cursor:pointer}
.qt span{min-width:22px;text-align:center;font-weight:600}
.liv{background:var(--sand);border-radius:var(--r2);padding:12px 14px;font-size:.88rem;margin-bottom:6px}
.liv .jauge{height:8px;border-radius:4px;background:var(--sand2);margin-top:8px;overflow:hidden}
.liv .jauge i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-l),var(--gold))}
.recap{background:#fff;border-radius:var(--r);box-shadow:var(--sh);padding:18px}
.recap .l{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font-size:.94rem}
.recap .l.t{border-top:1px solid var(--line);margin-top:8px;padding-top:12px;font-weight:700;font-size:1.1rem}
.choix{display:grid;gap:8px;margin:10px 0}
.choix button{display:flex;justify-content:space-between;align-items:center;min-height:50px;padding:8px 14px;border:1.5px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;text-align:left;font-size:.9rem}
.choix button.on{border-color:var(--gold-d);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.choix button b{white-space:nowrap}
.rep{display:grid;gap:6px;margin:14px 0 20px;max-width:420px}
.rep div{display:grid;grid-template-columns:54px 1fr 40px;gap:10px;align-items:center;font-size:.86rem}
.rep .jg{height:8px;border-radius:4px;background:var(--sand2);overflow:hidden}
.rep .jg i{display:block;height:100%;background:var(--gold)}
.avg{display:grid;gap:12px}
@media (min-width:800px){.avg{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}
.avg .av{width:auto}
table.ch{width:100%;border-collapse:collapse;font-size:.92rem}
table.ch th,table.ch td{text-align:left;vertical-align:top;padding:12px 10px;border-bottom:1px solid var(--line)}
table.ch th{font-size:.8rem;color:var(--muted)}
table.ch td:first-child{font-weight:600;width:26%}
.tabx{overflow-x:auto}
@media (max-width:700px){table.ch,table.ch tbody,table.ch tr,table.ch td{display:block}table.ch thead{display:none}table.ch tr{border-bottom:1px solid var(--line);padding:12px 0}table.ch td{border:0;padding:3px 0;width:auto!important}
 table.ch td:nth-child(2)::before{content:"Aujourd'hui : ";font-weight:600;color:var(--muted)}table.ch td:nth-child(3)::before{content:"Dans la maquette : ";font-weight:600;color:var(--gold-t)}}
.avalider{margin:24px 0 34px;background:#fffaf0;border:1px solid #e7d3a1;border-radius:var(--r2);padding:16px 18px;font-size:.92rem}
.avalider ul{margin:6px 0 0;padding-left:18px}
.toast{position:fixed;left:50%;bottom:calc(128px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:.88rem;font-weight:600;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis}
.toast[hidden]{display:none}
.vue[hidden]{display:none}
"""

ICO = {
    "menu": '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    "loupe": '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    "moi": '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>',
    "sac": '<svg viewBox="0 0 24 24"><path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    "coeur": '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.600 12 20 12 20z"/></svg>',
    "maison": '<svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5"/><path d="M6.500 10v9.500h11V10"/></svg>',
    "grille": '<svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="6" height="6" rx="1.2"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.2"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.2"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.2"/></svg>',
    "etoile": '<svg viewBox="0 0 24 24"><path d="M12 3.500l1.900 5.400 5.600.300-4.400 3.500 1.500 5.500-4.600-3.100-4.600 3.100 1.500-5.500-4.400-3.500 5.600-.300z"/></svg>',
    "croix": '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
}

CORPS = r"""
<div class="mq"><div class="wrap"><b>Maquette</b><div class="rail" id="mqVues">
 <button data-go="accueil">Accueil</button><button data-go="univers:bijoux">Catégorie</button><button data-go="fiche">Fiche produit</button><button data-go="creer">Créez le vôtre</button>
 <button data-go="panier">Panier</button><button data-go="avis">Avis</button><button data-go="change">Ce qui change</button></div></div></div>
<div class="promo" id="promo">−10 % sur votre première commande en vous inscrivant à nos nouveautés. <button type="button" data-toast="La fenêtre d'inscription s'ouvre ici, seulement quand la cliente le demande.">Recevoir mon code</button></div>
<header class="site"><div class="wrap">
 <div class="h1r">
  <div class="g"><button class="ico seulTel" id="ouvrir" aria-label="Menu">__menu__</button><button class="ico seulTel" aria-label="Rechercher" data-toast="La recherche s'ouvre ici.">__loupe__</button>
   <span class="cherche" data-toast="La recherche s'ouvre ici.">__loupe__ Rechercher une création</span></div>
  <img class="logo" id="logo" alt="Niv Création, accueil" data-go="accueil">
  <div class="d"><button class="ico" aria-label="Mes favoris" data-toast="Mes favoris, rangés dans le compte.">__coeur__<i id="nFav" hidden>0</i></button><button class="ico" aria-label="Mon compte" data-toast="Mon compte : commandes, suivi, cagnotte, favoris.">__moi__</button>
   <button class="ico" aria-label="Panier" data-go="panier">__sac__<i id="nPan">2</i></button></div>
 </div>
 <nav class="menu" id="menu" aria-label="Menu">
  <div><button class="m" data-pan="pBoutique" aria-expanded="false">Boutique ▾</button></div>
  <div><button class="m or" data-go="creer">✦ Créez le vôtre</button></div>
  <div><button class="m" data-go="univers:cristal">Cristal photo 3D</button></div>
  <div><button class="m" data-pan="pOffrir" aria-expanded="false">Offrir ▾</button></div>
  <div><button class="m rouge" data-toast="La page des promotions.">Promotions</button></div>
  <div><button class="m" data-toast="Les 14 guides « Idées & conseils ».">Idées &amp; conseils</button></div>
  <div><button class="m" data-pan="pAtelier" aria-expanded="false">L'atelier ▾</button></div>
  <div class="pan" id="pBoutique" hidden><div class="wrap" id="panUniv"></div></div>
  <div class="pan trois" id="pOffrir" hidden><div class="wrap">
   <div class="pl"><h4>Pour qui</h4><button data-toast="Les idées pour elle.">Pour elle</button><button data-toast="Les idées pour lui.">Pour lui</button><button data-toast="Les idées pour un couple.">Pour un couple</button><button data-toast="Les idées pour un enfant.">Pour un enfant</button><button data-toast="Les idées pour la famille.">Pour la famille</button></div>
   <div class="pl"><h4>Pour quelle occasion</h4><button data-toast="La sélection de Noël.">Noël</button><button data-toast="Les cadeaux de naissance.">Naissance</button><button data-toast="Les cadeaux de mariage.">Mariage</button><button data-toast="Les cadeaux d'anniversaire.">Anniversaire</button><button data-toast="Les cadeaux d'amour.">Amour</button></div>
   <div class="pl"><h4>Et aussi</h4><button data-toast="La carte cadeau, de 20 à 100 €.">Carte cadeau</button><button data-toast="La page des promotions.">Promotions</button><button data-go="univers:tout">Toute la boutique</button></div>
  </div></div>
  <div class="pan trois" id="pAtelier" hidden><div class="wrap">
   <div class="pl"><h4>L'atelier</h4><button data-toast="La page À propos.">À propos</button><button data-go="avis">Avis clients</button><button data-toast="Une demande sur mesure, avec devis.">Projet sur mesure</button></div>
   <div class="pl"><h4>Besoin d'aide</h4><button data-toast="Les questions fréquentes.">Questions fréquentes</button><button data-toast="Le formulaire de contact, avec photos.">Nous écrire</button><button data-toast="Le suivi de commande.">Suivre ma commande</button></div>
   <div class="pl"><h4>Livraison et retours</h4><button data-toast="La page Livraison.">Livraison</button><button data-toast="La page Retours.">Retours</button><button data-toast="Le formulaire de rétractation en ligne.">Me rétracter d'une commande</button></div>
  </div></div>
 </nav>
</div></header>

<div class="tiroir" id="tiroir" hidden><div role="dialog" aria-label="Menu">
 <div class="haut"><b>Menu</b><button class="ico" id="fermer" aria-label="Fermer le menu">__croix__</button></div>
 <div class="champ" data-toast="La recherche s'ouvre ici.">__loupe__ Rechercher une création</div>
 <div class="tu" id="tirUniv"></div>
 <div class="tl">
  <button class="or" data-go="creer">✦ Créez le vôtre <small>7 créations à composer</small></button>
  <button data-go="accueil:trouver">Trouver un cadeau <small>pour qui, quelle occasion</small></button>
  <button class="rouge" data-toast="La page des promotions.">Promotions</button>
  <button data-toast="La carte cadeau, de 20 à 100 €.">Carte cadeau</button>
  <button data-toast="Les 14 guides « Idées & conseils ».">Idées &amp; conseils</button>
  <button data-go="avis">Avis clients</button>
  <button class="petit" data-toast="Mon compte : commandes, suivi, cagnotte, favoris.">Mon compte</button>
  <button class="petit" data-toast="Le suivi de commande.">Suivre ma commande</button>
  <button class="petit" data-toast="La bulle « Une question ? » s'ouvre ici, avec l'envoi de photos.">Une question ? Écrivez-nous</button>
  <button class="petit" data-toast="La page À propos.">L'atelier, à propos</button>
 </div>
</div></div>

<main>
<!-- ===================== ACCUEIL ===================== -->
<section class="vue" data-vue="accueil">
 <div class="hero"><div class="wrap">
  <div><h1>Votre photo, <em>sculptée</em> dans le cristal.</h1><p>Gravure photo 3D au cœur d'un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière, et l'émotion.</p>
   <div class="btns"><button class="btn or" data-go="univers:cristal">Créer mon cristal →</button><button class="btn filet" data-go="univers:cristal">Tailles et prix</button></div></div>
  <figure class="cadre" data-go="univers:cristal"><img id="hero" alt="Cristal Photo 3D, portrait gravé"><figcaption><b>Cristal Photo 3D</b>dès 39,90 €</figcaption></figure>
 </div></div>
 <div class="ruban" aria-hidden="true"><div id="ruban"></div></div>

 <div class="sec"><div class="wrap">
  <div class="tete"><h2>Nos <em>univers</em></h2><a data-go="univers:tout">Toute la boutique</a></div>
  <div class="univ" id="univ"></div>
 </div></div>

 <div class="sec sable"><div class="wrap">
  <div class="tete"><h2>À la <em>une</em></h2><a id="vitTout" data-go="univers:tout">Tout voir</a></div>
  <div class="rail" id="vitTabs" style="margin-bottom:16px"></div>
  <div class="deuxl" id="vit"></div>
 </div></div>

 <div class="sec"><div class="wrap"><div class="clv">
  <h2>Créez votre cadeau <em>vous-même</em></h2>
  <p>Vous choisissez la forme, vous écrivez les prénoms : l'aperçu se dessine sous vos yeux, puis nous découpons et gravons votre création.</p>
  <div class="rail" id="outils"></div>
  <button class="btn or" style="margin-top:18px" data-go="creer">Voir les 7 créations à composer →</button>
 </div></div></div>

 <div class="sec" style="padding-top:8px"><div class="wrap">
  <div class="tete"><h2>En ce moment à <em>l'atelier</em></h2></div>
  <div class="moment">
   <button class="mo noel" data-toast="La sélection de Noël."><img id="imNoel" alt=""><span><b>Ce Noël, offrez un cadeau unique</b><span>Dessins de Noël à graver, décoration en cristal, emballages de fête pour les bijoux.</span><u>Voir les idées de Noël →</u></span></button>
   <button class="mo lim" data-toast="La fiche de la carafe à whisky gravée."><img id="imCarafe" alt=""><span><b>La carafe à whisky gravée</b><span>Édition limitée, 54,90 €. Un modèle décoré, vos initiales, une date.</span><u>Découvrir la carafe →</u></span></button>
   <button class="mo neuf" data-go="univers:papeterie"><img id="imMp" alt=""><span><b>Les marque-pages sont arrivés</b><span>En bois gravé ou en métal, à partir de 9,90 €.</span><u>Voir la papeterie →</u></span></button>
  </div>
 </div></div>

 <div class="sec sable finder" id="trouver"><div class="wrap">
  <h2>Trouver le bon cadeau en <em>deux étapes</em></h2>
  <p class="chapo">Chaque pièce est gravée à la commande dans notre atelier, en France.</p>
  <div class="etape"><i>1</i>Pour qui ?</div><div class="rail" id="fQui"></div>
  <div class="etape"><i>2</i>Pour quelle occasion ?</div><div class="rail" id="fOcc"></div>
  <button class="btn encre" style="margin-top:20px" id="fVoir" data-toast="La page « Trouver un cadeau » s'ouvre avec ces deux choix.">Voir les idées →</button>
 </div></div>

 <div class="sec"><div class="wrap">
  <div class="tete"><div><h2>Vos <em>avis</em></h2><p class="note" style="margin:8px 0 0"><b id="noteA"></b><span class="et5">★★★★★</span><span id="nbA" style="color:var(--muted)"></span></p></div><a data-go="avis">Lire les avis</a></div>
  <div class="rail" id="avisA"></div>
  <div class="conf">
   <div><b>Gravé en France</b>Dans notre atelier, à la commande.</div><div><b>Paiement sécurisé</b>Carte, PayPal, Klarna, en plusieurs fois sans frais.</div>
   <div><b>Livraison suivie</b>À domicile ou en point relais.</div><div><b>On vous répond</b>Une question, une photo à montrer : écrivez-nous.</div>
  </div>
  <div class="paie"><span>VISA</span><span>Mastercard</span><span>CB</span><span>PayPal</span><span>Klarna</span><span>Apple Pay</span><span>Google Pay</span></div>
 </div></div>

 <div class="ecrin"><div class="wrap"><h2>Une idée précise ? <em>Créons-la ensemble</em></h2>
  <p>Une image vraiment personnalisée, un logo, une demande pour un mariage ou un restaurant : décrivez votre projet, nous vous répondons avec un devis.</p>
  <button class="btn or" data-toast="Le formulaire « projet sur mesure », avec envoi de photos.">Demander un projet sur mesure →</button></div></div>
</section>

<!-- ===================== UN UNIVERS ===================== -->
<section class="vue" data-vue="univers" hidden><div class="wrap">
 <div class="fil"><button data-go="accueil">Accueil</button> › <span id="uFil"></span></div>
 <div class="ut1"><h1 id="uTitre"></h1><p id="uIntro"></p></div>
 <div class="barre"><div class="rail" id="uRayons"></div>
  <div class="filtres"><select id="uBudget" aria-label="Budget"><option value="">Budget</option><option value="0-20">Moins de 20 €</option><option value="20-40">20 à 40 €</option><option value="40-999">Plus de 40 €</option></select>
   <select id="uTri" aria-label="Trier"><option value="">Trier</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></div></div>
 <div id="uCorps"></div>
</div></section>

<!-- ===================== LA FICHE ===================== -->
<section class="vue" data-vue="fiche" hidden><div class="wrap">
 <div class="fil"><button data-go="accueil">Accueil</button> › <button data-go="univers:bijoux">Bijoux</button> › Colliers</div>
 <div class="fp">
  <div class="gal"><div class="rail" id="gRail"></div><div class="pts" id="gPts"></div><div class="vig" id="gVig"></div></div>
  <div class="fi">
   <h1>Collier Cœur à graver recto-verso</h1>
   <p class="acc">Un cœur plat et lisse, à graver au recto, au verso, ou les deux.</p>
   <p style="margin:0;font-size:.9rem"><span class="et5">★★★★★</span> <b>4,7</b> · <button style="border:0;background:none;padding:0;text-decoration:underline;cursor:pointer;font-size:inherit" data-ancre="fAvis">3 avis</button></p>
   <div class="prix"><b id="fPrix">22,41 €</b><s>24,90 €</s><i>−10 %</i></div>
   <div class="bloc"><h3><i>1</i>La couleur</h3><div class="coul" id="fCoul"></div></div>
   <div class="bloc"><h3><i>2</i>La gravure <small>+ 3 € par face gravée</small></h3>
    <p style="margin:0;font-size:.9rem;color:var(--muted)">Le cœur se grave des deux côtés. Laissez vide pour un cœur lisse.</p>
    <div class="champ"><label for="fRecto">Recto <small id="cRecto">0 / 20</small></label><input id="fRecto" maxlength="20" placeholder="Un prénom, une date" autocomplete="off">
     <label for="fVerso">Verso <small id="cVerso">0 / 20</small></label><input id="fVerso" maxlength="20" placeholder="Un petit mot" autocomplete="off">
     <label for="fPol">Écriture</label><select id="fPol"></select></div>
    <div class="apercu"><div><small>RECTO</small><span id="aRecto"></span></div><div><small>VERSO</small><span id="aVerso"></span></div></div>
   </div>
   <div class="bloc"><h3><i>3</i>L'emballage <small>facultatif</small></h3><div class="emb" id="fEmb"></div>
    <p style="margin:10px 0 0;font-size:.86rem;color:var(--muted)">🎄 Pour Noël : six emballages de fête, dès 0,90 €. <button style="border:0;background:none;padding:0;text-decoration:underline;cursor:pointer;font-size:inherit;color:var(--gold-t)" data-toast="Les six emballages de Noël s'ouvrent ici.">Voir</button></p></div>
   <div class="total"><span>Total tout compris</span><b id="fTotal"></b></div>
   <button class="btn or large" id="fAjout">Ajouter au panier</button>
   <p style="margin:10px 0 0;font-size:.84rem;color:var(--muted)">Payez en plusieurs fois sans frais : 4× avec PayPal dès 30 €, 3× avec Klarna dès 50 €.</p>
   <div class="liens"><button data-toast="Gardé dans vos favoris.">♡ Garder pour plus tard</button><button data-toast="Vous serez prévenue si le prix baisse.">Me prévenir si le prix baisse</button></div>
   <div class="rea"><div><b>Gravé en France</b>à la commande, dans notre atelier</div><div><b>Fabrication 3 à 5 jours ouvrés</b>puis lettre suivie</div><div><b>Paiement sécurisé</b>carte, PayPal, Klarna</div><div><b>Une question ?</b>nous répondons par message</div></div>
  </div>
 </div>
 <div style="max-width:780px;margin:0 auto 10px">
  <details class="acc2" open><summary>Description</summary><div><p style="margin-top:0">Un cœur plat et lisse sur une chaîne fine : la forme la plus simple pour dire quelque chose. Sa surface polie se grave des deux côtés : un prénom devant, une date derrière, ou un petit mot qu'on garde pour soi.</p><ul><li>Matière : acier au titane</li><li>Finitions : doré, or rose et argenté</li><li>Chaîne : maille câble, fermoir mousqueton</li><li>Poids : environ 18 g</li></ul></div></details>
  <details class="acc2"><summary>Entretien</summary><div>Mettez parfum, crème et laque avant votre bijou. Retirez-le pour la douche, la piscine, la mer et le sport. Essuyez-le avec un chiffon doux et sec, et rangez-le à part dans sa pochette.</div></details>
  <details class="acc2"><summary>Livraison et retours</summary><div><ul><li>Expédié en lettre suivie, soigneusement protégé.</li><li>Sans gravure : échange possible sous 14 jours, bijou non porté.</li><li>Avec gravure : personnalisé, non remboursable une fois la gravure lancée (article L221-28).</li></ul></div></details>
  <details class="acc2" id="fAvis"><summary>Avis clients · 4,7 / 5</summary><div><div class="av" style="width:auto;box-shadow:none;border:1px solid var(--line)"><span class="et5">★★★★</span><p>Conforme aux photos, le doré est doux. Le message au verso est petit mais j'arrive à le lire sans lunettes.</p><small>Caroline D.</small></div>
   <button class="btn filet" style="margin-top:12px" data-go="avis">Lire tous les avis</button></div></details>
  <details class="acc2"><summary>Une demande particulière ?</summary><div>Une autre taille de chaîne, un dessin, une idée qui n'est pas dans la liste : décrivez-la, nous vous répondons avec une proposition. <button style="border:0;background:none;padding:0;text-decoration:underline;cursor:pointer;font-size:inherit;color:var(--gold-t)" data-toast="Le formulaire de demande particulière, avec photos.">Faire une demande</button></div></details>
 </div>
 <div class="sec" style="padding-bottom:26px"><div class="tete"><h2 style="font-size:1.6rem">Vous aimerez <em>aussi</em></h2><a data-go="univers:bijoux">Tous les bijoux</a></div><div class="deuxl"><div class="rail" id="fAussi"></div></div></div>
</div>
<div class="achat" id="achat"><div><b id="aTotal"></b><small id="aDetail"></small></div><button class="btn or" id="aAjout">Ajouter au panier</button></div>
</section>

<!-- ===================== CRÉEZ LE VÔTRE ===================== -->
<section class="vue" data-vue="creer" hidden><div class="wrap">
 <div class="fil"><button data-go="accueil">Accueil</button> › Créez le vôtre</div>
 <div class="ut1"><h1>Créez le <em>vôtre</em></h1><p>Sept créations en bois à composer vous-même. Vous voyez le résultat avant de commander ; nous le découpons et le gravons dans notre atelier.</p></div>
 <div class="pas"><div><i>1</i><span><b>Choisissez une création</b><span>Une fleur, un arbre, une maisonnette…</span></span></div><div><i>2</i><span><b>Écrivez les prénoms</b><span>L'aperçu se dessine en direct.</span></span></div><div><i>3</i><span><b>Nous la fabriquons</b><span>Découpée et gravée à la commande.</span></span></div></div>
 <div class="og" id="outilsG"></div>
 <div class="avalider" style="margin-top:26px"><b>Dans la maquette</b><ul><li>Les sept outils sont les maquettes déjà faites (fleur, arbre, suspension, deux décorations, support, maisonnette). Aucun n'est en vente.</li><li>Une seule entrée « Créez le vôtre » dans le menu, dorée ; sur téléphone, le bouton du milieu de la barre du bas.</li></ul></div>
</div></section>

<!-- ===================== LE PANIER ===================== -->
<section class="vue" data-vue="panier" hidden><div class="wrap">
 <div class="fil"><button data-go="accueil">Accueil</button> › Panier</div>
 <div class="ut1"><h1>Votre <em>panier</em></h1></div>
 <div class="pn">
  <div><div class="liv" id="pLiv"></div><div id="pLignes"></div>
   <button class="btn filet" style="margin-top:16px" data-go="univers:bijoux">Continuer mes achats</button></div>
  <div class="recap">
   <h3 style="font-size:1.2rem;margin-bottom:8px">La livraison</h3>
   <div class="champ"><label for="pPays">Pays</label><select id="pPays"><option>France</option><option>Belgique</option><option>Luxembourg</option><option>Suisse</option></select></div>
   <div class="choix" id="pMode"></div>
   <div class="champ"><label for="pCode">Code promo ou carte cadeau</label><input id="pCode" placeholder="Votre code" autocomplete="off"></div>
   <div style="margin-top:14px" id="pRecap"></div>
   <button class="btn or large" style="margin-top:14px" data-toast="Le paiement sécurisé s'ouvre ici.">Payer en toute sécurité</button>
   <div class="paie" style="justify-content:center"><span>VISA</span><span>Mastercard</span><span>CB</span><span>PayPal</span><span>Klarna</span></div>
   <p style="margin:10px 0 0;font-size:.8rem;color:var(--muted);text-align:center">Pièces personnalisées : fabrication 3 à 5 jours ouvrés avant l'envoi.</p>
  </div>
 </div>
</div></section>

<!-- ===================== LES AVIS ===================== -->
<section class="vue" data-vue="avis" hidden><div class="wrap">
 <div class="fil"><button data-go="accueil">Accueil</button> › Avis clients</div>
 <div class="ut1"><h1>Avis <em>clients</em></h1><p class="note"><b id="noteB"></b><span class="et5">★★★★★</span><span id="nbB" style="color:var(--muted)"></span></p></div>
 <div class="rail" id="avFiltres" style="margin-bottom:16px"></div>
 <div class="avg" id="avListe"></div>
 <button class="btn filet plus" data-toast="Les douze avis suivants s'affichent.">Afficher plus d'avis</button>
 <p style="text-align:center;color:var(--muted);font-size:.86rem;margin:14px 0 34px">Tous les avis sont relus par l'atelier avant d'être publiés.</p>
</div></section>

<!-- ===================== CE QUI CHANGE ===================== -->
<section class="vue" data-vue="change" hidden><div class="wrap">
 <div class="ut1" style="padding-top:22px"><h1>Ce qui <em>change</em></h1><p>Ce que l'audit du 13 novembre a relevé sur le site en ligne, et ce que la maquette propose à la place. Rien n'est en ligne.</p></div>
 <div class="tabx"><table class="ch"><thead><tr><th>Sujet</th><th>Aujourd'hui sur le site</th><th>Dans la maquette</th></tr></thead><tbody>
  <tr><td>L'arrivée sur le site</td><td>Sur téléphone, quatre choses se posent sur le titre dès l'arrivée : la fenêtre −10 %, deux boutons flottants et la bulle « Nouveauté ».</td><td>Une ligne discrète « −10 % » en haut ; la fenêtre ne s'ouvre que si la cliente la demande. Les boutons flottants sont remplacés par la barre du bas.</td></tr>
  <tr><td>La longueur de l'accueil</td><td>19 écrans de téléphone, 12 blocs, 220 liens vers des créations.</td><td>Environ 9 écrans : les univers tout de suite sous le titre, une seule vitrine à onglets au lieu d'un bloc par famille, un bouton « Toute la boutique » à la place du mur.</td></tr>
  <tr><td>Le menu</td><td>Sur ordinateur, 16 entrées sur deux lignes : rayons, services et pages d'information mélangés.</td><td>7 entrées sur une ligne : Boutique, Créez le vôtre, Cristal photo 3D, Offrir, Promotions, Idées &amp; conseils, L'atelier. Le reste est rangé dans trois panneaux.</td></tr>
  <tr><td>Sur téléphone</td><td>Tout passe par le menu ; panier et boutique sont des boutons qui se cachent.</td><td>Une barre fixe en bas : Accueil, Boutique, Créer, Favoris, Panier. Le menu montre les 8 univers en photos.</td></tr>
  <tr><td>La fiche produit</td><td>13 à 18 écrans. « Demande particulière » passe avant le titre et le prix ; la réassurance revient trois fois ; le bouton d'achat disparaît quand on descend.</td><td>Photo, nom court, prix, puis les choix numérotés. Le total et « Ajouter au panier » restent visibles en bas. La réassurance une seule fois, le reste dans des volets.</td></tr>
  <tr><td>Les pages de rayon</td><td>« Toute la boutique » montre 91 créations d'un coup (19 écrans).</td><td>12 créations par rayon, puis « Afficher les autres ». Budget et tri en deux menus. Un lien vers le guide du rayon.</td></tr>
  <tr><td>Les créateurs</td><td>Les sept outils de création n'ont pas de place sur le site.</td><td>Une page « Créez le vôtre », une entrée dorée dans le menu, un bloc sur l'accueil.</td></tr>
  <tr><td>Les avis</td><td>La page des avis fait 66 écrans de téléphone.</td><td>La note, un filtre par univers, 6 avis, puis « Afficher plus ».</td></tr>
  <tr><td>Le pied de page</td><td>Environ deux écrans et demi sur téléphone, sur toutes les pages.</td><td>Quatre volets fermés sur téléphone, l'inscription sur une ligne.</td></tr>
  <tr><td>La rétractation en ligne</td><td>Absente. Depuis le 19 juin 2026, un site doit permettre de se rétracter en ligne pour les articles non personnalisés.</td><td>Un lien « Me rétracter d'une commande » dans le menu L'atelier et le pied de page.</td></tr>
 </tbody></table></div>
 <div class="avalider"><b>Ce qui ne change pas</b><ul><li>Le logo : le fichier d'origine, à la même taille, au milieu.</li><li>Les couleurs, les polices, le ruban doré, l'ouverture sur le cristal.</li><li>Toutes les fonctions : favoris, compte, cagnotte, carte cadeau, codes promo, point relais, langues de gravure, emballages, Noël, guides, sur mesure, « Une question ? ».</li><li>Les créations, leurs prix et leurs photos viennent du site, relevés ce matin.</li></ul></div>
</div></section>
</main>

<footer class="site"><div class="wrap">
 <div class="nl"><div><b>Restez informé</b><div>Nouveautés et offres, directement par e-mail.</div></div><form onsubmit="return false"><input type="email" placeholder="Votre e-mail" aria-label="Votre e-mail"><button class="btn or" type="button" data-toast="Inscription à la lettre, avec le code −10 %.">S'inscrire</button></form></div>
 <div class="cols">
  <details><summary>Boutique</summary><div id="pBout"></div></details>
  <details><summary>Offrir</summary><div><button data-go="accueil:trouver">Trouver un cadeau</button><button data-toast="La carte cadeau.">Carte cadeau</button><button data-toast="Les promotions.">Promotions</button><button data-go="creer">Créez le vôtre</button><button data-toast="Les guides.">Idées &amp; conseils</button></div></details>
  <details><summary>Aide</summary><div><button data-toast="Les questions fréquentes.">Questions fréquentes</button><button data-toast="Le suivi de commande.">Suivre ma commande</button><button data-toast="La page Livraison.">Livraison</button><button data-toast="La page Retours.">Retours et remboursements</button><button data-toast="Le formulaire de rétractation en ligne.">Me rétracter d'une commande</button><button data-toast="Le formulaire de contact.">Nous écrire</button></div></details>
  <details><summary>L'atelier</summary><div><button data-toast="La page À propos.">À propos</button><button data-go="avis">Avis clients</button><button data-toast="Les conditions générales de vente.">CGV</button><button data-toast="Les mentions légales.">Mentions légales</button><button data-toast="La page Confidentialité.">Confidentialité</button></div></details>
 </div>
 <div class="fin"><img id="logoPied" alt="Niv Création"><small>Atelier français de gravure et de découpe laser. contact.nivcreation@gmail.com · 07 66 15 31 02 · 6 rue d'Armaillé, 75017 Paris<br>© 2026 Niv Création · Paiement sécurisé par Stripe · @nivcreation.fr sur Instagram</small></div>
</div></footer>

<nav class="bas" aria-label="Barre du bas">
 <button data-go="accueil" data-b="accueil">__maison__Accueil</button><button data-go="univers:tout" data-b="univers">__grille__Boutique</button>
 <button class="or" data-go="creer" data-b="creer">__etoile__Créer</button><button data-toast="Mes favoris, rangés dans le compte." data-b="fav">__coeur__Favoris<i id="nFav2" hidden>0</i></button>
 <button data-go="panier" data-b="panier">__sac__Panier<i id="nPan2">2</i></button>
</nav>
<div class="toast" id="toast" hidden></div>
"""

JS = r"""
(function(){
var D=__DONNEES__,I=__IMAGES__,$=function(i){return document.getElementById(i)};
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
function ech(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var TOUS={},FAV={};D.univ.forEach(function(u){u.r.forEach(function(r){r.c.forEach(function(c){if(!TOUS[c.s])TOUS[c.s]=c})})});
function univ(id){return D.univ.filter(function(u){return u.id===id})[0]}
function total(u){var v={};u.r.forEach(function(r){r.c.forEach(function(c){v[c.s]=1})});return Object.keys(v).length}

/* ---- la carte d'une création ---- */
function carte(c){var rem=c.v?'<span class="rm">−10 %</span>':'';
 return '<div class="uc"><button class="l" data-fiche="'+c.s+'"><span class="ph"><img loading="lazy" src="'+I.p[c.f]+'" alt="'+ech(c.n)+'">'+rem+'</span>'
  +(c.g?'<span class="et">'+ech(c.g)+'</span>':'')+'<span class="nm">'+ech(c.n)+'</span><span class="px">'+(c.v?'<s>'+c.v+'</s>':'')+c.t+'</span>'+(c.o?'<span class="po">Prêt à offrir</span>':'')+'</button>'
  +'<button class="coeur'+(FAV[c.s]?' on':'')+'" data-fav="'+c.s+'" aria-label="Ajouter aux favoris">'+(FAV[c.s]?'♥':'♡')+'</button></div>'}

/* ---- l'accueil ---- */
$('logo').src=I.logo;$('logoPied').src=I.logo;$('hero').src=I.g.hero;$('imNoel').src=I.g['deco-noel-cristal-exemple'];$('imCarafe').src=I.g.carafe_gravee;$('imMp').src=I.p[TOUS['marque-page-bois-pompon'].f];
var RUB=['Gravé en France','Gravé à la commande dans notre atelier','Paiement sécurisé','Livraison suivie','Emballage soigné'],rb='';for(var q=0;q<6;q++)RUB.forEach(function(t){rb+='<span>'+t+'</span><span>✦</span>'});$('ruban').innerHTML=rb;
$('univ').innerHTML=D.univ.map(function(u){return '<button class="ut" data-go="univers:'+u.id+'"><img loading="lazy" src="'+I.p[TOUS[u.tuile].f]+'" alt=""><span>'+u.k+'<small>'+u.r.map(function(r){return r.n}).slice(0,2).join(' · ')+'</small></span></button>'}).join('');
var VIT=[['neuf','Nouveautés'],['bijoux','Bijoux'],['verres','Verres'],['cristal','Cristal'],['enfants','Bébé & Enfant'],['cadeaux','Petits cadeaux']],vit='neuf';
function listeVit(id){var l=[],vu={};if(id==='neuf'){Object.keys(TOUS).forEach(function(s){var c=TOUS[s];if(/Nouveau|Édition limitée|Coup de cœur/.test(c.g))l.push(c)})}
 else univ(id).r.forEach(function(r){r.c.forEach(function(c){if(!vu[c.s]&&c.s.charAt(0)!=='/'){vu[c.s]=1;l.push(c)}})});return l.slice(0,8)}
function majVit(){$('vitTabs').innerHTML=VIT.map(function(v){return '<button class="puce'+(v[0]===vit?' on':'')+'" data-vit="'+v[0]+'" style="background:'+(v[0]===vit?'':'#fff')+'">'+v[1]+'</button>'}).join('');
 var l=listeVit(vit);$('vit').innerHTML='<div class="rail">'+l.slice(0,4).map(carte).join('')+'</div>'+(l.length>4?'<div class="rail">'+l.slice(4,8).map(carte).join('')+'</div>':'');
 $('vitTout').setAttribute('data-go','univers:'+(vit==='neuf'?'tout':vit));$('vitTout').textContent=vit==='neuf'?'Toute la boutique':'Tout voir'}
function outil(o){return '<button class="oc" data-toast="L\'outil « '+ech(o[1])+' » s\'ouvre (maquette déjà faite)."><img loading="lazy" src="'+I.c[o[0]]+'" alt=""><b>'+o[1]+'</b>'}
$('outils').innerHTML=D.outils.map(function(o){return outil(o)+'<span>'+o[3]+'</span></button>'}).join('');
$('outilsG').innerHTML=D.outils.map(function(o){return outil(o)+'<small>'+o[2]+'</small><span>'+o[3]+'</span></button>'}).join('');
var QUI=[['Pour elle','collier-coeur-grave'],['Pour lui','verre-a-whisky-grave'],['Pour un couple','collier-couple-coeur-lot2'],['Pour un enfant','couverts-enfants-personnalises'],['Pour la famille','cristal-photo-3d-horizontal']],
 OCC=[['Noël','decoration-noel-verre-gravee'],['Naissance','plaque-de-naissance'],['Mariage','numero-table-arches-bohemes'],['Anniversaire','collier-coeur-plaques'],['Amour','collier-double-coeur']];
function tuiles(l,g){return l.map(function(t){return '<button class="ft" aria-pressed="false" data-ft="'+g+'"><img loading="lazy" src="'+I.p[TOUS[t[1]].f]+'" alt=""><span>'+t[0]+'</span></button>'}).join('')}
$('fQui').innerHTML=tuiles(QUI,'q');$('fOcc').innerHTML=tuiles(OCC,'o');
function etoiles(n){return '★★★★★'.slice(0,n)}
function avis(a){return '<div class="av"><span class="et5">'+etoiles(a[1])+'</span><p>'+ech(a[2])+'</p><small><b>'+a[0]+'</b> · '+ech(a[3])+'</small></div>'}
$('avisA').innerHTML=D.avis.slice(0,4).map(avis).join('');$('avListe').innerHTML=D.avis.map(avis).join('');
['A','B'].forEach(function(k){$('note'+k).textContent=D.note+' / 5';$('nb'+k).textContent=D.nbAvis+' avis'});
$('avFiltres').innerHTML=['Tous les avis'].concat(D.univ.map(function(u){return u.k})).map(function(n,i){return '<button class="puce'+(i?'':' on')+'" data-toast="Les avis de ce rayon.">'+n+'</button>'}).join('');
/* ---- le menu ---- */
$('panUniv').innerHTML=D.univ.map(function(u){return '<button class="pu" data-go="univers:'+u.id+'"><img loading="lazy" src="'+I.p[TOUS[u.tuile].f]+'" alt=""><span><b>'+u.k+'</b><span>'+u.r.map(function(r){return r.n}).join(', ')+'</span></span></button>'}).join('');
$('tirUniv').innerHTML=D.univ.map(function(u){return '<button data-go="univers:'+u.id+'"><img loading="lazy" src="'+I.p[TOUS[u.tuile].f]+'" alt="">'+u.k+'</button>'}).join('');
$('pBout').innerHTML=D.univ.map(function(u){return '<button data-go="univers:'+u.id+'">'+u.k+'</button>'}).join('')+'<button data-go="univers:tout">Toute la boutique</button>';
function fermerPans(){document.querySelectorAll('.pan').forEach(function(p){p.hidden=true});document.querySelectorAll('[data-pan]').forEach(function(b){b.setAttribute('aria-expanded','false')})}
document.querySelectorAll('[data-pan]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var p=$(b.getAttribute('data-pan')),o=p.hidden;fermerPans();p.hidden=!o;b.setAttribute('aria-expanded',String(o))})});
document.addEventListener('click',function(e){if(!e.target.closest('.pan'))fermerPans()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){fermerPans();$('tiroir').hidden=true}});
$('ouvrir').addEventListener('click',function(){$('tiroir').hidden=false});$('fermer').addEventListener('click',function(){$('tiroir').hidden=true});
$('tiroir').addEventListener('click',function(e){if(e.target===$('tiroir'))$('tiroir').hidden=true});

/* ---- la page d'un univers (ou de toute la boutique) ---- */
var U={id:'bijoux',plus:{}};
function majUnivers(){var tout=U.id==='tout',u=tout?{n:'Toute la boutique',k:'Toute la boutique',i:'Toutes nos créations, un rayon par univers.',r:D.univ.map(function(x){var l=[],v={};x.r.forEach(function(r){r.c.forEach(function(c){if(!v[c.s]){v[c.s]=1;l.push(c)}})});return {n:x.k,c:l,id:x.id}})}:univ(U.id);
 $('uFil').textContent=u.k;$('uTitre').textContent=u.n;$('uIntro').textContent=u.i;
 $('uRayons').innerHTML=u.r.map(function(r,i){return '<button class="puce" data-ancre="ray'+i+'">'+r.n+'</button>'}).join('');
 var b=$('uBudget').value.split('-'),tri=$('uTri').value,h='';
 u.r.forEach(function(r,i){var l=r.c.filter(function(c){return !b[1]||(c.p>=+b[0]&&c.p<+b[1])});if(tri)l=l.slice().sort(function(x,y){return tri==='asc'?x.p-y.p:y.p-x.p});
  var lim=U.plus[i]?l.length:Math.min(l.length,tout?4:12),reste=l.length-lim;
  h+='<div class="rayon" id="ray'+i+'"><h2>'+r.n+'<small>'+l.length+' création'+(l.length>1?'s':'')+'</small></h2>'+(l.length?'<div class="grille">'+l.slice(0,lim).map(carte).join('')+'</div>':'<p style="color:var(--muted)">Aucune création à ce prix dans ce rayon.</p>')
   +(reste>0?(tout?'<button class="btn filet plus" data-go="univers:'+r.id+'">Voir tout le rayon '+r.n+'</button>':'<button class="btn filet plus" data-plus="'+i+'">Afficher les '+reste+' autres</button>'):'')+'</div>';
  if(!tout&&i===0&&U.id==='bijoux')h+='<button class="guide" data-toast="Le guide « Que graver sur un bijou ? »."><span><b>Que graver sur un bijou ?</b><span>Nos idées de prénoms, de dates et de petits mots.</span></span><i>→</i></button>'});
 $('uCorps').innerHTML=h}
$('uBudget').addEventListener('change',majUnivers);$('uTri').addEventListener('change',majUnivers);

/* ---- la fiche ---- */
var F={coul:0,emb:-1,q:1},COUL=[['Doré','#d9b45a'],['Or rose','#dba58f'],['Argenté','#c9ccd1']],EMB=[['Sac cadeau','Sac carton beige',1.7],['Boîte cadeau','Boîte carton 9 × 9 cm',3.9],['Pochette microfibre','Protection, voyage',2.7],['Pack boîte cadeau','Sac + boîte + microfibre, au lieu de 8,30 €',6.5]],
 POL=[['Playfair Display','Playfair, serif élégante'],['Cinzel','Cinzel, capitales romaines'],['Cinzel Decorative','Cinzel Decorative, décoratif'],['Montserrat','Montserrat, moderne'],['Inter','Inter, épuré'],['Great Vibes','Great Vibes, calligraphie'],['Allura','Allura, script élégant'],['Pacifico','Pacifico, script rétro']];
var GAL=['fiche-1','fiche-2','fiche-3','fiche-4','fiche-5'];
$('gRail').innerHTML=GAL.map(function(g,i){return '<img'+(i?' loading="lazy"':'')+' class="'+(i?'':'on')+'" src="'+I.g[g]+'" alt="Collier Cœur à graver, photo '+(i+1)+'">'}).join('');
$('gPts').innerHTML=GAL.map(function(g,i){return '<i class="'+(i?'':'on')+'"></i>'}).join('');
$('gVig').innerHTML=GAL.map(function(g,i){return '<button class="'+(i?'':'on')+'" data-gal="'+i+'" aria-label="Photo '+(i+1)+'"><img src="'+I.g[g]+'" alt=""></button>'}).join('');
function galerie(i){document.querySelectorAll('#gRail img').forEach(function(m,k){m.classList.toggle('on',k===i)});document.querySelectorAll('#gPts i').forEach(function(m,k){m.classList.toggle('on',k===i)});document.querySelectorAll('#gVig button').forEach(function(m,k){m.classList.toggle('on',k===i)})}
$('gRail').addEventListener('scroll',function(){var r=this,w=r.firstChild.getBoundingClientRect().width+8;galerie(Math.round(r.scrollLeft/w))},{passive:true});
$('gVig').addEventListener('click',function(e){var b=e.target.closest('button');if(b)galerie(+b.getAttribute('data-gal'))});
$('fPol').innerHTML=POL.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('');
function majFiche(){var r=$('fRecto').value.trim(),v=$('fVerso').value.trim(),t=22.41+(r?3:0)+(v?3:0)+(F.emb>=0?EMB[F.emb][2]:0),pol="'"+$('fPol').value+"',serif";
 $('fCoul').innerHTML=COUL.map(function(c,i){return '<button class="'+(i===F.coul?'on':'')+'" data-coul="'+i+'" aria-pressed="'+(i===F.coul)+'"><i style="background:'+c[1]+'"></i>'+c[0]+'</button>'}).join('');
 $('fEmb').innerHTML=EMB.map(function(e,i){return '<button class="'+(i===F.emb?'on':'')+'" data-emb="'+i+'" aria-pressed="'+(i===F.emb)+'"><span><b>'+e[0]+'</b><small>'+e[1]+'</small></span><em>+ '+eur(e[2])+'</em></button>'}).join('');
 $('cRecto').textContent=$('fRecto').value.length+' / 20';$('cVerso').textContent=$('fVerso').value.length+' / 20';
 $('aRecto').textContent=r||'lisse';$('aVerso').textContent=v||'lisse';$('aRecto').style.fontFamily=$('aVerso').style.fontFamily=pol;$('aRecto').style.opacity=r?1:.45;$('aVerso').style.opacity=v?1:.45;
 $('fTotal').textContent=$('aTotal').textContent=eur(t);
 $('aDetail').textContent=COUL[F.coul][0]+((r||v)?' · gravé'+(r&&v?' des deux côtés':r?' au recto':' au verso'):' · sans gravure')}
['fRecto','fVerso','fPol'].forEach(function(i){$(i).addEventListener('input',majFiche)});
$('fCoul').addEventListener('click',function(e){var b=e.target.closest('button');if(b){F.coul=+b.getAttribute('data-coul');majFiche()}});
$('fEmb').addEventListener('click',function(e){var b=e.target.closest('button');if(b){var i=+b.getAttribute('data-emb');F.emb=F.emb===i?-1:i;majFiche()}});
function ajouter(){PAN.push({s:'collier-coeur-grave',n:'Collier Cœur à graver recto-verso',d:$('aDetail').textContent,p:parseFloat($('fTotal').textContent.replace(',','.')),q:1,g:'fiche-1'});majPanier();dire('Ajouté au panier')}
$('fAjout').addEventListener('click',ajouter);$('aAjout').addEventListener('click',ajouter);
$('fAussi').innerHTML=['collier-enveloppe-message-secret','collier-double-coeur','collier-3coeurs','bracelet-femme-coeur'].map(function(s){return carte(TOUS[s])}).join('');
/* la barre d'achat : visible dès que le bouton de la page sort de l'écran */
function barreAchat(){var v=VUE==='fiche',b=$('fAjout').getBoundingClientRect();$('achat').classList.toggle('vu',v&&(b.top>window.innerHeight-60||b.bottom<60))}
window.addEventListener('scroll',barreAchat,{passive:true});window.addEventListener('resize',barreAchat);

/* ---- le panier ---- */
var PAN=[{s:'collier-3coeurs',n:TOUS['collier-3coeurs'].n,d:'Doré · « Léa », « Tom », « Inès »',p:TOUS['collier-3coeurs'].p+9,q:1,f:TOUS['collier-3coeurs'].f},
 {s:'bracelet-cordon-plaque',n:TOUS['bracelet-cordon-plaque'].n,d:'Noir · « Camille » · sac cadeau',p:TOUS['bracelet-cordon-plaque'].p+3+1.7,q:1,f:TOUS['bracelet-cordon-plaque'].f}],MODE=0;
function majPanier(){var st=0,n=0;PAN.forEach(function(l){st+=l.p*l.q;n+=l.q});var seuil=45,offert=st>=seuil,port=offert?0:4.9;
 $('pLignes').innerHTML=PAN.length?PAN.map(function(l,i){return '<div class="lg"><img src="'+(l.g?I.g[l.g]:I.p[l.f])+'" alt=""><div><b>'+ech(l.n)+'</b><small>'+ech(l.d)+'</small><div class="bas2"><span class="qt"><button data-q="'+i+',-1" aria-label="Moins">−</button><span>'+l.q+'</span><button data-q="'+i+',1" aria-label="Plus">+</button></span><b>'+eur(l.p*l.q)+'</b></div></div></div>'}).join(''):'<p>Votre panier est vide.</p>';
 $('pLiv').innerHTML=offert?'<b>La livraison de vos bijoux est offerte.</b><div class="jauge"><i style="width:100%"></i></div>':'Plus que <b>'+eur(seuil-st)+'</b> de bijoux pour la livraison offerte.<div class="jauge"><i style="width:'+Math.round(st/seuil*100)+'%"></i></div>';
 $('pMode').innerHTML=[['À domicile, lettre suivie',port],['En point relais, choisi sur la carte',port]].map(function(m,i){return '<button class="'+(i===MODE?'on':'')+'" data-mode="'+i+'" aria-pressed="'+(i===MODE)+'"><span>'+m[0]+'</span><b>'+(m[1]?eur(m[1]):'Offerte')+'</b></button>'}).join('');
 $('pRecap').innerHTML='<div class="l"><span>Sous-total</span><span>'+eur(st)+'</span></div><div class="l"><span>Livraison</span><span>'+(port?eur(port):'Offerte')+'</span></div><div class="l t"><span>Total</span><span>'+eur(st+port)+'</span></div>';
 [$('nPan'),$('nPan2')].forEach(function(e){e.textContent=n;e.hidden=!n})}
$('pLignes').addEventListener('click',function(e){var b=e.target.closest('[data-q]');if(!b)return;var q=b.getAttribute('data-q').split(','),l=PAN[+q[0]];l.q+=+q[1];if(l.q<1)PAN.splice(+q[0],1);majPanier()});
$('pMode').addEventListener('click',function(e){var b=e.target.closest('button');if(b){MODE=+b.getAttribute('data-mode');majPanier()}});

/* ---- aller d'une vue à l'autre ---- */
var VUE='accueil';
function dire(t){var o=$('toast');o.textContent=t;o.hidden=false;clearTimeout(dire.t);dire.t=setTimeout(function(){o.hidden=true},2600)}
function aller(cible){var q=cible.split(':'),v=q[0];fermerPans();$('tiroir').hidden=true;
 if(v==='univers'){U.id=q[1]||'bijoux';U.plus={};$('uBudget').value='';$('uTri').value='';majUnivers()}
 VUE=v;document.querySelectorAll('.vue').forEach(function(s){s.hidden=s.getAttribute('data-vue')!==v});
 document.querySelectorAll('#mqVues button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-go').split(':')[0]===v)});
 document.querySelectorAll('.bas button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-b')===v)});
 $('promo').hidden=v!=='accueil';
 if(v==='accueil'&&q[1]){var a=$(q[1]);if(a){a.scrollIntoView();return}}
 window.scrollTo(0,0);barreAchat()}
document.addEventListener('click',function(e){
 var f=e.target.closest('[data-fav]');if(f){var s=f.getAttribute('data-fav');FAV[s]=!FAV[s];f.classList.toggle('on',FAV[s]);f.textContent=FAV[s]?'♥':'♡';var n=Object.keys(FAV).filter(function(k){return FAV[k]}).length;[$('nFav'),$('nFav2')].forEach(function(x){x.textContent=n;x.hidden=!n});return}
 var c=e.target.closest('[data-fiche]');if(c){var s2=c.getAttribute('data-fiche');if(s2==='collier-coeur-grave')aller('fiche');else{aller('fiche');dire('La maquette montre une seule fiche : le Collier Cœur à graver.')}return}
 var p=e.target.closest('[data-plus]');if(p){U.plus[p.getAttribute('data-plus')]=true;majUnivers();return}
 var t=e.target.closest('[data-ft]');if(t){var g=t.getAttribute('data-ft'),on=t.getAttribute('aria-pressed')==='true';document.querySelectorAll('[data-ft="'+g+'"]').forEach(function(x){x.setAttribute('aria-pressed','false')});t.setAttribute('aria-pressed',String(!on));return}
 var vt=e.target.closest('[data-vit]');if(vt){vit=vt.getAttribute('data-vit');majVit();return}
 var an=e.target.closest('[data-ancre]');if(an){var el=$(an.getAttribute('data-ancre'));if(el){if(el.tagName==='DETAILS')el.open=true;var y=el.getBoundingClientRect().top+window.scrollY-(document.querySelector('header.site').offsetHeight+10);window.scrollTo(0,y)}return}
 var go=e.target.closest('[data-go]');if(go){aller(go.getAttribute('data-go'));return}
 var to=e.target.closest('[data-toast]');if(to)dire(to.getAttribute('data-toast'))});
/* sur ordinateur, les quatre colonnes du pied de page sont ouvertes ; sur téléphone ce sont des volets */
function pied(){var g=window.matchMedia('(min-width:900px)').matches;document.querySelectorAll('footer details').forEach(function(d){d.open=g})}
pied();window.addEventListener('resize',pied);
majVit();majFiche();majPanier();aller('accueil');
window.srEtat=function(){return{vue:VUE,univers:U.id,cartes:document.querySelectorAll('.vue:not([hidden]) .uc').length,total:$('fTotal').textContent,panier:$('pRecap').textContent,n:$('nPan').textContent}};
})();
"""

corps = CORPS
for k, v in ICO.items():
    corps = corps.replace("__%s__" % k, v)
tete = ('<title>Le site refait</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700'
        '&family=Cinzel&family=Cinzel+Decorative&family=Montserrat&family=Great+Vibes&family=Allura&family=Pacifico&display=swap">\n')
page = tete + "<style>" + CSS + "</style>\n" + corps + "\n<script>" + JS.replace("__DONNEES__", DONNEES).replace("__IMAGES__", IMAGES) + "</script>\n"
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko")
