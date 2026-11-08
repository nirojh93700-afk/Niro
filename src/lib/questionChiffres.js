// « Posez une question sur vos chiffres » (Gestion → Finances → Ventes, 08/11/2026).
// Le gérant tape « Combien de colliers vendus en octobre ? » ; Claude répond UNIQUEMENT à partir
// d'agrégats calculés ICI, côté serveur, sur les VRAIES commandes (jamais un chiffre inventé).
// Serveur seulement (clé Claude). Lecture seule : rien n'est écrit nulle part.
import Anthropic from "@anthropic-ai/sdk";
import { paysDeLaCommande } from "@/lib/paysLivraison";
import { modeDe } from "@/lib/fileCommandes";
import { CATEGORIES } from "@/lib/products";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const NB_MOIS = 12;
const MAX_PRODUITS = 60;
const MAX_JSON = 12_000; // taille visée des agrégats envoyés à Claude (octets)

const PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
/** « AAAA-MM » du mois de Paris d'une date (chaîne vide si illisible). */
export function moisDe(ts) {
  try { const s = PARIS.format(new Date(ts)); return s.slice(6) + "-" + s.slice(3, 5); } catch { return ""; }
}
const jourDe = (ts) => { try { const s = PARIS.format(new Date(ts)); return `${s.slice(6)}-${s.slice(3, 5)}-${s.slice(0, 2)}`; } catch { return ""; } };
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const moisLisible = (k) => { const [a, m] = String(k).split("-").map(Number); return NOMS_MOIS[m - 1] ? `${NOMS_MOIS[m - 1]} ${a}` : k; };

/** Les N derniers mois (clés « AAAA-MM »), du plus ancien au plus récent, mois courant compris. */
export function derniersMois(n = NB_MOIS, maintenant = Date.now()) {
  const [yy, mm] = moisDe(maintenant).split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    let m = mm - i, y = yy;
    while (m <= 0) { m += 12; y -= 1; }
    out.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return out;
}

/** « Camille Durand » → « Camille D. » (jamais l'e-mail, jamais le nom entier). */
export function prenomInitiale(nom) {
  const mots = String(nom || "").trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return "Cliente";
  const prenom = mots[0].charAt(0).toUpperCase() + mots[0].slice(1).toLowerCase();
  return mots.length > 1 ? `${prenom} ${mots[mots.length - 1].charAt(0).toUpperCase()}.` : prenom;
}

const LABEL_CAT = Object.fromEntries((CATEGORIES || []).map((c) => [c.slug, c.short || c.label || c.slug]));

/** Les commandes qui comptent : ni test, ni annulée, ni remboursée. */
export function commandesReelles(orders) {
  return (orders || []).filter((o) => o && !o.test && !["annulee", "remboursee"].includes(o.status));
}

/**
 * Agrégats compacts (≤ ~12 Ko de JSON) calculés sur les vraies commandes, pour que Claude réponde
 * sans jamais voir une commande entière : par mois, par produit (× mois), par catégorie, par pays,
 * par mode de livraison, top clientes (prénom + initiale), commandes en cours, période couverte.
 */
