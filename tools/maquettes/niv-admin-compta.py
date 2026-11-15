# -*- coding: utf-8 -*-
# MAQUETTE « APPLICATION NIV ADMIN + PHOTOS DU COLIS + FACTURES + COMPTABILITÉ » (15/11/2026, gérant :
# « Tout ça… une page vraiment comptabilité comme les vrais… » puis « Fais les maquettes »). RIEN en ligne.
# Usage : python3 tools/maquettes/niv-admin-compta.py <dossier css du site> <sortie.html>
# Reprend la coquille de Gestion (gestion_coquille.py) et le CSS des vues de gestion-idees-08-11.py (lu dans le fichier).
# Données = exemples. Seuils et taux à revérifier sur les sites officiels avant la construction.
import sys, os, re, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import css_site, shell, I, uri, P, M

HERE = os.path.dirname(os.path.abspath(__file__))
css_dir, sortie = sys.argv[1], sys.argv[2]
CSS_BASE = re.search(r"CSS = r'''(.*?)'''", open(os.path.join(HERE, "gestion-idees-08-11.py"), encoding="utf-8").read(), re.S).group(1)

def ou(chemin):
    return f'<div class="gi-ou">{I("pin")} Où : <b>{chemin}</b></div>'

def emp(s):
    return hashlib.sha256(s.encode()).hexdigest()[:12]

# ---------- photos d'exemple (photos du site, entières) ----------
PH_CONTENU = uri(P("verre_a_whisky_exemple_face.jpg"), 360)
PH_FERME = uri(M("boite-kraft-30x23x8.webp"), 360)
PH_ETIQ = uri(M("etiquettes-fragile.webp"), 360)
PH_CRISTAL = uri(P("cristal-v-couple.jpg"), 360)

# ================= PLAN =================
PLAN = [
  ("Votre téléphone", "phone", [("Icône « Niv Admin »", "Déjà installée, plein écran. + Face ID, notifications, chiffre sur l'icône", "faceid")]),
  ("Commandes", "orders", [("File de production · Fiche commande", "« 📷 Photos du colis » sur chaque commande", "colis"),
                            ("Fiche commande › Plus d'actions", "« Dossier de preuve (litige) » : un PDF prêt à envoyer", "preuve")]),
  ("Stock & achats", "box", [("Achats & factures", "Devient le classeur : photo ou PDF d'origine gardé 10 ans", "factures")]),
  ("Finances", "coin", [("Comptabilité (NOUVEAU)", "Tableau de bord, livre des recettes, registre des achats, URSSAF, rapprochement, exports", "compta"),
                        ("Bénéfices · Ventes · Visiteurs", "Inchangés", None), ("Inventaire & compta", "Rejoint « Comptabilité »", None)]),
  ("Réglages", "set", [("Notifications & résumés", "+ notifications sur le téléphone, écran allumé", "notif"),
                       ("Appareils connectés (NOUVEAU)", "Les téléphones qui entrent avec Face ID, « Retirer »", "faceid"),
                       ("Facture électronique (NOUVEAU)", "Ce qui change en 2026 et 2027, ce qui est prêt", "efacture")]),
]
def plan_html():
    out = []
    for sec, ic, subs in PLAN:
        lis = []
        for s, note, v in subs:
            lab = f'<button type="button" class="gi-go" data-v="{v}">{s}</button>' if v else f'<span>{s}</span>'
            lis.append(f'<li{" class=new" if v else ""}>{lab}<em>{note}</em></li>')
        out.append(f'<div class="gi-sec"><h3>{I(ic)} {sec}</h3><ul>{"".join(lis)}</ul></div>')
    return "".join(out)

VUE_PLAN = f'''
<div class="pv-note">Où va chaque nouveauté dans Gestion. Rien n'est déplacé ni supprimé. Lignes <b>en or</b> = nouveau : touchez-en une pour voir l'écran.
Rien ne change pour les clientes.</div>
<div class="gi-plan">{plan_html()}</div>'''

# ================= 1 · FACE ID =================
VUE_FACEID = f'''
{ou("À l'ouverture de « Niv Admin » · Réglages › Appareils connectés")}
<div class="pv-note">Vous tapez le mot de passe <b>une seule fois</b> sur le téléphone, puis « Activer Face ID ». Ensuite : vous ouvrez l'application, vous touchez le bouton, Face ID, et vous êtes dans Gestion.
Le mot de passe reste en secours. Changer le mot de passe déconnecte tous les téléphones.</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("phone")} Ouverture de l'application</h3>
    <div class="na-phone"><div class="na-login" id="fid-ecran">
      <div class="na-login-t">Espace gestion</div>
      <div class="na-login-s">Bonjour. Entrez avec Face ID.</div>
      <button type="button" class="fq-btn pri na-big" id="fid-go">{I("user")} Entrer avec Face ID</button>
      <button type="button" class="na-link" id="fid-mdp">Utiliser le mot de passe</button>
      <div class="na-mdp" id="fid-mdpbox" hidden><input type="password" placeholder="Mot de passe" aria-label="Mot de passe"><button type="button" class="fq-btn">Entrer</button></div>
      <div class="na-face" id="fid-face" hidden><span class="na-face-ic"></span><b>Face ID</b></div>
      <div class="na-ok" id="fid-ok" hidden>{I("check")} Bienvenue · ouverture de « Aujourd'hui »…</div>
    </div></div>
    <p class="pv-small">Face ID demande toujours un toucher du bouton (règle d'Apple). Si Face ID refuse 3 fois : le mot de passe.</p>
  </section>
  <section class="pv-box"><h3>{I("set")} Réglages › Appareils connectés</h3>
    <table class="pv-table"><thead><tr><th>Appareil</th><th>Dernière ouverture</th><th></th></tr></thead><tbody>
      <tr><td><b>iPhone · Niv Admin</b><span class="pv-sub">Face ID activé le 15/11/2026</span></td><td class="n">aujourd'hui 11:40</td><td class="n"><button type="button" class="fq-btn sm ghost">Retirer</button></td></tr>
      <tr><td><b>Ordinateur · Chrome</b><span class="pv-sub">Mot de passe</span></td><td class="n">hier 21:12</td><td class="n"><button type="button" class="fq-btn sm ghost">Retirer</button></td></tr>
    </tbody></table>
    <p class="pv-small">Un téléphone perdu : « Retirer », il ne peut plus entrer. « Déconnecter tous les appareils » en bas de la liste.</p>
  </section>
</div>'''

