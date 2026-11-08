# -*- coding: utf-8 -*-
# MAQUETTE « GESTION : LES IDÉES DU 08/11 RANGÉES DANS LE MENU » (08/11/2026, gérant : « fais-moi une maquette avec tout,
# mais tu dois ranger dans admin, tu ajoutes pas n'importe comment, bien organisé ; pour le 6 tu gardes en mémoire pour après »).
# RIEN en ligne. Usage : python3 tools/maquettes/gestion-idees-08-11.py <dossier css du site> <sortie.html>
# Idées : 1 dossier de gravure du jour · 2 scanner l'étiquette · 3 question sur les chiffres · 4 programmer un changement ·
# 5 refaire la même commande · 7 coût réel par pièce · 8 geste en avoir · + résumé du matin · état du système · journal + Annuler.
# L'idée 6 (accès aide atelier) N'EST PAS dans la maquette (gardée pour plus tard, sur sa demande).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import css_site, shell, I

css_dir, sortie = sys.argv[1], sys.argv[2]

# ---------- Plan : où va chaque idée dans le menu de Gestion (le menu actuel, rien de déplacé) ----------
MENU = [
  ("Aujourd'hui", "sun", [("Aujourd'hui", "Résumé du matin affiché en tête (le même que l'e-mail)", "matin")]),
  ("Commandes", "orders", [("File de production", "Expédier… → « 📷 Scanner l'étiquette »", "scan"),
                            ("Fiche commande", "« Refaire la même commande » · « Créditer la cagnotte » dans Plus d'actions", "refaire"),
                            ("Atelier · fichiers à graver", "Bouton « Dossier de gravure du jour »", "dossier"),
                            ("Étiquettes d'adresse", "", None), ("Devis & factures", "Reçoit le devis prérempli de « Refaire »", None)]),
  ("Messages", "mail", [("Boîte de réception", "", None), ("Réponses à valider", "", None), ("Envois & modèles", "", None)]),
  ("Clients", "user", [("Clientes", "", None), ("Avis", "", None), ("Fidélité & cashback", "Reçoit l'avoir crédité", None), ("Favoris", "", None), ("Connexions", "", None), ("Restaurants & bars", "", None)]),
  ("Catalogue", "tag", [("Produits & stock", "Sur une fiche : « Programmer un changement »", None), ("Visibilité", "", None), ("Catégories & ordre", "", None), ("Gravure", "", None), ("Réglage des aperçus", "", None), ("Tailles & coûts", "Coût réel par pièce (laser, électricité, temps)", "cout"), ("Santé du catalogue", "", None)]),
  ("Stock & achats", "box", [("Matériel", "", None), ("Emballages vendus", "", None), ("Achats & factures", "", None)]),
  ("Fêtes", "tree", [("Fêtes de l'année", "« Programmer » l'allumage / l'extinction", None)]),
  ("Marketing", "mega", [("Newsletter", "", None), ("Codes promo", "« Programmer » un code à une date", None), ("Offre gravure offerte", "", None), ("Étude de marché", "", None)]),
  ("Finances", "coin", [("Bénéfices", "Tuile « Coût de gravure » (usure, électricité, temps)", None), ("Ventes", "« Posez une question sur vos chiffres »", "question"), ("Visiteurs", "", None), ("Inventaire & compta", "", None)]),
  ("Réglages", "set", [("Boutique", "", None), ("Apparence du site", "", None), ("Livraison", "", None), ("Équipe d'agents", "", None),
                        ("Programmations", "NOUVEAU sous-onglet : tout ce qui est programmé, au même endroit", "programme"),
                        ("Notifications & résumés", "NOUVEAU : heure du résumé du matin, résumé du lundi", "matin"),
                        ("Journal d'activité", "NOUVEAU : qui a changé quoi, avant → après, « Rétablir »", "journal"),
                        ("État du système", "NOUVEAU : feux vert / rouge", "etat")]),
]

def plan_html():
    out = []
    for sec, ic, subs in MENU:
        lis = []
        for s, note, v in subs:
            cls = ' class="new"' if note else ""
            if v:
                lab = '<button type="button" class="gi-go" data-v="' + v + '">' + s + '</button>'
            else:
                lab = '<span>' + s + '</span>'
            em = ('<em>' + note + '</em>') if note else ""
            lis.append('<li' + cls + '>' + lab + em + '</li>')
        n = sum(1 for s, note, v in subs if note)
        nb = ('<b>' + str(n) + '</b>') if n else ""
        out.append('<div class="gi-sec"><h3>' + I(ic) + ' ' + sec + nb + '</h3><ul>' + "".join(lis) + '</ul></div>')
    return "".join(out)

VUE_PLAN = f'''
<div class="pv-note">Le menu de Gestion tel qu'il est aujourd'hui (9 sections + Fêtes). Les lignes <b>en or</b> = ce que la maquette ajoute, à sa place.
Rien n'est déplacé, aucun écran n'est supprimé. Quatre sous-onglets neufs seulement, tous dans <b>Réglages</b>. Touchez une ligne en or pour voir l'écran.</div>
<div class="gi-plan">{plan_html()}</div>
<div class="pv-note" style="margin-top:14px">L'idée <b>« accès pour une aide à l'atelier »</b> (un 2ᵉ mot de passe limité) n'est pas dans cette maquette : gardée en mémoire, pour plus tard, à votre demande.</div>
'''

def ou(chemin):
    return f'<div class="gi-ou">{I("pin")} Où : <b>{chemin}</b></div>'

# ---------- 1 · Dossier de gravure du jour (Commandes › Atelier) ----------
FICHIERS = [
  ("0LQ7PZ2K-collier-coeur-grave", ["recto-Lea.svg"]),
  ("0M2ABQ9T-verre-whisky-lot2", ["verre1-face-Papa-14.06.2026.svg", "verre2-face-Papa-14.06.2026.svg"]),
  ("0M5CDE3R-cristal-vertical-moyen", ["photo-couple.jpg", "texte-Mariage.svg"]),
  ("0M8XYZ1A-collier-quatre-mots", ["face1-Maman.svg", "face2-tamoul-அம்மா.svg"]),
  ("0M9RTU7B-gobelet-creme", ["dessin-48.svg", "autour-Camille.svg"]),
]
def _arbo():
    out = []
    for d, fs in FICHIERS:
        items = "".join('<li>' + (I("img") if f.endswith(".jpg") else I("pen")) + ' ' + f + '</li>' for f in fs)
        out.append('<li><b>' + I("box") + ' ' + d + '/</b><ul>' + items + '</ul></li>')
    return "".join(out)
