import json, csv, datetime, os, sys

src = sys.argv[1]; stamp = sys.argv[2]
out = os.path.dirname(src)
d = json.load(open(src))

def dt(ms):
    if not ms: return ""
    return datetime.datetime.utcfromtimestamp(int(ms)/1000).strftime("%Y-%m-%d %H:%M")

delAt, undelAt = d.get("delAt") or {}, d.get("undelAt") or {}
def supprime(i):
    return (int(delAt.get(i, 0)) or (1 if i in (d.get("deleted") or []) else 0)) > int(undelAt.get(i, 0))

# --- Dépenses ---
exp = sorted(d.get("expenses") or [], key=lambda x: x.get("ts") or 0)
with open(f"{out}/depenses_{stamp}.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["Date","Libellé","Catégorie","Montant","Devise","Montant EUR","Payé par",
                "Partage","Participants","Hôtel","Nuits","Supprimé","id"])
    for x in exp:
        sp = x.get("split") or {}
        w.writerow([dt(x.get("ts")), x.get("label",""), x.get("cat",""),
                    x.get("amount",""), x.get("cur",""), round(float(x.get("eur") or 0), 2),
                    x.get("who",""), sp.get("mode",""), " / ".join(sp.get("among") or []),
                    x.get("hotel",""), x.get("nights",""),
                    "oui" if supprime(x.get("id","")) else "", x.get("id","")])

# --- Remboursements ---
pay = sorted(d.get("payments") or [], key=lambda p: p.get("ts") or 0)
with open(f"{out}/remboursements_{stamp}.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["Date","De","Vers","Montant EUR","Supprimé","id"])
    for p in pay:
        w.writerow([dt(p.get("ts")), p.get("from",""), p.get("to",""),
                    round(float(p.get("eur") or 0), 2),
                    "oui" if supprime("P:" + str(p.get("id",""))) else "", p.get("id","")])

# --- Récapitulatif ---
actives = [x for x in exp if not supprime(x.get("id",""))]
total = sum(float(x.get("eur") or 0) for x in actives)
par_cat, par_payeur = {}, {}
for x in actives:
    par_cat[x.get("cat") or "(sans)"] = par_cat.get(x.get("cat") or "(sans)", 0) + float(x.get("eur") or 0)
    par_payeur[x.get("who") or "(inconnu)"] = par_payeur.get(x.get("who") or "(inconnu)", 0) + float(x.get("eur") or 0)
pay_actifs = [p for p in pay if not supprime("P:" + str(p.get("id","")))]

L = []
L.append("# Sauvegarde du carnet — Voyage Inde du Sud\n")
L.append(f"- Sauvegardé le : **{datetime.datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC**")
L.append(f"- Code de voyage : `inde26-4h7k2p`")
L.append(f"- Dernière modification dans l'appli : {dt(d.get('updatedAt'))} UTC")
L.append(f"- Participants : {', '.join(d.get('people') or [])}\n")
L.append("## Chiffres\n")
L.append(f"- Dépenses actives : **{len(actives)}** — total **{total:.2f} €**")
L.append(f"- Dépenses supprimées/corbeille : {len(exp)-len(actives)} (conservées dans la sauvegarde)")
L.append(f"- Remboursements : **{len(pay_actifs)}** — total {sum(float(p.get('eur') or 0) for p in pay_actifs):.2f} €\n")
L.append("## Total par catégorie\n")
L.append("| Catégorie | Total EUR |")
L.append("|---|---:|")
for k, v in sorted(par_cat.items(), key=lambda kv: -kv[1]):
    L.append(f"| {k} | {v:.2f} |")
L.append("\n## Total avancé par personne\n")
L.append("| Personne | Total EUR |")
L.append("|---|---:|")
for k, v in sorted(par_payeur.items(), key=lambda kv: -kv[1]):
    L.append(f"| {k} | {v:.2f} |")
L.append("\n## Fichiers de cette sauvegarde\n")
L.append(f"- `carnet_{stamp}.json` — **sauvegarde complète** (tout : dépenses, remboursements, corbeille, parts, réglages). C'est ce fichier qui permet de tout remettre.")
L.append(f"- `depenses_{stamp}.csv` — toutes les dépenses (ouvrable dans Excel).")
L.append(f"- `remboursements_{stamp}.csv` — tous les remboursements.")
open(f"{out}/RECAP_{stamp}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L[:20]))
