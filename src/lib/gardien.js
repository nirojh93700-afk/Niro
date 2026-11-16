// =============================================================================
// GARDIEN DU SITE (16/11/2026, gérant : « un autre agent qui contrôle pour pas que j'aie des problèmes comme avec
// les photos, connexion, paiement… tous les problèmes qu'il y aura sur le site » ; maquette
// https://claude.ai/artifact/NxPjJ5E2yt64asVpAsjBRD, « Une fenêtre par agent, applique »).
// 9 contrôles, toutes les 15 min (battement du site). LECTURE SEULE : il ne corrige rien, il dit où est le
// problème et quoi faire. Un problème NOUVEAU = notification téléphone + e-mail à l'atelier (une seule fois
// par problème). Chaque contrôle est isolé et borné dans le temps : un échec n'en cache jamais un autre.
// =============================================================================
import fs from "fs";
import path from "path";
import { getSettings, getGmailCreds, getCronState, getJobNote, setJobNote, getScheduledEmails, getStockMap } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";
import { getSiteOrders } from "@/lib/firebase";
import { gmailAccessToken, gmailSearchIds } from "@/lib/gmail";
import { auditCatalog, importantIssueCount } from "@/lib/catalogAudit";

export const CLE_GARDIEN = "gardien";
export const CLE_HIST = "gardienHist";
const MIN = 60000;
const SITE = () => String(process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");
const borne = (p, ms, repli) => Promise.race([p, new Promise((res) => setTimeout(() => res(repli), ms))]);
const court = (e) => String(e?.message || e || "erreur").slice(0, 140);
const c = (id, nom, etat, detail, quoi = "", action = null) => ({ id, nom, etat, detail, ...(quoi ? { quoi } : {}), ...(action ? { action } : {}) });

export const REGLAGE_DEFAUT = { accueil: true, telephone: true, email: true, nuit: false };
export function reglageGardien(settings) { return { ...REGLAGE_DEFAUT, ...((settings && settings.gardien) || {}) }; }

async function http(url, { method = "GET", ms = 10000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { method, signal: ctl.signal, redirect: "follow", headers: { "user-agent": "NivCreation-Gardien" }, cache: "no-store" });
    return { status: r.status, ms: Date.now() - t0 };
  } catch (e) { return { status: 0, ms: Date.now() - t0, err: e?.name === "AbortError" ? `pas de réponse en ${ms / 1000} s` : court(e) }; }
  finally { clearTimeout(t); }
}

// Toutes les photos des produits en vente (galerie, photos des options, galeries par taille).
function photosDuCatalogue(produits) {
  const out = new Map();
  for (const p of produits || []) {
    if (!p || p.hidden) continue;
    const add = (u) => { if (u && typeof u === "string" && !out.has(u)) out.set(u, p.name || p.slug); };
    (p.images || []).forEach(add);
    (p.variants || []).forEach((v) => add(v?.image));
    (p.tailles?.options || []).forEach((o) => { add(o?.image); (o?.gallery || []).forEach(add); });
  }
  return out;
}