# ================= 2 · PHOTOS DU COLIS =================
def slot(k, titre, ph, heure):
    return f'''<div class="cl-slot{" pris" if ph else ""}" data-k="{k}">
      <div class="cl-img">{f'<img src="{ph}" alt="">' if ph else I("img")}</div>
      <b>{titre}</b><span class="pv-sub cl-h">{heure if ph else "pas encore prise"}</span>
      <button type="button" class="fq-btn sm{"" if ph else " pri"} cl-take">{I("img")} {"Reprendre" if ph else "Prendre la photo"}</button></div>'''

VUE_COLIS = f'''
{ou("Commandes › File de production (carte) et Fiche commande › bloc « Photos du colis »")}
<div class="pv-note">Au moment d'emballer : trois photos guidées, prises avec l'appareil photo du téléphone (ou choisies dans la galerie).
Chaque photo garde <b>la date, l'heure et une empreinte</b> qui prouve qu'elle n'a pas été modifiée. En cas de retour ou de « colis vide », tout est dans la commande.</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("box")} #1RHXBNSI · Inés Hmidi Garcia · Verre à whisky gravé</h3>
    <div class="cl-grid">
      {slot("contenu", "1 · Le contenu", PH_CONTENU, "15/11/2026 · 16:02 · empreinte " + emp("a"))}
      {slot("ferme", "2 · La boîte fermée", None, "")}
      {slot("etiq", "3 · L'étiquette collée", None, "")}
    </div>
    <div class="cl-more"><button type="button" class="fq-btn sm ghost">{I("img")} + Autre photo</button><button type="button" class="fq-btn sm ghost">Choisir dans la galerie</button></div>
    <div class="cl-state" id="cl-state">1 photo sur 3 · il manque la boîte fermée et l'étiquette.</div>
    <label class="cl-check"><input type="checkbox" checked> Me rappeler les photos quand je clique « Expédier » (si elles manquent)</label>
  </section>
  <section class="pv-box"><h3>{I("orders")} Dans la file de production</h3>
    <article class="fq-card" style="margin:0">
      <div class="fq-c1"><a class="fq-ref" href="#">#1RHXBNSI</a><span class="fq-tot mono">31,80 €</span></div>
      <div class="fq-who"><b>Inés Hmidi Garcia</b><span class="dot">·</span><span>Domicile · Lyon</span></div>
      <ul class="fq-items"><li><span class="q">1×</span><span><b>Verre à whisky à personnaliser</b><span class="var"> · Meilleur Papa</span></span></li></ul>
      <div class="cl-chips"><span class="fq-pill" id="cl-pill">📷 1 / 3 photos du colis</span></div>
      <div class="r" style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px"><button type="button" class="fq-btn sm">📷 Photos du colis</button><button type="button" class="fq-btn sm pri">{I("truck")} Expédier…</button></div>
    </article>
    <p class="pv-small">La pastille devient verte à 3 photos. Les photos sont rangées avec la commande, jamais envoyées à la cliente sans vous.</p>
  </section>
</div>'''

# ================= 3 · DOSSIER DE PREUVE =================
VUE_PREUVE = f'''
{ou("Fiche commande › Plus d'actions › « Dossier de preuve (litige) »")}
<div class="pv-note">Une cliente dit « colis vide », « pas reçu » ou ouvre un litige PayPal / Stripe : un bouton fabrique <b>un seul PDF</b> avec tout ce qui prouve l'envoi.
Fait pour entrer dans les limites de Stripe (PDF, 2 Mo par fichier, 4 Mo au total). Vous le joignez vous-même au litige : rien ne part tout seul.</div>
<div class="gi-bar"><button type="button" class="fq-btn pri" id="pv-make">{I("dl")} Fabriquer le dossier de preuve</button><span class="pv-sub" id="pv-made" style="margin:0"></span></div>
<div class="pr-pdf">
  <div class="pr-h"><div><b>Dossier de preuve d'expédition</b><span>Niv Création · SIRET 105 914 774 00010 · nivcreation.fr</span></div><div class="mono">Commande 06W69SNX</div></div>
  <div class="pr-grid">
    <div><h4>Commande</h4><p>Payée le 10/11/2026 22:31 · 74,70 € (carte Visa •5347)<br>Cristal photo 3D vertical Petit + socle<br>Livraison : Express Chronopost</p></div>
    <div><h4>Livraison</h4><p>Mohammad Abu Jamous<br>Adresse de livraison (étiquette)<br>Suivi : <b>XY123456789FR</b></p></div>
  </div>
  <h4>Suivi du transporteur</h4>
  <ul class="pr-tl"><li><b>17/11 09:12</b> Pris en charge</li><li><b>18/11 07:40</b> En cours de livraison</li><li><b>18/11 11:05</b> Livré · signé « M. ABU »</li></ul>
  <h4>Photos du colis (prises dans l'atelier)</h4>
  <div class="pr-ph"><figure><img src="{PH_CRISTAL}" alt=""><figcaption>Contenu · 16/11 18:02</figcaption></figure><figure><img src="{PH_FERME}" alt=""><figcaption>Boîte fermée · 16/11 18:04</figcaption></figure><figure><img src="{PH_ETIQ}" alt=""><figcaption>Étiquette · 16/11 18:05</figcaption></figure></div>
  <h4>Échanges avec le client</h4>
  <p class="pr-mail">13/11 19:08 · Aperçu envoyé · 14/11 · « Je valide l'aperçu » · 15/11 · demande de date de livraison · réponse envoyée 18:00</p>
  <p class="pr-foot">Empreintes des photos : {emp("1")} · {emp("2")} · {emp("3")} · dossier fabriqué le 20/11/2026 à 10:14</p>
</div>'''

