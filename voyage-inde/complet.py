# -*- coding: utf-8 -*-
"""Document unique : dépenses + historique complet des paiements. Heures = INDE (IST)."""
import json, datetime, os, html
from datetime import timezone, timedelta
from collections import defaultdict

IST = timezone(timedelta(hours=5, minutes=30))          # heure de l'Inde
esc = lambda s: html.escape(str(s or ''))

D = json.load(open('carnet.json', encoding='utf-8'))
PEOPLE, PARTS, EXP, PAYS = D['people'], (D.get('partShares') or {}), D['expenses'], (D.get('payments') or [])
TAUX = 113.20

SNAPS = ['/tmp/carnet.json', '/tmp/c.json', '/tmp/c2.json', 'carnet.json']
pay_seen, exp_seen = {}, {}
for path in SNAPS:
    if not os.path.exists(path) or os.path.getsize(path) == 0: continue
    s = json.load(open(path, encoding='utf-8'))
    for p in (s.get('payments') or []): pay_seen.setdefault(p['id'], p)
    for x in (s.get('expenses') or []): exp_seen.setdefault(x['id'], x)
pay_act = {p['id'] for p in PAYS}
exp_tomb = [t for t in (D.get('deleted') or []) if not t.startswith(('P:', 'H:'))]

def sh(p):
    try: n = float(PARTS.get(p, 1) or 1)
    except Exception: n = 1
    return n if n > 0 else 1

def owed(x, person):
    sp = x.get('split') or {}; mode = sp.get('mode', 'equal')
    if mode in (None, 'equal'):
        among = sp.get('among') or PEOPLE
        if person not in among: return 0.0
        tot = sum(sh(p) for p in among)
        return x['eur'] * sh(person) / tot if tot > 0 else 0.0
    if mode == 'exact':  return float((sp.get('amounts') or {}).get(person, 0) or 0)
    if mode == 'shares':
        s = sp.get('shares') or {}; tot = sum(float(v or 0) for v in s.values())
        return x['eur'] * float(s.get(person, 0) or 0) / tot if tot > 0 else 0.0
    return 0.0

def conc(x):
    sp = x.get('split') or {}; m = sp.get('mode', 'equal')
    if m == 'exact':  return [p for p in PEOPLE if float((sp.get('amounts') or {}).get(p,0) or 0) > 0]
    if m == 'shares': return [p for p in PEOPLE if float((sp.get('shares') or {}).get(p,0) or 0) > 0]
    return sp.get('among') or PEOPLE

def e(v): return ('%.2f' % v).replace('.', ',') + ' €'
def r(v): return ('%.0f' % v) if abs(v - round(v)) < .005 else ('%.2f' % v).replace('.', ',')
def D_(ts): return datetime.datetime.fromtimestamp((ts or 0)/1000, IST).strftime('%d/%m/%Y')
def DH(ts): return datetime.datetime.fromtimestamp((ts or 0)/1000, IST).strftime('%d/%m à %Hh%M')
def DHL(ts): return datetime.datetime.fromtimestamp((ts or 0)/1000, IST).strftime('%d/%m/%Y à %Hh%M')

CATLBL = {'hotel':'Hôtel','driver':'Chauffeur','transport':'Transport','food':'Restaurant','other':'Autres'}
CATICO = {'hotel':'🏨','driver':'🛣️','transport':'🚗','food':'🍽️','other':'📌'}
COLORS = ['#f0b429','#2ec4b6','#e07a5f','#7dd3fc','#c084fc']
def col(p): return COLORS[(PEOPLE.index(p) if p in PEOPLE else 0) % len(COLORS)]

TOTAL = sum(float(x.get('eur') or 0) for x in EXP)
bilan = {}
for p in PEOPLE:
    paid = sum(float(x.get('eur') or 0) for x in EXP if x.get('who') == p)
    part = sum(owed(x, p) for x in EXP)
    rb = sum(float(q['eur']) for q in PAYS if q.get('from') == p)
    rc = sum(float(q['eur']) for q in PAYS if q.get('to') == p)
    bilan[p] = dict(paid=paid, part=part, rb=rb, rc=rc, solde=part - paid - rb + rc)

