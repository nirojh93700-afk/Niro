#!/usr/bin/env python3
"""PDF : toutes les dépenses et tous les remboursements du carnet, avec le taux de chacun.

Lecture seule — ne modifie ni le carnet en ligne ni l'appli.
  python3 rapport-taux.py
"""
import json, datetime, os, subprocess, urllib.request, html

URL = ("https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app"
       "/carnets/inde26-4h7k2p.json")
ICI = os.path.dirname(os.path.abspath(__file__))
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SYM = {"EUR": "€", "INR": "₹", "USD": "$", "QAR": "QAR", "AED": "AED", "CHF": "CHF", "GBP": "£"}
CAT = {"hotel": "Hôtel", "food": "Restaurant", "tips": "Pourboires", "activity": "Activités",
       "transport": "Transport", "coffee": "Café / snacks", "driver": "Chauffeur", "other": "Autres"}

with urllib.request.urlopen(URL, timeout=30) as r:
    d = json.load(r)

DEL, UND = d.get("delAt") or {}, d.get("undelAt") or {}
def supprime(i):
    return (int(DEL.get(i, 0)) or (1 if i in (d.get("deleted") or []) else 0)) > int(UND.get(i, 0))

def jour(rec):
    return datetime.datetime.fromtimestamp((rec.get("ts") or 0) / 1000, IST)

def nb(v, dec=2):
    s = ("%,.*f" % (dec, v)).replace(",", " ").replace(".", ",") if False else f"{v:,.{dec}f}"
    return s.replace(",", " ").replace(".", ",")

def taux_de(rec):
    """taux réellement appliqué à cette ligne, ou None si saisie en euros"""
    cur = rec.get("cur") or "EUR"
    a, e = float(rec.get("amount") or 0), float(rec.get("eur") or 0)
    if cur == "EUR" or not (a > 0 and e > 0):
        return None
    return a / e

exp = sorted([x for x in d["expenses"] if not supprime(x.get("id", ""))],
             key=lambda x: (x.get("ts") or 0, x.get("label") or ""))
pay = sorted([p for p in (d.get("payments") or []) if not supprime("P:" + str(p.get("id", "")))],
             key=lambda p: p.get("ts") or 0)

# ---- récapitulatif par taux ----
paliers = {}
for x in exp:
    t = taux_de(x)
    cle = round(t, 2) if t else "eur"
    g = paliers.setdefault(cle, {"n": 0, "eur": 0.0, "dev": 0.0, "d1": None, "d2": None})
    g["n"] += 1; g["eur"] += float(x.get("eur") or 0); g["dev"] += float(x.get("amount") or 0)
    j = jour(x).date()
    g["d1"] = j if g["d1"] is None or j < g["d1"] else g["d1"]
    g["d2"] = j if g["d2"] is None or j > g["d2"] else g["d2"]

tot_exp = sum(float(x.get("eur") or 0) for x in exp)
tot_pay = sum(float(p.get("eur") or 0) for p in pay)

def ligne_recap(cle, g):
    if cle == "eur":
        libelle, dev = "Saisies directement en euros", "—"
    else:
        libelle, dev = f"1 € = {nb(cle)} ₹", f"{nb(g['dev'], 0)} ₹"
    per = f"{g['d1']:%d/%m}" + (f" → {g['d2']:%d/%m}" if g["d1"] != g["d2"] else "")
    return (f"<tr><td class='r'><b>{libelle}</b></td><td class='c'>{per}</td>"
            f"<td class='c'>{g['n']}</td><td class='n'>{dev}</td>"
            f"<td class='n'><b>{nb(g['eur'])} €</b></td></tr>")

ordre = sorted([k for k in paliers if k != "eur"]) + (["eur"] if "eur" in paliers else [])
recap = "".join(ligne_recap(k, paliers[k]) for k in ordre)

# ---- tableau des dépenses ----
lignes, jour_prec = [], None
for x in exp:
    j = jour(x)
    t = taux_de(x)
    cur = x.get("cur") or "EUR"
    sep = " sep" if jour_prec and j.date() != jour_prec else ""
    jour_prec = j.date()
    montant = f"{nb(float(x.get('amount') or 0), 0 if cur == 'INR' else 2)} {SYM.get(cur, cur)}"
    cell_taux = (f"<span class='tx'>{nb(t)}</span>" if t else "<span class='eu'>en €</span>")
    lignes.append(
        f"<tr class='{sep.strip()}'><td class='c'>{j:%d/%m}</td>"
        f"<td>{html.escape(x.get('label') or x.get('hotel') or '—')}</td>"
        f"<td class='cat'>{CAT.get(x.get('cat'), x.get('cat') or '')}</td>"
        f"<td class='n'>{montant}</td><td class='c'>{cell_taux}</td>"
        f"<td class='n'><b>{nb(float(x.get('eur') or 0))} €</b></td>"
        f"<td class='qui'>{html.escape(x.get('who') or '')}</td></tr>")

# ---- tableau des remboursements ----
lp = []
for p in pay:
    t = taux_de(p)
    cur = p.get("cur") or "EUR"
    a = float(p.get("amount") or 0)
    montant = f"{nb(a, 0 if cur == 'INR' else 2)} {SYM.get(cur, cur)}" if a > 0 else "—"
    cell_taux = (f"<span class='tx'>{nb(t)}</span>" if t else "<span class='eu'>en €</span>")
    lp.append(f"<tr><td class='c'>{jour(p):%d/%m}</td><td>{html.escape(p.get('from') or '?')}</td>"
              f"<td class='cat'>vers {html.escape(p.get('to') or '?')}</td>"
              f"<td class='n'>{montant}</td><td class='c'>{cell_taux}</td>"
              f"<td class='n'><b>{nb(float(p.get('eur') or 0))} €</b></td><td class='qui'></td></tr>")