arbo = _arbo()
VUE_DOSSIER = f'''
{ou("Commandes › Atelier · fichiers à graver (en haut de la page, à côté de « Tournée du jour »)")}
<div class="pv-note">Aujourd'hui vous téléchargez les fichiers <b>un par un</b> sur chaque commande. Ici : <b>un bouton = un seul dossier</b> avec tout ce qu'il y a à graver aujourd'hui, nommé par commande, plus un tableau pour la gravure en série dans le logiciel du laser.</div>
<div class="gi-bar">
  <div><div class="gi-kpi"><span>À graver aujourd'hui</span><b>5 commandes · 9 fichiers</b></div></div>
  <button type="button" class="fq-btn pri" id="dl-zip">{I("dl")} Dossier de gravure du jour (.zip)</button>
  <button type="button" class="fq-btn">{I("print")} Tournée du jour (déjà en ligne)</button>
</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("box")} Ce qu'il y a dans le dossier</h3>
    <ul class="gi-arbo">{arbo}<li><b>{I("tag")} gravure-du-jour.csv</b> <span class="pv-sub" style="display:inline;margin:0">(tableau pour la gravure par lot)</span></li><li><b>{I("print")} fiches-atelier.pdf</b></li></ul>
    <p class="pv-small">Lettres en tracés (SVG vectoriel, comme les textes traduits) : aucune police à installer dans le logiciel du laser. Les photos restent en JPG. Un dossier par commande, le nom porte la réf. et le produit.</p>
  </section>
  <section class="pv-box"><h3>{I("tag")} gravure-du-jour.csv — pour graver en série</h3>
    <div class="pv-tablewrap" style="margin:0"><table class="pv-table" style="min-width:520px"><thead><tr><th>Commande</th><th>Produit</th><th>Face</th><th>Texte</th><th>Écriture</th><th>Fichier</th></tr></thead><tbody>
    <tr><td class="mono">0LQ7PZ2K</td><td>Collier Cœur gravé</td><td>Recto</td><td>Léa</td><td>Allura</td><td class="mono">recto-Lea.svg</td></tr>
    <tr><td class="mono">0M2ABQ9T</td><td>Verre à whisky · verre 1</td><td>Face</td><td>Papa · 14.06.2026</td><td>Playfair</td><td class="mono">verre1-face….svg</td></tr>
    <tr><td class="mono">0M2ABQ9T</td><td>Verre à whisky · verre 2</td><td>Face</td><td>Papa · 14.06.2026</td><td>Playfair</td><td class="mono">verre2-face….svg</td></tr>
    <tr><td class="mono">0M8XYZ1A</td><td>Collier Quatre Mots</td><td>Face 2</td><td>அம்மா <span class="fq-pill bad" style="font-size:10px">TAMOUL</span></td><td>Noto Serif Tamil</td><td class="mono">face2-tamoul….svg</td></tr>
    </tbody></table></div>
    <p class="pv-small">Le logiciel du laser (xTool, LightBurn…) sait lire un tableau : une ligne = une pièce, le texte se remplace tout seul. Les gravures dans une autre langue sont marquées, comme dans Gestion.</p>
  </section>
</div>
<div class="gi-toast" id="zip-toast" hidden>{I("check")} Dossier préparé : <b>gravure-2026-11-08.zip</b> (9 fichiers, 4,2 Mo) · <a href="#">Télécharger</a></div>
'''

# ---------- 2 · Scanner l'étiquette (File de production › Expédier…) ----------
VUE_SCAN = f'''
{ou("Commandes › File de production › carte de la commande › « Expédier… » (et la fiche commande)")}
<div class="pv-note">Le formulaire d'expédition d'aujourd'hui, avec <b>un bouton de plus</b> : photographier l'étiquette Boxtal ou La Poste au téléphone. Le numéro de suivi est lu, le transporteur reconnu, il ne reste qu'à confirmer. Le numéro tapé à la main marche toujours.</div>
<article class="fq-card" style="max-width:560px">
  <div class="fq-c1"><a class="fq-ref" href="#">#0M2ABQ9T</a><span class="fq-tot mono">45,90 €</span></div>
  <div class="fq-who"><b>Paul Mercier</b><span class="dot">·</span><span>Point relais · 4,90 €</span></div>
  <ul class="fq-items"><li><span class="q">1×</span><span><b>Verre à whisky gravé</b><span class="var"> · Lot de 2</span></span></li></ul>
  <form class="fq-ship" onsubmit="return false">
    <b>Expédier</b>
    <div class="gi-scanrow">
      <button type="button" class="fq-btn" id="btn-scan">{I("img")} Scanner l'étiquette</button>
      <span class="car">ou tapez le numéro :</span>
    </div>
    <div id="scan-cam" class="gi-cam" hidden><div class="gi-cam-in"><span class="gi-cam-frame"></span><p>Visez le code-barres de l'étiquette…</p></div></div>
    <input id="scan-num" placeholder="Numéro de suivi" aria-label="Numéro de suivi">
    <div class="car" id="scan-car">Transporteur reconnu : <b>—</b></div>
    <label><input type="checkbox" checked> Prévenir la cliente par e-mail (paul.mercier@exemple.fr)</label>
    <div class="r"><button type="button" class="fq-btn ghost">Annuler</button><button type="submit" class="fq-btn pri" id="scan-ok" disabled>{I("check")} Confirmer l'expédition</button></div>
  </form>
</article>
<p class="pv-small" style="max-width:560px">Lecture dans le navigateur du téléphone (code-barres et chiffres), rien n'est envoyé ailleurs. Si la lecture doute, le numéro s'affiche en orange et vous le corrigez. Plusieurs colis : un scan par étiquette, comme les champs « + Ajouter un autre colis » d'aujourd'hui.</p>
'''

