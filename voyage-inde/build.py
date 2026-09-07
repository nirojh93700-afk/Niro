# -*- coding: utf-8 -*-
"""Génère le rapport HTML détaillé du carnet Voyage Inde du Sud."""
import json, datetime, html
from collections import defaultdict

D = json.load(open('carnet.json', encoding='utf-8'))
PEOPLE = D['people']
PARTS = D.get('partShares') or {}
EXP = D['expenses']
PAYS = D.get('payments') or []
TAUX = 113.20   # taux fixe demandé

def sh(p):
    try: n = float(PARTS.get(p, 1) or 1)
    except Exception: n = 1
    return n if n > 0 else 1

def owed(x, person):
    sp = x.get('split') or {}
    mode = sp.get('mode', 'equal')
    if mode in (None, 'equal'):
        among = sp.get('among') or PEOPLE
        if person not in among: return 0.0
        tot = sum(sh(p) for p in among)
        return x['eur'] * sh(person) / tot if tot > 0 else 0.0
    if mode == 'exact':
        return float((sp.get('amounts') or {}).get(person, 0) or 0)
    if mode == 'shares':
        s = sp.get('shares') or {}
        tot = sum(float(v or 0) for v in s.values())
        return x['eur'] * float(s.get(person, 0) or 0) / tot if tot > 0 else 0.0
    return 0.0

def concerned(x):
    sp = x.get('split') or {}
    mode = sp.get('mode', 'equal')
    if mode == 'exact':  return [p for p in PEOPLE if float((sp.get('amounts') or {}).get(p,0) or 0) > 0]
    if mode == 'shares': return [p for p in PEOPLE if float((sp.get('shares') or {}).get(p,0) or 0) > 0]
    return sp.get('among') or PEOPLE

def e(v):   # euros
    return ('%.2f' % v).replace('.', ',') + ' €'
def r(v):   # roupies / devise d'origine
    return ('%.0f' % v).replace(',', ' ') if abs(v - round(v)) < .005 else ('%.2f' % v).replace('.', ',')
def dt(ts):
    return datetime.datetime.fromtimestamp((ts or 0)/1000).strftime('%d/%m/%Y')
def esc(s): return html.escape(str(s or ''))

CATLBL = {'hotel':'Hôtel','driver':'Chauffeur','transport':'Transport','food':'Restaurant',
          'flight':'Vol','activity':'Activités','shopping':'Shopping','other':'Autres'}
CATICO = {'hotel':'🏨','driver':'🛣️','transport':'🚗','food':'🍽️','other':'📌'}
COLORS = ['#f0b429','#2ec4b6','#e07a5f','#7dd3fc','#c084fc','#86efac']
def col(p):
    i = PEOPLE.index(p) if p in PEOPLE else 0
    return COLORS[i % len(COLORS)]

TOTAL = sum(float(x.get('eur') or 0) for x in EXP)

# ---------- bilan par personne ----------
bilan = {}
for p in PEOPLE:
    paid = sum(float(x.get('eur') or 0) for x in EXP if x.get('who') == p)
    part = sum(owed(x, p) for x in EXP)
    remb = sum(float(q['eur']) for q in PAYS if q.get('from') == p)
    recu = sum(float(q['eur']) for q in PAYS if q.get('to') == p)
    bilan[p] = dict(paid=paid, part=part, remb=remb, recu=recu, solde=part - paid - remb + recu)

# ---------- qui doit à qui (glouton) ----------
deb = sorted([(p, b['solde']) for p, b in bilan.items() if b['solde'] > 0.005], key=lambda t: -t[1])
cre = sorted([(p, -b['solde']) for p, b in bilan.items() if b['solde'] < -0.005], key=lambda t: -t[1])
transf, di, ci = [], 0, 0
deb = [list(t) for t in deb]; cre = [list(t) for t in cre]
while di < len(deb) and ci < len(cre):
    m = min(deb[di][1], cre[ci][1])
    if m > 0.005: transf.append((deb[di][0], cre[ci][0], m))
    deb[di][1] -= m; cre[ci][1] -= m
    if deb[di][1] <= 0.005: di += 1
    if cre[ci][1] <= 0.005: ci += 1