# ================= 4 · NOTIFICATIONS =================
VUE_NOTIF = f'''
{ou("Réglages › Notifications & résumés")}
<div class="pv-note">Les notifications arrivent sur le téléphone même quand « Niv Admin » est fermée, comme une vraie application (iPhone avec iOS 16.4 ou plus).
Le chiffre sur l'icône = les commandes à préparer. Vous choisissez ce qui sonne.</div>
<div class="gi-two">
  <section class="pv-box"><h3>{I("phone")} Sur l'écran verrouillé</h3>
    <div class="nt-lock">
      <div class="nt-time">16:02</div>
      <div class="nt-n"><span class="nt-ic">NiV</span><div><b>Nouvelle commande · 31,80 €</b><p>Inés Hmidi Garcia · Verre à whisky gravé</p></div><em>maintenant</em></div>
      <div class="nt-n"><span class="nt-ic">NiV</span><div><b>Réponse à valider</b><p>Mohammad Abu Jamous demande la date de livraison</p></div><em>9:39</em></div>
      <div class="nt-n bad"><span class="nt-ic">NiV</span><div><b>⚠️ Litige PayPal ouvert</b><p>Commande 0FUPET23 · 42,80 € · à traiter sous 10 jours</p></div><em>hier</em></div>
      <div class="nt-app"><span class="nt-appic">NiV<i>3</i></span><span>Niv Admin</span></div>
    </div>
  </section>
  <section class="pv-box"><h3>{I("set")} Ce qui sonne</h3>
    <div class="gi-form">
      <label><input type="checkbox" checked> Nouvelle commande (Express en premier)</label>
      <label><input type="checkbox" checked> Réponse d'une cliente · réponse à valider</label>
      <label><input type="checkbox" checked> Litige, remboursement, contestation (PayPal, Stripe)</label>
      <label><input type="checkbox"> Matériel à racheter</label>
      <label><input type="checkbox"> Résumé du matin (à 8 h 30)</label>
      <label>Heures calmes<select><option>22 h → 7 h 30 (sauf litige)</option><option>Jamais</option></select></label>
      <label>Chiffre sur l'icône<select><option>Commandes à préparer</option><option>Messages à traiter</option><option>Rien</option></select></label>
      <label><input type="checkbox" checked> Garder l'écran allumé quand une fiche commande ou l'Atelier est ouvert</label>
    </div>
    <p class="pv-small">Première fois : l'iPhone demande « Autoriser les notifications ? » (une seule fois). Les e-mails d'alerte d'aujourd'hui continuent comme avant.</p>
  </section>
</div>'''

# ================= 5 · CLASSEUR DES FACTURES =================
FACT = [
  ("METRO", "Verres Lario 20 cl · 12 pièces", "14/11/2026", "Achat de marchandises", "41,52 €", "photo", "ok"),
  ("Alibaba · Wenzhou Senyuan", "Carnets A5 · 60 pièces", "23/10/2026", "Achat de marchandises", "153,94 €", "PDF", "ok"),
  ("Amazon", "Cartons 25 × 20 × 15 · lot de 25", "11/10/2026", "Emballage", "27,99 €", "PDF", "ok"),
  ("Temu", "Emballages de Noël · 13 lignes", "17/10/2026", "Emballage", "38,40 €", "photo", "warn"),
  ("Boxtal", "Étiquettes d'envoi · octobre", "31/10/2026", "Frais d'envoi", "96,12 €", "PDF", "ok"),
  ("xTool", "Pièce détachée · acompte", "—", "Matériel", "40,00 €", "—", "bad"),
]
def fact_rows():
    out = []
    for four, quoi, d, cat, mt, typ, st in FACT:
        lab = {"ok": "Rangée", "warn": "À vérifier", "bad": "Facture manquante"}[st]
        out.append(f'<tr><td><b>{four}</b><span class="pv-sub">{quoi}</span></td><td class="n">{d}</td><td>{cat}</td><td class="n">{mt}</td><td>{typ}</td><td><span class="fq-pill {"" if st == "ok" else st}">{lab}</span></td></tr>')
    return "".join(out)

