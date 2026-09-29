// Parcours guidé (carafe…) : règles PURES, testables sans navigateur.
// - PARCOURS_CHAMPS : les champs qu'un modèle peut demander (clé de champ → libellé).
//   Les 3 sortes d'initiales écrivent toutes dans la clé « initiale » (comme avant).
// - parcoursEtat(product, fieldValues) : la gravure est-elle complète ? + résumé.
export const PARCOURS_CHAMPS = {
  ini1: { key: "initiale", label: "Votre initiale", ph: "Ex. K", max: 1, req: true },
  ini2: { key: "initiale", label: "Vos 2 initiales", ph: "Ex. JR", max: 2, req: true },
  ini3: { key: "initiale", label: "Vos 3 initiales", ph: "Ex. ABC", max: 3, req: true },
  prenom: { key: "prenom", label: "Prénom ou nom", ph: "Ex. Stephan", max: 40, req: true },
  role: { key: "role", label: "Rôle", ph: "Ex. Papa · Témoin · Best Man", max: 20, req: true },
  date: { key: "date", label: "Date ou année", ph: "Ex. 1989 · 09.09.25", max: 20, req: false, extra: 3 },
};

const v = (fv, k) => String(fv?.[k] ?? "").trim();
const policeNom = (k) => {
  const noms = { playfair: "Playfair", cinzel: "Cinzel", "cinzel-deco": "Cinzel Decorative", montserrat: "Montserrat", inter: "Inter", "great-vibes": "Great Vibes", allura: "Allura", pacifico: "Pacifico" };
  return noms[k] || k || "Playfair";
};

/** @returns {{ok:boolean, grav:string|null, detail:string, manque:string}} */
export function parcoursEtat(product, fv) {
  const cfg = product?.parcoursGuide || {};
  const mode = v(fv, "mode");
  if (!mode) return { ok: false, grav: null, detail: "", manque: "Choisissez votre gravure (étape 1)." };
  if (mode === "modele") {
    const n = v(fv, "numstyle");
    const M = n ? (cfg.modeles || {})[n] : null;
    if (!n || !M) return { ok: false, grav: "Un modèle décoré", detail: "", manque: "Cliquez le modèle voulu (étape 2)." };
    const parts = [], miss = [];
    (M.champs || []).forEach((k) => {
      const F = PARCOURS_CHAMPS[k]; if (!F) return;
      const val = v(fv, F.key);
      if (F.req && !val) miss.push(F.label.toLowerCase());
      if (val) parts.push(`${F.label} : ${val}`);
    });
    const grav = `Modèle n° ${n} — ${M.legende}`;
    if (miss.length) return { ok: false, grav, detail: parts.join(" · "), manque: `Il manque : ${miss.join(", ")} (étape 2).` };
    return { ok: true, grav, detail: parts.length ? parts.join(" · ") : "gravé tel quel", manque: "" };
  }
  if (mode === "lettre") {
    const L = v(fv, "lettreFleurie");
    if (!L) return { ok: false, grav: "Une lettre fleurie", detail: "", manque: "Cliquez votre lettre (étape 2)." };
    const p = v(fv, "prenom");
    return { ok: true, grav: `Lettre fleurie « ${L} »`, detail: p ? `Prénom dans la bande : ${p} (${policeNom(v(fv, "police"))})` : "sans prénom", manque: "" };
  }
  if (mode === "photo") {
    const ph = v(fv, "photo");
    if (!ph) return { ok: false, grav: "Ma photo ou mon logo", detail: "", manque: "Ajoutez votre photo ou votre logo (étape 2)." };
    const t = v(fv, "texte");
    return { ok: true, grav: "Votre photo / logo", detail: t ? `Texte sous la photo : ${t} (${policeNom(v(fv, "police"))})` : "photo seule, vérifiée par l'atelier", manque: "" };
  }
  if (mode === "texte") {
    const t = v(fv, "texte");
    if (!t) return { ok: false, grav: "Mon propre texte", detail: "", manque: "Écrivez votre texte (étape 2)." };
    const d = v(fv, "date");
    return { ok: true, grav: `Texte : « ${t} »`, detail: `Écriture ${policeNom(v(fv, "police"))}${d ? ` · Date : ${d} (+3 €)` : ""}`, manque: "" };
  }
  return { ok: false, grav: null, detail: "", manque: "Choisissez votre gravure (étape 1)." };
}