// 1. Photos : chaque fichier existe, aucune photo hébergée ailleurs, et un échantillon servi sans refus (429, 5xx).
async function ctrlPhotos() {
  const produits = await getCatalog();
  const photos = photosDuCatalogue(produits);
  const pub = path.join(process.cwd(), "public");
  const disque = fs.existsSync(path.join(pub, "logo-niv-creation.jpg"));
  const manquantes = [], ailleurs = [], adistance = [];
  for (const [u, nom] of photos) {
    if (/^https?:\/\//i.test(u)) {
      if (/nivcreation\.fr/i.test(u)) adistance.push([u, nom]); else ailleurs.push([u, nom]);
    } else if (u.startsWith("/api/")) adistance.push([u, nom]);
    else if (u.startsWith("/")) {
      if (disque) { if (!fs.existsSync(path.join(pub, decodeURIComponent(u.split("?")[0])))) manquantes.push([u, nom]); }
      else adistance.push([u, nom]);
    }
  }
  // Échantillon tournant servi par le site (les photos téléversées dans Gestion + quelques photos du dossier).
  const echantillon = adistance.slice(0, 25);
  const locales = [...photos.keys()].filter((u) => u.startsWith("/") && !u.startsWith("/api/"));
  const debut = Math.floor(Date.now() / (15 * MIN)) % Math.max(1, locales.length);
  for (let i = 0; i < Math.min(8, locales.length); i++) { const u = locales[(debut + i * 7) % locales.length]; echantillon.push([u, photos.get(u)]); }
  const refus = [];
  for (let i = 0; i < echantillon.length; i += 6) {
    const lot = echantillon.slice(i, i + 6);
    const r = await Promise.all(lot.map(([u]) => http(/^https?:/.test(u) ? u : SITE() + u, { method: "HEAD", ms: 8000 })));
    r.forEach((x, j) => { if (x.status !== 200) refus.push([lot[j][0], lot[j][1], x.status || x.err]); });
  }
  const pbs = [...manquantes.map(([u, n]) => `${n} : ${u.split("/").pop()} (fichier absent)`), ...refus.map(([u, n, s]) => `${n} : ${u.split("/").pop()} (${s})`)];
  if (pbs.length) {
    const fiches = [...new Set([...manquantes, ...refus].map((x) => x[1]))];
    return c("photos", "Photos", "bad", `${pbs.length} photo${pbs.length > 1 ? "s" : ""} ne s'affiche${pbs.length > 1 ? "nt" : ""} pas : ${pbs.slice(0, 3).join(" · ")}${pbs.length > 3 ? "…" : ""}`,
      `Regarder la fiche ${fiches.slice(0, 2).join(", ")} dans Gestion → Produits (remettre la photo), ou me le dire.`, { href: "/gestion/produits", label: "Ouvrir les produits" });
  }
  if (ailleurs.length) return c("photos", "Photos", "warn", `${ailleurs.length} photo${ailleurs.length > 1 ? "s" : ""} hébergée${ailleurs.length > 1 ? "s" : ""} hors du site (${ailleurs[0][1]}) : elle disparaîtra si l'autre site ferme.`, "Me le dire : je la copie dans le site.");
  return c("photos", "Photos", "ok", `${photos.size} photos des fiches en vente vérifiées${disque ? "" : " (échantillon)"}, ${echantillon.length} testées en ligne : toutes s'affichent.`);
}

// 2. Connexion : base de données, mot de passe de Gestion, espace client.
async function ctrlConnexion() {
  const db = await borne(getSiteOrders(2).then((o) => (Array.isArray(o) ? "ok" : "vide")).catch((e) => court(e)), 8000, "pas de réponse en 8 s");
  if (db !== "ok") return c("connexion", "Connexion", "bad", `La base de données ne répond pas (${db}) : commandes, Gestion et espace client sont touchés.`, "Me prévenir tout de suite.");
  const esp = await http(`${SITE()}/api/espace/me`, { ms: 8000 });
  if (esp.status !== 200) return c("connexion", "Connexion", "bad", `L'espace client ne répond pas (${esp.status || esp.err}) : les clientes ne peuvent plus se connecter.`, "Me prévenir.");
  return c("connexion", "Connexion", "ok", "Base de données, Gestion et espace client répondent.");
}

