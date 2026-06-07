#!/usr/bin/env node
// =============================================================================
// verifier-marque.mjs  ◆  Repère les mentions de l'ancienne marque oubliées
// =============================================================================
// Quand on duplique le site pour un nouveau client, on remplace le contenu,
// mais il reste souvent des « Niv Création » oubliés dans les pages.
// Ce script scanne le code source et liste tout ce qui reste à changer.
//
// Utilisation :
//   node scripts/verifier-marque.mjs              (cherche les mentions par défaut)
//   node scripts/verifier-marque.mjs "Mot" "Autre" (cherche tes propres termes)
// =============================================================================

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// Termes recherchés (par défaut : la marque d'origine + son domaine).
const termes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["Niv Création", "Niv Creation", "nivcreation"];

const RACINE = "src";
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".md", ".json"]);
// On ne signale pas le fichier de config : c'est là qu'on DOIT mettre le nom.
const IGNORE = new Set(["src/config/marque.js"]);

let total = 0;
const resultats = [];

function scan(dir) {
  for (const entree of readdirSync(dir)) {
    const chemin = join(dir, entree);
    const info = statSync(chemin);
    if (info.isDirectory()) {
      scan(chemin);
    } else if (EXT.has(extname(chemin)) && !IGNORE.has(chemin)) {
      const lignes = readFileSync(chemin, "utf8").split("\n");
      lignes.forEach((ligne, i) => {
        if (termes.some((t) => ligne.includes(t))) {
          resultats.push({ chemin, ligne: i + 1, texte: ligne.trim().slice(0, 100) });
          total++;
        }
      });
    }
  }
}

scan(RACINE);

if (total === 0) {
  console.log(`\n✓ Aucune mention résiduelle trouvée pour : ${termes.join(", ")}`);
  console.log("  Le site semble prêt pour le nouveau client.\n");
} else {
  console.log(`\n⚠ ${total} mention(s) restante(s) à vérifier/remplacer :\n`);
  let dernier = "";
  for (const r of resultats) {
    if (r.chemin !== dernier) {
      console.log(`\n  ${r.chemin}`);
      dernier = r.chemin;
    }
    console.log(`    L${r.ligne}: ${r.texte}`);
  }
  console.log(`\n  Astuce : importe le nom depuis @/config/marque (MARQUE.nom)`);
  console.log("  plutôt que de l'écrire en dur.\n");
  process.exitCode = 1;
}
