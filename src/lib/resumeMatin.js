// =============================================================================
// RÉSUMÉ DU MATIN (08/11/2026) — un e-mail au gérant, chaque matin, à l'heure réglée.
// -----------------------------------------------------------------------------
// Réglage : settings.notifications = { resumeMatin, heure: "07:30", joursOff: [0..6] }
// (Gestion → Réglages → Notifications & résumés). Lancé par le battement du site
// (`runResumeMatin`, toutes les 15 min) : il part UNE fois par jour, dans le quart
// d'heure qui suit l'heure choisie, jamais un jour coché « sans résumé ».
// Contenu : commandes à préparer / en fabrication, à expédier aujourd'hui ou en
// retard (jours ouvrés, `delaiCommande`), Express en attente, réponses de clientes
// à valider, matériel sous le seuil, ce qui a changé hier (journal), CA de la
// veille et du mois. `construireResume` est PUR (aucune lecture) : l'écran l'utilise
// pour l'aperçu. Destinataire = l'atelier (BRAND.contact), jamais une cliente.
// =============================================================================
import { getSettings, getJobNote, setJobNote, listPendingReplies, getMateriel, getJournal } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { sendEmail, emailLayout, escapeHtml as esc, BRAND } from "@/lib/email";
import { delaiCommande, jourFr } from "@/lib/delaiCommande";
import { estActive, estExpress, statutDe, refDe, euro } from "@/lib/fileCommandes";

export const CLE_RESUME = "resumeMatin";

// --- heure de Paris ------------------------------------------------------------
export const jourParis = (t) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(t)); // AAAA-MM-JJ
const JOURS_EN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
/** Jour de la semaine à Paris : 0 = dimanche … 6 = samedi (convention JavaScript). */
export const jourSemaineParis = (t) => JOURS_EN[new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(new Date(t))] ?? new Date(t).getDay();
/** Minutes écoulées depuis minuit, heure de Paris. */
export function minutesParis(t) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(t));
  const h = parseInt(p.find((x) => x.type === "hour")?.value || "0", 10);
  const m = parseInt(p.find((x) => x.type === "minute")?.value || "0", 10);
  return h * 60 + m;
}
export function minutesDe(heure) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(heure || "").trim());
  if (!m) return 7 * 60 + 30;
  return Math.min(23, parseInt(m[1], 10)) * 60 + Math.min(59, parseInt(m[2], 10));
}
const dateLongue = (t) => new Date(t).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const heureCourte = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");

// --- petits utilitaires --------------------------------------------------------
const PAS_VENTE = new Set(["annulee", "remboursee"]);
const articleDe = (o) => {
  const it = Array.isArray(o?.items) ? o.items.filter(Boolean) : [];
  if (!it.length) return o?.quoteNumber ? `devis ${o.quoteNumber}` : "—";
  const n = it.reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  return it[0].name ? `${it[0].name}${n > 1 ? ` (+${n - 1})` : ""}` : "—";
};
const valeur = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
  if (typeof v === "string") return v.length > 40 ? v.slice(0, 37) + "…" : v;
  if (v && typeof v === "object" && v.resume) return v.resume;
  const s = JSON.stringify(v);
  return s.length > 40 ? s.slice(0, 37) + "…" : s;
};

/**
 * Construit le résumé (PUR : aucune lecture, aucun envoi).
 * @param {{ orders?: any[], settings?: any, pending?: any[], journal?: any[], materiel?: any[], now?: number }} p
 * @returns {{ sujet, html, texte, points }}
 */
