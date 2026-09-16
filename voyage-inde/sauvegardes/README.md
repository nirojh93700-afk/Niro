# Sauvegardes du carnet — Voyage Inde du Sud

Copies des données de l'appli `voyage-inde-sud.surge.sh`, pour ne rien perdre.
Chaque sauvegarde porte la date et l'heure (UTC) où elle a été prise.

## Ce que contient une sauvegarde

| Fichier | Contenu |
|---|---|
| `carnet_<date>.json` | **La sauvegarde complète** : dépenses, remboursements, corbeille, participants, parts par personne, suppressions, code secret. C'est le seul fichier nécessaire pour tout remettre. |
| `depenses_<date>.csv` | Toutes les dépenses, ouvrable dans Excel (séparateur `;`). |
| `remboursements_<date>.csv` | Tous les remboursements, ouvrable dans Excel. |
| `RECAP_<date>.md` | Récapitulatif lisible : totaux par catégorie et par personne. |

Les CSV et le récap sont là pour **lire** les données ; le `.json` est là pour **restaurer**.

## D'où viennent les données

Base : Firebase Realtime Database du projet `voyage-inde`
Adresse du carnet : `https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json`
Code de voyage : `inde26-4h7k2p` (c'est lui que tous les téléphones partagent).

## Refaire une sauvegarde (lecture seule, sans risque)

```bash
cd voyage-inde/sauvegardes
STAMP=$(date -u '+%Y-%m-%d_%H%M')
curl -s -o "carnet_${STAMP}.json" \
  "https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json"
```

## Restaurer après une perte de données

⚠️ La restauration **écrit** dans la base et **remplace** le carnet en ligne sur tous les
téléphones. À ne faire que sur demande explicite de la gérante.

```bash
curl -X PUT -H "Content-Type: application/json" \
  --data-binary @carnet_<date>.json \
  "https://voyage-inde-default-rtdb.europe-west1.firebasedatabase.app/carnets/inde26-4h7k2p.json"
```

Ensuite, sur chaque téléphone : rouvrir l'appli et tirer vers le bas pour resynchroniser.

## Note

L'appli fusionne les carnets sans jamais écraser une saisie (union par identifiant +
suppressions datées). Une sauvegarde plus ancienne remise en ligne ne détruit donc pas les
saisies plus récentes faites entre-temps sur un téléphone encore connecté.