# ---------- 3 · Question sur les chiffres (Finances › Ventes) ----------
VUE_QUESTION = f'''
{ou("Finances › Ventes (en haut de la page, au-dessus des tableaux)")}
<div class="pv-note">Vous posez la question en français, la réponse vient des <b>vraies commandes et bénéfices</b> (jamais un chiffre inventé : si la donnée n'existe pas, il le dit). Les chiffres ci-dessous sont des exemples.</div>
<section class="pv-box" style="max-width:760px">
  <div class="gi-ask"><input id="q-in" placeholder="Posez une question sur vos chiffres…" value="Combien de colliers vendus en octobre ?"><button type="button" class="fq-btn pri" id="q-go">{I("search")} Demander</button></div>
  <div class="gi-chips">
    <button type="button" class="fq-chip" data-q="Combien de colliers vendus en octobre ?">Colliers en octobre</button>
    <button type="button" class="fq-chip" data-q="Quel produit rapporte le plus ?">Produit qui rapporte le plus</button>
    <button type="button" class="fq-chip" data-q="Panier moyen des verres ?">Panier moyen des verres</button>
    <button type="button" class="fq-chip" data-q="Combien de commandes en Belgique ?">Commandes en Belgique</button>
  </div>
  <div id="q-out" class="gi-answer"></div>
</section>
'''

# ---------- 4 · Programmations (Réglages › Programmations + bouton « Programmer » sur les écrans) ----------
VUE_PROG = f'''
{ou("Réglages › Programmations (nouveau sous-onglet) · bouton « Programmer » sur une fiche produit, un code promo, une fête, l'apparence")}
<div class="pv-note">Un changement se prépare maintenant et s'applique tout seul <b>à la date et à l'heure choisies</b>. Tout ce qui est programmé se voit au même endroit, et s'annule d'un bouton tant que ce n'est pas passé.</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("clock")} Programmer un changement</h3>
    <div class="gi-form">
      <label>Quoi<select id="pg-quoi"><option>Prix d'un produit</option><option>Allumer / éteindre une fête</option><option>Code promo</option><option>Mettre un produit en ligne</option><option>Bandeau de l'accueil</option></select></label>
      <label>Produit<select id="pg-prod"><option>Collier Cœur gravé</option><option>Verre à vin gravé · 36 cl</option><option>Carnet A5 gravé</option></select></label>
      <label>Nouveau prix barré<input id="pg-val" value="24,90 €"></label>
      <label>Le<input id="pg-date" type="date" value="2026-11-20"></label>
      <label>À<input id="pg-heure" type="time" value="08:00"></label>
      <label>Note<input id="pg-note" placeholder="Pourquoi (pour vous)" value="Prix de Noël"></label>
    </div>
    <button type="button" class="fq-btn pri" id="pg-add">{I("clock")} Programmer</button>
    <p class="pv-small">Un prix programmé passe par la MÊME règle que Gestion aujourd'hui (barré en ,90, prix payé −10 %). Rien ne change avant l'heure dite.</p>
  </section>
  <section class="pv-box"><h3>{I("clock")} Programmé</h3>
    <table class="gi-list" id="pg-list">
      <tr><td><b>Éteindre Noël</b><span class="pv-sub">Fêtes · tout ce qui touche à Noël disparaît</span></td><td class="n">lun. 28 déc. · 09 h 00</td><td class="n"><button type="button" class="fq-btn sm ghost pg-del">Annuler</button></td></tr>
      <tr><td><b>Code NOEL10 · −10 %</b><span class="pv-sub">Codes promo · du 1ᵉʳ au 24 déc.</span></td><td class="n">mar. 1ᵉʳ déc. · 08 h 00</td><td class="n"><button type="button" class="fq-btn sm ghost pg-del">Annuler</button></td></tr>
      <tr><td><b>Carnet A5 : mise en ligne</b><span class="pv-sub">Produits & stock · masqué → en vente</span></td><td class="n">ven. 13 nov. · 10 h 00</td><td class="n"><button type="button" class="fq-btn sm ghost pg-del">Annuler</button></td></tr>
    </table>
    <p class="pv-small">Passé : la ligne devient « Fait le … » et part dans le Journal d'activité. Une programmation ratée (site injoignable à l'heure dite) se rejoue au passage suivant et se signale dans « État du système ».</p>
  </section>
</div>
'''

# ---------- 5 · Refaire la même commande + 8 · Créditer la cagnotte (Fiche commande) ----------
VUE_REFAIRE = f'''
{ou("Commandes › Fiche commande › « Plus d'actions » (en-tête) · le devis arrive dans Commandes › Devis & factures")}
<div class="pv-note">Deux lignes de plus dans le menu « Plus d'actions » de la fiche commande. <b>« Refaire la même commande »</b> : une cliente en veut un 2ᵉ, un cadeau à refaire, un raté à remplacer. <b>« Créditer la cagnotte »</b> : un geste en avoir au lieu d'un remboursement, quand VOUS le décidez.</div>
<div class="gi-two">
  <section class="pv-box">
    <div class="gi-fchead"><div><span class="fq-pill ok">Livrée</span> <b>#0XIF6DDO</b> · Thomas Garnier · 27,81 €</div>
      <div class="gi-menu-wrap"><button type="button" class="fq-btn" id="pa-btn">Plus d'actions {I("more")}</button>
        <div class="gi-menu" id="pa-menu" hidden>
          <button type="button">{I("print")} Imprimer la fiche</button><button type="button">{I("tag")} Étiquette d'adresse</button><button type="button">{I("mail")} Communications</button>
          <hr><button type="button" class="new" id="pa-refaire">{I("copy")} Refaire la même commande → devis</button>
          <button type="button" class="new" id="pa-avoir">{I("gift")} Créditer la cagnotte (avoir)</button>
          <hr><button type="button" class="danger">{I("undo")} Rembourser…</button><button type="button" class="danger">{I("x")} Annuler la commande…</button>
        </div></div></div>
    <ul class="fq-items" style="margin-top:10px"><li><span class="q">1×</span><span><b>Pendentif géométrique gravé</b><span class="var"> · Argenté</span><span class="perso">{I("pen")} Face avant : « Léo » · motif ∞ · Montserrat</span></span></li></ul>
    <div id="pa-out"></div>
  </section>
  <section class="pv-box" id="devis-box" hidden><h3>{I("copy")} Devis prérempli · DEV-1552</h3>
    <table class="gi-list">
      <tr><td><b>Pendentif géométrique gravé · Argenté</b><span class="pv-sub">Face avant « Léo » · motif ∞ · Montserrat · <a href="#">fichier à graver repris</a></span></td><td class="n">24,81 €</td></tr>
      <tr><td><b>Gravure · 1 face</b></td><td class="n">3,00 €</td></tr>
      <tr><td><b>Total</b><span class="pv-sub">livraison choisie par la cliente au paiement</span></td><td class="n"><b>27,81 €</b></td></tr>
    </table>
    <p class="pv-small">Prix relus sur la fiche EN LIGNE au moment du devis (pas ceux de l'ancienne commande). Les textes, la photo, la police et le fichier à graver sont repris tels quels. Le devis est créé en brouillon : il ne part à la cliente que si vous l'envoyez.</p>
    <div class="r" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="fq-btn ghost">Modifier le devis</button><button type="button" class="fq-btn pri">Ouvrir dans Devis & factures</button></div>
  </section>
  <section class="pv-box" id="avoir-box" hidden><h3>{I("gift")} Créditer la cagnotte de Thomas Garnier</h3>
    <div class="gi-form"><label>Montant<input value="5,00 €"></label><label>Motif (pour vous)<input value="Délai dépassé de 3 jours"></label></div>
    <label style="display:block;margin:8px 0 12px"><input type="checkbox"> Prévenir la cliente par e-mail (texte à relire avant l'envoi)</label>
    <div class="pv-note" style="margin:0 0 10px">Cagnotte actuelle : 1,40 € → <b>6,40 €</b> après. Utilisable au prochain paiement, comme le cashback d'aujourd'hui (Clients › Fidélité & cashback).</div>
    <div class="r" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="fq-btn ghost" id="avoir-non">Annuler</button><button type="button" class="fq-btn pri" id="avoir-ok">{I("check")} Créditer 5,00 €</button></div>
  </section>
</div>
'''