maintenant = datetime.datetime.now(IST)
doc = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Dépenses et taux</title>
<style>
  @page {{ size:A4; margin:14mm 12mm 16mm; }}
  * {{ box-sizing:border-box; }}
  body {{ font:11px/1.45 "DejaVu Sans",system-ui,sans-serif; color:#16211f; margin:0; }}
  h1 {{ font-size:20px; margin:0 0 2px; color:#0d3b39; letter-spacing:-.2px; }}
  h2 {{ font-size:13px; margin:22px 0 7px; color:#0d3b39; padding-bottom:4px;
        border-bottom:2px solid #c9a24b; page-break-after:avoid; }}
  .sub {{ color:#6b7a77; font-size:10.5px; margin-bottom:14px; }}
  .kpis {{ display:flex; gap:8px; margin:12px 0 4px; }}
  .kpi {{ flex:1; border:1px solid #dfe6e3; border-left:3px solid #c9a24b; border-radius:6px;
          padding:7px 9px; background:#fbfaf6; }}
  .kpi span {{ display:block; font-size:9px; color:#6b7a77; text-transform:uppercase;
               letter-spacing:.5px; }}
  .kpi b {{ font-size:15px; color:#0d3b39; }}
  table {{ width:100%; border-collapse:collapse; }}
  th {{ font-size:8.5px; text-transform:uppercase; letter-spacing:.5px; color:#6b7a77;
        text-align:left; padding:0 5px 4px; border-bottom:1px solid #c9d4d0; }}
  td {{ padding:3.5px 5px; border-bottom:1px solid #eef2f1; vertical-align:top; }}
  tr.sep td {{ border-top:1px solid #dfe6e3; }}
  .n {{ text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }}
  .c {{ text-align:center; white-space:nowrap; }}
  .r {{ white-space:nowrap; }}
  .cat, .qui {{ color:#6b7a77; font-size:10px; }}
  .tx {{ font-variant-numeric:tabular-nums; font-weight:700; color:#8a6a1f;
         background:#f7efd9; border-radius:4px; padding:1px 5px; }}
  .eu {{ color:#9aa8a5; font-size:9.5px; }}
  tbody tr {{ page-break-inside:avoid; }}
  .note {{ color:#6b7a77; font-size:9.5px; margin-top:8px; font-style:italic; }}
  .tot td {{ border-top:2px solid #0d3b39; border-bottom:none; padding-top:6px;
             font-size:12px; color:#0d3b39; }}
</style></head><body>

<h1>Dépenses et taux de change</h1>
<div class="sub">Voyage Inde du Sud — carnet <b>inde26-4h7k2p</b> · arrêté au
  {maintenant:%d/%m/%Y à %Hh%M} (heure de l'Inde)</div>

<div class="kpis">
  <div class="kpi"><span>Total dépensé</span><b>{nb(tot_exp)} €</b></div>
  <div class="kpi"><span>Dépenses</span><b>{len(exp)}</b></div>
  <div class="kpi"><span>Remboursé</span><b>{nb(tot_pay)} €</b></div>
  <div class="kpi"><span>Taux différents</span><b>{len([k for k in paliers if k != 'eur'])}</b></div>
</div>

<h2>Les taux utilisés dans le carnet</h2>
<table><thead><tr><th>Taux</th><th class="c">Période</th><th class="c">Lignes</th>
  <th class="n">Montant en devise</th><th class="n">En euros</th></tr></thead>
<tbody>{recap}
<tr class="tot"><td colspan="4"><b>Total</b></td><td class="n"><b>{nb(tot_exp)} €</b></td></tr>
</tbody></table>
<div class="note">Chaque dépense garde le taux qui avait cours au moment où elle a été
  enregistrée : c'est normal d'en voir plusieurs.</div>

<h2>Toutes les dépenses ({len(exp)})</h2>
<table><thead><tr><th class="c">Date</th><th>Libellé</th><th>Catégorie</th>
  <th class="n">Montant saisi</th><th class="c">Taux</th><th class="n">En euros</th>
  <th>Payé par</th></tr></thead>
<tbody>{''.join(lignes)}
<tr class="tot"><td colspan="5"><b>Total des dépenses</b></td>
  <td class="n"><b>{nb(tot_exp)} €</b></td><td></td></tr>
</tbody></table>

<h2>Les remboursements ({len(pay)})</h2>
<table><thead><tr><th class="c">Date</th><th>De</th><th></th>
  <th class="n">Montant saisi</th><th class="c">Taux</th><th class="n">En euros</th>
  <th></th></tr></thead>
<tbody>{''.join(lp)}
<tr class="tot"><td colspan="5"><b>Total remboursé</b></td>
  <td class="n"><b>{nb(tot_pay)} €</b></td><td></td></tr>
</tbody></table>
<div class="note">« en € » = la somme a été saisie directement en euros, aucun taux n'intervient.</div>

</body></html>"""

hp = os.path.join(ICI, "depenses-et-taux.html")
open(hp, "w", encoding="utf-8").write(doc)
pdf = os.path.join(ICI, "depenses-et-taux.pdf")
subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                "--no-pdf-header-footer", f"--print-to-pdf={pdf}", "file://" + hp],
               check=True, capture_output=True)
print("PDF : %s (%.0f Ko)" % (pdf, os.path.getsize(pdf) / 1024))
print("%d dépenses · %d remboursements · %d taux différents"
      % (len(exp), len(pay), len([k for k in paliers if k != "eur"])))
