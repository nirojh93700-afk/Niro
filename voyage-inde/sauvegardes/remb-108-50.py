#!/usr/bin/env python3
"""Les 2 remboursements en roupies du 16/09 passent au taux 108,50.

Les dépenses restent à 108. Ceux d'AVANT le 16/09 (ex. Mama, 10 000 ₹ le 12/09) ne bougent pas."""
import json, urllib.request, datetime, sys, os
URL=("https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json")
TAUX=108.50
DEPUIS=datetime.date(2026,9,16)
IST=datetime.timezone(datetime.timedelta(hours=5,minutes=30))
def lire():
    with urllib.request.urlopen(URL, timeout=30) as r: return json.load(r)
d=lire(); now=int(datetime.datetime.now(datetime.timezone.utc).timestamp()*1000)
n=0
for p in (d.get("payments") or []):
    if not p or (p.get("cur") or "")!="INR" or not (float(p.get("amount") or 0)>0): continue
    if datetime.datetime.fromtimestamp((p.get("ts") or 0)/1000, IST).date() < DEPUIS: continue
    a=float(p["amount"]); avant=float(p.get("eur") or 0); apres=round(a/TAUX,10)
    print("  %-26s %7.0f ₹   %7.2f € -> %7.2f €" % (p.get("from","?"), a, avant, apres))
    if abs(apres-avant)>0.005: p["eur"]=apres; p["mt"]=now; n+=1
if "--appliquer" not in sys.argv:
    print("\n(%d à modifier — rien écrit)" % n); sys.exit(0)
json.dump(lire(), open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
    "carnet_avant-remb_%s.json" % datetime.datetime.utcnow().strftime("%Y-%m-%d_%H%M")),"w",
    encoding="utf-8"), ensure_ascii=False, indent=1)
req=urllib.request.Request(URL, data=json.dumps({"payments":d.get("payments") or [],
    "updatedAt":now}).encode(), method="PATCH", headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, timeout=30) as r: print("\nÉcriture : HTTP %s" % r.status)
for p in (lire().get("payments") or []):
    if p and p.get("cur")=="INR":
        j=datetime.datetime.fromtimestamp((p.get("ts") or 0)/1000, IST)
        print("  contrôle : %s  %-26s %7.2f €  taux %.2f" % (j.strftime("%d/%m"), p.get("from"), float(p["eur"]), float(p["amount"])/float(p["eur"])))