# ---------- 7 · Coût réel par pièce (Catalogue › Tailles & coûts + tuile Bénéfices) ----------
VUE_COUT = f'''
{ou("Catalogue › Tailles & coûts (réglage) · Finances › Bénéfices (tuile « Coût de gravure »)")}
<div class="pv-note">Aujourd'hui le bénéfice = prix payé − achat − matériel − étiquette − ratés. Il manque <b>ce que coûte la gravure elle-même</b> : l'usure du laser, l'électricité et votre temps. Trois réglages, une fois, puis tout se calcule.</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("set")} Réglages (une fois)</h3>
    <div class="gi-form">
      <label>Prix du laser<input id="c-laser" value="3 500"> <span class="pv-sub">€</span></label>
      <label>Durée de vie estimée<input id="c-heures" value="8 000"> <span class="pv-sub">heures (usure = prix ÷ heures)</span></label>
      <label>Électricité<input id="c-elec" value="0,25"> <span class="pv-sub">€ / heure de gravure</span></label>
      <label>Votre heure de travail<input id="c-main" value="0"> <span class="pv-sub">€ (0 = non compté)</span></label>
    </div>
    <h3 style="margin-top:14px">{I("clock")} Temps de gravure par produit</h3>
    <table class="gi-list">
      <tr><td>Collier Cœur gravé · 1 face</td><td class="n"><input class="c-min" data-p="collier" value="4" size="3"> min</td><td class="n c-out" data-p="collier"></td></tr>
      <tr><td>Verre à vin · 1 verre, texte</td><td class="n"><input class="c-min" data-p="verre" value="9" size="3"> min</td><td class="n c-out" data-p="verre"></td></tr>
      <tr><td>Cristal photo 3D · Moyen</td><td class="n"><input class="c-min" data-p="cristal" value="25" size="3"> min</td><td class="n c-out" data-p="cristal"></td></tr>
      <tr><td>Gobelet · 1 élément</td><td class="n"><input class="c-min" data-p="gobelet" value="12" size="3"> min</td><td class="n c-out" data-p="gobelet"></td></tr>
    </table>
    <p class="pv-small">Le temps se mesure une fois par produit (chrono) et s'ajuste quand vous voulez. Une face en plus = son temps en plus.</p>
  </section>
  <section class="pv-box"><h3>{I("coin")} Dans Bénéfices · Ce mois</h3>
    <div class="pv-kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div class="pv-kpi"><span>Chiffre d'affaires</span><b>1 109,61 €</b></div>
      <div class="pv-kpi"><span>Achat + matériel + étiquettes</span><b>− 412,30 €</b></div>
      <div class="pv-kpi" style="border-left-color:var(--ash-warn)"><span>Coût de gravure <em style="display:inline;color:var(--ash-warn)">nouveau</em></span><b id="c-mois">—</b><em>usure + électricité, 33 pièces</em></div>
      <div class="pv-kpi"><span>Bénéfice</span><b id="c-benef">—</b></div>
    </div>
    <p class="pv-small">Par commande, la ligne « Coût de gravure » s'ajoute dans le bloc Conditionnement, à côté du matériel. Sans réglage saisi, rien ne change : le bénéfice reste calculé comme aujourd'hui.</p>
  </section>
</div>
'''

# ---------- Résumé du matin (Aujourd'hui + Réglages › Notifications) ----------
VUE_MATIN = f'''
{ou("Aujourd'hui (en tête de l'accueil) · Réglages › Notifications & résumés (l'heure)")}
<div class="pv-note">Le même résumé, à deux endroits : <b>en tête de l'accueil</b> de Gestion, et <b>par e-mail</b> (ou notification) à l'heure que vous choisissez. Tout vient des données déjà chargées, rien d'inventé.</div>
<div class="gi-two">
  <section class="pv-box gi-mail"><div class="gi-mail-head">{I("sun")} <b>Résumé du matin · dimanche 8 novembre</b></div>
    <ul>
      <li><b>2 commandes hier</b> (77,71 €) · 0FUPET23 Halid Ibouroi · 0LQ7PZ2K Camille Durand</li>
      <li><b>3 à expédier aujourd'hui</b> au plus tard · <span style="color:var(--ash-bad);font-weight:700">1 en retard</span> (0M8XYZ1A, 1 j ouvré)</li>
      <li><b>1 gravure dans une autre langue</b> à graver (0M8XYZ1A · TAMOUL)</li>
      <li><b>2 messages</b> attendent votre réponse (1 depuis plus de 24 h)</li>
      <li><b>Stock bas</b> : boîte à ruban bleu nuit (4), gobelet crème (0)</li>
      <li><b>Novembre</b> : 1 109,61 € · 33 commandes · objectif 1 500 € : 74 %</li>
    </ul>
    <a class="fq-btn pri" href="#" style="display:inline-flex;text-decoration:none">Ouvrir la file de production</a>
  </section>
  <section class="pv-box"><h3>{I("set")} Réglages › Notifications & résumés</h3>
    <div class="gi-form">
      <label><input type="checkbox" checked style="width:auto"> Résumé du matin par e-mail</label>
      <label>À<input type="time" value="07:30"></label>
      <label><input type="checkbox" checked style="width:auto"> Notification sur le téléphone (en plus)</label>
      <label><input type="checkbox" checked style="width:auto"> Résumé de la semaine le lundi (ventes, meilleurs produits, anomalies)</label>
      <label><input type="checkbox" style="width:auto"> Rien le dimanche</label>
    </div>
    <p class="pv-small">Envoyé par le site (gabarit de l'atelier), à vous seul. Jamais une cliente.</p>
  </section>
</div>
'''

