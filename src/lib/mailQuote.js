// =============================================================================
// SÉPARER LA RÉPONSE DU TEXTE CITÉ (comme Gmail / Apple Mail).
//
// Dans un fil d'e-mails, la cliente répond au-dessus et son logiciel recopie
// dessous tout l'échange précédent. Affiché brut, ça donne le « mur de texte »
// illisible sur téléphone. On coupe donc le message en deux :
//   - `main`   : ce qu'elle vient d'écrire (toujours affiché)
//   - `quoted` : l'historique recopié (replié derrière un bouton)
//
// ⚠️ RÈGLE ABSOLUE : on ne perd JAMAIS un caractère. `main + quoted` contient
// toujours l'intégralité du texte d'origine. En cas de doute, on ne coupe pas.
// =============================================================================

// Lignes qui annoncent le début d'une citation.
const MARQUEURS = [
  // « Le 17/09/2026 à 21:14, Rose Catarino a écrit : »  (Gmail / Thunderbird FR)
  /^\s*Le\s.{4,120}\sa\s[ée]crit\s*:?\s*$/i,
  // « On Wed, Sep 17, 2026 at 9:14 PM, Rose wrote: »  (Gmail EN)
  /^\s*On\s.{4,120}\swrote\s*:?\s*$/i,
  // « -----Message d'origine----- » / « -----Original Message----- »
  /^\s*-{2,}\s*(message d'origine|original message|message transf[ée]r[ée]|forwarded message)\s*-{2,}\s*$/i,
  // Bandeau Outlook : « ________________________________ »
  /^\s*_{8,}\s*$/,
  // En-tête recopié par Outlook : « De : Rose Catarino » / « From: … »
  /^\s*(De|From)\s*:\s*\S.{0,160}$/i,
  // Notre propre gabarit d'e-mail, recopié dans la réponse.
  /^\s*-{2,}\s*$/,
];

const estCitee = (l) => /^\s*>/.test(l);

/**
 * Coupe un message en { main, quoted }.
 * @param {string} texte
 * @returns {{ main: string, quoted: string }} `quoted` vaut "" s'il n'y a rien à replier.
 */
export function separerCitation(texte) {
  const brut = typeof texte === "string" ? texte : "";
  if (!brut.trim()) return { main: brut, quoted: "" };

  const lignes = brut.split("\n");

  // On cherche le PREMIER endroit où la citation commence.
  let coupe = -1;
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (estCitee(l)) { coupe = i; break; }
    if (MARQUEURS.some((r) => r.test(l))) {
      // Un marqueur ne compte que s'il reste vraiment quelque chose derrière.
      if (lignes.slice(i + 1).some((x) => x.trim())) { coupe = i; break; }
    }
  }
  if (coupe < 0) return { main: brut, quoted: "" };

  // On ne replie pas si la réponse au-dessus est vide : mieux vaut tout
  // montrer qu'un message qui a l'air vide avec un bouton « afficher ».
  const main = lignes.slice(0, coupe).join("\n").replace(/\s+$/, "");
  if (!main.trim()) return { main: brut, quoted: "" };

  const quoted = lignes.slice(coupe).join("\n").replace(/^\s*\n/, "");
  if (!quoted.trim()) return { main: brut, quoted: "" };

  // Sécurité : on ne coupe pas pour deux lignes, ça n'en vaut pas la peine.
  if (quoted.length < 40) return { main: brut, quoted: "" };

  return { main, quoted };
}

/** Nombre de lignes repliées, pour l'afficher sur le bouton. */
export function compterLignes(quoted) {
  return String(quoted || "").split("\n").filter((l) => l.trim()).length;
}
