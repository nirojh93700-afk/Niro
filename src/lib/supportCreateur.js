// Créateur « support de téléphone » (14/11/2026, gérant : « OK pour remplacer et mettre en ligne »).
// La fiche du site est la maquette enregistrée : la cliente choisit la forme, la taille, pose textes, dessins, photo,
// lettre fleurie, un motif ajouré, l'inclinaison. Ce fichier est PUR : il sert à la fiche, au panier, au paiement
// (prix de confiance), à l'atelier et à l'outil de Gestion. La création gardée = l'état complet de l'outil.
import { FONTS, getFontLabel } from "@/lib/fonts";
import { SUP_DESSINS, SUP_LETTRES, SUP_EXEMPLE } from "@/lib/supportCreateurData";

export const SUP_FORMES = { rectangle: "Rectangle arrondi", arche: "Arche", chat: "Tête de chat", ours: "Oreilles d'ours" };
export const SUP_TAILLES = {
  petit: { nom: "Petit", W: 76, H: 142 },
  standard: { nom: "Standard", W: 80, H: 151 },
  grand: { nom: "Grand", W: 86, H: 165 },
};
export const SUP_MOTIFS = { coeurs: "Cœurs", pattes: "Pattes", soleil: "Soleil", nid: "Nid d'abeille", losanges: "Losanges", persienne: "Persienne", fenetre: "Fenêtre", etoiles: "Étoiles" };
export const SUP_DENSITES = { moins: "Moins", moyen: "Moyen", plus: "Plus" };
export const SUP_ANGLES = [10, 13, 16, 20];
// Prix donnés par le gérant le 12/11/2026 : chaque élément gravé + 3 €, motif ajouré + 3 € (le prix de la taille = l'option).
export const SUP_PRIX = { element: 3, ajoure: 3 };
export const SUP_MAX_ELEMENTS = 12;
const POLICES = new Set(FONTS.map((f) => f.key));
const TYPES = { texte: "Texte", dessin: "Dessin", lettre: "Lettre fleurie", photo: "Photo" };

export const supVariantId = (taille) => `support-tel-${taille}`;
export function supTailleDeVariante(variantId) {
  const t = String(variantId || "").replace(/^support-tel-/, "");
  return SUP_TAILLES[t] ? t : null;
}

const nombre = (v, min, max, defaut) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : defaut; };
const texte = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const police = (v) => (POLICES.has(v) ? v : "playfair");
// Une photo de cliente = une image envoyée au site (/api/img/<id>), ou la photo d'exemple de la fiche.
const photoValide = (src) => typeof src === "string" && (/^\/api\/img\/[A-Za-z0-9_-]{6,80}$/.test(src) || src === SUP_EXEMPLE);

/**
 * L'état de l'outil, vérifié et nettoyé (adresses des images refaites depuis nos tables : jamais une adresse libre).
 * Renvoie null si la création n'est pas valable (forme inconnue, photo non envoyée, gravure cochée sans rien…).
 */
export function supNormaliser(etat) {
  if (!etat || typeof etat !== "object") return null;
  if (!SUP_FORMES[etat.forme] || !SUP_TAILLES[etat.taille]) return null;
  const grave = Boolean(etat.grave), ajoure = Boolean(etat.ajoure);
  const els = [];
  if (grave) {
    if (!Array.isArray(etat.els) || etat.els.length > SUP_MAX_ELEMENTS) return null;
    let id = 0;
    for (const e of etat.els) {
      if (!e || !TYPES[e.type]) return null;
      const o = { type: e.type, id: ++id, s: nombre(e.s, 0.3, 2.2, 1), x: nombre(e.x, 0, 400, 200), y: nombre(e.y, 0, 560, 300) };
      if (e.type === "texte") {
        o.texte = texte(e.texte, 30); o.police = police(e.police);
        if (!o.texte) return null;
      } else if (e.type === "dessin") {
        const d = SUP_DESSINS[String(parseInt(e.n, 10))];
        if (!d) return null;
        o.n = parseInt(e.n, 10); o.src = d.src; o.r = d.r;
      } else if (e.type === "lettre") {
        const L = String(e.L || "").toUpperCase(), l = SUP_LETTRES[L];
        if (!l) return null;
        o.L = L; o.src = l.src; o.r = l.r; o.b = l.b; o.nom = texte(e.nom, 20); o.police = police(e.police);
      } else {
        const src = e.url || e.src;
        if (!photoValide(src)) return null;
        o.src = src; o.nom = texte(e.nom, 80);
      }
      els.push(o);
    }
    if (!els.length) return null;
  }
  return {
    forme: etat.forme, taille: etat.taille, grave, ajoure,
    motif: SUP_MOTIFS[etat.motif] ? etat.motif : "coeurs", densite: SUP_DENSITES[etat.densite] ? etat.densite : "moyen",
    piedMotif: etat.piedMotif !== false, angle: SUP_ANGLES.includes(Number(etat.angle)) ? Number(etat.angle) : 13, cable: etat.cable !== false,
    els, police: police(etat.police), seq: els.length,
  };
}

