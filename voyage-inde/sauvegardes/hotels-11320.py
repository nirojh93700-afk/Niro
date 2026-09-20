#!/usr/bin/env python3
"""Atithi Pondichéry (08/09) et North Gate (11/09) : remettre le taux de l'époque, 113,20.

Ces deux hôtels avaient été recalculés à 108 par l'ancien défaut de l'appli. Leurs chambres
sont remises au taux 113,20, et ce taux est GRAVÉ sur l'hôtel (champ fxr) pour que l'appli
ne les recalcule plus jamais. Les roupies saisies ne changent pas.
  python3 hotels-11320.py              -> montre
  python3 hotels-11320.py --appliquer  -> écrit (sauvegarde prise avant)
"""
import json, sys, urllib.request, datetime, os
URL=("https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json")
ICI=os.path.dirname(os.path.abspath(__file__)); TAUX=113.20
HOTELS=["Atithi Hotel Pondichéry","North Gate"]
def lire():
    with urllib.request.urlopen(URL, timeout=30) as r: return json.load(r)
d=lire(); now=int(datetime.datetime.now(datetime.timezone.utc).timestamp()*1000)
for nom in HOTELS:
    ch=[x for x in d["expenses"] if x.get("hotel")==nom]
    if not ch: print("!! introuvable :", nom); continue
    paid=float(ch[0].get("paid") or 0)
    cible=round(paid/TAUX, 2)                      # ce que vaut le total payé au taux d'époque
    print("\n%s — payé %.0f ₹  ->  %.2f € au taux %.2f" % (nom, paid, cible, TAUX))
    acc=0.0
    for i,x in enumerate(ch):
        a=float(x.get("amount") or 0)
        e=round(a/TAUX, 2)
        if i==len(ch)-1: e=round(cible-acc, 2)     # dernier: absorbe l'arrondi, comme l'appli
        acc=round(acc+e, 2)
        print("   %-11s %7.0f ₹   %7.2f € -> %7.2f €" % (x.get("label") or "Chambre", a, float(x.get("eur") or 0), e))
        x["eur"]=e; x["fxr"]=TAUX; x["mt"]=now     # fxr = taux gravé : plus jamais recalculé
    print("   total chambres : %.2f €   (= prix payé au taux %.2f ✔)" % (acc, TAUX))
if "--appliquer" not in sys.argv:
    print("\n(rien écrit)"); sys.exit(0)
json.dump(lire(), open(os.path.join(ICI,"carnet_avant-hotels_%s.json"%datetime.datetime.utcnow().strftime("%Y-%m-%d_%H%M")),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
req=urllib.request.Request(URL, data=json.dumps({"expenses":d["expenses"], "updatedAt":now}).encode(),
                           method="PATCH", headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, timeout=30) as r: print("\nÉcriture : HTTP %s" % r.status)