deb = [[p, b['solde']] for p, b in bilan.items() if b['solde'] > 0.005]
cre = [[p, -b['solde']] for p, b in bilan.items() if b['solde'] < -0.005]
deb.sort(key=lambda t: -t[1]); cre.sort(key=lambda t: -t[1])
transf, i, j = [], 0, 0
while i < len(deb) and j < len(cre):
    m = min(deb[i][1], cre[j][1])
    if m > 0.005: transf.append((deb[i][0], cre[j][0], m))
    deb[i][1] -= m; cre[j][1] -= m
    if deb[i][1] <= 0.005: i += 1
    if cre[j][1] <= 0.005: j += 1

hot = defaultdict(list)
for x in EXP:
    if x.get('cat') == 'hotel': hot[x.get('hotel') or x.get('label') or '?'].append(x)
hot_s = sorted(hot.items(), key=lambda kv: min(y.get('ts') or 0 for y in kv[1]))

P = []; A = P.append
A('<!doctype html><meta charset="utf-8"><title>Carnet complet — Voyage Inde du Sud</title>')
A('''<style>
@page{size:A4;margin:14mm 12mm}
*{box-sizing:border-box}
body{font:12px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#16241f;margin:0}
h1{font-size:23px;margin:0 0 3px;color:#0e3b3a}
h2{font-size:15px;margin:22px 0 9px;color:#0e3b3a;border-bottom:2.5px solid #f0b429;padding-bottom:5px;page-break-after:avoid}
h3{font-size:12.5px;margin:14px 0 6px;color:#0e3b3a;page-break-after:avoid}
.sub{color:#5d6b66;font-size:11px}
table{width:100%;border-collapse:collapse;margin:6px 0;font-size:11px}
th{text-align:left;font-weight:600;color:#5d6b66;border-bottom:1px solid #cfd8d4;padding:5px 6px;font-size:10px;text-transform:uppercase}
td{padding:5px 6px;border-bottom:1px solid #eceff0;vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr.tot td{border-top:2px solid #0e3b3a;border-bottom:none;font-weight:700;padding-top:7px}
tr.del td{color:#9aa5a0;text-decoration:line-through}
tr.del td.tag{text-decoration:none}
.tag{font-size:9.5px;padding:1px 7px;border-radius:20px;white-space:nowrap}
.ok{background:#e6f5f1;color:#0f8b7e}.no{background:#fdecea;color:#c0392b}
.card{border:1px solid #d7dedb;border-radius:9px;padding:10px 12px;margin:9px 0;page-break-inside:avoid}
.card.h{border-left:4px solid #f0b429}
.badge{display:inline-block;background:#f3f6f5;border-radius:20px;padding:2px 9px;font-size:10px;color:#42514c}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.pos{color:#c0392b;font-weight:700}.neg{color:#0f8b7e;font-weight:700}
.muted{color:#7b8781}
.head{border-bottom:3px solid #0e3b3a;padding-bottom:11px;margin-bottom:6px}
.kpi{display:flex;gap:9px;margin:11px 0}
.kpi div{flex:1;border:1px solid #d7dedb;border-radius:9px;padding:8px 10px}
.kpi b{display:block;font-size:17px;color:#0e3b3a}
.kpi span{font-size:9.5px;color:#5d6b66;text-transform:uppercase}
.note{background:#fbf7ec;border-left:3px solid #f0b429;padding:7px 10px;border-radius:0 7px 7px 0;font-size:10.5px;margin:8px 0}
.pg{page-break-before:always}
</style>''')