export function construireResume({ orders = [], settings = {}, pending = [], journal = [], materiel = [], now = Date.now() } = {}) {
  const site = BRAND.siteUrl || "https://nivcreation.fr";
  const cmds = (Array.isArray(orders) ? orders : []).filter((o) => o && !o.test);
  const parDate = (a, b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0);

  // Commandes
  const aPreparer = cmds.filter((o) => statutDe(o) === "a_preparer").sort(parDate);
  const enFab = cmds.filter((o) => statutDe(o) === "en_gravure");
  const actives = cmds.filter(estActive);
  const retard = [], aujourdHui = [], demain = [];
  for (const o of actives) {
    const d = delaiCommande(o, now);
    if (!d || d.etat === "parti") continue;
    const ligne = { ref: refDe(o), cliente: o.customerName || o.customerEmail || "—", limite: jourFr(d.limite), ouvres: d.ouvresRestants };
    if (d.etat === "depasse") retard.push(ligne);
    else if (d.ouvresRestants === 0) aujourdHui.push(ligne);
    else if (d.ouvresRestants === 1) demain.push(ligne);
  }
  const express = actives.filter(estExpress);

  // Réponses à valider
  const aValider = (Array.isArray(pending) ? pending : []).filter((r) => r && (r.status || "pending") === "pending");

  // Matériel sous le seuil
  const bas = (Array.isArray(materiel) ? materiel : []).filter((m) => m && !m.archive && typeof m.stock === "number" && (m.stock === 0 || (Number(m.seuil) > 0 && m.stock <= Number(m.seuil))));

  // Hier (journal + CA)
  const hierJour = jourParis(now - 86400000);
  const moisCourant = jourParis(now).slice(0, 7);
  const changes = (Array.isArray(journal) ? journal : []).filter((e) => e && Number(e.at) && jourParis(e.at) === hierJour);
  const ventesHier = cmds.filter((o) => !PAS_VENTE.has(o.status) && o.createdAt && jourParis(Date.parse(o.createdAt)) === hierJour);
  const ventesMois = cmds.filter((o) => !PAS_VENTE.has(o.status) && o.createdAt && jourParis(Date.parse(o.createdAt)).slice(0, 7) === moisCourant);
  const somme = (l) => l.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const caHier = somme(ventesHier), caMois = somme(ventesMois);

  const points = [
    { k: "aPreparer", n: aPreparer.length, lib: "à préparer" },
    { k: "enFab", n: enFab.length, lib: "en fabrication" },
    { k: "retard", n: retard.length, lib: "en retard" },
    { k: "aujourdHui", n: aujourdHui.length, lib: "à expédier aujourd'hui" },
    { k: "express", n: express.length, lib: "Express en attente" },
    { k: "aValider", n: aValider.length, lib: "réponses à valider" },
    { k: "materiel", n: bas.length, lib: "matériel à racheter" },
    { k: "changes", n: changes.length, lib: "changements hier" },
    { k: "caHier", n: Math.round(caHier * 100) / 100, lib: "CA d'hier" },
    { k: "caMois", n: Math.round(caMois * 100) / 100, lib: "CA du mois" },
  ];

  // --- sujet -------------------------------------------------------------------
  const bouts = [];
  bouts.push(`${aPreparer.length} à préparer`);
  if (retard.length) bouts.push(`${retard.length} en retard`);
  if (aujourdHui.length) bouts.push(`${aujourdHui.length} à expédier aujourd'hui`);
  if (express.length) bouts.push(`${express.length} Express`);
  if (aValider.length) bouts.push(`${aValider.length} réponse${aValider.length > 1 ? "s" : ""} à valider`);
  const sujet = `${retard.length || express.length ? "🔴" : "☀️"} Résumé du ${dateLongue(now)} : ${bouts.join(" · ")}`;

  // --- texte --------------------------------------------------------------------
  const T = [];
  T.push(`Résumé du ${dateLongue(now)}`);
  T.push("");
  T.push(`Commandes : ${aPreparer.length} à préparer · ${enFab.length} en fabrication`);
  for (const o of aPreparer.slice(0, 3)) T.push(`  - #${refDe(o)} · ${o.customerName || o.customerEmail || "—"} · ${articleDe(o)}`);
  if (aPreparer.length > 3) T.push(`  … et ${aPreparer.length - 3} autre${aPreparer.length - 3 > 1 ? "s" : ""}`);
  T.push("");
  if (retard.length) { T.push(`EN RETARD (date limite dépassée, jours ouvrés) : ${retard.length}`); for (const l of retard) T.push(`  - #${l.ref} · ${l.cliente} · limite ${l.limite} · dépassé de ${-l.ouvres} j ouvré${-l.ouvres > 1 ? "s" : ""}`); }
  if (aujourdHui.length) { T.push(`À expédier AUJOURD'HUI : ${aujourdHui.length}`); for (const l of aujourdHui) T.push(`  - #${l.ref} · ${l.cliente} · limite ${l.limite}`); }
  if (demain.length) T.push(`À expédier demain : ${demain.length} (${demain.map((l) => "#" + l.ref).join(", ")})`);
  if (!retard.length && !aujourdHui.length) T.push("Aucune commande à expédier aujourd'hui, aucune en retard.");
  T.push(`Express en attente : ${express.length}${express.length ? " (" + express.map((o) => "#" + refDe(o)).join(", ") + ") — à graver en priorité" : ""}`);
  T.push("");
  T.push(`Réponses de clientes à valider : ${aValider.length}`);
  for (const r of aValider.slice(0, 3)) T.push(`  - ${r.name || r.email}${r.orderRef ? " · #" + r.orderRef : ""}${r.subject ? " · " + r.subject : ""}`);
  T.push("");
  T.push(`Matériel sous le seuil : ${bas.length}`);
  for (const m of bas.slice(0, 5)) T.push(`  - ${m.nom}${m.court ? "" : ""} · reste ${m.stock}${Number(m.seuil) > 0 ? ` (seuil ${m.seuil})` : ""}`);
  T.push("");
  T.push(`Hier dans Gestion : ${changes.length} changement${changes.length > 1 ? "s" : ""}`);
  for (const e of changes.slice(0, 3)) T.push(`  - ${e.label || e.cible} : ${valeur(e.avant)} → ${valeur(e.apres)}${e.par ? " (" + e.par + ")" : ""}`);
  T.push("");
  T.push(`Chiffre d'affaires : hier ${euro(caHier)} (${ventesHier.length} commande${ventesHier.length > 1 ? "s" : ""}) · ce mois ${euro(caMois)} (${ventesMois.length} commande${ventesMois.length > 1 ? "s" : ""})`);
  const texte = T.join("\n");

  // --- html ---------------------------------------------------------------------
  const or = BRAND.gold || "#a98935";
  const h2 = (t) => `<h2 style="margin:22px 0 8px;font-family:Georgia,serif;font-weight:normal;font-size:17px;color:${or};border-bottom:1px solid #ece3d2;padding-bottom:4px;">${t}</h2>`;
  const ul = (items) => (items.length ? `<ul style="margin:6px 0 0 18px;padding:0;">${items.map((x) => `<li style="margin:3px 0;">${x}</li>`).join("")}</ul>` : "");
  const lien = (href, t) => `<a href="${site}${href}" style="color:${or};font-weight:700;text-decoration:none;">${t}</a>`;
  const ficheLien = (ref) => lien(`/gestion/commande/${encodeURIComponent(ref)}`, `#${esc(ref)}`);
  const chiffre = (n, lib, tone) => `<td style="padding:8px 10px;text-align:center;border:1px solid #ece3d2;border-radius:10px;background:${tone === "bad" && n ? "#fdeeee" : "#faf6ee"};"><div style="font-size:22px;font-weight:700;color:${tone === "bad" && n ? "#b3261e" : BRAND.ink};">${n}</div><div style="font-size:11px;color:#7a6d58;text-transform:uppercase;letter-spacing:.04em;">${lib}</div></td>`;

  let b = "";
  b += `<p style="margin:0 0 14px;color:#5a5048;">Voici où en est l'atelier ce matin.</p>`;
  b += `<table role="presentation" cellpadding="0" cellspacing="6" style="width:100%;border-collapse:separate;"><tr>${chiffre(aPreparer.length, "à préparer")}${chiffre(enFab.length, "en fabrication")}${chiffre(retard.length, "en retard", "bad")}${chiffre(aujourdHui.length, "à expédier aujourd'hui", "bad")}</tr></table>`;

  b += h2("Commandes à préparer");
  b += aPreparer.length
    ? ul(aPreparer.slice(0, 3).map((o) => `${ficheLien(refDe(o))} · ${esc(o.customerName || o.customerEmail || "—")} · ${esc(articleDe(o))}`)) + (aPreparer.length > 3 ? `<p style="margin:6px 0 0;color:#7a6d58;font-size:13px;">… et ${aPreparer.length - 3} autre${aPreparer.length - 3 > 1 ? "s" : ""} dans la file.</p>` : "")
    : `<p style="margin:6px 0 0;color:#7a6d58;">Rien à préparer.</p>`;

  b += h2("Dates limites (jours ouvrés)");
  if (retard.length) b += `<p style="margin:6px 0 2px;color:#b3261e;font-weight:700;">En retard : ${retard.length}</p>` + ul(retard.map((l) => `${ficheLien(l.ref)} · ${esc(l.cliente)} · limite ${esc(l.limite)} · dépassé de ${-l.ouvres} j ouvré${-l.ouvres > 1 ? "s" : ""}`));
  if (aujourdHui.length) b += `<p style="margin:10px 0 2px;color:#8a5a00;font-weight:700;">À expédier aujourd'hui : ${aujourdHui.length}</p>` + ul(aujourdHui.map((l) => `${ficheLien(l.ref)} · ${esc(l.cliente)} · limite ${esc(l.limite)}`));
  if (demain.length) b += `<p style="margin:10px 0 0;color:#5a5048;">À expédier demain : ${demain.length} (${demain.map((l) => ficheLien(l.ref)).join(", ")})</p>`;
  if (!retard.length && !aujourdHui.length) b += `<p style="margin:6px 0 0;color:#7a6d58;">Aucune commande à expédier aujourd'hui, aucune en retard.</p>`;
  b += `<p style="margin:10px 0 0;">Express en attente : <b>${express.length}</b>${express.length ? ` — ${express.map((o) => ficheLien(refDe(o))).join(", ")} · à graver en priorité` : ""}</p>`;

  b += h2("Réponses de clientes à valider");
  b += aValider.length
    ? ul(aValider.slice(0, 3).map((r) => `${esc(r.name || r.email)}${r.orderRef ? " · #" + esc(r.orderRef) : ""}${r.subject ? " · " + esc(r.subject) : ""}`)) + `<p style="margin:8px 0 0;">${lien("/gestion/assistant", "Relire et envoyer →")}</p>`
    : `<p style="margin:6px 0 0;color:#7a6d58;">Aucune réponse en attente.</p>`;

  b += h2("Matériel à racheter");
  b += bas.length
    ? ul(bas.slice(0, 6).map((m) => `${esc(m.nom)} · reste <b>${m.stock}</b>${Number(m.seuil) > 0 ? ` (seuil ${m.seuil})` : ""}`)) + `<p style="margin:8px 0 0;">${lien("/gestion/materiel", "Ouvrir Matériel →")}</p>`
    : `<p style="margin:6px 0 0;color:#7a6d58;">Rien sous le seuil.</p>`;

  b += h2("Hier dans Gestion");
  b += changes.length
    ? `<p style="margin:6px 0 2px;">${changes.length} changement${changes.length > 1 ? "s" : ""} :</p>` + ul(changes.slice(0, 3).map((e) => `${esc(e.label || e.cible)} : <span style="color:#7a6d58;">${esc(valeur(e.avant))}</span> → <b>${esc(valeur(e.apres))}</b>${e.par ? ` <span style="color:#7a6d58;">(${esc(e.par)})</span>` : ""}`)) + (changes.length > 3 ? `<p style="margin:6px 0 0;">${lien("/gestion/journal", "Voir le journal →")}</p>` : "")
    : `<p style="margin:6px 0 0;color:#7a6d58;">Aucun changement hier.</p>`;

  b += h2("Chiffre d'affaires");
  b += `<p style="margin:6px 0 0;">Hier : <b>${esc(euro(caHier))}</b> (${ventesHier.length} commande${ventesHier.length > 1 ? "s" : ""}) · Ce mois : <b>${esc(euro(caMois))}</b> (${ventesMois.length} commande${ventesMois.length > 1 ? "s" : ""})</p>`;

  b += `<p style="margin:26px 0 0;">${lien("/gestion/commandes", "Ouvrir la file de production →")}</p>`;
  b += `<p style="margin:14px 0 0;font-size:12px;color:#9b8f7a;">Résumé envoyé par le site à l'heure réglée dans Gestion → Réglages → Notifications &amp; résumés.</p>`;

  const html = emailLayout({ heading: `Résumé du ${esc(dateLongue(now))}`, bodyHtml: b });
  return { sujet, html, texte, points };
}