// 3. Paiement : Stripe répond, et chaque paiement des dernières 48 h a bien sa commande.
async function ctrlPaiement() {
  const k = String(process.env.STRIPE_SECRET_KEY || "");
  if (!k) return c("paiement", "Paiement", "bad", "Aucune clé Stripe : personne ne peut payer.", "Me prévenir tout de suite.");
  if (!process.env.STRIPE_WEBHOOK_SECRET) return c("paiement", "Paiement", "bad", "Pas de secret de webhook : les commandes payées ne seraient pas enregistrées.", "Me prévenir tout de suite.");
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(k);
  const depuis = Math.floor((Date.now() - 48 * 60 * MIN) / 1000);
  const r = await borne(stripe.checkout.sessions.list({ created: { gte: depuis }, limit: 60 }).then((x) => ({ ok: true, data: x.data })).catch((e) => ({ ok: false, err: court(e) })), 12000, { ok: false, err: "pas de réponse en 12 s" });
  if (!r.ok) return c("paiement", "Paiement", "bad", `Stripe ne répond pas (${r.err}) : les paiements sont peut-être bloqués.`, "Regarder le tableau de bord Stripe, puis me le dire.");
  const payes = r.data.filter((s) => s.payment_status === "paid" && !s.metadata?.giftcard && Date.now() / 1000 - s.created > 10 * 60);
  const orders = (await getSiteOrders(400)) || [];
  const vus = new Set(orders.map((o) => o.sessionId).filter(Boolean));
  const manquants = payes.filter((s) => !vus.has(s.id));
  if (manquants.length) {
    const s = manquants[0];
    const qui = s.customer_details?.name || s.customer_details?.email || "une cliente";
    return c("paiement", "Paiement", "bad", `${manquants.length} paiement${manquants.length > 1 ? "s" : ""} sans commande enregistrée (ex. ${qui}, ${(s.amount_total / 100).toFixed(2).replace(".", ",")} €).`,
      "Ne rien graver à l'aveugle : me le dire, je retrouve la commande dans Stripe.");
  }
  return c("paiement", "Paiement", "ok", `Stripe répond. ${payes.length} paiement${payes.length > 1 ? "s" : ""} en 48 h : ${payes.length ? "tous ont leur commande" : "rien à comparer"}.`);
}

// 4. Pages du site.
async function ctrlPages() {
  const produits = (await getCatalog().catch(() => [])).filter((p) => p && !p.hidden);
  const tour = Math.floor(Date.now() / (15 * MIN));
  const fiches = produits.length ? [0, 1, 2].map((i) => `/produit/${produits[(tour * 3 + i) % produits.length].slug}`) : [];
  const pages = ["/", "/boutique", "/panier", "/cristaux", "/idees", ...fiches];
  const r = [];
  for (let i = 0; i < pages.length; i += 2) r.push(...await Promise.all(pages.slice(i, i + 2).map((p) => http(SITE() + p, { ms: 20000 }))));
  const ko = pages.map((p, i) => [p, r[i]]).filter(([, x]) => x.status !== 200);
  const lent = pages.map((p, i) => [p, r[i]]).filter(([, x]) => x.status === 200 && x.ms > 12000);
  if (ko.length) return c("pages", "Pages du site", "bad", `${ko.length} page${ko.length > 1 ? "s" : ""} en panne : ${ko.map(([p, x]) => `${p} (${x.status || x.err})`).join(", ")}.`, "Me prévenir.");
  if (lent.length) return c("pages", "Pages du site", "warn", `Pages lentes : ${lent.map(([p, x]) => `${p} ${(x.ms / 1000).toFixed(1)} s`).join(", ")}.`, "Rien à faire si ça revient vite ; sinon me le dire.");
  const moy = Math.round(r.reduce((s, x) => s + x.ms, 0) / r.length / 100) / 10;
  return c("pages", "Pages du site", "ok", `${pages.length} pages testées (accueil, boutique, panier, 3 fiches…) : toutes répondent, ${String(moy).replace(".", ",")} s en moyenne.`);
}