A('<div class="head"><h1>Carnet complet — Voyage Inde du Sud</h1>')
A('<div class="sub">Dépenses et historique des paiements &nbsp;·&nbsp; arrêté au <b>%s</b> &nbsp;·&nbsp; '
  '<b>toutes les heures sont en heure de l\'Inde (IST)</b></div></div>' % DHL(D['updatedAt']))
A('<div class="kpi"><div><span>Total dépensé</span><b>%s</b></div>'
  '<div><span>Dépenses</span><b>%d</b></div>'
  '<div><span>Déjà remboursé</span><b>%s</b></div>'
  '<div><span>Taux</span><b>1 € = %s ₹</b></div></div>'
  % (e(TOTAL), len(EXP), e(sum(float(q['eur']) for q in PAYS)), r(TAUX)))

# 1 — PARTICIPANTS
A('<h2>1. Participants et soldes</h2><table><tr><th>Nom</th><th class="n">Parts</th><th class="n">A payé</th>'
  '<th class="n">Sa part</th><th class="n">Remboursé</th><th class="n">Solde</th></tr>')
for p in PEOPLE:
    b = bilan[p]; s = b['solde']
    cls = 'pos' if s > 0.005 else ('neg' if s < -0.005 else 'muted')
    txt = ('doit ' + e(s)) if s > 0.005 else (('à recevoir ' + e(-s)) if s < -0.005 else 'à jour')
    A('<tr><td><span class="dot" style="background:%s"></span><b>%s</b>%s</td><td class="n">%d</td>'
      '<td class="n">%s</td><td class="n">%s</td><td class="n">%s</td><td class="n %s">%s</td></tr>'
      % (col(p), esc(p), ' <span class="badge">couple</span>' if sh(p) >= 2 else '', int(sh(p)),
         e(b['paid']), e(b['part']), e(b['rb']) if b['rb'] > 0.005 else '—', cls, txt))
A('<tr class="tot"><td>TOTAL</td><td class="n">%d</td><td class="n">%s</td><td class="n">%s</td>'
  '<td class="n">%s</td><td></td></tr></table>'
  % (int(sum(sh(p) for p in PEOPLE)), e(sum(b['paid'] for b in bilan.values())),
     e(sum(b['part'] for b in bilan.values())), e(sum(float(q['eur']) for q in PAYS))))

# 2 — HISTORIQUE DES PAIEMENTS
pays_all = sorted(pay_seen.values(), key=lambda p: p.get('ts') or 0)
tot_ok = sum(float(p['eur']) for p in pays_all if p['id'] in pay_act)
A('<h2>2. Historique des remboursements — qui t\'a donné combien</h2>')
A('<table><tr><th>Saisi le (heure Inde)</th><th>Qui a donné</th><th>À qui</th><th class="n">Montant</th><th>État</th></tr>')
for p in pays_all:
    ok = p['id'] in pay_act
    A('<tr class="%s"><td>%s</td><td><span class="dot" style="background:%s"></span>%s</td><td>%s</td>'
      '<td class="n">%s</td><td class="tag"><span class="tag %s">%s</span></td></tr>'
      % ('' if ok else 'del', DHL(p.get('ts')), col(p.get('from')), esc(p.get('from')), esc(p.get('to')),
         e(float(p['eur'])), 'ok' if ok else 'no', 'compté' if ok else 'supprimé'))
A('<tr class="tot"><td colspan="3">TOTAL RÉELLEMENT ENCAISSÉ</td><td class="n">%s</td><td></td></tr></table>' % e(tot_ok))
A('<h3>Total donné par personne</h3><table><tr><th>Personne</th><th class="n">Nb</th><th class="n">Total donné</th><th class="n">Reste à payer</th></tr>')
for q in PEOPLE:
    if q == 'Niv': continue
    lst = [p for p in PAYS if p.get('from') == q]
    tt = sum(float(p['eur']) for p in lst)
    s = bilan[q]['solde']
    A('<tr><td><span class="dot" style="background:%s"></span>%s</td><td class="n">%d</td>'
      '<td class="n">%s</td><td class="n %s">%s</td></tr>'
      % (col(q), esc(q), len(lst), e(tt) if tt > 0 else '<span class="muted">n\'a rien donné</span>',
         'pos' if s > 0.005 else 'neg', e(s) if s > 0.005 else ('à recevoir ' + e(-s)) if s < -0.005 else 'à jour'))
