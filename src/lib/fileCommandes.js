// =============================================================================
// FILE DE PRODUCTION + FICHE COMMANDE (04/11/2026) — règles PURES partagées par
// /gestion/commandes (la file) et /gestion/commande/<ref> (la fiche) : statuts,
// mode d'envoi, ordre de traitement, état de la date limite, filtres, tri.
// Aucune donnée inventée : tout est lu dans la commande telle que l'API la rend.
// =============================================================================
import { delaiCommande, jourFr } from "@/lib/delaiCommande";
import { paysDeLaCommande } from "@/lib/paysLivraison";
import { languesDeLaCommande, nomsLangues } from "@/lib/traductionGravure";
import { sourceDe, provenanceDe, detailVisite, couleurSource, nomSource, ORDRE_SOURCES } from "@/lib/provenance";

export const FLAGS = [
  { id: "urgent", label: "Urgente", tone: "bad" },
  { id: "attend", label: "Accepte d'attendre", tone: "grey" },
  { id: "cadeau", label: "Cadeau promis", tone: "gold" },
  { id: "gravure_offerte", label: "Gravure offerte", tone: "info" },
  { id: "attente_client", label: "En attente de la cliente", tone: "warn" },
  { id: "appel", label: "À rappeler", tone: "warn" },
];
export const FLAG_PAR_ID = Object.fromEntries(FLAGS.map((f) => [f.id, f]));

// Liste de contrôle de la fiche (Katana / Etsy « top tasks ») : cochée à la main, rangée avec la commande.
export const CONTROLES = [
  { id: "gravee", label: "Gravée" },
  { id: "controlee", label: "Contrôlée (texte, police, photo)" },
  { id: "emballee", label: "Emballée" },
  { id: "etiquette", label: "Étiquette imprimée" },
  { id: "expediee", label: "Expédiée" },
];

export const ACTIFS = new Set(["", "a_preparer", "en_gravure"]);
export const STATUTS = {
  a_preparer: { lib: "À préparer", tone: "gold" },
  en_gravure: { lib: "En fabrication", tone: "info" },
  expediee: { lib: "Expédiée", tone: "ok" },
  remise_main_propre: { lib: "Remise en main propre", tone: "ok" },
  livree: { lib: "Livrée", tone: "grey" },
  annulee: { lib: "Annulée", tone: "bad" },
  remboursee: { lib: "Remboursée", tone: "bad" },
};
export const statutDe = (o) => o?.status || "a_preparer";
export const statutInfo = (o) => STATUTS[statutDe(o)] || { lib: statutDe(o), tone: "grey" };
export const estActive = (o) => ACTIFS.has(o?.status || "");
export const estPartie = (o) => ["expediee", "remise_main_propre"].includes(o?.status);
export const estFinie = (o) => ["livree", "annulee", "remboursee"].includes(o?.status);

export const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

export function modeDe(o) {
  const m = String(o?.shippingMethod || "").toLowerCase();
  if (/express|chronopost/.test(m)) return { k: "express", lib: "Express Chronopost" };
  if (o?.relaisPoint || m.includes("relais")) return { k: "relais", lib: "Point relais" };
  if (m.includes("main propre") || m.includes("retrait") || o?.status === "remise_main_propre") return { k: "retrait", lib: "Retrait à l'atelier" };
  return { k: "domicile", lib: "Domicile" };
}
export const estExpress = (o) => modeDe(o).k === "express";
export const estUrgent = (o) => Boolean(o?.immediateStart) || (o?.flags || []).includes("urgent") || estExpress(o);

// Ordre de traitement : Express / urgentes d'abord, puis les premières arrivées (FIFO).
export function ordreTraitement(a, b) {
  return (estUrgent(b) - estUrgent(a)) || (Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0));
}
export function positions(orders) {
  const pos = {};
  (orders || []).filter(estActive).sort(ordreTraitement).forEach((o, i) => { pos[o.id] = i + 1; });
  return pos;
}

// État de la date limite d'une commande, en une clé : late · today · week · later · done · none.
export function etatDelai(o, maintenant = Date.now()) {
  if (estFinie(o) && !estPartie(o)) return { k: "none", d: null };
  const d = delaiCommande(o, maintenant);
  if (!d) return { k: "none", d: null };
  if (d.etat === "parti") return { k: "done", d };
  if (d.etat === "depasse") return { k: "late", d };
  if (d.etat === "bientot") return { k: "today", d };
  return { k: d.ouvresRestants <= 3 ? "week" : "later", d };
}
export const RANG_DELAI = { late: 0, today: 1, week: 2, later: 3, done: 4, none: 5 };