export function agregats(orders, catalog, maintenant = Date.now()) {
  const reelles = commandesReelles(orders);
  const exclues = (orders || []).length - reelles.length;
  const mois = derniersMois(NB_MOIS, maintenant);
  const moisOk = new Set(mois);

  const bySlug = {};
  for (const p of Array.isArray(catalog) ? catalog : []) if (p?.slug) bySlug[p.slug] = p;

  const parMois = Object.fromEntries(mois.map((k) => [k, { commandes: 0, ca: 0, livraison: 0, pieces: 0 }]));
  const parProduit = {};
  const parCategorie = {};
  const parPays = {};
  const parMode = {};
  const parCliente = {};
  const enCours = { aPreparer: 0, enFabrication: 0, montant: 0 };
  const glissant = { j7: { commandes: 0, ca: 0 }, j30: { commandes: 0, ca: 0 } };
  let debut = "", fin = "";

  for (const o of reelles) {
    const ts = Date.parse(o.createdAt || "") || 0;
    const jour = jourDe(o.createdAt);
    if (jour) { if (!debut || jour < debut) debut = jour; if (!fin || jour > fin) fin = jour; }
    const mk = moisDe(o.createdAt);
    const total = Number(o.total) || 0;
    const livraison = Number(o.shippingPrice) || 0;
    const dansFenetre = moisOk.has(mk);

    if (dansFenetre) { const m = parMois[mk]; m.commandes += 1; m.ca += total; m.livraison += livraison; }
    if (ts && maintenant - ts <= 7 * 86400000) { glissant.j7.commandes += 1; glissant.j7.ca += total; }
    if (ts && maintenant - ts <= 30 * 86400000) { glissant.j30.commandes += 1; glissant.j30.ca += total; }

    const st = o.status || "a_preparer";
    if (st === "a_preparer") { enCours.aPreparer += 1; enCours.montant += total; }
    if (st === "en_gravure") { enCours.enFabrication += 1; enCours.montant += total; }

    const pays = paysDeLaCommande(o).nom;
    parPays[pays] = parPays[pays] || { commandes: 0, ca: 0 };
    parPays[pays].commandes += 1; parPays[pays].ca += total;

    const mode = modeDe(o).lib;
    parMode[mode] = parMode[mode] || { commandes: 0, ca: 0 };
    parMode[mode].commandes += 1; parMode[mode].ca += total;

    const cle = String(o.customerEmail || o.customerName || o.id || "").toLowerCase().trim() || String(o.id);
    parCliente[cle] = parCliente[cle] || { nom: prenomInitiale(o.customerName || o.shippingName), commandes: 0, ca: 0 };
    parCliente[cle].commandes += 1; parCliente[cle].ca += total;

    for (const it of o.items || []) {
      const qty = Number(it.quantity) || 1;
      const ca = Number(it.total) || 0;
      const slug = it.slug || "";
      const p = bySlug[slug];
      const nom = p?.name || it.name || slug || "Article";
      const categorie = p?.category ? (LABEL_CAT[p.category] || p.category) : (o.surMesure || o.quoteNumber ? "Devis / sur mesure" : "Autre");
      const k = slug || nom;
      parProduit[k] = parProduit[k] || { slug: slug || null, nom, categorie, pieces: 0, ca: 0, parMois: {} };
      const pp = parProduit[k];
      pp.pieces += qty; pp.ca += ca;
      if (dansFenetre) {
        pp.parMois[mk] = pp.parMois[mk] || [0, 0];
        pp.parMois[mk][0] += qty; pp.parMois[mk][1] = r2(pp.parMois[mk][1] + ca);
        parMois[mk].pieces += qty;
      }
      parCategorie[categorie] = parCategorie[categorie] || { pieces: 0, ca: 0, commandes: new Set() };
      parCategorie[categorie].pieces += qty; parCategorie[categorie].ca += ca; parCategorie[categorie].commandes.add(o.id || cle);
    }
  }

  const listeMois = mois.map((k) => {
    const m = parMois[k];
    return { mois: k, lisible: moisLisible(k), commandes: m.commandes, ca: r2(m.ca), livraison: r2(m.livraison), pieces: m.pieces, panierMoyen: m.commandes ? r2(m.ca / m.commandes) : 0 };
  });

  let produits = Object.values(parProduit)
    .filter((p) => p.pieces > 0)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, MAX_PRODUITS)
    .map((p) => ({ ...p, ca: r2(p.ca) }));

  const categories = Object.entries(parCategorie)
    .map(([categorie, v]) => ({ categorie, pieces: v.pieces, ca: r2(v.ca), commandes: v.commandes.size }))
    .sort((a, b) => b.ca - a.ca);

  const pays = Object.entries(parPays).map(([pays, v]) => ({ pays, commandes: v.commandes, ca: r2(v.ca) })).sort((a, b) => b.commandes - a.commandes);
  const modes = Object.entries(parMode).map(([mode, v]) => ({ mode, commandes: v.commandes, ca: r2(v.ca) })).sort((a, b) => b.commandes - a.commandes);
  const topClientes = Object.values(parCliente).sort((a, b) => b.ca - a.ca).slice(0, 10).map((c) => ({ ...c, ca: r2(c.ca) }));

  const out = {
    genereLe: jourDe(maintenant),
    moisCourant: moisDe(maintenant),
    nbCommandesLues: reelles.length,
    nbExclues: exclues,
    periode: { debut, fin },
    note: "Montants en euros TTC encaissés (livraison comprise dans « ca » des mois / pays / modes / clientes ; « ca » d'un produit ou d'une catégorie = la ligne d'article seule). Clés de mois « AAAA-MM ». Les produits ne listent que ceux vendus, par CA décroissant.",
    glissant: { j7: { ...glissant.j7, ca: r2(glissant.j7.ca) }, j30: { ...glissant.j30, ca: r2(glissant.j30.ca), panierMoyen: glissant.j30.commandes ? r2(glissant.j30.ca / glissant.j30.commandes) : 0 } },
    enCours: { ...enCours, montant: r2(enCours.montant) },
    parMois: listeMois,
    parCategorie: categories,
    parPays: pays,
    parMode: modes,
    topClientes,
    parProduit: produits,
  };

  // Garde-fou de taille : on retire d'abord le détail mensuel des produits les moins vendus, puis des produits.
  let json = JSON.stringify(out);
  let i = out.parProduit.length - 1;
  while (json.length > MAX_JSON && i >= 0) {
    if (out.parProduit[i].parMois && Object.keys(out.parProduit[i].parMois).length) out.parProduit[i] = { ...out.parProduit[i], parMois: undefined };
    else out.parProduit.splice(i, 1);
    i -= 1;
    json = JSON.stringify(out);
  }
  return out;
}