# ---------- État du système (Réglages) ----------
FEUX = [
  ("Site en ligne", "ok", "répond en 0,4 s"), ("Dernier déploiement", "ok", "5ab22b30 · réussi · il y a 12 min"),
  ("Battement du site", "ok", "dernier passage il y a 3 min"), ("Gmail connecté", "ok", "jeton valide · 42 mails lus aujourd'hui"),
  ("Paiement Stripe (webhook)", "ok", "dernier événement il y a 1 h 10"), ("Envoi d'e-mails (Resend)", "warn", "2 e-mails en spam signalés cette semaine"),
  ("Ancien site Netlify", "bad", "répond encore · www.nivcreation.fr pointe dessus"), ("Taille du dépôt", "warn", "428 Mo (limite conseillée 440)"),
  ("Programmations", "ok", "3 à venir · 0 ratée"), ("Rangement des mails (21 h)", "ok", "hier : 47 commandes, 3 mails ajoutés"),
]
feux = "".join(f'<li class="{t}"><i></i><b>{n}</b><span>{d}</span></li>' for n, t, d in FEUX)
VUE_ETAT = f'''
{ou("Réglages › État du système (nouveau sous-onglet) · un point rouge sur « Réglages » dans le menu quand un feu est rouge")}
<div class="pv-note">Dix feux, lus en direct. Les pannes des derniers mois (doublons de l'ancien site, jeton Gmail, déploiement en échec) se seraient vues ici tout de suite.</div>
<section class="pv-box" style="max-width:760px"><ul class="gi-feux">{feux}</ul>
<p class="pv-small">Un feu rouge ou orange remonte aussi dans « À faire » de l'accueil (groupe Surveillance). Chaque ligne dit quoi faire : le Netlify, par exemple, renvoie vers les 3 étapes notées dans EN-ATTENTE.</p></section>
'''

# ---------- Journal d'activité + Annuler (Réglages) ----------
JOURNAL = [
  ("08/11 · 10 h 12", "Prix", "Collier Cœur gravé", "22,41 € → 24,21 €", "Gestion"),
  ("08/11 · 09 h 40", "Statut", "0M5CDE3R", "À préparer → En fabrication", "Gestion"),
  ("07/11 · 21 h 05", "Stock", "Gobelet crème", "1 → 0 (vente 0M9RTU7B)", "Site"),
  ("07/11 · 18 h 30", "Réglage", "Fêtes · Noël", "éteint → allumé", "Gestion"),
  ("07/11 · 16 h 02", "Programmation", "Carnet A5", "mise en ligne le 13/11 10 h", "Gestion"),
]
lj = "".join(f'<tr><td class="mono">{d}</td><td><span class="fq-pill grey">{t}</span></td><td><b>{o}</b></td><td>{c}</td><td>{q}</td><td class="n"><button type="button" class="fq-btn sm ghost j-undo">{I("undo")} Rétablir</button></td></tr>' for d, t, o, c, q in JOURNAL)
VUE_JOURNAL = f'''
{ou("Réglages › Journal d'activité (nouveau sous-onglet) · bouton « Annuler » 10 s après toute action risquée, partout")}
<div class="pv-note"><b>Qui a changé quoi</b>, avant → après, et « Rétablir » en un clic. Protège contre l'incident des réglages effacés (26/09). Le « Annuler » de 10 s existe déjà sur la file de production : la maquette l'étend à toutes les pages (prix, stock, réglages, suppression).</div>
<div class="pv-tablewrap"><table class="pv-table" style="min-width:680px"><thead><tr><th>Quand</th><th>Quoi</th><th>Sur</th><th>Avant → après</th><th>Par</th><th></th></tr></thead><tbody>{lj}</tbody></table></div>
<div class="gi-filtres"><span class="pv-flab">Filtrer</span>{"".join(f'<button type="button" class="fq-chip{" on" if f == "Tout" else ""}">{f}</button>' for f in ["Tout","Prix","Stock","Statut","Réglage","Programmation"])}</div>
<p class="pv-small">« Par : Site » = fait tout seul par le site (une vente, une programmation, le battement). Gardé 12 mois. Un réglage « en bloc » (plusieurs produits d'un coup) fait une ligne par produit, rétablissable un par un.</p>
<div class="gi-toast" id="j-toast" hidden>{I("undo")} Rétabli : <b id="j-txt"></b> · <button type="button" class="fq-btn sm" id="j-cancel">Annuler (10 s)</button></div>
'''

TABS = [("plan", "Plan du menu"), ("dossier", "1 · Dossier de gravure"), ("scan", "2 · Scanner l'étiquette"), ("question", "3 · Question sur les chiffres"),
        ("programme", "4 · Programmations"), ("refaire", "5 + 8 · Refaire · Avoir"), ("cout", "7 · Coût par pièce"), ("matin", "Résumé du matin"), ("etat", "État du système"), ("journal", "Journal · Annuler")]
VUES = dict(plan=VUE_PLAN, dossier=VUE_DOSSIER, scan=VUE_SCAN, question=VUE_QUESTION, programme=VUE_PROG, refaire=VUE_REFAIRE, cout=VUE_COUT, matin=VUE_MATIN, etat=VUE_ETAT, journal=VUE_JOURNAL)

BODY = f'''<div class="fq gi">
<div class="ph-row"><div class="ph-txt"><div class="ph-eyebrow">Maquette · rien en ligne</div><h1 class="ph-title">Gestion : les idées du 8 novembre, rangées</h1>
<div class="ph-sub">Chaque idée à sa place dans le menu d'aujourd'hui. Données = exemples.</div></div></div>
<nav class="fq-views pv-tabs" role="tablist">{"".join(f'<button type="button" class="fq-view{" on" if k == "plan" else ""}" data-v="{k}">{t}</button>' for k, t in TABS)}</nav>
{"".join(f'<div class="pv-v" data-v="{k}"{"" if k == "plan" else " hidden"}>{v}</div>' for k, v in VUES.items())}
</div>'''

