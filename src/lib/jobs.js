// =============================================================================
// Tâches périodiques (envois auto, cagnotte, anniversaires) — logique PARTAGÉE
// entre les crons protégés par jeton (/api/cron/*) ET le déclencheur intégré au
// site (/api/heartbeat). Aucune de ces fonctions n'envoie quoi que ce soit au
// public sans règle explicite de la gérante ; tout est isolé (try/catch).
// =============================================================================
import {
  getScheduledEmails, markScheduledSent, getSettings, hasAutoSent, markAutoSent,
  listCagnottes, markCagnotteReminded, expireCagnotte, getBirthdays, setPromoCode,
  getSubscribersDetailed, getPromoCodes, getOffreGravureSent, markOffreGravureSent,
  purgeExpiredPromoCodes, getFavoris, logComm, getPriceWatchAll, rebasePriceWatch, setJobNote,
  CAGNOTTE_EXPIRY_DAYS, CAGNOTTE_REMIND_BEFORE,
} from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { sendClientMail, brandedMessage, boutonsAvis, boutonRepondre, imageEnTete } from "@/lib/clientMail";
import { cashbackReminderEmail, emailLayout, BRAND } from "@/lib/email";
import { offreActive, offreGravureEmail, joursDepuis } from "@/lib/offreGravure";
import { cadeauColisActif } from "@/lib/vacation";

const DAY = 86400000;

function fill(tpl, o) {
  const prenom = (o.customerName || "").split(" ")[0];
  return String(tpl || "")
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, o.customerName || "")
    .replace(/\{ref\}/gi, o.ref || (o.id || "").slice(-6));
}

// --- 1) Messages programmés + règles automatiques --------------------------
export async function runScheduledJobs() {
  const now = Date.now();
  let sentManual = 0, sentAuto = 0, failed = 0;

  const queue = await getScheduledEmails();
  for (const s of queue) {
    if (s.sent || (s.sendAt || 0) > now) continue;
    const btn = await boutonRepondre({
      email: s.to, name: s.name || "", subject: s.subject,
      excerpt: String(s.body || "").slice(0, 240), orderId: s.orderId || "",
    });
    const html = brandedMessage(s.subject, s.body, btn, imageEnTete(s.imageUrl));
    const r = await sendClientMail({ to: s.to, subject: s.subject, html });
    await markScheduledSent(s.id, { ok: r.ok, error: r.error });
    // Rangé dans le dossier de la cliente (et ça classe la réponse préparée, s'il y en avait une).
    if (r.ok) { try { await logComm({ email: s.to, from: "nous", text: String(s.body || s.text || s.subject || ""), subject: s.subject, via: "programme" }); } catch { /* ignore */ } }
    if (r.ok) sentManual++; else failed++;
  }

  const settings = await getSettings();
  const rules = (settings?.autoRules || []).filter((r) => r.active && r.body && r.delayDays >= 0);
  if (rules.length) {
    const orders = (await getSiteOrders(300)) || [];
    // Règles basées sur les commandes (commande / livrée).
    for (const rule of rules) {
      if (rule.trigger === "inscription") continue; // traité séparément ci-dessous
      for (const o of orders) {
        if (o.test || !o.customerEmail) continue;
        if (["annulee", "remboursee"].includes(o.status)) continue;
        // Les dates sont stockées en chaîne ISO (ex. "2026-07-20T10:00:00Z") :
        // on parse avec Date (Number() renverrait NaN sur une date ISO).
        const ts = (v) => { const n = new Date(v).getTime(); return Number.isFinite(n) ? n : 0; };
        let baseTs;
        if (rule.trigger === "livree") {
          if (o.status !== "livree") continue;
          baseTs = ts(o.deliveredAt) || ts(o.shippedAt) || ts(o.updatedAt) || ts(o.createdAt);
        } else {
          baseTs = ts(o.createdAt);
        }
        if (!baseTs) continue;
        const dueAt = baseTs + rule.delayDays * DAY;
        if (dueAt > now || now - dueAt > 3 * DAY) continue;
        if (await hasAutoSent(rule.id, o.id)) continue;

        const subject = fill(rule.subject || "Un message de Niv Création", o);
        // Règle d'AVIS (après livraison) → on joint les boutons « ★ Noter ».
        const estRegleAvis = rule.trigger === "livree" && /avis/i.test(`${rule.name || ""} ${rule.subject || ""}`);
        const html = brandedMessage(subject, fill(rule.body, o), estRegleAvis ? boutonsAvis(o.items) : "");
        const r = await sendClientMail({ to: o.customerEmail, subject, html });
        await markAutoSent(rule.id, o.id);
        if (r.ok) sentAuto++; else failed++;
      }
    }

    // Règles "inscription" : relance des abonnées newsletter X jours après leur
    // inscription, UNIQUEMENT si elles n'ont pas commandé. Une seule fois chacune.
    const inscRules = rules.filter((r) => r.trigger === "inscription");
    if (inscRules.length) {
      const detailed = await getSubscribersDetailed().catch(() => []);
      const buyers = new Set((orders || []).map((o) => (o.customerEmail || "").toLowerCase()).filter(Boolean));
      const ts = (v) => { const n = new Date(v).getTime(); return Number.isFinite(n) ? n : 0; };
      for (const rule of inscRules) {
        for (const s of detailed) {
          const email = (s.email || "").toLowerCase();
          if (!email || !s.date) continue;          // pas de date connue → on ne relance pas
          if (buyers.has(email)) continue;           // a déjà commandé → pas de relance
          const baseTs = ts(s.date);
          if (!baseTs) continue;
          const dueAt = baseTs + rule.delayDays * DAY;
          if (dueAt > now || now - dueAt > 3 * DAY) continue;
          if (await hasAutoSent(rule.id, "sub:" + email)) continue;
          const subject = fill(rule.subject || "Un message de Niv Création", {});
          const html = brandedMessage(subject, fill(rule.body, {}));
          const r = await sendClientMail({ to: email, subject, html, bcc: "" });
          await markAutoSent(rule.id, "sub:" + email);
          if (r.ok) sentAuto++; else failed++;
        }
      }
    }
  }
  return { sentManual, sentAuto, failed };
}

