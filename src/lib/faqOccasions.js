// Questions-réponses en bas des pages « Offrir » (24/11/2026, gérant : « applique le bloc Noël »,
// maquette https://claude.ai/artifact/EApVv3qejZPQEQgUV1F8YJ). Lues aussi par Google et les IA (FAQPage).
// ⛔ Aucun produit ni prix écrit à la main dans les réponses : chaque produit cité est relu dans le
// catalogue EN DIRECT (prix du jour, produit masqué = retiré de la phrase, phrase vide = question retirée).
// La question « date limite pour Noël » n'y est pas : le gérant ne l'a pas encore donnée.
import { prixCarte } from "@/lib/univers";
import { configNoel } from "@/lib/fetes";

const euro = (n) => `${Number(n).toFixed(2).replace(/\.00$/, "").replace(".", ",")} €`;

// Morceau de phrase : texte, ou liste de produits { s: slug, l: libellé, max?: prix maximum }.
const FAQ = {
  noel: [
    {
      q: "Quel cadeau de Noël personnalisé offrir à moins de 30 € ?",
      a: [
        "Plusieurs créations gravées restent sous 30 € : ",
        { liste: [
          { s: "porte-cles-cuir-a-graver", l: "le porte-clés aspect cuir à graver" },
          { s: "marque-page-bois-pompon", l: "le marque-page en bois gravé" },
          { s: "collier-papillon-ajoure", l: "le collier papillon ajouré" },
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "puzzle-savane", l: "le puzzle en bois au prénom de l'enfant" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
        ], max: 30 },
        ". Chaque pièce est gravée à la commande dans notre atelier, en France.",
      ],
    },
    {
      q: "Quel cadeau de Noël offrir à un homme ou à un papa ?",
      a: [
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
        ] },
        " se gravent d'un prénom, d'une date, d'un logo ou d'une photo.",
        { liste: [{ s: "bracelet-homme-plaque-cuir", l: "le bracelet homme cuir et plaque" }], avant: " Pour un bijou, ", apres: " se grave d'un prénom ou d'une date." },
      ],
    },
    {
      q: "Peut-on offrir une photo gravée pour Noël ?",
      a: [
        "Oui. ",
        { liste: [{ s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" }], apres: " grave votre photo en relief à l'intérieur du bloc." },
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky" },
          { s: "puzzle-photo-grave", l: "le puzzle photo en bois" },
          { s: "support-telephone-bois-grave", l: "le support de téléphone en bois" },
        ], avant: " Sur ", apres: ", on peut aussi graver une photo." },
      ],
    },
    { q: "Les bijoux peuvent-ils être emballés pour Noël ?", noelEmballages: true },
  ],
};

function prixTexte(p) {
  const pc = prixCarte(p);
  if (!pc) return null;
  return { lo: pc.lo, texte: pc.hi > pc.lo ? `dès ${euro(pc.lo)}` : euro(pc.lo) };
}

function joindre(items) {
  if (items.length <= 1) return items;
  const out = [];
  items.forEach((it, i) => {
    if (i > 0) out.push(i === items.length - 1 ? " et " : ", ");
    out.push(it);
  });
  return out;
}

/** Morceaux d'une réponse : chaînes et liens { href, label, prix }. null si la phrase n'a plus de produit. */
function construire(segments, parSlug) {
  const out = [];
  let produits = 0;
  for (const seg of segments) {
    if (typeof seg === "string") { out.push(seg); continue; }
    const items = [];
    for (const it of seg.liste) {
      const p = parSlug.get(it.s);
      const prix = p && prixTexte(p);
      if (!prix || (seg.max && prix.lo >= seg.max)) continue;
      items.push({ href: p.pageDediee || `/produit/${p.slug}`, label: it.l, prix: prix.texte });
    }
    if (!items.length) {
      if (!seg.avant && !seg.apres) return null; // morceau principal sans produit → question retirée
      continue;
    }
    produits += items.length;
    if (seg.avant) out.push(seg.avant);
    const liste = joindre(items);
    out.push(...liste);
    if (seg.apres) out.push(seg.apres);
  }
  if (!produits) return null;
  // Majuscule au libellé qui ouvre une phrase (début de réponse ou après un point).
  for (let i = 0; i < out.length; i++) {
    if (typeof out[i] === "string") continue;
    const avant = out.slice(0, i).filter((x) => typeof x === "string").join("");
    const precedent = i === 0 ? "" : typeof out[i - 1] === "string" ? out[i - 1] : "x";
    if (i === 0 || /[.!?]\s*$/.test(precedent) || !avant.trim()) out[i] = { ...out[i], label: out[i].label.charAt(0).toUpperCase() + out[i].label.slice(1) };
  }
  return out;
}

/** Questions-réponses prêtes à afficher pour une occasion ([] si aucune). */
export function faqOccasion(slug, catalog, settings) {
  const liste = FAQ[slug];
  if (!liste) return [];
  const parSlug = new Map((catalog || []).map((p) => [p.slug, p]));
  const out = [];
  for (const f of liste) {
    if (f.noelEmballages) {
      const cfg = configNoel(settings);
      if (!cfg.on) continue; // Noël éteint dans Gestion → pas un mot sur les emballages de Noël
      const emb = cfg.emballages.filter((e) => !e.masque);
      if (!emb.length) continue;
      const pack = emb.find((e) => e.id === "pack");
      const autres = emb.filter((e) => e.id !== "pack").map((e) => e.nom.charAt(0).toLowerCase() + e.nom.slice(1));
      const noms = pack ? [...autres, `le Pack de Noël à ${euro(pack.prix)}`] : autres;
      const phrase = `Oui. Pour les bijoux, nous proposons des emballages de Noël : ${joindre(noms).join("")}. Chacun est livré avec son étiquette offerte.`;
      out.push({ q: f.q, parts: [phrase] });
      continue;
    }
    const parts = construire(f.a, parSlug);
    if (parts) out.push({ q: f.q, parts });
  }
  return out;
}

/** Texte brut d'une réponse (données structurées FAQPage). */
export function texteReponse(parts) {
  return parts.map((x) => (typeof x === "string" ? x : `${x.label} (${x.prix})`)).join("").replace(/\s+/g, " ").trim();
}