CSS = r'''
body,.ash{font-family:Inter,system-ui,-apple-system,sans-serif}
.ph-title{font-family:"Playfair Display",Georgia,serif}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.fq{color:var(--ash-ink);font-size:14px;line-height:1.45}
.fq svg{width:16px;height:16px;flex:none;vertical-align:-3px}
.fq .fq-pill svg,.fq .perso svg{width:12px;height:12px}
.fq button{font:inherit;cursor:pointer}
.fq .mono{font-variant-numeric:tabular-nums}
.pv-tabs{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;margin:14px 0 16px;padding-bottom:2px}
.pv-tabs .fq-view{white-space:nowrap}
.pv-note{background:var(--ash-gold-bg);color:var(--ash-gold-ink);border-radius:10px;padding:10px 14px;font-size:13.5px;line-height:1.5;margin-bottom:14px}
.pv-box{background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:14px;padding:16px 18px;box-shadow:var(--ash-shadow);min-width:0}
.pv-box h3{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 0 12px;color:var(--ash-ink)}
.pv-box h3 svg{width:17px;height:17px;color:var(--ash-gold-2)}
.pv-sub{display:block;font-size:12.5px;color:var(--ash-muted);margin-top:3px;line-height:1.4}
.pv-small{font-size:12.5px;color:var(--ash-muted);line-height:1.5;margin:10px 0 0}
.pv-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
.pv-kpi{background:var(--ash-surface);border:1px solid var(--ash-line);border-left:3px solid var(--ash-gold);border-radius:12px;padding:12px 14px;min-width:0}
.pv-kpi span{display:block;font-size:12px;color:var(--ash-muted);font-weight:600}
.pv-kpi b{display:block;font-size:20px;margin-top:4px;color:var(--ash-ink);font-variant-numeric:tabular-nums}
.pv-kpi em{display:block;font-style:normal;font-size:12px;color:var(--ash-muted);margin-top:2px}
.pv-tablewrap{overflow-x:auto;background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:14px;margin-bottom:12px}
.pv-table{width:100%;border-collapse:collapse;font-size:13.5px}
.pv-table th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-muted);padding:10px 14px;border-bottom:1px solid var(--ash-line);background:var(--ash-sunk)}
.pv-table td{padding:10px 14px;border-bottom:1px solid var(--ash-line);vertical-align:top}
.pv-table tr:last-child td{border-bottom:0}
.pv-table .n,.gi-list .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pv-flab{font-size:12px;font-weight:700;color:var(--ash-muted);text-transform:uppercase;letter-spacing:.06em;margin-right:4px}
.gi-ou{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ash-muted);margin:0 0 10px;flex-wrap:wrap}
.gi-ou b{color:var(--ash-ink)}
.gi-plan{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.gi-sec{background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:14px;padding:12px 14px;min-width:0}
.gi-sec h3{display:flex;align-items:center;gap:8px;font-size:14px;margin:0 0 8px}
.gi-sec h3 b{margin-left:auto;background:var(--ash-gold);color:var(--ash-ink);border-radius:99px;font-size:11px;padding:1px 7px}
.gi-sec ul{list-style:none;margin:0;padding:0}
.gi-sec li{padding:6px 8px;border-radius:8px;font-size:13px;color:var(--ash-muted)}
.gi-sec li.new{background:var(--ash-gold-bg);color:var(--ash-ink);margin:3px 0}
.gi-sec li em{display:block;font-style:normal;font-size:12px;color:var(--ash-gold-ink);margin-top:2px}
.gi-go{background:none;border:0;padding:0;color:var(--ash-ink);font-weight:700;text-decoration:underline;text-decoration-color:var(--ash-gold)}
.gi-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}
.gi-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.gi-kpi{background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:12px;padding:8px 14px}
.gi-kpi span{display:block;font-size:11.5px;color:var(--ash-muted);font-weight:600}.gi-kpi b{font-size:15px}
.gi-arbo,.gi-arbo ul{list-style:none;margin:0;padding:0}
.gi-arbo>li{padding:6px 0;border-bottom:1px dashed var(--ash-line);font-size:13px}
.gi-arbo ul{padding-left:22px;margin-top:3px;color:var(--ash-muted);font-size:12.5px}
.gi-arbo ul li{padding:2px 0}
.gi-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ash-ink);color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;z-index:99;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 32px)}
.gi-toast[hidden],.gi-cam[hidden],.gi-menu[hidden],.pv-box[hidden],.pv-v[hidden]{display:none!important}
.gi-toast a{color:var(--ash-gold)}.gi-toast .fq-btn{color:var(--ash-ink)}
.gi-scanrow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}
.gi-cam{background:#111;border-radius:12px;aspect-ratio:3/2;display:grid;place-items:center;margin:4px 0;position:relative;overflow:hidden}
.gi-cam-in{text-align:center;color:#ddd;font-size:12.5px}
.gi-cam-frame{display:block;width:70%;height:38%;margin:0 auto 10px;border:2px solid var(--ash-gold);border-radius:8px;position:relative}
.gi-cam-frame::after{content:"";position:absolute;left:4%;right:4%;top:50%;height:2px;background:#e3493a;animation:gi-scan 1.2s ease-in-out infinite alternate}
@keyframes gi-scan{from{transform:translateY(-22px)}to{transform:translateY(22px)}}
.fq-ship input[type=text],.fq-ship input:not([type]){width:100%;box-sizing:border-box;min-width:0}
.gi-ask{display:flex;gap:8px;flex-wrap:wrap}
.gi-ask input{flex:1 1 260px;min-width:0;box-sizing:border-box;font:inherit;font-size:14px;padding:9px 12px;border:1px solid var(--ash-line-2);border-radius:10px}
.gi-chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.gi-answer:empty{display:none}
.gi-answer{margin-top:12px;background:var(--ash-bg);border-radius:12px;padding:14px}
.gi-answer p{margin:0 0 10px;font-size:14.5px}
.gi-answer .src{font-size:12px;color:var(--ash-muted)}
.gi-bars{display:grid;gap:6px;margin:10px 0}
.gi-bars div{display:grid;grid-template-columns:150px minmax(0,1fr) 60px;gap:8px;align-items:center;font-size:12.5px}
.gi-bars span{height:10px;background:var(--ash-gold);border-radius:99px;display:block}
.gi-bars .n{text-align:right;font-variant-numeric:tabular-nums}
.gi-form{display:grid;gap:8px}
.gi-form label{display:grid;grid-template-columns:150px minmax(0,1fr);gap:8px;align-items:center;font-size:13px;color:var(--ash-muted)}
.gi-form label>.pv-sub{grid-column:2;margin-top:-4px;font-size:12px}
.gi-form input,.gi-form select{font:inherit;font-size:13.5px;padding:7px 10px;border:1px solid var(--ash-line-2);border-radius:8px;background:#fff;min-width:0;box-sizing:border-box;color:var(--ash-ink)}
.gi-form input[type=checkbox]{justify-self:start}
.gi-form label:has(input[type=checkbox]){grid-template-columns:auto minmax(0,1fr);color:var(--ash-ink)}
.gi-list{width:100%;border-collapse:collapse;font-size:13.5px}
.gi-list td{padding:9px 6px;border-bottom:1px solid var(--ash-line);vertical-align:top}
.gi-list tr:last-child td{border-bottom:0}
.gi-list input{font:inherit;font-size:13px;padding:4px 6px;border:1px solid var(--ash-line-2);border-radius:6px;width:52px;text-align:right}
.gi-fchead{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.gi-menu-wrap{position:relative}
.gi-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--ash-line-2);border-radius:12px;box-shadow:var(--ash-shadow);padding:6px;min-width:260px;z-index:5;display:grid}
.gi-menu button{display:flex;gap:8px;align-items:center;background:none;border:0;padding:8px 10px;border-radius:8px;text-align:left;font-size:13.5px;color:var(--ash-ink)}
.gi-menu button:hover{background:var(--ash-sunk)}
.gi-menu button.new{background:var(--ash-gold-bg);margin:2px 0}
.gi-menu button.danger{color:var(--ash-bad)}
.gi-menu hr{border:0;border-top:1px solid var(--ash-line);margin:4px 0}
.gi-mail ul{margin:0 0 12px;padding-left:18px;line-height:1.7;font-size:13.5px}
.gi-mail-head{display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:10px}
.gi-mail-head svg{color:var(--ash-gold-2)}
.gi-feux{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.gi-feux li{display:grid;grid-template-columns:14px 220px minmax(0,1fr);gap:12px;align-items:center;padding:9px 6px;border-bottom:1px solid var(--ash-line);font-size:13.5px}
.gi-feux li:last-child{border-bottom:0}
.gi-feux i{width:12px;height:12px;border-radius:50%;display:block}
.gi-feux .ok i{background:var(--ash-ok)}.gi-feux .warn i{background:var(--ash-warn)}.gi-feux .bad i{background:var(--ash-bad)}
.gi-feux .bad b{color:var(--ash-bad)}.gi-feux .warn b{color:var(--ash-warn)}
.gi-feux span{color:var(--ash-muted);font-size:12.5px}
.gi-filtres{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
@media (max-width:760px){.gi-two{grid-template-columns:minmax(0,1fr)}.pv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
 .gi-form label{grid-template-columns:minmax(0,1fr)}.gi-feux li{grid-template-columns:14px minmax(0,1fr)}.gi-feux span{grid-column:2}.gi-bars div{grid-template-columns:110px minmax(0,1fr) 54px}}
'''