# ---------- hôtels ----------
hot = defaultdict(list)
for x in EXP:
    if x.get('cat') == 'hotel':
        hot[x.get('hotel') or x.get('label') or '?'].append(x)
hot_sorted = sorted(hot.items(), key=lambda kv: min(y.get('ts') or 0 for y in kv[1]))

P = []
A = P.append
A('<!doctype html><meta charset="utf-8"><title>Carnet Voyage Inde du Sud</title>')
A('''<style>
@page{size:A4;margin:14mm 12mm}
*{box-sizing:border-box}
body{font:12px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#16241f;margin:0}
h1{font-size:23px;margin:0 0 3px;color:#0e3b3a;letter-spacing:-.3px}
h2{font-size:15px;margin:22px 0 9px;color:#0e3b3a;border-bottom:2.5px solid #f0b429;padding-bottom:5px;page-break-after:avoid}
h3{font-size:12.5px;margin:14px 0 6px;color:#0e3b3a;page-break-after:avoid}
.sub{color:#5d6b66;font-size:11px}
table{width:100%;border-collapse:collapse;margin:6px 0 2px;font-size:11px}
th{text-align:left;font-weight:600;color:#5d6b66;border-bottom:1px solid #cfd8d4;padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.3px}
td{padding:5px 6px;border-bottom:1px solid #eceff0;vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr.tot td{border-top:2px solid #0e3b3a;border-bottom:none;font-weight:700;padding-top:7px}
.card{border:1px solid #d7dedb;border-radius:9px;padding:10px 12px;margin:9px 0;page-break-inside:avoid}
.card.h{border-left:4px solid #f0b429}
.badge{display:inline-block;background:#f3f6f5;border-radius:20px;padding:2px 9px;font-size:10px;color:#42514c;margin-right:4px}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.pos{color:#c0392b;font-weight:700}.neg{color:#0f8b7e;font-weight:700}
.muted{color:#7b8781}
.head{border-bottom:3px solid #0e3b3a;padding-bottom:11px;margin-bottom:6px}
.kpi{display:flex;gap:9px;margin:11px 0 4px}
.kpi div{flex:1;border:1px solid #d7dedb;border-radius:9px;padding:8px 10px}
.kpi b{display:block;font-size:17px;color:#0e3b3a}
.kpi span{font-size:9.5px;color:#5d6b66;text-transform:uppercase;letter-spacing:.4px}
.note{background:#fbf7ec;border-left:3px solid #f0b429;padding:7px 10px;border-radius:0 7px 7px 0;font-size:10.5px;margin:8px 0}
.pg{page-break-before:always}
</style>''')

# En-tête
A('<div class="head"><h1>Carnet de dépenses — Voyage Inde du Sud</h1>')
A('<div class="sub">3 → 21 septembre 2026 &nbsp;·&nbsp; %d participants &nbsp;·&nbsp; document établi le %s</div></div>'
  % (len(PEOPLE), datetime.datetime.now().strftime('%d/%m/%Y')))
A('<div class="kpi"><div><span>Total dépensé</span><b>%s</b></div>'
  '<div><span>Nombre de dépenses</span><b>%d</b></div>'
  '<div><span>Taux appliqué</span><b>1 € = %s ₹</b></div></div>'
  % (e(TOTAL), len(EXP), r(TAUX)))

# Participants
A('<h2>Participants</h2><table><tr><th>Nom</th><th class="n">Parts</th><th class="n">A payé</th>'
  '<th class="n">Sa part</th><th class="n">Solde</th></tr>')
for p in PEOPLE:
    b = bilan[p]
    s = b['solde']
    cls = 'pos' if s > 0.005 else ('neg' if s < -0.005 else 'muted')
    txt = ('doit ' + e(s)) if s > 0.005 else (('à recevoir ' + e(-s)) if s < -0.005 else 'à jour')
    A('<tr><td><span class="dot" style="background:%s"></span><b>%s</b>%s</td><td class="n">%d</td>'
      '<td class="n">%s</td><td class="n">%s</td><td class="n %s">%s</td></tr>'
      % (col(p), esc(p), ' <span class="badge">couple</span>' if sh(p) >= 2 else '',
         int(sh(p)), e(b['paid']), e(b['part']), cls, txt))
