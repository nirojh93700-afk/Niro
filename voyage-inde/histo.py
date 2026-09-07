# -*- coding: utf-8 -*-
"""Historique complet : remboursements reçus, saisies manuelles, suppressions."""
import json, datetime, os, html
esc = lambda s: html.escape(str(s or ''))

SNAPS = [('/tmp/carnet.json', '5 sept. 06:07'), ('/tmp/c.json', '5 sept. 07:18'),
         ('/tmp/c2.json', '5 sept. 07:25'), ('carnet.json', '7 sept. (actuel)')]
CUR_D = json.load(open('carnet.json', encoding='utf-8'))
PEOPLE = CUR_D['people']

pay_seen, exp_seen = {}, {}
for path, when in SNAPS:
    if not os.path.exists(path) or os.path.getsize(path) == 0: continue
    d = json.load(open(path, encoding='utf-8'))
    for p in (d.get('payments') or []): pay_seen.setdefault(p['id'], p)
    for x in (d.get('expenses') or []): exp_seen.setdefault(x['id'], x)

pay_act = {p['id'] for p in (CUR_D.get('payments') or [])}
pay_tomb = {t[2:] for t in (CUR_D.get('deleted') or []) if t.startswith('P:')}
exp_act = {x['id'] for x in CUR_D['expenses']}
exp_tomb = [t for t in (CUR_D.get('deleted') or []) if not t.startswith(('P:', 'H:'))]

def e(v): return ('%.2f' % v).replace('.', ',') + ' €'
def r(v): return ('%.0f' % v) if abs(v - round(v)) < .005 else ('%.2f' % v).replace('.', ',')
def dts(ts, f='%d/%m/%Y à %Hh%M'): return datetime.datetime.fromtimestamp((ts or 0)/1000).strftime(f)

CATLBL = {'hotel':'Hôtel','driver':'Chauffeur','transport':'Transport','food':'Restaurant','other':'Autres'}
CATICO = {'hotel':'🏨','driver':'🛣️','transport':'🚗','food':'🍽️','other':'📌'}
COLORS = ['#f0b429','#2ec4b6','#e07a5f','#7dd3fc','#c084fc']
def col(p): return COLORS[(PEOPLE.index(p) if p in PEOPLE else 0) % len(COLORS)]

P = []; A = P.append
A('<!doctype html><meta charset="utf-8"><title>Historique — Voyage Inde du Sud</title>')
A('''<style>
@page{size:A4;margin:14mm 12mm}
*{box-sizing:border-box}
body{font:12px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#16241f;margin:0}
h1{font-size:23px;margin:0 0 3px;color:#0e3b3a}
h2{font-size:15px;margin:22px 0 9px;color:#0e3b3a;border-bottom:2.5px solid #f0b429;padding-bottom:5px;page-break-after:avoid}
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
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.head{border-bottom:3px solid #0e3b3a;padding-bottom:11px;margin-bottom:6px}
.note{background:#fbf7ec;border-left:3px solid #f0b429;padding:7px 10px;border-radius:0 7px 7px 0;font-size:10.5px;margin:8px 0}
.kpi{display:flex;gap:9px;margin:11px 0}
.kpi div{flex:1;border:1px solid #d7dedb;border-radius:9px;padding:8px 10px}
.kpi b{display:block;font-size:17px;color:#0e3b3a}
.kpi span{font-size:9.5px;color:#5d6b66;text-transform:uppercase}
</style>''')

A('<div class="head"><h1>Historique complet — Voyage Inde du Sud</h1>')
A('<div class="sub">Tout ce qui a été saisi depuis le début &nbsp;·&nbsp; document établi le %s</div></div>'
  % datetime.datetime.now().strftime('%d/%m/%Y'))

# ---- 1. REMBOURSEMENTS ----
pays = sorted(pay_seen.values(), key=lambda p: p.get('ts') or 0)
tot_ok = sum(float(p['eur']) for p in pays if p['id'] in pay_act)
tot_del = sum(float(p['eur']) for p in pays if p['id'] not in pay_act)
A('<h2>Ce que les gens t\'ont donné — historique des remboursements</h2>')
A('<div class="kpi"><div><span>Total encaissé (valide)</span><b>%s</b></div>'
  '<div><span>Remboursements valides</span><b>%d</b></div>'
  '<div><span>Saisies annulées</span><b>%d</b></div></div>'
  % (e(tot_ok), sum(1 for p in pays if p['id'] in pay_act), sum(1 for p in pays if p['id'] not in pay_act)))
A('<table><tr><th>Date de saisie</th><th>Qui a donné</th><th>À qui</th><th class="n">Montant</th><th>État</th></tr>')
for p in pays:
    ok = p['id'] in pay_act
    A('<tr class="%s"><td>%s</td><td><span class="dot" style="background:%s"></span>%s</td><td>%s</td>'
      '<td class="n">%s</td><td class="tag"><span class="tag %s">%s</span></td></tr>'
      % ('' if ok else 'del', dts(p.get('ts')), col(p.get('from')), esc(p.get('from')), esc(p.get('to')),
         e(float(p['eur'])), 'ok' if ok else 'no', 'compté' if ok else 'supprimé'))