const CONSIGNE = `Tu es l'assistant de Gestion de la boutique Niv Création (gravure personnalisée). Le gérant te pose une question sur ses ventes.
Tu réponds UNIQUEMENT à partir des agrégats fournis (JSON). Si la donnée n'y est pas, dis-le simplement et propose où la trouver dans Gestion (Bénéfices, Ventes, Clientes, Commandes, Produits & stock…). Jamais un chiffre inventé, jamais une estimation présentée comme un chiffre.
Règles d'écriture : français, vouvoiement, 2 à 3 phrases courtes, chiffres en euros à la française (« 341,20 € »), mois en toutes lettres (« octobre 2026 »). « Colliers », « bracelets », « verres »… se repèrent dans le nom des produits. « Ce mois-ci » = le mois courant des agrégats ; « sur 30 jours » = la fenêtre glissante j30.
Barres : seulement si une comparaison aide (par mois, par produit, par pays…), 0 à 8 barres, libellés courts, valeurs lues dans les agrégats. Source : une courte phrase qui dit d'où vient le chiffre (nombre de commandes lues, période, hors annulées et tests).
Réponds avec l'outil "reponse" seulement.`;

const OUTIL = {
  name: "reponse",
  description: "La réponse au gérant, à partir des agrégats.",
  input_schema: {
    type: "object",
    properties: {
      texte: { type: "string", description: "2 à 3 phrases en français, chiffres en euros à la française." },
      barres: {
        type: "array",
        description: "0 à 8 barres facultatives pour un petit graphique.",
        items: { type: "object", properties: { label: { type: "string" }, valeur: { type: "number" } }, required: ["label", "valeur"] },
      },
      source: { type: "string", description: "D'où vient le chiffre (commandes lues, période, exclusions)." },
    },
    required: ["texte", "source"],
  },
};

/** Nettoie ce que renvoie l'outil (jamais de confiance aveugle). */
function nettoyer(input, ag) {
  const texte = String(input?.texte || "").trim().slice(0, 1200);
  const barres = (Array.isArray(input?.barres) ? input.barres : [])
    .filter((b) => b && typeof b.label === "string" && Number.isFinite(Number(b.valeur)))
    .slice(0, 8)
    .map((b) => ({ label: b.label.trim().slice(0, 40), valeur: r2(b.valeur) }));
  const source = String(input?.source || "").trim().slice(0, 300)
    || `Lu dans ${ag.nbCommandesLues} commande${ag.nbCommandesLues > 1 ? "s" : ""}, hors annulées, remboursées et tests.`;
  return { texte, barres, source };
}

/** Pose la question à Claude. → { ok:true, texte, barres, source } ou { ok:false, raison }. */
export async function repondre(question, ag) {
  const q = String(question || "").trim();
  if (!q) return { ok: false, raison: "Écrivez une question." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, raison: "La clé Claude du site n'est pas configurée." };
  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: CONSIGNE,
      tools: [OUTIL],
      tool_choice: { type: "tool", name: "reponse" },
      messages: [{ role: "user", content: [
        { type: "text", text: `Agrégats des ventes (calculés sur les vraies commandes) :\n${JSON.stringify(ag)}` },
        { type: "text", text: `Question du gérant : ${q.slice(0, 400)}` },
      ] }],
    });
    const bloc = (resp.content || []).find((b) => b.type === "tool_use");
    if (!bloc) return { ok: false, raison: "Aucune réponse n'a pu être lue." };
    const r = nettoyer(bloc.input, ag);
    if (!r.texte) return { ok: false, raison: "Réponse vide." };
    return { ok: true, ...r };
  } catch (e) {
    console.error("Question chiffres:", e?.message || e);
    return { ok: false, raison: "La réponse n'a pas pu être obtenue. Réessayez dans un instant." };
  }
}