VUE_FACTURES = f'''
{ou("Stock & achats › Achats & factures (devient le classeur)")}
<div class="pv-note">Chaque facture d'achat est gardée <b>10 ans</b>, dans son fichier d'origine (photo ou PDF), avec une empreinte qui prouve qu'elle n'a pas changé.
Comme aujourd'hui, la photo d'une facture remplit le stock et le coût d'achat ; en plus, elle est rangée par mois et par fournisseur.</div>
<div class="gi-bar">
  <button type="button" class="fq-btn pri">{I("img")} Photographier une facture</button><button type="button" class="fq-btn">Importer un PDF</button>
  <input class="fc-find" placeholder="Rechercher : fournisseur, produit, montant…" aria-label="Rechercher">
</div>
<div class="pv-kpis">
  <div class="pv-kpi"><span>Achats de novembre</span><b>41,52 €</b><em>1 facture</em></div>
  <div class="pv-kpi"><span>Achats de 2026</span><b>2 184,60 €</b><em>38 factures</em></div>
  <div class="pv-kpi"><span>À vérifier</span><b>1</b><em>lecture incertaine</em></div>
  <div class="pv-kpi"><span>Factures manquantes</span><b>1</b><em>dépense sans justificatif</em></div>
</div>
<div class="gi-filtres"><button type="button" class="fq-chip on">Tout</button><button type="button" class="fq-chip">Novembre</button><button type="button" class="fq-chip">Octobre</button><button type="button" class="fq-chip">Par fournisseur</button><button type="button" class="fq-chip">Marchandises</button><button type="button" class="fq-chip">Emballage</button><button type="button" class="fq-chip">Frais d'envoi</button></div>
<div class="pv-tablewrap"><table class="pv-table" style="min-width:640px"><thead><tr><th>Fournisseur</th><th>Date</th><th>Catégorie</th><th>Montant TTC</th><th>Fichier</th><th>État</th></tr></thead><tbody>{fact_rows()}</tbody></table></div>
<p class="pv-small">« Facture manquante » = une dépense vue dans Bénéfices ou sur le relevé, sans pièce. Les factures reçues par e-mail (Amazon, Boxtal…) peuvent être rangées depuis la boîte mail surveillée.</p>'''

# ================= 6 · COMPTABILITÉ =================
RECETTES = [
  ("15/11/2026", "FA-2026-0412", "Inés Hmidi Garcia", "Verre à whisky gravé", "Carte · Stripe", "31,80 €", "1RHXBNSI"),
  ("14/11/2026", "FA-2026-0411", "Sony Saint-Auret", "Commande 0RPVCMNW", "PayPal", "86,72 €", "0RPVCMNW"),
  ("10/11/2026", "FA-2026-0408", "Mohammad Abu Jamous", "Cristal photo 3D vertical + socle", "Carte · Stripe", "74,70 €", "06W69SNX"),
  ("08/11/2026", "FA-2026-0405", "Vente sur un marché", "2 porte-clés gravés", "Espèces", "15,80 €", "hors site"),
]
ACHATS = [
  ("14/11/2026", "METRO", "Verres Lario 20 cl × 12", "Virement", "41,52 €", "FACT-METRO-0142"),
  ("31/10/2026", "Boxtal", "Étiquettes d'envoi octobre", "Carte", "96,12 €", "BX-2026-10"),
  ("23/10/2026", "Alibaba", "Carnets A5 × 60", "Carte", "153,94 €", "33986068501043880"),
]
def rows(lst, n):
    return "".join("<tr>" + "".join(f'<td{" class=n" if i in n else ""}>{c}</td>' for i, c in enumerate(r)) + "</tr>" for r in lst)

def jauge(lbl, val, max_, note):
    p = min(100, val / max_ * 100)
    return f'<div class="cp-jauge"><div class="cp-j1"><b>{lbl}</b><span class="mono">{val:,.0f} € / {max_:,.0f} €</span></div><div class="cp-bar"><span style="width:{p:.1f}%"></span></div><span class="pv-sub">{note}</span></div>'.replace(",", " ")