// --- 2) Rappels / expiration de la cagnotte fidélité -----------------------
export async function runCashbackJobs() {
  const now = Date.now();
  const list = await listCagnottes();

  const names = {};
  try {
    const orders = (await getSiteOrders(1000)) || [];
    for (const o of orders) {
      const e = (o.customerEmail || "").toLowerCase();
      if (e && !names[e] && o.customerName) names[e] = String(o.customerName).split(" ")[0];
    }
  } catch { /* e-mail sans prénom */ }

  let reminded = 0, expired = 0;
  for (const c of list) {
    const inactiveDays = c.updatedAt ? (now - c.updatedAt) / DAY : 0;
    if (inactiveDays >= CAGNOTTE_EXPIRY_DAYS) {
      try { await expireCagnotte(c.email); expired++; } catch { /* ignore */ }
      continue;
    }
    const daysLeft = Math.ceil(CAGNOTTE_EXPIRY_DAYS - inactiveDays);
    const alreadyReminded = c.remindedAt && (now - c.remindedAt) < 60 * DAY;
    if (daysLeft <= CAGNOTTE_REMIND_BEFORE && !alreadyReminded) {
      try {
        const { subject, html } = cashbackReminderEmail({ firstName: names[c.email.toLowerCase()] || "", balance: c.balance, daysLeft });
        const r = await sendClientMail({ to: c.email, subject, html, bcc: "" });
        if (r?.ok) { await markCagnotteReminded(c.email); reminded++; }
      } catch { /* ignore */ }
    }
  }
  return { scanned: list.length, reminded, expired };
}