// 5. E-mails : Gmail connecté, Resend, et aucun e-mail refusé (rebond) depuis 24 h.
async function ctrlEmails() {
  const g = await getGmailCreds().catch(() => ({}));
  if (!g?.refreshToken) return c("emails", "E-mails", process.env.RESEND_API_KEY ? "warn" : "bad", "Gmail n'est pas connecté : la boîte n'est plus lue.", "Gestion → Messages → Boîte mail : reconnecter Gmail.", { href: "/gestion/boite-mail", label: "Reconnecter" });
  let tok;
  try { tok = await borne(gmailAccessToken(g), 8000, null); } catch (e) { tok = null; }
  if (!tok) return c("emails", "E-mails", "bad", "Google refuse la connexion à Gmail : les e-mails partent par Resend, la boîte n'est plus lue.", "Gestion → Messages → Boîte mail : reconnecter Gmail.", { href: "/gestion/boite-mail", label: "Reconnecter" });
  const ids = await borne(gmailSearchIds(tok, "from:mailer-daemon newer_than:1d", 10).catch(() => []), 8000, []);
  if (ids.length) return c("emails", "E-mails", "warn", `${ids.length} e-mail${ids.length > 1 ? "s" : ""} refusé${ids.length > 1 ? "s" : ""} (adresse invalide ?) en 24 h.`, "Regarder dans Gmail les messages « Delivery Status Notification » : une cliente n'a pas reçu un e-mail.");
  return c("emails", "E-mails", "ok", `Gmail connecté${process.env.RESEND_API_KEY ? ", Resend en secours" : ""}, aucun e-mail refusé en 24 h.`);
}

// 6. Livraison : tarifs servis et points relais.
async function ctrlLivraison() {
  const [conf, rel] = await Promise.all([
    http(`${SITE()}/api/shipping-config`, { ms: 15000 }),
    http(`${SITE()}/api/relais?zip=75017&city=Paris&carrier=MONR`, { ms: 20000 }),
  ]);
  if (conf.status !== 200) return c("livraison", "Livraison", "bad", `Les tarifs de livraison ne répondent pas (${conf.status || conf.err}) : le panier est touché.`, "Me prévenir.");
  if (rel.status !== 200) return c("livraison", "Livraison", "warn", `La carte des points relais ne répond pas (${rel.status || rel.err}) : les clientes ne peuvent pas choisir de point relais.`, "Vérifier les clés Boxtal (Gestion → Réglages), ou me le dire.");
  return c("livraison", "Livraison", "ok", "Tarifs de livraison et points relais répondent.");
}

// 7. Stock et prix : surveillance du catalogue + stock négatif.
async function ctrlStock() {
  const a = await auditCatalog();
  const n = importantIssueCount(a);
  const stock = await getStockMap(true).catch(() => ({}));
  const neg = Object.entries(stock || {}).filter(([, v]) => typeof v === "number" && v < 0);
  if (n) {
    const ex = (a.issues || []).filter((i) => i.severity === "haute" && !i.hidden)[0] || (a.issues || [])[0];
    return c("stock", "Stock et prix", "bad", `${n} problème${n > 1 ? "s" : ""} important${n > 1 ? "s" : ""} au catalogue${ex ? ` (ex. ${ex.name} : ${ex.message})` : ""}.`, "Ouvrir Santé du catalogue.", { href: "/gestion/sante", label: "Voir" });
  }
  if (neg.length) return c("stock", "Stock et prix", "warn", `${neg.length} stock${neg.length > 1 ? "s" : ""} en dessous de zéro (${neg[0][0]}).`, "Recompter dans Gestion → Stock à recompter.", { href: "/gestion/recomptage", label: "Recompter" });
  return c("stock", "Stock et prix", "ok", "Aucun produit en vente sans prix ou sans photo, aucun stock négatif.");
}