COMPTA_TABS = [("cp-bord", "Tableau de bord"), ("cp-rec", "Livre des recettes"), ("cp-ach", "Registre des achats"), ("cp-urssaf", "URSSAF"), ("cp-rappro", "Rapprochement"), ("cp-pieces", "Pièces manquantes"), ("cp-export", "Exports")]
VUE_COMPTA = f'''
{ou("Finances › Comptabilité (nouvel écran)")}
<div class="pv-note">Une page comme un logiciel de comptabilité pour auto-entrepreneur : <b>tout se remplit tout seul</b> avec les commandes du site, les devis payés, les ventes hors site et les factures du classeur.
Vous ne ressaisissez rien. Chiffres = exemples ; plafonds et taux à revérifier sur les sites officiels avant la construction.</div>
<nav class="cp-tabs">{"".join(f'<button type="button" class="fq-chip{" on" if i == 0 else ""}" data-c="{k}">{t}</button>' for i, (k, t) in enumerate(COMPTA_TABS))}</nav>

<div class="cp-v" data-c="cp-bord">
  <div class="pv-kpis">
    <div class="pv-kpi"><span>Chiffre d'affaires 2026</span><b>14 862,40 €</b><em>encaissé du 1/1 au 15/11</em></div>
    <div class="pv-kpi"><span>Novembre</span><b>1 284,30 €</b><em>+12 % sur octobre</em></div>
    <div class="pv-kpi"><span>À déclarer à l'URSSAF</span><b>3 912,40 €</b><em>octobre · avant le 30/11</em></div>
    <div class="pv-kpi"><span>Cotisations estimées</span><b>481,23 €</b><em>12,3 % · vente de marchandises</em></div>
  </div>
  <div class="gi-two">
    <section class="pv-box"><h3>{I("chart")} Vos plafonds 2026</h3>
      {jauge("Franchise de TVA (ventes)", 14862, 91900, "Au-delà : facturer la TVA. Alerte à 80 %.")}
      {jauge("Régime micro-entreprise (ventes)", 14862, 203100, "Au-delà deux années de suite : sortie du régime micro.")}
      <p class="pv-small">Ventes de marchandises. Si une partie est une prestation de service, elle a ses propres seuils (36 800 € et 83 600 €) : à trancher avec vous.</p>
    </section>
    <section class="pv-box"><h3>{I("clock")} Échéances</h3>
      <ul class="cp-ech">
        <li class="warn"><b>30/11</b><span>Déclaration URSSAF d'octobre · 3 912,40 €</span><button type="button" class="fq-btn sm">Préparer</button></li>
        <li><b>31/12</b><span>Déclaration URSSAF de novembre</span></li>
        <li><b>Mai 2027</b><span>Déclaration de revenus (case micro-BIC) · montant prêt</span></li>
        <li><b>1/9/2027</b><span>Factures électroniques à émettre</span><button type="button" class="fq-btn sm ghost gi-go" data-v="efacture">Voir</button></li>
      </ul>
    </section>
  </div>
  <section class="pv-box" style="margin-top:14px"><h3>{I("chart")} Recettes et achats par mois</h3>
    <div class="cp-mois">{"".join(f'<div><span class="r" style="height:{r}%"></span><span class="a" style="height:{a}%"></span><em>{m}</em></div>' for m, r, a in [("juin",32,18),("juil.",41,22),("août",38,12),("sept.",55,30),("oct.",78,44),("nov.",30,8)])}</div>
    <p class="pv-small"><span class="cp-leg r"></span> Recettes encaissées <span class="cp-leg a"></span> Achats (factures du classeur)</p>
  </section>
</div>

<div class="cp-v" data-c="cp-rec" hidden>
  <p class="pv-small" style="margin-top:0">Obligatoire pour tout micro-entrepreneur. Une ligne par encaissement : date, n° de facture, client, nature, mode de règlement, référence. Rempli tout seul.</p>
  <div class="pv-tablewrap"><table class="pv-table" style="min-width:760px"><thead><tr><th>Date</th><th>Facture</th><th>Client</th><th>Nature</th><th>Règlement</th><th>Montant</th><th>Pièce</th></tr></thead><tbody>{rows(RECETTES, (5,))}</tbody></table></div>
  <div class="gi-bar"><button type="button" class="fq-btn">+ Ajouter une vente hors site</button><span class="pv-sub" style="margin:0">Marché, salon, vente en main propre : comme « Ventes hors site URSSAF » aujourd'hui.</span></div>
</div>

<div class="cp-v" data-c="cp-ach" hidden>
  <p class="pv-small" style="margin-top:0">Obligatoire quand on vend des marchandises. Une ligne par achat, reliée à sa facture dans le classeur.</p>
  <div class="pv-tablewrap"><table class="pv-table" style="min-width:680px"><thead><tr><th>Date</th><th>Fournisseur</th><th>Nature</th><th>Règlement</th><th>Montant</th><th>Facture</th></tr></thead><tbody>{rows(ACHATS, (4,))}</tbody></table></div>
</div>

<div class="cp-v" data-c="cp-urssaf" hidden>
  <div class="gi-two">
    <section class="pv-box"><h3>{I("coin")} Déclaration d'octobre</h3>
      <table class="pv-table"><tbody>
        <tr><td>Ventes du site (Stripe + PayPal)</td><td class="n">3 704,60 €</td></tr>
        <tr><td>Devis payés</td><td class="n">184,90 €</td></tr>
        <tr><td>Ventes hors site</td><td class="n">22,90 €</td></tr>
        <tr><td>− Remboursements du mois</td><td class="n">0,00 €</td></tr>
        <tr><td><b>Chiffre d'affaires à déclarer</b></td><td class="n"><b>3 912,40 €</b></td></tr>
        <tr><td>Cotisations estimées (12,3 %)</td><td class="n">481,23 €</td></tr>
      </tbody></table>
      <div class="gi-bar" style="margin:12px 0 0"><button type="button" class="fq-btn pri" id="ur-copy">{I("copy")} Copier le montant</button><button type="button" class="fq-btn">Ouvrir autoentrepreneur.urssaf.fr</button></div>
      <p class="pv-small">Vous déclarez vous-même sur le site de l'URSSAF ; ici, le montant est prêt et le détail se garde. « Déclaré le … » se coche ensuite.</p>
    </section>
    <section class="pv-box"><h3>{I("clock")} Historique</h3>
      <table class="pv-table"><tbody>
        <tr><td>Septembre</td><td class="n">2 864,20 €</td><td><span class="fq-pill">Déclaré le 28/10</span></td></tr>
        <tr><td>Août</td><td class="n">1 402,10 €</td><td><span class="fq-pill">Déclaré le 30/09</span></td></tr>
        <tr><td>Juillet</td><td class="n">1 588,00 €</td><td><span class="fq-pill">Déclaré le 31/08</span></td></tr>
      </tbody></table>
    </section>
  </div>
</div>

<div class="cp-v" data-c="cp-rappro" hidden>
  <p class="pv-small" style="margin-top:0">Chaque virement de Stripe et de PayPal vers votre banque est comparé aux commandes. Un écart = une vente oubliée, un remboursement ou des frais.</p>
  <div class="pv-tablewrap"><table class="pv-table" style="min-width:680px"><thead><tr><th>Versement</th><th>Date</th><th>Montant reçu</th><th>Commandes</th><th>Frais</th><th>État</th></tr></thead><tbody>
    <tr><td><b>Stripe</b></td><td class="n">14/11</td><td class="n">104,93 €</td><td>2 commandes · 106,50 €</td><td class="n">1,57 €</td><td><span class="fq-pill">Concorde</span></td></tr>
    <tr><td><b>PayPal</b></td><td class="n">14/11</td><td class="n">83,86 €</td><td>0RPVCMNW · 86,72 €</td><td class="n">2,86 €</td><td><span class="fq-pill">Concorde</span></td></tr>
    <tr><td><b>Stripe</b></td><td class="n">07/11</td><td class="n">212,40 €</td><td>4 commandes · 248,10 €</td><td class="n">3,62 €</td><td><span class="fq-pill warn">Écart 32,08 € · remboursement 1CSPQUR9 ?</span></td></tr>
  </tbody></table></div>
</div>

<div class="cp-v" data-c="cp-pieces" hidden>
  <ul class="cp-ech">
    <li class="bad"><b>Achat</b><span>xTool · acompte 40,00 € · aucune facture dans le classeur</span><button type="button" class="fq-btn sm">Ajouter la facture</button></li>
    <li class="warn"><b>Achat</b><span>Temu · emballages de Noël · montant lu incertain (38,40 € ?)</span><button type="button" class="fq-btn sm">Vérifier</button></li>
    <li class="warn"><b>Vente</b><span>Devis DEV-1527 payé · pas de facture émise</span><button type="button" class="fq-btn sm">Faire la facture</button></li>
  </ul>
</div>

<div class="cp-v" data-c="cp-export" hidden>
  <div class="gi-two">
    <section class="pv-box"><h3>{I("dl")} Exporter</h3>
      <div class="gi-form">
        <label>Période<select><option>Année 2026</option><option>Novembre 2026</option><option>4ᵉ trimestre 2026</option></select></label>
        <label>Contenu<select><option>Livre des recettes + registre des achats</option><option>Livre des recettes seul</option><option>Tout + les factures (dossier .zip)</option></select></label>
        <label>Format<select><option>Tableur (Excel)</option><option>PDF</option><option>CSV</option></select></label>
      </div>
      <div class="gi-bar" style="margin:12px 0 0"><button type="button" class="fq-btn pri">{I("dl")} Exporter</button></div>
    </section>
    <section class="pv-box"><h3>{I("user")} Pour un contrôle ou un comptable</h3>
      <p class="pv-small" style="margin-top:0">Un seul dossier : le livre des recettes, le registre des achats, chaque facture d'origine avec son empreinte, et les relevés Stripe / PayPal du mois. Gardé 10 ans.</p>
    </section>
  </div>
</div>'''

