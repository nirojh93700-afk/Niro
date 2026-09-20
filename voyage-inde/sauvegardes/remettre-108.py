#!/usr/bin/env python3
"""Tout ce qui est en roupies à partir du 16/09 doit être au taux 108.

Seule exception voulue par la gérante : les DEUX remboursements du 16/09 (Selvan Viji,
Paramu) qui restent à 108,50. Lecture puis écriture ciblée ; rien d'autre n'est touché.
  python3 remettre-108.py              -> montre, n'écrit rien
  python3 remettre-108.py --appliquer  -> écrit (sauvegarde prise avant)
"""
import json, sys, urllib.request, datetime, os
URL=("https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json")
ICI=os.path.dirname(os.path.abspath(__file__))
IST=datetime.timezone(datetime.timedelta(hours=5,minutes=30))
DEPUIS=datetime.date(2026,9,16)
def lire():
    with urllib.request.urlopen(URL, timeout=30) as r: return json.load(r)
def jour(r): return datetime.datetime.fromtimestamp((r.get("ts") or 0)/1000, IST)

d=lire(); now=int(datetime.datetime.now(datetime.timezone.utc).timestamp()*1000)
lignes=[]
def traite(rec, taux, quoi):
    if not rec or (rec.get("cur") or "")!="INR" or not (float(rec.get("amount") or 0)>0): return
    if jour(rec).date() < DEPUIS: return
    a=float(rec["amount"]); avant=float(rec.get("eur") or 0); apres=round(a/taux,10)
    if abs(apres-avant)<0.005: return
    nom=rec.get("label") or ("%s → %s" % (rec.get("from","?"), rec.get("to","?")))
    lignes.append((jour(rec), quoi, nom, a, avant, apres, taux))
    rec["eur"]=apres; rec["mt"]=now

for x in d.get("expenses") or []:
    traite(x, 108.0, "dépense")
for p in d.get("payments") or []:
    # les deux remboursements du 16/09 restent à 108,50 (demande explicite)
    taux = 108.50 if jour(p).date()==datetime.date(2026,9,16) else 108.0
    traite(p, taux, "remboursement")

print("%-6s %-14s %-32s %9s %9s %9s %7s" % ("DATE","QUOI","LIBELLÉ","ROUPIES","AVANT","APRÈS","TAUX"))
for j,q,n,a,av,ap,tx in sorted(lignes):
    print("%-6s %-14s %-32s %9.0f %8.2f€ %8.2f€ %7.2f" % (j.strftime("%d/%m"), q, n[:32], a, av, ap, tx))
print("\n%d ligne(s) — écart %+.2f €" % (len(lignes), sum(ap-av for _,_,_,_,av,ap,_ in lignes)))
if "--appliquer" not in sys.argv:
    print("(rien écrit)"); sys.exit(0)
json.dump(lire(), open(os.path.join(ICI,"carnet_avant-108_%s.json"%datetime.datetime.utcnow().strftime("%Y-%m-%d_%H%M")),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
req=urllib.request.Request(URL, data=json.dumps({"expenses":d.get("expenses") or [],
    "payments":d.get("payments") or [], "updatedAt":now}).encode(), method="PATCH",
    headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, timeout=30) as r: print("\nÉcriture : HTTP %s" % r.status)