A('<tr class="tot"><td>TOTAL</td><td class="n">%d</td><td class="n">%s</td><td class="n">%s</td><td></td></tr></table>'
  % (int(sum(sh(p) for p in PEOPLE)), e(sum(b['paid'] for b in bilan.values())), e(sum(b['part'] for b in bilan.values()))))
A('<div class="note"><b>Parts :</b> un couple compte 2 parts, une personne seule 1 part. '
  'Les dépenses communes sont partagées au prorata des parts.</div>')

# Résumé par catégorie
A('<h2>Résumé par catégorie</h2><table><tr><th>Catégorie</th><th class="n">Nb</th><th class="n">Montant</th><th class="n">%</th></tr>')
bycat = defaultdict(lambda: [0, 0.0])
for x in EXP:
    c = x.get('cat') or 'other'
    bycat[c][0] += 1; bycat[c][1] += float(x.get('eur') or 0)
for c, (n, t) in sorted(bycat.items(), key=lambda kv: -kv[1][1]):
    A('<tr><td>%s %s</td><td class="n">%d</td><td class="n">%s</td><td class="n muted">%.0f %%</td></tr>'
      % (CATICO.get(c, '📌'), CATLBL.get(c, c), n, e(t), 100*t/TOTAL if TOTAL else 0))
A('<tr class="tot"><td>TOTAL</td><td class="n">%d</td><td class="n">%s</td><td class="n">100 %%</td></tr></table>' % (len(EXP), e(TOTAL)))

# ---------- CHAUFFEUR ----------
A('<h2>Le chauffeur — détail</h2>')
if not any(x.get('cat') == 'driver' for x in EXP):
    A('<div class="note"><b>Aucun chauffeur enregistré dans le carnet.</b> La dépense « Chauffeur » a été '
      'supprimée depuis l\'application. Elle n\'est donc comptée dans aucun total de ce document, '
      'et n\'entre pas dans ce que chacun doit.</div>')
for x in EXP:
    if x.get('cat') != 'driver': continue
    dp = x.get('dp') or {}
    d_, a_, b_, s_ = dp.get('d', 0), dp.get('a', 0), dp.get('b', 0), dp.get('s', 0)
    cur = x.get('cur', 'INR')
    A('<div class="card h"><h3>%s</h3>' % esc(x.get('label') or 'Chauffeur'))
    A('<div class="sub">Payé par <b>%s</b> le %s</div>' % (esc(x.get('who')), dt(x.get('ts'))))
    if d_:
        A('<table><tr><th>Élément</th><th class="n">Détail</th><th class="n">Montant</th></tr>')
        A('<tr><td>Forfait par jour</td><td class="n muted">%s ₹ × %d j</td><td class="n">%s ₹</td></tr>' % (r(a_), d_, r(a_*d_)))
        A('<tr><td>Forfait kilomètres par jour</td><td class="n muted">%s ₹ × %d j</td><td class="n">%s ₹</td></tr>' % (r(b_), d_, r(b_*d_)))
        if s_: A('<tr><td>Supplément km en plus</td><td class="n muted">—</td><td class="n">%s ₹</td></tr>' % r(s_))
        A('<tr class="tot"><td>TOTAL CHAUFFEUR</td><td class="n muted">%d jours</td><td class="n">%s ₹</td></tr></table>' % (d_, r(x['amount'])))
    else:
        A('<table><tr class="tot"><td>TOTAL CHAUFFEUR</td><td class="n">%s %s</td></tr></table>' % (r(x['amount']), cur))
    A('<div class="sub" style="margin-top:6px">Soit <b>%s</b> — réparti entre %d personnes :</div>' % (e(x['eur']), len(concerned(x))))
    A('<table><tr><th>Personne</th><th class="n">Parts</th><th class="n">Sa part du chauffeur</th></tr>')
    for p in PEOPLE:
        v = owed(x, p)
        A('<tr><td><span class="dot" style="background:%s"></span>%s</td><td class="n">%s</td><td class="n">%s</td></tr>'
          % (col(p), esc(p), int(sh(p)) if v > 0 else '—', e(v) if v > 0 else '<span class="muted">non concerné</span>'))
    A('<tr class="tot"><td>TOTAL</td><td></td><td class="n">%s</td></tr></table></div>' % e(x['eur']))