/** Ce qui s'ajoute au prix de la taille : + 3 € par élément gravé, + 3 € le motif ajouré. */
export function supSupplement(sup) {
  if (!sup) return 0;
  return (sup.grave ? sup.els.length * SUP_PRIX.element : 0) + (sup.ajoure ? SUP_PRIX.ajoure : 0);
}

/** Pourquoi la création ne peut pas encore partir au panier (chaîne vide = prête). */
export function supManque(etat) {
  if (!etat) return "Le créateur se charge encore.";
  if (etat.grave && !(etat.els || []).length) return "Ajoutez un élément à graver, ou décochez la gravure pour un support sans gravure.";
  if (etat.grave && (etat.els || []).some((e) => e.type === "texte" && !String(e.texte || "").trim())) return "Un texte est vide : écrivez-le, ou retirez-le.";
  if (etat.grave && (etat.els || []).length > SUP_MAX_ELEMENTS) return `${SUP_MAX_ELEMENTS} éléments gravés au plus : retirez-en un.`;
  return "";
}

const ecriture = (k) => getFontLabel(k).split(" — ")[0] || k;
export function supNomElement(e) {
  if (e.type === "texte") return `« ${e.texte} »`;
  if (e.type === "dessin") return `Dessin n° ${e.n}`;
  if (e.type === "lettre") return `Lettre ${e.L}${e.nom ? ` · « ${e.nom} »` : ""}`;
  return "Photo";
}
export function supMotifTexte(sup) {
  return `${SUP_MOTIFS[sup.motif]} · ${SUP_DENSITES[sup.densite].toLowerCase()}${sup.piedMotif ? " · aussi sur le pied" : ""}`;
}

/** Le résumé en une ligne (panier, paiement, e-mails). */
export function supResume(sup) {
  if (!sup) return "";
  const t = SUP_TAILLES[sup.taille];
  const p = [`${SUP_FORMES[sup.forme]}`, `${t.nom} ${t.W} × ${t.H} mm`];
  if (sup.grave) for (const e of sup.els) p.push(`${TYPES[e.type]} : ${supNomElement(e)}${e.type === "texte" || (e.type === "lettre" && e.nom) ? ` (${ecriture(e.police)})` : ""}`);
  if (sup.ajoure) p.push(`Motif ajouré : ${supMotifTexte(sup)}`);
  if (!sup.grave && !sup.ajoure) p.push("Sans décoration (bois nu)");
  p.push(`${sup.angle}°`, sup.cable ? "passage du câble" : "sans passage du câble");
  return p.join(" · ");
}

/** Pour la fiche atelier : les lignes générales, puis un bloc « gravure » élément par élément (avec son image). */
export function supConsignes(sup) {
  const t = SUP_TAILLES[sup.taille];
  const general = [
    { k: "Forme", v: SUP_FORMES[sup.forme], fort: true },
    { k: "Taille", v: `${t.nom} · ${t.W} × ${t.H} mm`, fort: true },
    { k: "Inclinaison", v: `${sup.angle}°` },
    { k: "Câble", v: sup.cable ? "avec le passage du câble" : "SANS passage du câble", fort: !sup.cable },
    { k: "Motif ajouré", v: sup.ajoure ? `${supMotifTexte(sup)} (+3 €)` : "aucun", fort: sup.ajoure },
    { k: "Bois", v: "contreplaqué 3 mm, deux pièces qui s'emboîtent" },
  ];
  const lignes = sup.grave ? sup.els.map((e, i) => ({
    k: `${i + 1}. ${TYPES[e.type]} (+3 €)`,
    v: `${supNomElement(e)}${e.type === "texte" || (e.type === "lettre" && e.nom) ? ` — écriture ${ecriture(e.police)}` : ""}`,
    texte: e.type === "texte" || (e.type === "lettre" && Boolean(e.nom)),
    img: e.type === "texte" ? null : e.src,
  })) : [];
  const faces = [{ nom: "Gravure sur le dossier (places et tailles : bouton « Fichiers pour la machine »)", lignes, vide: !lignes.length }];
  return { general, faces };
}

/** Les photos envoyées par la cliente (adresses du site), pour les afficher et les télécharger dans Gestion. */
export function supPhotos(sup) {
  return sup && sup.grave ? sup.els.filter((e) => e.type === "photo" && /^\/api\/img\//.test(e.src)).map((e) => e.src) : [];
}