// --- 3) Anniversaires : code de remise + e-mail ----------------------------
export async function runBirthdayJobs() {
  const birthdays = await getBirthdays();
  const now = new Date();
  const mm = now.getMonth() + 1, dd = now.getDate();
  const todays = Object.entries(birthdays).filter(([, date]) => {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date || "");
    return m && +m[1] === mm && +m[2] === dd;
  }).map(([email]) => email);
  if (!todays.length) return { sent: 0 };

  const code = "ANNIV15";
  try { await setPromoCode(code, { type: "percent", value: 15 }); } catch { /* ignore */ }

  let sent = 0;
  for (const to of todays) {
    try {
      const html = emailLayout({
        heading: "Joyeux anniversaire ✦",
        bodyHtml: `<p style="margin:0 0 12px;">Bonjour,</p>
          <p style="margin:0 0 12px;">Toute l'équipe Niv Création vous souhaite un très <strong>joyeux anniversaire</strong> !</p>
          <p style="margin:0 0 16px;">Pour l'occasion, profitez de <strong>−15 %</strong> sur votre commande avec le code <strong>${code}</strong>.</p>
          <p style="margin:0;color:#7a7268;">Belle journée,<br>L'atelier Niv Création</p>`,
      });
      const r = await sendClientMail({ to, subject: "Joyeux anniversaire ✦ une surprise pour vous", html, bcc: BRAND.contact });
      if (r?.ok) sent++;
    } catch { /* ignore */ }
  }
  return { sent };
}