// --- lectures partagées ---------------------------------------------------------
async function lireDonnees() {
  const [orders, settings, pending, journal, mat] = await Promise.all([
    getSiteOrders(300).catch(() => null),
    getSettings(true).catch(() => ({})),
    listPendingReplies().catch(() => []),
    getJournal(true).catch(() => []),
    getMateriel(true).catch(() => ({ items: [] })),
  ]);
  return { orders: orders || [], settings: settings || {}, pending, journal, materiel: mat?.items || [] };
}

/** Le résumé tel qu'il partirait maintenant, SANS l'envoyer (aperçu de l'écran). */
export async function resumeDuJour(now = Date.now()) {
  const d = await lireDonnees();
  return construireResume({ ...d, now });
}

/**
 * Tâche du battement : envoie le résumé du matin au gérant si l'heure est venue.
 * `force` (bouton « M'envoyer le résumé maintenant ») ignore la case, l'heure, les
 * jours sans résumé et le « déjà envoyé aujourd'hui ».
 */
export async function runResumeMatin(now = Date.now(), { force = false } = {}) {
  const settings = await getSettings(true).catch(() => ({}));
  const n = settings?.notifications || {};
  const jour = jourParis(now);
  if (!force) {
    if (!n.resumeMatin) return { skipped: "off" };
    const joursOff = Array.isArray(n.joursOff) ? n.joursOff.map((x) => parseInt(x, 10)) : [];
    if (joursOff.includes(jourSemaineParis(now))) return { skipped: "jour sans résumé", jour };
    if (minutesParis(now) < minutesDe(n.heure)) return { attente: true, heure: n.heure || "07:30" };
    const dernier = await getJobNote(CLE_RESUME, true).catch(() => null);
    if (dernier?.jour === jour) return { skipped: "déjà envoyé aujourd'hui", at: dernier.at };
  }
  const d = await lireDonnees();
  const r = construireResume({ ...d, settings, now });
  const envoi = await sendEmail({ to: BRAND.contact, subject: r.sujet, html: r.html }).catch((e) => ({ ok: false, error: e.message }));
  const ok = envoi?.ok !== false;
  const note = { jour, at: Date.now(), ok, force, points: r.points, ...(ok ? {} : { erreur: String(envoi?.error || "envoi refusé").slice(0, 300) }) };
  await setJobNote(CLE_RESUME, note).catch(() => {});
  return { ok, points: r.points, at: note.at, erreur: note.erreur };
}