# ---------- HÔTELS ----------
A('<div class="pg"></div><h2>Les hôtels — détail par établissement</h2>')
thot = sum(float(x.get('eur') or 0) for x in EXP if x.get('cat') == 'hotel')
tnights = 0
for name, rooms in hot_sorted:
    ts = min(y.get('ts') or 0 for y in rooms)
    nights = max((y.get('nights') or 0) for y in rooms)
    tnights += nights
    bf = any(y.get('bf') for y in rooms)
    tot = sum(float(y.get('eur') or 0) for y in rooms)
    paid = next((y.get('paid') for y in rooms if y.get('paid')), None)
    paidCur = next((y.get('paidCur') for y in rooms if y.get('paid')), 'EUR')
    A('<div class="card h"><h3>%s</h3>' % esc(name))
    A('<div class="sub">Arrivée le %s%s%s</div>' % (
        dt(ts), (' · %d nuit%s' % (nights, 's' if nights > 1 else '')) if nights else '',
        ' · 🥐 petit déjeuner inclus' if bf else ''))
    A('<table><tr><th>Chambre</th><th>Pour</th><th class="n">Montant</th></tr>')
    for y in sorted(rooms, key=lambda z: z.get('label') or ''):
        occ = ', '.join(concerned(y)) if (y.get('split') or {}).get('among') else 'tout le monde'
        A('<tr><td>%s</td><td class="muted">%s</td><td class="n">%s%s</td></tr>' % (
            esc(y.get('label') or 'Chambre'), esc(occ), e(float(y.get('eur') or 0)),
            (' <span class="muted">(%s ₹)</span>' % r(y['amount'])) if y.get('cur') == 'INR' else ''))
    A('<tr class="tot"><td colspan="2">Total des chambres</td><td class="n">%s</td></tr>' % e(tot))
    if paid:
        # on convertit le prix payé au MÊME taux que celui des chambres (sinon faux écart)
        amt_same = sum(float(y.get('amount') or 0) for y in rooms if (y.get('cur') or 'EUR') == paidCur)
        eur_same = sum(float(y.get('eur') or 0) for y in rooms if (y.get('cur') or 'EUR') == paidCur)
        taux_h = (amt_same / eur_same) if eur_same > 0 else (TAUX if paidCur == 'INR' else 1)
        pe = float(paid) / taux_h
        ec = pe - tot
        A('<tr><td colspan="2" class="muted">Prix réel payé à l\'hôtel</td><td class="n">%s%s</td></tr>' % (
            e(pe), (' <span class="muted">(%s ₹)</span>' % r(paid)) if paidCur == 'INR' else ''))
        A('<tr><td colspan="2" class="muted">Écart</td><td class="n %s">%s%s</td></tr>' % (
            'pos' if ec > 0.005 else 'neg', '+' if ec > 0 else '', e(ec)))
    A('</table></div>')
A('<table><tr class="tot"><td>TOTAL HÔTELS — %d établissements, %d nuits</td><td class="n">%s</td></tr></table>'
  % (len(hot_sorted), tnights, e(thot)))

# ---------- AUTRES DÉPENSES ----------
A('<div class="pg"></div><h2>Restaurants, transports et autres dépenses</h2>')
for c in ['food', 'transport', 'flight', 'activity', 'shopping', 'other']:
    rows = sorted([x for x in EXP if (x.get('cat') or 'other') == c], key=lambda z: z.get('ts') or 0)
    if not rows: continue
    A('<h3>%s %s</h3><table><tr><th>Date</th><th>Libellé</th><th>Payé par</th><th>Concernés</th>'
      '<th class="n">Saisi</th><th class="n">En €</th></tr>' % (CATICO.get(c, '📌'), CATLBL.get(c, c)))
    for x in rows:
        cc = concerned(x)
        occ = 'tout le monde' if len(cc) == len(PEOPLE) else ', '.join(cc)
        A('<tr><td>%s</td><td>%s</td><td>%s</td><td class="muted" style="font-size:10px">%s</td>'
          '<td class="n muted">%s %s</td><td class="n">%s</td></tr>'
          % (dt(x.get('ts')), esc(x.get('label') or '—'), esc(x.get('who')), esc(occ),
             r(x['amount']), esc(x.get('cur')), e(float(x.get('eur') or 0))))
    A('<tr class="tot"><td colspan="5">Total %s</td><td class="n">%s</td></tr></table>'
      % (CATLBL.get(c, c), e(sum(float(x.get('eur') or 0) for x in rows))))