A('</table>')
_sup = [p for p in pays_all if p['id'] not in pay_act]
if _sup:
    for _s in _sup:
        # la saisie conservée la plus proche dans le temps explique le doublon
        _near = min([q for q in pays_all if q['id'] in pay_act],
                    key=lambda q: abs((q.get('ts') or 0) - (_s.get('ts') or 0)), default=None)
        _txt = ('c\'était un doublon : <b>%s</b> a été enregistrée le %s, puis <b>%s</b> le %s — '
                '%d minute(s) après.' % (esc(_s.get('from')), DHL(_s.get('ts')), esc(_near.get('from')),
                                         DHL(_near.get('ts')),
                                         round(abs((_near.get('ts',0)-_s.get('ts',0)))/60000))) if _near else ''
        A('<div class="note">La ligne barrée (<b>%s</b>, %s) a été <b>supprimée depuis l\'application</b> — %s '
          'Elle n\'est comptée nulle part.</div>' % (esc(_s.get('from')), e(float(_s['eur'])), _txt))

# 3 — TOUTES LES DÉPENSES DANS L'ORDRE DE SAISIE
man = sorted([x for x in EXP if x.get('cat') != 'hotel'], key=lambda z: z.get('mt') or z.get('ts') or 0)
A('<div class="pg"></div><h2>3. Tes saisies, dans l\'ordre où tu les as entrées</h2>')
A('<div class="sub" style="margin-bottom:4px">%d dépenses saisies à la main pendant le voyage '
  '(les 36 chambres d\'hôtel, préparées à l\'avance, sont détaillées au chapitre 5).</div>' % len(man))
A('<table><tr><th>Saisi le (Inde)</th><th>Libellé</th><th>Catégorie</th><th>Payé par</th>'
  '<th>Concernés</th><th class="n">Saisi</th><th class="n">En €</th></tr>')
for x in man:
    cc = conc(x); occ = 'tout le monde' if len(cc) == len(PEOPLE) else ', '.join(cc)
    A('<tr><td>%s</td><td>%s</td><td>%s %s</td><td>%s</td><td class="muted" style="font-size:10px">%s</td>'
      '<td class="n muted">%s %s</td><td class="n">%s</td></tr>'
      % (DH(x.get('mt') or x.get('ts')),
         (esc(x['label']) if x.get('label') else '<i class="muted">sans nom</i>'),
         CATICO.get(x.get('cat'), '📌'), CATLBL.get(x.get('cat'), x.get('cat')), esc(x.get('who')),
         esc(occ), r(float(x['amount'])), esc(x.get('cur')), e(float(x['eur']))))
A('<tr class="tot"><td colspan="6">TOTAL DES SAISIES MANUELLES</td><td class="n">%s</td></tr></table>'
  % e(sum(float(x['eur']) for x in man)))

# 4 — RÉSUMÉ CATÉGORIES
A('<h2>4. Résumé par catégorie</h2><table><tr><th>Catégorie</th><th class="n">Nb</th><th class="n">Montant</th><th class="n">%</th></tr>')
bc = defaultdict(lambda: [0, 0.0])
for x in EXP:
    c = x.get('cat') or 'other'; bc[c][0] += 1; bc[c][1] += float(x.get('eur') or 0)
for c, (n, t) in sorted(bc.items(), key=lambda kv: -kv[1][1]):
    A('<tr><td>%s %s</td><td class="n">%d</td><td class="n">%s</td><td class="n muted">%.0f %%</td></tr>'
      % (CATICO.get(c, '📌'), CATLBL.get(c, c), n, e(t), 100*t/TOTAL if TOTAL else 0))
