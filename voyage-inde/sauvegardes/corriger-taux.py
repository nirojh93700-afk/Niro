#!/usr/bin/env python3
"""Recalcule en euros les saisies faites en roupies à partir d'une date, à un nouveau taux.

Utilisé le 19/09/2026 : les dépenses et remboursements du 16/09 à aujourd'hui avaient été
convertis à 113,20 ₹ pour 1 €, alors que le vrai taux était 108,00. Ce script relit le montant
en roupies déjà saisi et refait la conversion ; il ne touche à rien d'autre.

  python3 corriger-taux.py             -> montre ce qui changerait, n'écrit RIEN
  python3 corriger-taux.py --appliquer -> écrit dans le carnet en ligne (sauvegarde d'abord)
"""
import json, sys, urllib.request, datetime, os

URL = ("https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app"
       "/carnets/inde26-4h7k2p.json")
TAUX = 108.00                                   # nouveau taux : 1 € = 108,00 ₹
DEPUIS = datetime.date(2026, 9, 16)             # à partir du 16/09 (heure de l'Inde)
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
ICI = os.path.dirname(os.path.abspath(__file__))
APPLIQUER = "--appliquer" in sys.argv


def lire():
    with urllib.request.urlopen(URL, timeout=30) as r:
        return json.load(r)


def concerne(rec):
    """en roupies, et daté du 16/09 ou après (heure de l'Inde)"""
    if (rec.get("cur") or "") != "INR" or not (float(rec.get("amount") or 0) > 0):
        return False
    return datetime.datetime.fromtimestamp((rec.get("ts") or 0) / 1000, IST).date() >= DEPUIS


def jour(rec):
    return datetime.datetime.fromtimestamp((rec.get("ts") or 0) / 1000, IST).strftime("%d/%m")


d = lire()
maintenant = int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000)
lignes, ecart = [], 0.0

for rec in (d.get("expenses") or []) + (d.get("payments") or []):
    if not rec or not concerne(rec):
        continue
    montant = float(rec["amount"])
    avant = float(rec.get("eur") or 0)
    apres = round(montant / TAUX, 10)
    if abs(apres - avant) < 0.005:
        continue
    nom = rec.get("label") or ("%s → %s" % (rec.get("from", "?"), rec.get("to", "?")))
    lignes.append((jour(rec), nom, montant, avant, apres))
    ecart += apres - avant
    rec["eur"] = apres
    rec["mt"] = maintenant          # marque la modif : elle gagne sur les autres téléphones

print("Nouveau taux : 1 € = %.2f ₹   —   à partir du %s\n" % (TAUX, DEPUIS.strftime("%d/%m/%Y")))
print("%-6s %-38s %10s %10s %10s" % ("DATE", "LIBELLÉ", "ROUPIES", "AVANT", "APRÈS"))
for j, nom, m, a, b in lignes:
    print("%-6s %-38s %10.0f %9.2f€ %9.2f€" % (j, nom[:38], m, a, b))
print("\n%d lignes modifiées — écart total %+.2f €" % (len(lignes), ecart))

if not APPLIQUER:
    print("\n(rien n'a été écrit — relancer avec --appliquer)")
    sys.exit(0)

# sauvegarde de l'état AVANT, puis écriture
avant_path = os.path.join(ICI, "carnet_avant-taux_%s.json"
                          % datetime.datetime.utcnow().strftime("%Y-%m-%d_%H%M"))
json.dump(lire(), open(avant_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nSauvegarde de l'état précédent : %s" % os.path.basename(avant_path))

corps = json.dumps({"expenses": d.get("expenses") or [],
                    "payments": d.get("payments") or [],
                    "updatedAt": maintenant}).encode()
req = urllib.request.Request(URL, data=corps, method="PATCH",
                             headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=30) as r:
    print("Écriture : HTTP %s" % r.status)

# relecture de contrôle
ok = sum(1 for rec in (lire().get("expenses") or []) + (lire().get("payments") or [])
         if rec and concerne(rec) and abs(float(rec.get("eur") or 0) - float(rec["amount"]) / TAUX) < 0.005)
print("Contrôle après écriture : %d saisies en roupies sont bien au taux %.2f" % (ok, TAUX))
