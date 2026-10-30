// Socles lumineux LED des cristaux — bascule automatique vers le nouveau modèle (gérant, 29/10/2026 :
// « tu prends les nouveaux que quand les autres seront finis, tu bascules automatiquement dès que
// l'autre sera en rupture »).
// Les fiches gardent leurs identifiants d'origine (`socle-led-carre`, `socle-led-rectangle`) ; dès que le
// stock d'un ancien modèle est à 0, le site vend le suivant : son stock, sa photo, son texte. Le petit et
// le grand basculent chacun de leur côté. Pur : aucune lecture de base ici (catalogue, Gestion, tests).

// Grand socle noir : câble USB fourni, mais pas encore d'adaptateur de prise. Le jour où le gérant a les
// adaptateurs : passer à true (le texte de la fiche le dira tout seul).
export const ADAPTATEUR_NOIR_FOURNI = false;

export const SOCLES = {
  // Anciens modèles (Alibaba, avr. 2026).
  "socle-led-carre": {
    titre: "Socle LED — petit (carré)",
    image: "/produits/socle-led-carre.jpg",
    phrase: "Petit socle carré : LED multicolores dont les couleurs changent au toucher. Il fonctionne sur une prise secteur, câble USB et adaptateur de prise fournis.",
    court: "LED multicolores, couleurs au toucher, sur prise secteur",
    suivant: "socle-led-carre-gris",
  },
  "socle-led-rectangle": {
    titre: "Socle LED — grand (rectangle)",
    image: "/produits/socle-led-rectangle.jpg",
    phrase: "Grand socle rectangle : LED multicolores dont les couleurs changent au toucher. Il fonctionne sur une prise secteur, câble USB et adaptateur de prise fournis.",
    court: "LED multicolores, couleurs au toucher, sur prise secteur",
    suivant: "socle-led-rectangle-noir",
  },
  // Nouveaux modèles (Alibaba n° 33855788501043880, commande du 11/10/2026, 20 de chaque).
  // Petit gris argenté : dessus 5,2 × 5,2 cm, base 6,5 × 6,5 × 2,9 cm, piles AAA seulement.
  "socle-led-carre-gris": {
    titre: "Socle LED — petit gris (à piles)",
    image: "/produits/socle-led-carre-gris.jpg",
    phrase: "Petit socle carré gris argenté : LED multicolores. Il fonctionne avec des piles AAA, sans câble.",
    court: "LED multicolores, fonctionne avec des piles AAA",
  },
  // Grand noir : 13,5 × 7,3 × 2,5 cm (dessus 13 × 7), piles AAA ou câble USB.
  "socle-led-rectangle-noir": {
    titre: "Socle LED — grand noir (piles ou câble)",
    image: "/produits/socle-led-rectangle-noir.jpg",
    phrase: ADAPTATEUR_NOIR_FOURNI
      ? "Grand socle rectangle noir : LED multicolores. Il fonctionne avec des piles AAA ou sur une prise secteur, câble USB et adaptateur de prise fournis."
      : "Grand socle rectangle noir : LED multicolores. Il fonctionne avec des piles AAA ou avec le câble USB fourni, à brancher sur un ordinateur ou un adaptateur USB (adaptateur de prise non fourni).",
    court: ADAPTATEUR_NOIR_FOURNI
      ? "LED multicolores, piles AAA ou prise secteur"
      : "LED multicolores, piles AAA ou câble USB",
  },
};

// Le socle réellement vendu pour un identifiant de la fiche : l'ancien tant qu'il en reste (ou s'il n'est
// pas suivi en stock), le suivant dès que l'ancien est à 0.
export function socleEnVente(id, stock = {}) {
  const s = SOCLES[id];
  if (!s?.suivant) return id;
  const n = stock?.[id];
  return typeof n === "number" && n <= 0 ? s.suivant : id;
}

const INTRO = "Socle lumineux LED multicolore (en option) : pose et illumine votre cristal. L'effet 3D est sublimé, surtout le soir.";

// Fiche produit : stock, photo et texte du socle suivent le modèle en vente, taille par taille.
export function appliquerSocles(product, stock = {}) {
  const extras = product?.engravingPricing?.flatExtras;
  if (!Array.isArray(extras) || !extras.some((e) => SOCLES[e.stockId])) return product;
  const flatExtras = extras.map((e) => {
    if (!SOCLES[e.stockId]) return e;
    const parVar = {};
    for (const [v, sid] of Object.entries(e.stockIdByVariant || {})) parVar[v] = socleEnVente(sid, stock);
    return { ...e, stockId: socleEnVente(e.stockId, stock), ...(e.stockIdByVariant ? { stockIdByVariant: parVar } : {}) };
  });
  const socle = flatExtras.find((e) => SOCLES[e.stockId]);
  const pourVariante = (vid) => (socle.stockIdByVariant && socle.stockIdByVariant[vid]) || socle.stockId;
  const personalizationFields = (product.personalizationFields || []).map((f) => {
    if (f.key !== "note-socle") return f;
    const imageByVariant = {};
    const textByVariant = {};
    for (const v of product.variants || []) {
      const info = SOCLES[pourVariante(v.id)];
      imageByVariant[v.id] = info.image;
      textByVariant[v.id] = `${INTRO} ${info.phrase}`;
    }
    const defaut = SOCLES[socle.stockId];
    return { ...f, image: defaut.image, text: `${INTRO} ${defaut.phrase}`, imageByVariant, textByVariant };
  });
  return { ...product, engravingPricing: { ...product.engravingPricing, flatExtras }, personalizationFields };
}

// Page « Cristaux déjà gravés » : le petit (vertical Petit, Moyen, Grand) et le grand (vertical XL + horizontal) en vente.
export function soclesPourPage(stock = {}) {
  const carre = SOCLES[socleEnVente("socle-led-carre", stock)];
  const rect = SOCLES[socleEnVente("socle-led-rectangle", stock)];
  return {
    carre: { image: carre.image, court: carre.court },
    rect: { image: rect.image, court: rect.court },
  };
}