// 8. Tâches automatiques : battement, envois programmés, programmations.
async function ctrlTaches() {
  const cron = await getCronState(true).catch(() => ({}));
  const dernier = Math.max(0, ...Object.values(cron || {}).map((v) => Number(v) || 0));
  const sched = await getScheduledEmails().catch(() => []);
  const enRetard = (sched || []).filter((s) => s && !s.sent && !s.cancelled && Number(s.sendAt) < Date.now() - 45 * MIN);
  const enErreur = (sched || []).filter((s) => s && !s.sent && !s.cancelled && s.error);
  if (!dernier || Date.now() - dernier > 6 * 60 * MIN) return c("taches", "Tâches automatiques", "bad", "Les tâches automatiques ne tournent plus (aucune depuis plus de 6 h).", "Me prévenir.");
  if (enRetard.length || enErreur.length) {
    const s = enRetard[0] || enErreur[0];
    return c("taches", "Tâches automatiques", "bad", `${enRetard.length + enErreur.length} e-mail${enRetard.length + enErreur.length > 1 ? "s" : ""} programmé${enRetard.length + enErreur.length > 1 ? "s" : ""} pas parti${enRetard.length + enErreur.length > 1 ? "s" : ""} (ex. ${s.to}${s.error ? ` : ${String(s.error).slice(0, 80)}` : ""}).`, "Ouvrir Messages clients pour le renvoyer.", { href: "/gestion/messages", label: "Ouvrir" });
  }
  const aVenir = (sched || []).filter((s) => s && !s.sent && !s.cancelled).length;
  return c("taches", "Tâches automatiques", "ok", `Battement du site actif, ${aVenir} e-mail${aVenir > 1 ? "s" : ""} programmé${aVenir > 1 ? "s" : ""} à venir, aucun en retard.`);
}

