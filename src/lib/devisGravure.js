// =============================================================================
// COMMANDE SUR DEVIS → LIGNES « À GRAVER » (30/09/2026).
// -----------------------------------------------------------------------------
// Remarque du gérant sur #16HGINEA (devis DEV-1506, 2 verres + un coffret) :
// « je sais même pas quoi, il veut combien de verres — deux verres de chaque style
// ou juste un verre de chaque style ? ». Une commande sur devis n'a PAS de réglages
// enregistrés (`spec`) : l'atelier n'affichait que le texte du devis, sans aucune
// quantité lisible ni fichier à ouvrir.
//
// Ici on relit les LIGNES DU DEVIS (nom, quantité, texte entre « », style n°) et on
// les présente comme une commande normale : une pièce par ligne, sa quantité, son
// texte, son fichier à graver. Les fichiers faits à la main pour une commande sont
// déclarés dans FICHIERS_DEVIS (ils vivent dans public/gravures/<réf>/).
// =============================================================================

// Un fichier par LIGNE DU DEVIS (hors livraison), dans l'ordre des lignes.
export const FICHIERS_DEVIS = {
  "16HGINEA": [
    { fichier: "/gravures/16HGINEA/verre-1.svg", texte: "Claude · Millésime 1976", style: "2" },
    { fichier: "/gravures/16HGINEA/verre-2.svg", texte: "Ami de Claude · Millésimé", style: "2" },
    {
      fichier: "/gravures/16HGINEA/couvercle.svg",
      texte: "Claude · Millésime 1976",
      style: "2",
      note: "Couvercle du coffret — même texte que le verre 1, confirmé par le client le 28/09.",
    },
  ],
  // Remplacement à l'identique de 1YPJVC5R (colis perdu). Réglages relus dans l'alerte de la
  // commande d'origine du 25/08/2026 : le devis, lui, ne portait ni la date ni la police.
  "0GTB1LZ5": [
    {
      texte: "Stéphanie 💜 Lorenzo",
      date: "15.07.2026",
      police: "Great Vibes",
      emplacement: "Face avant",
      emballage: "Sac cadeau",
      note: "Commande d'origine 1YPJVC5R (25/08) : même texte, date et police. Cœur : 💜 (décision du gérant, 02/10 — remplace le 💞 de l'original).",
    },
  ],
  // Devis DEV-1523, Yohan Dufour : réglages relus dans ses e-mails du 18/10/2026.
  "09SZ9VYH": [
    {
      texte: "Tournesol (dessin envoyé par le client, aucun texte)",
      emplacement: "Pièce GAUCHE du puzzle · la seconde pièce reste sans gravure",
      note: "Finition argentée. Modèle du tournesol : image « 1000025149.jpg » reçue par e-mail le 18/10 (voir les photos ci-dessous). Le client : « sur la pièce de puzzle gauche comme sur la photo transmise ». Express Chronopost : à graver en priorité.",
    },
  ],
  // Devis DEV-1528, Santos (01/11/2026) : image envoyée par le formulaire du site (bouton photo).
  // Rangé par NUMÉRO DE DEVIS : la référence de la commande n'existe qu'au paiement.
  "DEV-1528": [
    {
      fichier: "/api/img/zZUWRyvaRidkJmdAtCzI",
      texte: "EUGENIO (en capitales, sous la rose des vents)",
      emplacement: "Face avant du verre",
      note: "Image envoyée par le client le 01/11 : rose des vents avec N, O, E, S, prénom « EUGENIO » dessous, petit trait de vagues. C'est un visuel d'exemple (photo d'un verre) : reprendre la rose des vents, le prénom et les vagues.",
    },
    { texte: "Eugenio", note: "Ce n'est pas une 2ᵉ pièce : c'est le prénom gravé sur le MÊME verre (ligne 1), sous la rose des vents." },
  ],
  // Devis DEV-1544, Coline Goossens (05/11/2026) : un seul verre à whisky, choix confirmés par e-mail les 04 et 05/11.
  "DEV-1544": [
    {
      fichier: "/gravures/DEV-1544/photo.png",
      texte: "Photo (papa et bébé)",
      emplacement: "Face avant du verre, à GAUCHE",
      note: "Photo déjà préparée pour la gravure. La cliente accepte qu'on coupe un peu le bras en bas pour laisser de la place aux deux phrases.",
    },
    {
      fichier: "/gravures/DEV-1544/textes-a-cote-de-la-photo.png",
      texte: "Notre plus belle aventure",
      emplacement: "Face avant, à DROITE de la photo, en haut",
      note: "Fichier = les deux phrases ensemble, séparées par un petit trait avec un cœur. Elles doivent rester bien lisibles.",
    },
    { texte: "C'est ça, le bonheur.", emplacement: "Face avant, à droite de la photo, sous le cœur", note: "Déjà dans le fichier de la ligne 2." },
    { texte: "Gravure face + fond", note: "Ce n'est pas une pièce : le même verre est gravé sur la face ET au fond." },
    {
      fichier: "/gravures/DEV-1544/fond-cest-chic.png",
      texte: "C'est chic !",
      emplacement: "FOND du verre",
      note: "Présentation B choisie par la cliente (trait courbe + petit cœur dessous). Fichier à l'endroit.",
    },
  ],
};

// Lignes d'envoi (pas des pièces à fabriquer) : « Livraison… », « Lettre suivie La Poste », « Colis suivi ».
const LIVRAISON = /livraison|point relais|retrait|expédition|frais de port|^\s*(lettre|colis)\s+suivi/i;

/** Les pièces à fabriquer d'une commande sur devis, une par ligne du devis. */
export function lignesDevis(order) {
  const fichiers = FICHIERS_DEVIS[order?.ref] || FICHIERS_DEVIS[order?.quoteNumber] || [];
  return (order?.items || [])
    .filter((it) => !LIVRAISON.test(it.name || ""))
    // Devis payé AVEC d'autres articles du site (02/11/2026) : seules les lignes du devis (sans fiche
    // produit) ; les articles de la boutique ont leur propre fiche, l'emballage est écrit à part.
    .filter((it) => !it.slug && !/^Emballage cadeau$/i.test(String(it.name || "").trim()))
    .map((it, i) => {
      const nom = String(it.name || "").trim();
      const texteNom = (/«\s*([^»]+?)\s*»/.exec(nom) || [])[1] || "";
      const styleNom = (/style\s*n°\s*(\d+)/i.exec(nom) || [])[1] || "";
      const f = fichiers[i] || {};
      return {
        rang: i + 1,
        quantite: Number(it.quantity) || 1,
        nom,
        court: nom.split(/\s+[—–-]\s+/)[0],
        texte: f.texte || texteNom,
        style: f.style || styleNom,
        date: f.date || "",
        police: f.police || "",
        emplacement: f.emplacement || "",
        emballage: f.emballage || "",
        dateManquante: !f.date && /\+\s*date|date\b/i.test(nom),
        fichier: f.fichier || "",
        note: f.note || "",
      };
    });
}