// --- 4) Offre « gravure offerte » : e-mail ciblé aux inscrites sans commande -
// Ne part QUE si le gérant a activé l'offre (Gestion → Marketing → Offre
// gravure offerte) et que la période est ouverte. Chaque inscrite ne la reçoit
// qu'une fois. Les inscriptions de moins de `minJours` jours attendent : elles
// seront servies au fil de l'eau, tant que l'offre est ouverte.
// `dryRun` : compte seulement, n'envoie rien (sert à l'écran d'admin).
// `testTo` : mode test de l'admin — UN seul envoi à cette adresse, rien n'est
// mémorisé (sert à voir l'e-mail réel et l'erreur exacte s'il y en a une).
export async function runOffreGravureJob({ dryRun = false, testTo = "" } = {}) {
  const s = await getSettings();
  const o = offreActive(s?.gravureOfferte);
  if (!o) return { actif: false, eligibles: 0, envoyes: 0, attente: 0, deja: 0 };

  const minJours = Number(o.minJours) || 0;
  const [abonnes, commandes, dejaEnvoye, devisListe, dossiers] = await Promise.all([
    getSubscribersDetailed(),
    getSiteOrders(500),
    getOffreGravureSent(),
    (await import("@/lib/firebase")).listQuotes(300).catch(() => null),
    (await import("@/lib/stock")).getCommsAll().catch(() => ({})),
  ]);

  // Adresses ayant déjà commandé (toute commande, même annulée : la personne
  // connaît déjà la boutique, l'offre « première pièce » ne la concerne plus).
  const acheteuses = new Set(
    commandes.map((c) => String(c.customerEmail || "").trim().toLowerCase()).filter(Boolean)
  );
  // Adresses à qui un DEVIS (ou une facture) a été envoyé (règle du gérant,
  // 20/09/2026 : « il faut pas envoyer aux gens à qui on a envoyé un devis ») :
  // une négociation est en cours ou l'a été — pas d'offre promotionnelle dessus.
  for (const q of devisListe || []) {
    const e = String(q?.client?.email || "").trim().toLowerCase();
    if (e) acheteuses.add(e);
  }
  // Et toute adresse avec une VRAIE conversation en cours (devis envoyés par
  // e-mail — carafe, bracelets… —, demandes sur mesure, échanges) : « vérifie
  // bien, il y a d'autres personnes à qui on a envoyé un devis » (gérant,
  // 20/09/2026). ⚠️ Un dossier qui ne contient QUE nos e-mails automatiques
  // (code de bienvenue, relance −10 %) n'est PAS une conversation : ces
  // inscrites restent servies (vérifié dossier par dossier le 20/09).
  const DEVIS_RE = /devis|sur[ -]?mesure/i;
  for (const [e, d] of Object.entries(dossiers || {})) {
    const em = String(e || "").trim().toLowerCase();
    if (!em) continue;
    const msgs = Array.isArray(d?.messages) ? d.messages : [];
    const vraiEchange = msgs.some((m) => m && m.from === "cliente")
      || msgs.some((m) => DEVIS_RE.test(`${m?.subject || ""} ${m?.text || ""}`));
    if (vraiEchange) acheteuses.add(em);
  }

  let attente = 0, deja = 0;
  const cibles = [];
  for (const ab of abonnes) {
    const email = String(ab.email || "").trim().toLowerCase();
    if (!email || acheteuses.has(email)) continue;
    if (dejaEnvoye[email]) { deja++; continue; }
    const j = joursDepuis(ab.date);
    if (j != null && j < minJours) { attente++; continue; } // trop récente → plus tard
    cibles.push({ email, date: ab.date || "" });
  }

  if (dryRun) return { actif: true, eligibles: cibles.length, envoyes: 0, attente, deja };

  const test = String(testTo || "").trim().toLowerCase();
  if (test) { cibles.length = 0; cibles.push({ email: test, date: "" }); }

  // Nettoyage des codes nominatifs morts (expirés ou déjà utilisés) — à chaque
  // passage réel, pour que la liste de Promotions ne s'encombre pas.
  let purges = 0;
  try { purges = (await purgeExpiredPromoCodes()).supprimes || 0; } catch { /* jamais bloquant */ }

  if (!cibles.length) return { actif: true, eligibles: 0, envoyes: 0, attente, deja, purges };

  // Ses pièces : les FAVORIS de la cliente si elle en a (nom, photo, prix lus
  // dans le catalogue en direct → jamais un vieux prix ni un lien mort), sinon
  // trois idées gravables du catalogue. C'est ce qui rend l'e-mail vraiment
  // adapté à chacune (demande du gérant, 17/09/2026).
  let catalogue = [];
  try { catalogue = await (await import("@/lib/catalog")).getCatalog(); } catch { catalogue = []; }
  const parSlug = new Map(catalogue.map((p) => [p.slug, p]));
  const { formatEuro } = await import("@/lib/format").catch(() => ({ formatEuro: (n) => `${n} €` }));
  const versPiece = (p) => {
    if (!p || p.hidden || !p.variants?.length) return null;
    const v = p.variants[0];
    const prix = typeof p.salePrice === "number" && p.salePrice < v.price ? p.salePrice : v.price;
    return { slug: p.slug, name: p.name, image: p.cardImage || p.images?.[0] || "", prix: prix ? formatEuro(prix) : "" };
  };
  const IDEES = ["collier-plaque-acier", "cristal-photo-3d-vertical", "bracelet-femme-coeur", "verre-a-vin-grave"]; // bijou femme à la place du porte-clés (demande du gérant, 20/09)
  const idees = IDEES.map((sl) => versPiece(parSlug.get(sl))).filter(Boolean).slice(0, 3);

  // ⛔ UN CODE PAR CLIENTE, UTILISABLE UNE SEULE FOIS (demande du gérant,
  // 17/09/2026 : « il faut que les clients utilisent qu'une fois le code », puis
  // « on fait un code par client »).
  //
  // Avant : UN code commun (GRAVUREOFFERTE) créé en `reusable: true` → illimité
  // et PARTAGEABLE. Une inscrite pouvait le donner à qui elle voulait, autant de
  // fois qu'elle voulait. Maintenant, chaque cliente reçoit SON code —
  // GRAVURE-A7K2, GRAVURE-M4P9… — avec trois verrous :
  //   1. `email` : le code n'est valable QUE pour l'adresse à laquelle il est
  //      envoyé → le partager ne sert à rien (refusé au panier ET au paiement) ;
  //   2. `reusable: false` : une seule utilisation, contrôlée sur l'e-mail ;
  //   3. `days` : le code MEURT à la date de fin de l'offre.
  // Les trois sont vérifiés CÔTÉ SERVEUR (`/api/promo-validate` et
  // `/api/checkout`), donc incontournables depuis le navigateur.
  //
  // Le préfixe reste réglable dans l'écran de l'offre (`o.code`). Le code est
  // gardé à côté de l'adresse (`markOffreGravureSent`) pour pouvoir le
  // retrouver si une cliente écrit « mon code ne marche pas ».
  const prefixe = String(o.code || "GRAVUREOFFERTE").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "GRAVURE";
  const finTs = o.end ? Date.parse(`${o.end}T23:59:59`) : 0;
  const jours = finTs ? Math.max(1, Math.ceil((finTs - Date.now()) / 86400000)) : 0;
  // Alphabet sans 0/O ni 1/I/L : une cliente doit pouvoir recopier son code sans
  // se tromper si elle le lit au lieu de cliquer.
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let dejaPris = {};
  try { dejaPris = await getPromoCodes(); } catch { dejaPris = {}; }

  // Un code nominatif encore valide existe déjà pour cette adresse (passage
  // précédent dont l'envoi a échoué) → on le RÉUTILISE : jamais deux codes pour
  // la même inscrite, pas de codes orphelins dans Promotions.
  function codeExistant(email) {
    for (const [c, d] of Object.entries(dejaPris)) {
      if (d && typeof d === "object" && d.email === email && d.kind === "gravure" && c.startsWith(`${prefixe}-`)
        && (!d.expiresAt || d.expiresAt > Date.now())) return c;
    }
    return "";
  }

  function nouveauCode() {
    for (let essai = 0; essai < 40; essai++) {
      let suffixe = "";
      for (let i = 0; i < 5; i++) suffixe += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      const c = `${prefixe}-${suffixe}`;
      if (!dejaPris[c]) { dejaPris[c] = true; return c; }
    }
    return "";
  }

  let envoyes = 0, echecs = 0;
  const faits = [], erreurs = [];
  const noter = (email, msg) => { echecs++; if (erreurs.length < 5) erreurs.push(`${email} : ${String(msg || "envoi refusé").slice(0, 200)}`); };
  for (const c of cibles) {
    try {
      const code = codeExistant(c.email) || nouveauCode();
      if (!code) continue; // on ne promet JAMAIS un code qui n'existe pas
      // Le code doit EXISTER pour de vrai AVANT l'envoi (règle : aucune promesse
      // qui ne marche pas au paiement).
      await setPromoCode(code, {
        type: "fixed",
        value: Number(o.montant) || 3, // affichage de secours seulement
        kind: "gravure",  // au paiement : prix RÉEL de la 1re gravure du panier
        reusable: false,  // une seule utilisation
        email: c.email,   // réservé à cette adresse
        days: jours,      // 0 = pas d'expiration
      });
      // Ses favoris (si elle s'est connectée un jour), sinon les idées.
      let pieces = [], favoris = false;
      try {
        const slugs = await getFavoris(c.email);
        pieces = slugs.map((sl) => versPiece(parSlug.get(sl))).filter(Boolean).slice(0, 3);
        favoris = pieces.length > 0;
      } catch { pieces = []; }
      if (!pieces.length) pieces = idees;
      // La ligne « un cadeau vous attend » n'est écrite que si un cadeau est
      // vraiment offert aujourd'hui (mode délai allongé OU interrupteur cadeau) :
      // jamais de promesse que le panier ne tiendrait pas.
      const args = { date: c.date, code, fin: o.end, cadeau: o.cadeau !== false && Boolean(cadeauColisActif(s)), pieces, favoris };
      let mail = offreGravureEmail(args);
      // Bouton « ✉️ Répondre à ce message » (règle du 17/09) — jamais bloquant :
      // si le jeton échoue, l'e-mail part sans bouton.
      try {
        const btn = await boutonRepondre({ email: c.email, name: "", subject: mail.subject, excerpt: `Offre gravure offerte — code ${code}` });
        if (btn) mail = offreGravureEmail({ ...args, bouton: btn });
      } catch { /* ignore */ }
      const r = await sendClientMail({ to: c.email, subject: mail.subject, html: mail.html });
      if (r?.ok) {
        envoyes++; faits.push({ email: c.email, code });
        // Mémorisé TOUT DE SUITE : si le passage est coupé en route, les
        // personnes déjà servies ne recevront jamais un second e-mail.
        if (!test) { try { await markOffreGravureSent([{ email: c.email, code }]); } catch (e) { noter("mémoire des envois", e?.message || e); } }
      } else noter(c.email, r?.error);
    } catch (e) { noter(c.email, e?.message || e); /* on continue avec les suivantes */ }
  }
  // Compte rendu visible dans l'écran de l'offre (GET /api/admin/offre-gravure).
  try { await setJobNote("offreGravure", { at: Date.now(), test, eligibles: cibles.length, envoyes, echecs, erreurs }); } catch { /* ignore */ }
  return { actif: true, eligibles: cibles.length, envoyes, echecs, erreurs, attente, deja, purges };
}