JS = r'''
function montrer(v){document.querySelectorAll('.pv-tabs .fq-view').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
 document.querySelectorAll('.pv-v').forEach(x=>x.hidden=x.dataset.v!==v);window.scrollTo(0,0);}
document.querySelectorAll('.pv-tabs .fq-view,.gi-go').forEach(b=>b.onclick=()=>montrer(b.dataset.v));
// 1 zip
document.getElementById('dl-zip').onclick=()=>{const t=document.getElementById('zip-toast');t.hidden=false;setTimeout(()=>t.hidden=true,4000);};
// 2 scan
const sNum=document.getElementById('scan-num'),sCar=document.getElementById('scan-car'),sOk=document.getElementById('scan-ok');
function transporteur(n){n=n.replace(/\s/g,'');if(/^\d{8}$/.test(n))return'Mondial Relay';if(/^\d[A-Z]\d{11}$/i.test(n)||/^\d{14}[A-Z]$/i.test(n))return'La Poste';if(/^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(n))return'Chronopost';return n?'inconnu (lien Boxtal + La Poste)':'—';}
function majScan(){const t=transporteur(sNum.value);sCar.innerHTML='Transporteur reconnu : <b>'+t+'</b>';sOk.disabled=!sNum.value.trim();}
sNum.addEventListener('input',majScan);
document.getElementById('btn-scan').onclick=()=>{const c=document.getElementById('scan-cam');c.hidden=false;sNum.value='';majScan();
 setTimeout(()=>{c.hidden=true;sNum.value='74550444';majScan();sNum.style.borderColor='var(--ash-ok)';},1700);};
// 3 question
const REP={
 'colliers':{p:'<b>14 colliers</b> vendus en octobre, pour <b>341,20 €</b>. Le plus vendu : Collier Cœur gravé (6).',bars:[['Collier Cœur gravé',6],['Collier 3 Cœurs',3],['Collier Quatre Mots',2],['Collier Enveloppe',2],['Collier Double Cœur',1]],src:'Lu dans 33 commandes d\'octobre (hors annulées et tests).'},
 'rapporte':{p:'Ce mois, c\'est le <b>cristal photo 3D vertical</b> qui rapporte le plus : <b>287,60 €</b> de bénéfice sur 5 pièces (57,52 € la pièce après achat, socle et étiquette).',bars:[['Cristal vertical',288],['Verre à whisky',96],['Collier Cœur gravé',88],['Carafe',71],['Gobelet',52]],src:'Bénéfice = prix payé − achat − matériel − étiquette − ratés (page Bénéfices).'},
 'panier':{p:'Panier moyen des commandes de verres (vin, flûte, whisky, cocktail, tumbler, carafe) : <b>48,30 €</b> sur 30 jours, contre 31,80 € pour les bijoux.',bars:[['Verres & carafe',48.3],['Cristal',71.2],['Bijoux',31.8],['Papeterie',22.4]],src:'Calculé sur les commandes des 30 derniers jours.'},
 'belgique':{p:'<b>3 commandes</b> livrées en Belgique depuis le début (1PCACXUM, 0M9RTU7B, 0K2LMN4P), <b>142,70 €</b>. Aucune autre destination hors France à part Monaco (1).',bars:[['France',30],['Belgique',3],['Monaco',1]],src:'Pays lu dans l\'adresse de livraison de chaque commande.'}
};
function repondre(q){const k=/collier/i.test(q)?'colliers':/rapporte|plus/i.test(q)?'rapporte':/panier|verre/i.test(q)?'panier':/belgique|pays/i.test(q)?'belgique':null;
 const o=document.getElementById('q-out');if(!k){o.innerHTML='<p>Je n\'ai pas cette donnée dans les commandes. Reformulez (produit, mois, pays, panier moyen), ou demandez-la à l\'assistant.</p>';return;}
 const r=REP[k],m=Math.max(...r.bars.map(b=>b[1]));
 o.innerHTML='<p>'+r.p+'</p><div class="gi-bars">'+r.bars.map(b=>'<div><label>'+b[0]+'</label><span style="width:'+(b[1]/m*100).toFixed(0)+'%"></span><em class="n">'+(Number.isInteger(b[1])?b[1]:b[1].toFixed(2).replace('.',',')+' €')+'</em></div>').join('')+'</div><div class="src">'+r.src+'</div>';}
document.getElementById('q-go').onclick=()=>repondre(document.getElementById('q-in').value);
document.getElementById('q-in').addEventListener('keydown',e=>{if(e.key==='Enter')repondre(e.target.value);});
document.querySelectorAll('.gi-chips .fq-chip').forEach(b=>b.onclick=()=>{document.getElementById('q-in').value=b.dataset.q;repondre(b.dataset.q);});
repondre('Combien de colliers vendus en octobre ?');
// 4 programmations
const J=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'],M=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
document.getElementById('pg-add').onclick=()=>{const d=new Date(document.getElementById('pg-date').value+'T'+document.getElementById('pg-heure').value);
 const quoi=document.getElementById('pg-quoi').value,prod=document.getElementById('pg-prod').value,val=document.getElementById('pg-val').value,note=document.getElementById('pg-note').value;
 const tr=document.createElement('tr');tr.innerHTML='<td><b>'+(quoi.startsWith('Prix')?prod+' : '+val:quoi)+'</b><span class="pv-sub">'+(note||'')+'</span></td><td class="n">'+J[d.getDay()]+' '+d.getDate()+' '+M[d.getMonth()]+' · '+String(d.getHours()).padStart(2,'0')+' h '+String(d.getMinutes()).padStart(2,'0')+'</td><td class="n"><button type="button" class="fq-btn sm ghost pg-del">Annuler</button></td>';
 document.getElementById('pg-list').prepend(tr);lierDel();};
function lierDel(){document.querySelectorAll('.pg-del').forEach(b=>b.onclick=()=>b.closest('tr').remove());}lierDel();
// 5 + 8
const paMenu=document.getElementById('pa-menu');document.getElementById('pa-btn').onclick=()=>paMenu.hidden=!paMenu.hidden;
document.getElementById('pa-refaire').onclick=()=>{paMenu.hidden=true;document.getElementById('avoir-box').hidden=true;document.getElementById('devis-box').hidden=false;document.getElementById('devis-box').scrollIntoView({behavior:'smooth',block:'nearest'});};
document.getElementById('pa-avoir').onclick=()=>{paMenu.hidden=true;document.getElementById('devis-box').hidden=true;document.getElementById('avoir-box').hidden=false;document.getElementById('avoir-box').scrollIntoView({behavior:'smooth',block:'nearest'});};
document.getElementById('avoir-non').onclick=()=>document.getElementById('avoir-box').hidden=true;
document.getElementById('avoir-ok').onclick=()=>{document.getElementById('avoir-box').hidden=true;document.getElementById('pa-out').innerHTML='<div class="pv-note" style="margin:10px 0 0">Cagnotte créditée de <b>5,00 €</b> (1,40 → 6,40 €). Écrit dans le Journal d\'activité. Aucun e-mail parti.</div>';};
// 7 coût
const num=s=>parseFloat(String(s).replace(/\s/g,'').replace(',','.'))||0,eur=x=>x.toFixed(2).replace('.',',')+' €';
function majCout(){const h=num(document.getElementById('c-laser').value)/Math.max(1,num(document.getElementById('c-heures').value)),e=num(document.getElementById('c-elec').value),m=num(document.getElementById('c-main').value);
 const parH=h+e+m;let tot=0;const nb={collier:12,verre:9,cristal:5,gobelet:7};
 document.querySelectorAll('.c-min').forEach(i=>{const c=parH*num(i.value)/60;document.querySelector('.c-out[data-p="'+i.dataset.p+'"]').textContent=eur(c)+' / pièce';tot+=c*(nb[i.dataset.p]||0);});
 document.getElementById('c-mois').textContent='− '+eur(tot);document.getElementById('c-benef').textContent=eur(1109.61-412.30-tot);}
document.querySelectorAll('#c-laser,#c-heures,#c-elec,#c-main,.c-min').forEach(i=>i.addEventListener('input',majCout));majCout();
// journal
let jt;document.querySelectorAll('.j-undo').forEach(b=>b.onclick=()=>{const tr=b.closest('tr');document.getElementById('j-txt').textContent=tr.children[2].textContent+' · '+tr.children[3].textContent.split('→')[0].trim();
 const t=document.getElementById('j-toast');t.hidden=false;clearTimeout(jt);jt=setTimeout(()=>t.hidden=true,10000);});
document.getElementById('j-cancel').onclick=()=>{document.getElementById('j-toast').hidden=true;};
document.querySelectorAll('.gi-filtres .fq-chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.gi-filtres .fq-chip').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('[data-v="journal"] tbody tr').forEach(tr=>tr.hidden=b.textContent!=='Tout'&&tr.children[1].textContent!==b.textContent);});
'''

html = shell(title="Gestion : idées rangées", crumb="Les idées du 8 novembre", subtab="File de production",
             css_site_txt=css_site(css_dir), css=CSS, body=BODY, js=JS)
open(sortie, "w", encoding="utf-8").write(html)
print("écrit", sortie, len(html) // 1024, "Ko")