// Une ligne courte pour la carte ; les deux dates complètes restent dans DelaiCommande (gérant, 26/10).
export function texteDelaiCourt(e) {
  const d = e?.d; if (!d) return "";
  const pl = (n, mot) => `${n} j ${mot}${n > 1 ? "s" : ""}`;
  if (e.k === "done") return `Expédiée en ${pl(d.ouvresEcoules, "ouvré")} · ${d.aTemps ? "dans les temps" : "après la date limite"}`;
  const reste = e.k === "late" ? `dépassé de ${pl(-d.ouvresRestants, "ouvré")}` : d.ouvresRestants === 0 ? "dernier jour" : `encore ${pl(d.ouvresRestants, "ouvré")}`;
  return `À expédier avant ${jourFr(d.limite)} · ${reste} · ${pl(d.calendairesEcoules, "calendaire")} écoulé${d.calendairesEcoules > 1 ? "s" : ""}`;
}

export function cadeauTexte(o) {
  if (!o?.cadeauChoix) return "";
  const lib = (v) => ({ surprise: "surprise", femme: "plutôt femme", homme: "plutôt homme" })[v] || v;
  const p = String(o.cadeauChoix).split("+").filter(Boolean);
  return p.length === 2 ? `deux cadeaux : ${lib(p[0])} + ${lib(p[1])}` : lib(o.cadeauChoix);
}

// Pastilles d'alerte d'une commande (jamais cachées derrière un « voir plus »).
export function chipsDe(o, unread = false) {
  const c = [];
  const pays = paysDeLaCommande(o);
  if (estExpress(o) && estActive(o)) c.push({ k: "express", tone: "bad", lib: "Express · à graver en priorité" });
  else if (o.immediateStart && estActive(o)) c.push({ k: "immediate", tone: "bad", lib: "Fabrication immédiate demandée" });
  if (pays.etranger) c.push({ k: "pays", tone: "bad", lib: `${pays.drapeau} À envoyer en ${pays.nom.toUpperCase()} · affranchir international` });
  const langues = languesDeLaCommande(o);
  if (langues.length) c.push({ k: "langue", tone: "bad", lib: `🌐 Gravure en ${nomsLangues(langues)} · pas en français : texte et fichier à graver dans « À graver »` });
  if (unread) c.push({ k: "reponse", tone: "info", lib: "Nouvelle réponse de la cliente" });
  if (o.cadeauChoix) c.push({ k: "cadeau", tone: "gold", lib: (o.cadeauPromis ? "Cadeau PROMIS : " : "Cadeau à glisser : ") + cadeauTexte(o) + (Number(o.total) >= 80 ? " · ≥ 80 € = deux cadeaux" : "") });
  if (Array.isArray(o.alerteImage) && o.alerteImage.length) c.push({ k: "dateimage", tone: "warn", lib: "Date dans l'image · à regarder avant de graver" });
  if (o.alerteInterne) c.push({ k: "alerte", tone: "bad", lib: o.alerteInterne });
  if (o.surMesure || o.demande) c.push({ k: "surmesure", tone: "gold", lib: `Sur mesure${o.quoteNumber ? ` · devis ${o.quoteNumber}` : ""}` });
  if (o.alerteEmail || o.emailCorrigeDe) c.push({ k: "emailfix", tone: "warn", lib: o.alerteEmail || `E-mail corrigé (« ${o.emailCorrigeDe} »)` });
  if (o.test) c.push({ k: "test", tone: "grey", lib: "Commande test (non comptée)" });
  return c;
}