// --- 6) « Prévenez-moi si le prix baisse » (favoris) ------------------------
// Lancé 1×/jour par le heartbeat. Pour chaque cliente qui a coché la cloche sur
// un favori : si le prix du catalogue EN DIRECT est passé SOUS le prix relevé au
// moment où elle a coché, UN e-mail part (tous ses favoris baissés regroupés),
// puis la référence est ramenée au nouveau prix — jamais deux e-mails pour la
// même baisse. Prix remonté ? La référence suit vers le haut : une future promo
// depuis ce nouveau prix la préviendra. Produit masqué/supprimé : on saute.
export async function runPriceWatchJob() {
  const tous = await getPriceWatchAll();
  const emails = Object.keys(tous);
  if (!emails.length) return { surveilles: 0, envoyes: 0 };

  let catalogue = [];
  try { catalogue = await (await import("@/lib/catalog")).getCatalog(); } catch { return { surveilles: 0, envoyes: 0, erreur: "catalogue" }; }
  const parSlug = new Map(catalogue.map((p) => [p.slug, p]));
  const prixDe = (p) => Number(p?.variants?.[0]?.price) || 0;

  let envoyes = 0, surveilles = 0;
  const rebase = {}; // { email: { slug: nouvelleBase } } — une seule écriture à la fin

  for (const email of emails) {
    const mien = tous[email] || {};
    const baisses = [];
    for (const [slug, w] of Object.entries(mien)) {
      surveilles++;
      const p = parSlug.get(slug);
      if (!p) continue; // masqué ou supprimé : on garde la surveillance telle quelle
      const prix = prixDe(p);
      const base = Number(w?.base) || 0;
      if (!prix || !base) continue;
      if (prix < base - 0.009) baisses.push({ slug, name: p.name, avant: base, apres: prix });
      else if (prix > base + 0.009) { (rebase[email] = rebase[email] || {})[slug] = prix; }
    }
    if (!baisses.length) continue;

    try {
      const subject = baisses.length === 1
        ? "Le prix de votre favori vient de baisser"
        : "Le prix de vos favoris vient de baisser";
      const lignes = baisses.map((b) =>
        `${b.name} : ${b.avant.toFixed(2).replace(".", ",")} € → ${b.apres.toFixed(2).replace(".", ",")} €\n${BRAND.siteUrl}/produit/${b.slug}`
      ).join("\n\n");
      const body =
        `Bonne nouvelle : ${baisses.length === 1 ? "une création que vous gardiez de côté vient de baisser de prix" : "des créations que vous gardiez de côté viennent de baisser de prix"}.\n\n` +
        `${lignes}\n\n` +
        `${baisses.length === 1 ? "Elle vous attend" : "Elles vous attendent"} dans vos favoris :\n${BRAND.siteUrl}/favoris\n\n` +
        `Vous recevez ce message parce que vous avez demandé à être prévenue en cas de baisse de prix sur ce favori. Pour ne plus l'être, décochez la cloche sur votre page Favoris.`;
      const btn = await boutonRepondre({ email, name: "", subject, excerpt: body.slice(0, 240) });
      const html = brandedMessage(subject, body, btn);
      const r = await sendClientMail({ to: email, subject, html, bcc: "" });
      if (r?.ok) {
        envoyes++;
        for (const b of baisses) { (rebase[email] = rebase[email] || {})[b.slug] = b.apres; }
        try { await logComm({ email, from: "nous", text: body, subject, via: r.via || "site" }); } catch { /* ignore */ }
      }
    } catch { /* on continue avec les clientes suivantes */ }
  }

  try { if (Object.keys(rebase).length) await rebasePriceWatch(rebase); } catch { /* ignore */ }
  return { surveilles, envoyes };
}