# ================= 7 · FACTURE ÉLECTRONIQUE =================
VUE_EFACT = f'''
{ou("Réglages › Facture électronique · rappel dans Finances › Comptabilité")}
<div class="pv-note">La loi change pour toutes les entreprises, micro-entrepreneurs compris. Dates lues sur les sites officiels et spécialisés le 15/11/2026, à revérifier avant la construction.</div>
<div class="ef-tl">
  <div class="ef-s done"><b>1er septembre 2026</b><span>Pouvoir <b>recevoir</b> des factures électroniques de vos fournisseurs.</span><em>À faire : choisir une plateforme agréée (gratuite pour la réception chez plusieurs).</em></div>
  <div class="ef-s"><b>1er septembre 2027</b><span><b>Émettre</b> vos factures en électronique, par une plateforme agréée.</span><em>Le site enverra vos factures et devis payés à cette plateforme ; vous ne retapez rien.</em></div>
</div>
<section class="pv-box" style="margin-top:14px"><h3>{I("check")} Ce qui sera prêt</h3>
  <ul class="cp-ech">
    <li><b>Numéros</b><span>Factures numérotées à la suite, sans trou (déjà le cas pour les devis)</span></li>
    <li><b>Mentions</b><span>SIRET, adresse, « TVA non applicable, art. 293 B du CGI », date de livraison</span></li>
    <li class="warn"><b>Plateforme</b><span>À choisir avec vous avant l'été 2027 ; rappel le 1er mars 2027</span></li>
  </ul>
</section>'''

TABS = [("plan", "Plan"), ("faceid", "1 · Face ID"), ("colis", "2 · Photos du colis"), ("preuve", "3 · Dossier de preuve"),
        ("notif", "4 · Notifications"), ("factures", "5 · Classeur des factures"), ("compta", "6 · Comptabilité"), ("efacture", "7 · Facture électronique")]
VUES = dict(plan=VUE_PLAN, faceid=VUE_FACEID, colis=VUE_COLIS, preuve=VUE_PREUVE, notif=VUE_NOTIF, factures=VUE_FACTURES, compta=VUE_COMPTA, efacture=VUE_EFACT)

BODY = f'''<div class="fq gi">
<div class="ph-row"><div class="ph-txt"><div class="ph-eyebrow">Maquette · rien en ligne</div><h1 class="ph-title">Niv Admin : application, colis, factures, comptabilité</h1>
<div class="ph-sub">Chaque écran à sa place dans Gestion. Données = exemples.</div></div></div>
<nav class="fq-views pv-tabs" role="tablist">{"".join(f'<button type="button" class="fq-view{" on" if k == "plan" else ""}" data-v="{k}">{t}</button>' for k, t in TABS)}</nav>
{"".join(f'<div class="pv-v" data-v="{k}"{"" if k == "plan" else " hidden"}>{v}</div>' for k, v in VUES.items())}
</div>'''