# ---------- DÉTAIL PAR PERSONNE ----------
A('<div class="pg"></div><h2>Détail par personne</h2>')
for p in PEOPLE:
    b = bilan[p]
    A('<div class="card" style="border-left:4px solid %s"><h3 style="color:%s">%s%s</h3>'
      % (col(p), col(p), esc(p), ' — couple (2 parts)' if sh(p) >= 2 else ' — 1 part'))
    A('<table><tr><th>Catégorie</th><th class="n">Sa part</th></tr>')
    g = defaultdict(float)
    for x in EXP:
        v = owed(x, p)
        if v > 0.005: g[x.get('cat') or 'other'] += v
    for c, v in sorted(g.items(), key=lambda kv: -kv[1]):
        A('<tr><td>%s %s</td><td class="n">%s</td></tr>' % (CATICO.get(c, '📌'), CATLBL.get(c, c), e(v)))
    A('<tr class="tot"><td>Sa part totale du voyage</td><td class="n">%s</td></tr>' % e(b['part']))
    if b['paid'] > 0.005: A('<tr><td class="muted">Déjà payé de sa poche</td><td class="n neg">− %s</td></tr>' % e(b['paid']))
    if b['remb'] > 0.005: A('<tr><td class="muted">Déjà remboursé</td><td class="n neg">− %s</td></tr>' % e(b['remb']))
    if b['recu'] > 0.005: A('<tr><td class="muted">Remboursements reçus</td><td class="n">+ %s</td></tr>' % e(b['recu']))
    s = b['solde']
    lbl = 'RESTE À PAYER' if s > 0.005 else ('À RECEVOIR' if s < -0.005 else 'À JOUR')
    A('<tr class="tot"><td>%s</td><td class="n %s">%s</td></tr></table></div>'
      % (lbl, 'pos' if s > 0.005 else 'neg', e(abs(s)) if abs(s) > 0.005 else '—'))

# ---------- REMBOURSEMENTS ----------
A('<h2>Remboursements déjà enregistrés</h2>')
if PAYS:
    A('<table><tr><th>Date</th><th>De</th><th>Vers</th><th class="n">Montant</th></tr>')
    for q in sorted(PAYS, key=lambda z: z.get('ts') or 0):
        A('<tr><td>%s</td><td>%s</td><td>%s</td><td class="n">%s</td></tr>'
          % (dt(q.get('ts')), esc(q.get('from')), esc(q.get('to')), e(float(q['eur']))))
    A('<tr class="tot"><td colspan="3">TOTAL REMBOURSÉ</td><td class="n">%s</td></tr></table>'
      % e(sum(float(q['eur']) for q in PAYS)))
else:
    A('<p class="muted">Aucun remboursement enregistré.</p>')

# ---------- QUI DOIT À QUI ----------
A('<h2>Qui doit combien à qui</h2>')
if transf:
    A('<table><tr><th>De</th><th>Vers</th><th class="n">Montant à régler</th></tr>')
    for f, t, m in transf:
        A('<tr><td><span class="dot" style="background:%s"></span><b>%s</b></td>'
          '<td><span class="dot" style="background:%s"></span><b>%s</b></td><td class="n pos">%s</td></tr>'
          % (col(f), esc(f), col(t), esc(t), e(m)))
    A('<tr class="tot"><td colspan="2">TOTAL RESTANT</td><td class="n">%s</td></tr></table>'
      % e(sum(m for _, _, m in transf)))
else:
    A('<p class="neg">Tout le monde est à jour.</p>')

A('<div class="note" style="margin-top:16px">Document généré depuis l\'application '
  '<b>voyage-inde-sud.surge.sh</b> — carnet synchronisé, dernière mise à jour le %s.</div>'
  % datetime.datetime.fromtimestamp(D['updatedAt']/1000).strftime('%d/%m/%Y à %H:%M'))

open('rapport.html', 'w', encoding='utf-8').write('\n'.join(P))
print('HTML généré — total %.2f €, %d dépenses, %d hôtels' % (TOTAL, len(EXP), len(hot_sorted)))