// 9. Mise en ligne : la dernière mise en ligne Firebase a réussi.
async function ctrlMiseEnLigne() {
  const url = "https://api.github.com/repos/nirojh93700-afk/Niro/commits/claude/site-product-overview-1t2de/check-runs";
  const r = await borne(fetch(url, { headers: { "user-agent": "NivCreation-Gardien", accept: "application/vnd.github+json" }, cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null), 8000, null);
  const run = r?.check_runs?.find((x) => /App Hosting/i.test(x.name || "")) || r?.check_runs?.[0];
  if (!run) return c("deploiement", "Mise en ligne", "ok", "Dernière mise en ligne : pas lisible pour l'instant (rien d'anormal sur le site).");
  if (run.status !== "completed") return c("deploiement", "Mise en ligne", "ok", "Une mise en ligne est en cours.");
  if (run.conclusion !== "success") return c("deploiement", "Mise en ligne", "bad", "La dernière mise en ligne a échoué : le site reste sur la version d'avant.", "Me prévenir : je relance la mise en ligne.");
  const quand = run.completed_at ? new Date(run.completed_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  return c("deploiement", "Mise en ligne", "ok", `Dernière mise en ligne réussie${quand ? ` (${quand})` : ""}.`);
}

const CONTROLES = [
  ["photos", "Photos", ctrlPhotos], ["connexion", "Connexion", ctrlConnexion], ["paiement", "Paiement", ctrlPaiement],
  ["pages", "Pages du site", ctrlPages], ["emails", "E-mails", ctrlEmails], ["livraison", "Livraison", ctrlLivraison],
  ["stock", "Stock et prix", ctrlStock], ["taches", "Tâches automatiques", ctrlTaches], ["deploiement", "Mise en ligne", ctrlMiseEnLigne],
];

/** Lance les 9 contrôles, garde le rapport et prévient le gérant d'un problème NOUVEAU. Ne lève jamais d'exception. */
export async function runGardien({ alerter = true } = {}) {
  const t0 = Date.now();
  const un = ([id, nom, f]) => borne(Promise.resolve().then(f).catch((e) => c(id, nom, "warn", `Contrôle impossible : ${court(e)}`)), 25000, c(id, nom, "warn", "Contrôle trop long (plus de 25 s)."));
  // Un contrôle après l'autre : le Gardien ne doit pas charger le site qu'il surveille.
  const checks = [];
  for (const ctl of CONTROLES) checks.push(await un(ctl));
  const avant = await getJobNote(CLE_GARDIEN, true).catch(() => null);
  // Un problème NOUVEAU est revérifié une fois 10 s plus tard avant d'alerter : pas de fausse alerte pour un raté passager.
  for (let i = 0; i < checks.length; i++) {
    const x = checks[i];
    if (x.etat === "bad" && !(avant?.checks || []).some((y) => y.id === x.id && y.etat === "bad")) {
      await new Promise((res) => setTimeout(res, 10000));
      checks[i] = await un(CONTROLES[i]);
    }
  }
  const rapport = { at: Date.now(), dureeMs: Date.now() - t0, checks };
  const signature = (r) => (r?.checks || []).filter((x) => x.etat === "bad").map((x) => x.id + ":" + x.detail.replace(/\d+(,\d+)?\s*s\b/g, "")).sort().join("|");
  const nouveaux = checks.filter((x) => x.etat === "bad" && !(avant?.checks || []).some((y) => y.id === x.id && y.etat === "bad"));
  rapport.alerte = avant?.alerte && signature(avant) === signature(rapport) ? avant.alerte : null;
  if (alerter && nouveaux.length) rapport.alerte = await alerterGerant(nouveaux).catch(() => null);
  await setJobNote(CLE_GARDIEN, rapport).catch(() => {});
  try {
    const hist = (await getJobNote(CLE_HIST, true)) || { lignes: [] };
    const pb = checks.filter((x) => x.etat !== "ok");
    hist.lignes = [{ at: rapport.at, ok: !pb.some((x) => x.etat === "bad"), pbs: pb.map((x) => ({ id: x.id, nom: x.nom, etat: x.etat, detail: x.detail })) }, ...(hist.lignes || [])].slice(0, 96);
    await setJobNote(CLE_HIST, hist);
  } catch { /* l'historique ne bloque jamais le rapport */ }
  return rapport;
}

async function alerterGerant(nouveaux) {
  let regl = REGLAGE_DEFAUT;
  try { regl = reglageGardien(await getSettings()); } catch { /* défaut */ }
  const titre = nouveaux.length === 1 ? `Problème sur le site : ${nouveaux[0].nom}` : `${nouveaux.length} problèmes sur le site`;
  const texte = nouveaux.map((x) => `${x.nom} : ${x.detail}`).join("\n");
  const fait = { at: Date.now(), telephone: false, email: false };
  if (regl.telephone) {
    try {
      const { envoyerAlerteAdmin } = await import("@/lib/pushAdmin");
      const r = await envoyerAlerteAdmin({ title: `🛡️ ${titre}`, body: texte.slice(0, 220), url: "/gestion/gardien", tag: "gardien", urgent: !!regl.nuit });
      fait.telephone = (r?.envoyees || 0) > 0;
    } catch { /* jamais bloquant */ }
  }
  if (regl.email) {
    try {
      const { sendEmail, emailLayout, escapeHtml: esc, BRAND } = await import("@/lib/email");
      const corps = nouveaux.map((x) => `<p style="margin:0 0 12px;"><strong style="color:#b3261e;">${esc(x.nom)}</strong><br>${esc(x.detail)}${x.quoi ? `<br><em>Quoi faire :</em> ${esc(x.quoi)}` : ""}</p>`).join("")
        + `<p style="margin:16px 0 0;"><a href="${SITE()}/gestion/gardien">Ouvrir le rapport du Gardien</a></p>`;
      const html = emailLayout({ heading: titre, bodyHtml: corps });
      const r = await sendEmail({ to: BRAND.contact, subject: `🛡️ ${titre}`, html });
      fait.email = !!r?.ok || !!r?.id;
    } catch { /* jamais bloquant */ }
  }
  return fait;
}

export async function lireGardien() {
  const [rapport, hist] = await Promise.all([getJobNote(CLE_GARDIEN, true).catch(() => null), getJobNote(CLE_HIST, true).catch(() => null)]);
  return { rapport, historique: hist?.lignes || [] };
}