CSS = CSS_BASE + r'''
.na-phone{background:#1a1206;border-radius:30px;padding:12px;max-width:300px;margin:0 auto}
.na-login{background:#fbf7ee;border-radius:22px;padding:34px 18px;text-align:center;min-height:330px;display:grid;align-content:center;gap:12px;position:relative}
.na-login-t{font-family:"Playfair Display",Georgia,serif;font-size:24px}
.na-login-s{color:var(--ash-muted);font-size:13px}
.na-big{justify-self:center;padding:12px 18px}
.na-link{background:none;border:0;color:var(--ash-muted);text-decoration:underline;font-size:12.5px}
.na-mdp{display:flex;gap:6px}.na-mdp input{flex:1;min-width:0;font:inherit;padding:8px 10px;border:1px solid var(--ash-line-2);border-radius:10px}
.na-face{position:absolute;inset:0;display:grid;place-content:center;gap:8px;background:rgba(20,14,4,.55);border-radius:22px;color:#fff}
.na-face-ic{width:62px;height:62px;border:3px solid #fff;border-radius:16px;justify-self:center;animation:na-p 1s ease-in-out infinite alternate}
@keyframes na-p{from{transform:scale(.9)}to{transform:scale(1.05)}}
.na-ok{color:var(--ash-ok);font-weight:700;font-size:13px}
.na-mdp[hidden],.na-face[hidden],.na-ok[hidden],.cp-v[hidden]{display:none!important}
.cl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cl-slot{border:1.5px dashed var(--ash-line-2);border-radius:12px;padding:8px;display:grid;gap:5px;align-content:start;min-width:0}
.cl-slot.pris{border-style:solid;border-color:var(--ash-ok)}
.cl-img{aspect-ratio:1;border-radius:9px;background:var(--ash-sunk);display:grid;place-items:center;overflow:hidden;color:var(--ash-muted)}
.cl-img img{width:100%;height:100%;object-fit:contain;background:#fff}
.cl-img svg{width:28px;height:28px}
.cl-take{width:100%;justify-content:center;white-space:normal;line-height:1.2;padding:6px 4px!important;font-size:12px!important}
.cl-slot b{font-size:12.5px}.cl-h{font-size:11px!important;word-break:break-word}
.cl-more{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.cl-state{font-size:13px;color:var(--ash-warn);font-weight:600}
.cl-state.ok{color:var(--ash-ok)}
.cl-check{display:flex;gap:8px;align-items:center;font-size:13px;margin-top:8px}
.cl-chips{margin-top:8px}
.pr-pdf{background:#fff;border:1px solid var(--ash-line-2);border-radius:6px;box-shadow:var(--ash-shadow);padding:22px 24px;max-width:640px;font-size:13px;color:#222}
.pr-h{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:2px solid var(--ash-gold);padding-bottom:10px;margin-bottom:12px}
.pr-h b{font-size:16px;display:block}.pr-h span{font-size:11.5px;color:#777}
.pr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pr-pdf h4{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:#8a6d1f;margin:14px 0 6px}
.pr-pdf p{margin:0;line-height:1.5}
.pr-tl{margin:0;padding-left:18px;line-height:1.7}
.pr-ph{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pr-ph figure{margin:0}.pr-ph img{width:100%;aspect-ratio:1;object-fit:contain;background:#f6f3ec;border-radius:4px}
.pr-ph figcaption{font-size:10.5px;color:#777;margin-top:2px}
.pr-mail{font-size:12.5px}.pr-foot{font-size:10.5px;color:#888;margin-top:14px!important;word-break:break-all}
.nt-lock{background:linear-gradient(160deg,#2b2620,#5b4a2c);border-radius:26px;padding:22px 12px 16px;display:grid;gap:8px;max-width:330px;margin:0 auto;color:#fff}
.nt-time{text-align:center;font-size:44px;font-weight:300;margin-bottom:6px}
.nt-n{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:8px;align-items:start;background:rgba(255,255,255,.88);color:#1a1206;border-radius:16px;padding:10px}
.nt-n.bad{background:rgba(255,236,232,.95)}
.nt-n p{margin:2px 0 0;font-size:12px;color:#555}.nt-n b{font-size:12.5px}.nt-n em{font-style:normal;font-size:11px;color:#777}
.nt-ic{width:34px;height:34px;border-radius:9px;background:#1a1206;color:#d9b866;font-family:"Playfair Display",Georgia,serif;font-size:13px;display:grid;place-items:center}
.nt-app{display:grid;justify-items:center;gap:4px;margin-top:8px;font-size:11.5px}
.nt-appic{position:relative;width:58px;height:58px;border-radius:14px;background:#1a1206;color:#d9b866;font-family:"Playfair Display",Georgia,serif;font-size:20px;display:grid;place-items:center;border:1px solid #6b5a33}
.nt-appic i{position:absolute;top:-6px;right:-6px;background:#e3493a;color:#fff;font-style:normal;font-family:Inter,sans-serif;font-size:12px;font-weight:700;border-radius:99px;min-width:22px;height:22px;display:grid;place-items:center}
.pv-box{overflow-x:auto}.pv-box .pv-table td,.pv-box .pv-table th{padding:8px 8px}.pv-box .pv-table .n{white-space:normal}
.fc-find{flex:1 1 240px;min-width:0;font:inherit;font-size:13.5px;padding:8px 12px;border:1px solid var(--ash-line-2);border-radius:10px;box-sizing:border-box}
.fq-pill.warn{background:#fff3e0;color:#9a5b00}.fq-pill.bad{background:#fde8e6;color:#a32a1d}
.cp-tabs{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;margin-bottom:14px;padding-bottom:2px}
.cp-tabs .fq-chip{white-space:nowrap}
.cp-jauge{margin-bottom:14px}.cp-j1{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}
.cp-bar{height:10px;background:var(--ash-sunk);border-radius:99px;margin:6px 0 4px;overflow:hidden}
.cp-bar span{display:block;height:100%;background:var(--ash-gold);border-radius:99px}
.cp-ech{list-style:none;margin:0;padding:0;display:grid}
.cp-ech li{display:grid;grid-template-columns:90px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 6px;border-bottom:1px solid var(--ash-line);font-size:13.5px}
.cp-ech li:last-child{border-bottom:0}
.cp-ech li.warn b{color:var(--ash-warn)}.cp-ech li.bad b{color:var(--ash-bad)}
.cp-mois{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;height:160px;align-items:end;padding-bottom:20px}
.cp-mois div{position:relative;display:flex;gap:4px;align-items:flex-end;justify-content:center;height:100%}
.cp-mois span{width:38%;border-radius:4px 4px 0 0;display:block}
.cp-mois .r,.cp-leg.r{background:var(--ash-gold)}.cp-mois .a,.cp-leg.a{background:#8b7d6b}
.cp-mois em{position:absolute;bottom:-20px;font-style:normal;font-size:11.5px;color:var(--ash-muted)}
.cp-leg{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 10px;vertical-align:-1px}
.ef-tl{display:grid;gap:10px}
.ef-s{display:grid;gap:4px;background:var(--ash-surface);border:1px solid var(--ash-line);border-left:4px solid var(--ash-line-2);border-radius:12px;padding:12px 14px}
.ef-s.done{border-left-color:var(--ash-ok)}.ef-s b{font-size:15px}.ef-s em{font-style:normal;font-size:12.5px;color:var(--ash-muted)}
@media (max-width:760px){.cl-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.pr-grid{grid-template-columns:minmax(0,1fr)}
 .cp-ech li{grid-template-columns:minmax(0,1fr)}.pr-pdf{padding:16px}}
'''