// Pastille « Venue de : Instagram » (09/11/2026). Ancienne commande sans provenance = null (aucune pastille).
export function pastilleProvenance(o) {
  const s = sourceDe(o, "premiere");
  if (!s) return null;
  const p = provenanceDe(o);
  const extra = [detailVisite(s.visite)];
  const d = p.derniere ? sourceDe(o, "derniere") : null;
  if (d && (d.cle !== s.cle || d.nom !== s.nom)) extra.push(`puis revenue par ${d.nom}`);
  return { cle: s.cle, nom: s.nom, couleur: couleurSource(s.cle), extra: extra.filter(Boolean).join(" · ") };
}
// Filtre « Provenance » de la file : "" = toutes, une clé de source, ou "inconnue" (non relevée).
export function passeProvenance(o, cle) {
  if (!cle) return true;
  const s = sourceDe(o, "premiere");
  return cle === "inconnue" ? !s : Boolean(s) && s.cle === cle;
}
// Les choix du filtre : seulement les sources présentes dans les commandes chargées.
export function choixProvenance(orders) {
  const vues = new Set((orders || []).map((o) => sourceDe(o, "premiere")?.cle || "inconnue"));
  const l = ORDRE_SOURCES.filter((k) => vues.has(k)).map((k) => [k, nomSource(k)]);
  if (vues.has("inconnue") && l.length) l.push(["inconnue", "Non relevée"]);
  return l;
}

export function rechercheTexte(o) {
  return [o.ref, o.id, o.customerName, o.customerEmail, o.customerPhone, o.relaisPoint, o.quoteNumber, ...(o.items || []).map((i) => `${i.name} ${i.details || ""} ${i.personalization || ""}`)].filter(Boolean).join(" ").toLowerCase();
}

export const FILTRES = [
  { id: "express", lib: "Express", ic: "bolt" },
  { id: "relais", lib: "Point relais", ic: "pin" },
  { id: "cadeau", lib: "Cadeau", ic: "gift" },
  { id: "reponse", lib: "Réponse cliente", ic: "mail" },
  { id: "etranger", lib: "Hors France", ic: "flag" },
  { id: "alerte", lib: "Alerte", ic: "alert" },
  { id: "langue", lib: "Autre langue", ic: "flag" },
];
export function passeFiltre(o, f, unread) {
  switch (f) {
    case "express": return estExpress(o);
    case "relais": return modeDe(o).k === "relais";
    case "cadeau": return Boolean(o.cadeauChoix) || (o.flags || []).includes("cadeau");
    case "reponse": return Boolean(unread);
    case "etranger": return paysDeLaCommande(o).etranger;
    case "langue": return languesDeLaCommande(o).length > 0;
    case "alerte": return Boolean(o.alerteInterne) || (Array.isArray(o.alerteImage) && o.alerteImage.length > 0) || (o.flags || []).includes("urgent") || Boolean(o.alerteEmail || o.emailCorrigeDe);
    case "late": return etatDelai(o).k === "late";
    default: return true;
  }
}

export const TRIS = [["ordre", "Tri : ordre de traitement"], ["limite", "Tri : date limite"], ["recent", "Tri : plus récentes"], ["montant", "Tri : montant"]];
export function trier(list, sort) {
  const l = [...list];
  if (sort === "limite") l.sort((a, b) => RANG_DELAI[etatDelai(a).k] - RANG_DELAI[etatDelai(b).k] || Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0));
  else if (sort === "recent") l.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
  else if (sort === "montant") l.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
  else l.sort(ordreTraitement);
  return l;
}

// Jours du CALENDRIER à l'heure française (12/10/2026).
const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const numJour = (t) => Math.round(Date.parse(JOUR_PARIS.format(new Date(t)) + "T00:00:00Z") / 86400000);
export function ageDe(iso) {
  const t = Date.parse(iso || ""); if (!t) return "";
  const j = numJour(Date.now()) - numJour(t);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  return `il y a ${j} j`;
}
export function dateFr(iso, heure = true) {
  const d = new Date(iso || ""); if (Number.isNaN(d.getTime())) return "";
  const j = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: heure ? undefined : "numeric", timeZone: "Europe/Paris" });
  return heure ? `${j} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}` : j;
}
export const refDe = (o) => o?.ref || String(o?.id || "").slice(-6);
export const hrefFiche = (o) => `/gestion/commande/${encodeURIComponent(refDe(o))}`;

// Adresse de livraison sur une ligne (étiquette), nom et société compris.
export function adresseLigne(o) {
  const a = o?.shippingAddress; if (!a) return "";
  return [o.shippingName, o.shippingCompany, a.line1, a.line2, `${a.postal_code || ""} ${a.city || ""}`.trim(), a.country].filter(Boolean).join(", ");
}