A('<tr class="tot"><td>TOTAL</td><td class="n">%d</td><td class="n">%s</td><td class="n">100 %%</td></tr></table>' % (len(EXP), e(TOTAL)))
if not any(x.get('cat') == 'driver' for x in EXP):
    A('<div class="note"><b>Le chauffeur n\'est plus dans le carnet</b> (supprimé depuis l\'application). '
      'Ses 949,09 € ne sont comptés dans aucun total ci-dessus. Détail conservé : 12 j × 900 ₹ + 12 j × 7 800 ₹ = 104 400 ₹.</div>')

# 5 — HÔTELS
A('<div class="pg"></div><h2>5. Les hôtels, établissement par établissement</h2>')
thot = sum(float(x.get('eur') or 0) for x in EXP if x.get('cat') == 'hotel'); tn = 0
for name, rooms in hot_s:
    ts = min(y.get('ts') or 0 for y in rooms); nights = max((y.get('nights') or 0) for y in rooms); tn += nights
    bf = any(y.get('bf') for y in rooms); tot = sum(float(y.get('eur') or 0) for y in rooms)
    paid = next((y.get('paid') for y in rooms if y.get('paid')), None)
    pc = next((y.get('paidCur') for y in rooms if y.get('paid')), 'EUR')
    A('<div class="card h"><h3>%s</h3><div class="sub">Arrivée le %s%s%s</div>' % (
        esc(name), D_(ts), (' · %d nuit%s' % (nights, 's' if nights > 1 else '')) if nights else '',
        ' · 🥐 petit déjeuner inclus' if bf else ''))
    A('<table><tr><th>Chambre</th><th>Pour</th><th class="n">Montant</th></tr>')
    for y in sorted(rooms, key=lambda z: z.get('label') or ''):
        occ = ', '.join(conc(y)) if (y.get('split') or {}).get('among') else 'tout le monde'
        A('<tr><td>%s</td><td class="muted">%s</td><td class="n">%s%s</td></tr>' % (
            esc(y.get('label') or 'Chambre'), esc(occ), e(float(y.get('eur') or 0)),
            (' <span class="muted">(%s ₹)</span>' % r(y['amount'])) if y.get('cur') == 'INR' else ''))
    A('<tr class="tot"><td colspan="2">Total des chambres</td><td class="n">%s</td></tr>' % e(tot))
    if paid:
        a_s = sum(float(y.get('amount') or 0) for y in rooms if (y.get('cur') or 'EUR') == pc)
        e_s = sum(float(y.get('eur') or 0) for y in rooms if (y.get('cur') or 'EUR') == pc)
        tx = (a_s / e_s) if e_s > 0 else (TAUX if pc == 'INR' else 1)
        pe = float(paid) / tx; ec = pe - tot
        A('<tr><td colspan="2" class="muted">Prix réel payé à l\'hôtel</td><td class="n">%s%s</td></tr>'
          % (e(pe), (' <span class="muted">(%s ₹)</span>' % r(paid)) if pc == 'INR' else ''))
        A('<tr><td colspan="2" class="muted">Écart</td><td class="n %s">%s%s</td></tr>'
          % ('pos' if ec > 0.005 else 'neg', '+' if ec > 0 else '', e(ec)))
    A('</table></div>')
A('<table><tr class="tot"><td>TOTAL HÔTELS — %d établissements, %d nuits</td><td class="n">%s</td></tr></table>'
  % (len(hot_s), tn, e(thot)))