JS = r'''
function montrer(v){document.querySelectorAll('.pv-tabs .fq-view').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
 document.querySelectorAll('.pv-v').forEach(x=>x.hidden=x.dataset.v!==v);window.scrollTo(0,0);}
document.querySelectorAll('.pv-tabs .fq-view,.gi-go').forEach(b=>b.onclick=()=>montrer(b.dataset.v));
// Face ID
const fe=id=>document.getElementById(id);
fe('fid-go').onclick=()=>{fe('fid-face').hidden=false;setTimeout(()=>{fe('fid-face').hidden=true;fe('fid-ok').hidden=false;},1300);};
fe('fid-mdp').onclick=()=>fe('fid-mdpbox').hidden=!fe('fid-mdpbox').hidden;
// photos du colis
const PH={contenu:document.querySelector('.cl-slot[data-k=contenu] img')?.src};
const SRC={ferme:'__FERME__',etiq:'__ETIQ__',contenu:PH.contenu};
let nb=1;const H={contenu:'16:02',ferme:'16:04',etiq:'16:05'};
document.querySelectorAll('.cl-take').forEach(b=>b.onclick=()=>{const s=b.closest('.cl-slot');const k=s.dataset.k;
 if(!s.classList.contains('pris')){nb++;}
 s.classList.add('pris');s.querySelector('.cl-img').innerHTML='<img src="'+SRC[k]+'" alt="">';
 s.querySelector('.cl-h').textContent='15/11/2026 · '+H[k]+' · empreinte '+Math.random().toString(16).slice(2,14);
 b.classList.remove('pri');b.innerHTML='Reprendre';
 const st=fe('cl-state'),pill=fe('cl-pill');
 if(nb>=3){st.textContent='3 photos sur 3 · colis prouvé, prêt à expédier.';st.classList.add('ok');pill.textContent='📷 3 / 3 photos du colis ✓';pill.classList.add('ok');}
 else{st.textContent=nb+' photos sur 3';pill.textContent='📷 '+nb+' / 3 photos du colis';}});
// preuve
fe('pv-make').onclick=()=>{fe('pv-made').textContent='Fabriqué : preuve-06W69SNX.pdf · 1,6 Mo · 2 pages · prêt à joindre au litige';};
// compta
document.querySelectorAll('.cp-tabs .fq-chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.cp-tabs .fq-chip').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.cp-v').forEach(v=>v.hidden=v.dataset.c!==b.dataset.c);});
fe('ur-copy').onclick=()=>{try{navigator.clipboard.writeText('3912,40').catch(()=>{});}catch(e){}fe('ur-copy').textContent='Copié : 3 912,40 €';};
'''
JS = JS.replace("__FERME__", PH_FERME).replace("__ETIQ__", PH_ETIQ)

html = shell(title="Niv Admin et compta", crumb="Niv Admin · maquette", subtab="File de production",
             css_site_txt=css_site(css_dir), css=CSS, body=BODY, js=JS)
open(sortie, "w", encoding="utf-8").write(html)
print("écrit", sortie, len(html) // 1024, "Ko")