A('<tr class="tot"><td colspan="3">TOTAL RÉELLEMENT ENCAISSÉ</td><td class="n">%s</td><td></td></tr></table>' % e(tot_ok))
if tot_del > 0:
    A('<div class="note">Une saisie de <b>%s</b> (Mama → Niv, le 3 septembre à 23h57) a été <b>supprimée</b> : '
      'c\'était un doublon, enregistré une minute avant celle d\'Amma Appa. Elle n\'est comptée nulle part.</div>' % e(tot_del))
A('<h3 style="font-size:12.5px;margin:14px 0 6px;color:#0e3b3a">Total reçu par personne</h3>')
A('<table><tr><th>Personne</th><th class="n">Nb</th><th class="n">Total donné</th></tr>')
parp = {}
for p in pays:
    if p['id'] in pay_act: parp.setdefault(p['from'], [0, 0.0]); parp[p['from']][0] += 1; parp[p['from']][1] += float(p['eur'])
for who, (n, t) in sorted(parp.items(), key=lambda kv: -kv[1][1]):
    A('<tr><td><span class="dot" style="background:%s"></span>%s</td><td class="n">%d</td><td class="n">%s</td></tr>'
      % (col(who), esc(who), n, e(t)))
for q in PEOPLE:
    if q not in parp and q != 'Niv':
        A('<tr><td><span class="dot" style="background:%s"></span>%s</td><td class="n">0</td>'
          '<td class="n" style="color:#9aa5a0">n\'a rien donné</td></tr>' % (col(q), esc(q)))
A('</table>')

# ---- 2. SAISIES MANUELLES ----
man = [x for x in CUR_D['expenses'] if x.get('cat') != 'hotel']
man.sort(key=lambda z: z.get('mt') or z.get('ts') or 0)
A('<h2>Tes saisies manuelles — dans l\'ordre où tu les as entrées</h2>')
A('<div class="sub" style="margin-bottom:4px">%d dépenses saisies à la main (hors les 36 chambres d\'hôtel préparées à l\'avance).</div>'
  % len(man))
A('<table><tr><th>Saisi le</th><th>Libellé</th><th>Catégorie</th><th>Payé par</th><th class="n">Montant</th><th class="n">En €</th></tr>')
for x in man:
    A('<tr><td>%s</td><td>%s</td><td>%s %s</td><td>%s</td><td class="n muted">%s %s</td><td class="n">%s</td></tr>'
      % (dts(x.get('mt') or x.get('ts'), '%d/%m à %Hh%M'),
         (esc(x['label']) if x.get('label') else '<i style="color:#9aa5a0">sans nom</i>'),
         CATICO.get(x.get('cat'), '📌'), CATLBL.get(x.get('cat'), x.get('cat')), esc(x.get('who')),
         r(float(x['amount'])), esc(x.get('cur')), e(float(x['eur']))))
A('<tr class="tot"><td colspan="5">TOTAL DES SAISIES MANUELLES</td><td class="n">%s</td></tr></table>'
  % e(sum(float(x['eur']) for x in man)))

# ---- 3. SUPPRESSIONS ----
A('<h2>Ce qui a été supprimé</h2>')
A('<table><tr><th>Date</th><th>Libellé</th><th>Payé par</th><th class="n">Montant</th></tr>')
found = 0
for t in exp_tomb:
    x = exp_seen.get(t)
    if not x: continue
    found += 1
    A('<tr class="del"><td>%s</td><td>%s</td><td>%s</td><td class="n">%s</td></tr>'
      % (dts(x.get('ts'), '%d/%m/%Y'), esc(x.get('label') or x.get('hotel') or 'sans nom'),
         esc(x.get('who')), e(float(x.get('eur') or 0))))
if found == 0: A('<tr><td colspan="4" style="color:#9aa5a0">Aucun détail récupérable.</td></tr>')
A('</table>')
A('<div class="note"><b>Important :</b> l\'application ne conserve pas le détail de ce qui est supprimé — '
  'elle ne garde que l\'identifiant, pour éviter que la ligne ne revienne lors de la synchronisation. '
  'Sur les <b>%d suppressions</b> enregistrées, j\'ai pu retrouver <b>%d</b> grâce aux copies de ton carnet '
  'que j\'avais prises le 5 septembre. Les autres (faites avant) ne sont plus récupérables.</div>'
  % (len(exp_tomb), found))
A('<div class="note">Le <b>chauffeur (949,09 €)</b> fait partie des suppressions : il n\'est plus compté '
  'dans les totaux ni dans ce que chacun doit. Détail conservé ici : 12 jours × 900 ₹ de forfait + '
  '12 jours × 7 800 ₹ de forfait kilomètres = <b>104 400 ₹</b>. Tu peux le recréer à l\'identique si besoin.</div>')

open('historique.html', 'w', encoding='utf-8').write('\n'.join(P))
print('OK — %d remboursements (%d valides), %d saisies manuelles, %d suppressions retrouvées'
      % (len(pays), len(pay_act), len(man), found))