# 6 — DÉTAIL PAR PERSONNE
A('<div class="pg"></div><h2>6. Détail par personne</h2>')
for p in PEOPLE:
    b = bilan[p]
    A('<div class="card" style="border-left:4px solid %s"><h3 style="color:%s">%s — %s</h3>'
      % (col(p), col(p), esc(p), 'couple (2 parts)' if sh(p) >= 2 else '1 part'))
    A('<table><tr><th>Catégorie</th><th class="n">Sa part</th></tr>')
    g = defaultdict(float)
    for x in EXP:
        v = owed(x, p)
        if v > 0.005: g[x.get('cat') or 'other'] += v
    for c, v in sorted(g.items(), key=lambda kv: -kv[1]):
        A('<tr><td>%s %s</td><td class="n">%s</td></tr>' % (CATICO.get(c, '📌'), CATLBL.get(c, c), e(v)))
    A('<tr class="tot"><td>Sa part totale</td><td class="n">%s</td></tr>' % e(b['part']))
    if b['paid'] > 0.005: A('<tr><td class="muted">Déjà payé de sa poche</td><td class="n neg">− %s</td></tr>' % e(b['paid']))
    if b['rb'] > 0.005:  A('<tr><td class="muted">Déjà remboursé</td><td class="n neg">− %s</td></tr>' % e(b['rb']))
    if b['rc'] > 0.005:  A('<tr><td class="muted">Remboursements reçus</td><td class="n">+ %s</td></tr>' % e(b['rc']))
    s = b['solde']
    A('<tr class="tot"><td>%s</td><td class="n %s">%s</td></tr></table></div>'
      % ('RESTE À PAYER' if s > 0.005 else ('À RECEVOIR' if s < -0.005 else 'À JOUR'),
         'pos' if s > 0.005 else 'neg', e(abs(s)) if abs(s) > 0.005 else '—'))

# 7 — SUPPRESSIONS
A('<h2>7. Ce qui a été supprimé</h2><table><tr><th>Date</th><th>Libellé</th><th>Payé par</th><th class="n">Montant</th></tr>')
found = 0
for t in exp_tomb:
    x = exp_seen.get(t)
    if not x: continue
    found += 1
    A('<tr class="del"><td>%s</td><td>%s</td><td>%s</td><td class="n">%s</td></tr>'
      % (D_(x.get('ts')), esc(x.get('label') or x.get('hotel') or 'sans nom'), esc(x.get('who')), e(float(x.get('eur') or 0))))
if not found: A('<tr><td colspan="4" class="muted">Aucun détail récupérable.</td></tr>')
A('</table>')
A('<div class="note">L\'application ne conserve pas le détail des lignes supprimées (seulement leur identifiant, '
  'pour qu\'elles ne reviennent pas à la synchronisation). Sur <b>%d suppressions</b>, <b>%d</b> ont pu être '
  'retrouvées grâce aux copies du carnet prises le 5 septembre.</div>' % (len(exp_tomb), found))

# 8 — QUI DOIT À QUI
A('<h2>8. Qui doit combien à qui — à ce jour</h2>')
if transf:
    A('<table><tr><th>De</th><th>Vers</th><th class="n">Reste à régler</th></tr>')
    for f, t, m in transf:
        A('<tr><td><span class="dot" style="background:%s"></span><b>%s</b></td>'
          '<td><span class="dot" style="background:%s"></span><b>%s</b></td><td class="n pos">%s</td></tr>'
          % (col(f), esc(f), col(t), esc(t), e(m)))
    A('<tr class="tot"><td colspan="2">TOTAL RESTANT</td><td class="n">%s</td></tr></table>'
      % e(sum(m for _, _, m in transf)))
else:
    A('<p class="neg">Tout le monde est à jour.</p>')
A('<div class="note" style="margin-top:14px">Document généré depuis <b>voyage-inde-sud.surge.sh</b>. '
  'Toutes les heures indiquées sont en <b>heure de l\'Inde (IST, UTC+5:30)</b>.</div>')

open('complet.html', 'w', encoding='utf-8').write('\n'.join(P))
print('OK — %d dépenses, %.2f €, %d remboursements (%d valides), %d suppressions retrouvées'
      % (len(EXP), TOTAL, len(pays_all), len(pay_act), found))
