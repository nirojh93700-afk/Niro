// =============================================================================
// DOSSIER DE GRAVURE DU JOUR (page Atelier, 08/11/2026)
// -----------------------------------------------------------------------------
// Un seul zip avec tout ce qu'il y a à graver aujourd'hui : un dossier par
// commande (à préparer / en gravure) et, à la racine, un tableau
// `gravure-du-jour.csv` pour graver en série + un `LISEZ-MOI.txt`.
//
// Ce fichier ne fait que le PLAN (quels fichiers, quels noms, d'où ils viennent)
// et les textes (consignes, CSV, LISEZ-MOI). Il ne télécharge rien : la page
// Atelier lit chaque source (canvas, fetch) et construit le zip (zipStore).
//
// Pur côté données ; utilisable dans le navigateur. Les deux fonctions
// `sideConfig(item, side)` → { src, widthMm, heightMm } et `sidesOf(item)` →
// ["face" | "fond"] sont celles de la page Atelier : on les reçoit en option
// pour ne pas les recopier.
// =============================================================================
import { eclaterParVerre } from "@/lib/orderSpec";
import { consignesGravure } from "@/lib/consignesGravure";
import { lignesGravure } from "@/lib/engravingSheet";
import { imagesOrigineArticle } from "@/lib/imagesOrigine";
import { photosEnvoyees } from "@/lib/apercuCote";
import { liensFichierGravure } from "@/components/admin/FichierGravure";
import { langueActive, langueDe } from "@/lib/traductionGravure";

export const STATUTS_DU_JOUR = ["a_preparer", "en_gravure"];
const STATUT_LIBELLE = { a_preparer: "À préparer", en_gravure: "En gravure" };

export const slugFichier = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "article";

export const refCommande = (o) => String(o?.ref || (o?.id ? String(o.id).slice(-8).toUpperCase() : "") || "commande");

/** Commandes qui entrent dans le dossier du jour : pas test, à préparer / en gravure, avec des réglages. */
export function commandesDuJour(orders) {
  return (Array.isArray(orders) ? orders : []).filter(
    (o) => o && !o.test && STATUTS_DU_JOUR.includes(o.status) && Array.isArray(o.spec) && o.spec.filter(Boolean).length,
  );
}

// Quelques lignes lisibles depuis le résultat de consignesGravure.
function lignesConsignes(c) {
  const out = [];
  const ligne = (l) => `${l.k} : ${l.v}${l.alerte ? "  ⚠️" : ""}`;
  for (const g of c.general || []) out.push(ligne(g));
  for (const f of c.faces || []) {
    out.push(`[${f.nom}]${f.vide ? " (vierge, rien à graver)" : ""}`);
    for (const l of f.lignes || []) out.push(`  ${ligne(l)}`);
  }
  for (const a of c.autres || []) out.push(ligne(a));
  for (const p of c.placement || []) out.push(ligne(p));
  return out;
}

/** Texte du `consignes.txt` d'une commande : en-tête + chaque article (chaque verre d'un lot) + ses lignes à graver. */
export function texteConsignes(o, articles) {
  const ref = refCommande(o);
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "";
  const L = [];
  L.push(`COMMANDE #${ref}${o.customerName ? ` — ${o.customerName}` : ""}${date ? ` — ${date}` : ""}`);
  L.push(`Statut : ${STATUT_LIBELLE[o.status] || o.status || ""}`);
  if (o.adminNote) L.push(`Note interne : ${o.adminNote}`);
  if (Array.isArray(o.alerteImage) && o.alerteImage.length) {
    L.push("⚠️ Date dans l'image — à regarder avant de graver :");
    for (const a of o.alerteImage) L.push(`  ${a}`);
  }
  L.push("");
  articles.forEach(({ item, nomBase }, i) => {
    const variante = item.variantDetail || item.variantTitle || "";
    L.push(`${"=".repeat(60)}`);
    L.push(`${i + 1}. ${item.name || item.slug || "Article"}${variante ? ` — ${variante}` : ""}${item.verre ? ` — verre ${item.verre} / ${item.verres}` : ""}`);
    if (nomBase) L.push(`   fichiers : ${nomBase}*`);
    L.push(`${"=".repeat(60)}`);
    const perso = String(item.personalization || "").trim();
    if (perso) { L.push("Résumé (ce que la cliente a choisi) :"); L.push(`  ${perso.replace(/ · /g, "\n  ")}`); L.push(""); }
    let lignes = [];
    try { lignes = lignesConsignes(consignesGravure(item)); } catch { lignes = []; }
    if (!lignes.length) {
      try { lignes = lignesGravure(item).map((l) => `${l.face} : ${l.texte}`); } catch { lignes = []; }
    }
    if (lignes.length) { L.push("À graver :"); for (const l of lignes) L.push(`  ${l}`); }
    else L.push("À graver : (aucun texte enregistré — voir le résumé et les fichiers du dossier)");
    L.push("");
  });
  return L.join("\n");
}

/**
 * Plan du dossier : pour chaque commande du jour, son dossier et la liste des
 * fichiers à produire. Rien n'est téléchargé ici.
 * → [{ dossier, ref, cliente, statut, fichiers: [{ nom, kind, src?, url?, side?, item?, titre?, contenu? }] }]
 *   kind : "visuel" (capture / artwork d'une face : lire `src` par canvas → PNG)
 *          "origine" (image du site choisie par la cliente : fetch `src`, SVG vectoriel préféré)
 *          "photo"   (photo envoyée par la cliente : fetch `src`)
 *          "svgLangue" (texte dans une autre langue : fetch `url` → SVG en tracés)
 *          "texte"   (consignes.txt : `contenu` déjà prêt)
 */
export function planDossier(orders, { sideConfig, sidesOf } = {}) {
  const plan = [];
  const dossiersVus = new Set();
  for (const o of commandesDuJour(orders)) {
    const specs = o.spec.filter(Boolean);
    const ref = refCommande(o);
    let dossier = `${ref}-${slugFichier(specs[0].slug || specs[0].name)}`;
    while (dossiersVus.has(dossier)) dossier += "-bis";
    dossiersVus.add(dossier);

    const fichiers = [];
    const nomsVus = new Set();
    const unique = (nom) => {
      let n = nom, i = 2;
      while (nomsVus.has(n)) { n = nom.replace(/(\.[a-z0-9]+)$/i, `-${i}$1`); i++; }
      nomsVus.add(n);
      return n;
    };
    const articles = [];
    specs.forEach((spec, iSpec) => {
      const items = eclaterParVerre(spec);
      for (const item of items) {
        // Préfixe quand la commande a plusieurs articles : « 2-collier-coeur- ».
        const nomBase = specs.length > 1 ? `${iSpec + 1}-${slugFichier(item.slug || item.name)}-` : "";
        articles.push({ item, nomBase });
        const verre = item.verre ? `verre${item.verre}-` : "";

        // 1. Visuels capturés (face / fond) → PNG.
        if (typeof sideConfig === "function") {
          let sides = [];
          try { sides = typeof sidesOf === "function" ? sidesOf(item) : ["face"]; } catch { sides = ["face"]; }
          for (const side of sides) {
            let cfg = null;
            try { cfg = sideConfig(item, side); } catch { cfg = null; }
            if (!cfg || !cfg.src) continue;
            fichiers.push({
              nom: unique(`${nomBase}${verre}${side === "fond" ? "fond" : "face"}.png`),
              kind: "visuel", src: cfg.src, side, item, widthMm: cfg.widthMm, heightMm: cfg.heightMm,
              titre: `${item.name || item.slug}${item.verre ? ` · verre ${item.verre}` : ""} · ${side === "fond" ? "fond du verre" : "face avant"}`,
            });
          }
        }

        // 2. Images d'origine du site (modèle n°, motif, lettre fleurie, dessin de Noël…), SVG vectoriel si présent.
        let origines = [];
        try { origines = imagesOrigineArticle(item); } catch { origines = []; }
        for (const im of origines) {
          const src = im.svg || im.src;
          const nom = im.svg ? String(im.nom || "image.png").replace(/\.[a-z0-9]+$/i, ".svg") : (im.nom || "image.png");
          fichiers.push({ nom: unique(`${nomBase}${verre}${nom}`), kind: "origine", src, item, titre: im.titre || "", note: im.note || "" });
        }

        // 3. Photos envoyées par la cliente (cristal, verre à photo…).
        let photos = [];
        try { photos = photosEnvoyees(item); } catch { photos = []; }
        photos.forEach((ph, i) => {
          if (!ph?.src) return;
          const ext = (String(ph.src).split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i) || [, "jpg"])[1].toLowerCase();
          const base = slugFichier(ph.titre || "photo") || "photo";
          fichiers.push({ nom: unique(`${nomBase}${verre}${base}${photos.length > 1 ? `-${i + 1}` : ""}.${ext}`), kind: "photo", src: ph.src, item, titre: ph.titre || "Photo envoyée" });
        });

        // 4. Texte dans une autre langue : SVG en tracés fabriqué par le serveur (même adresse que le bouton de la fiche).
        if (langueActive(item.fields)) {
          for (const lien of liensFichierGravure({ ...item, orderRef: ref })) {
            fichiers.push({ nom: unique(`${nomBase}${lien.nom}`), kind: "svgLangue", url: lien.href, item, titre: `Texte en ${langueDe(item.fields.langue)?.nom || item.fields.langue}` });
          }
        }
      }
    });

    // 5. consignes.txt : une fois par commande.
    fichiers.push({ nom: unique("consignes.txt"), kind: "texte", contenu: texteConsignes(o, articles), titre: "Consignes" });

    plan.push({ dossier, ref, cliente: o.customerName || "", statut: STATUT_LIBELLE[o.status] || o.status || "", fichiers, articles });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// CSV « gravure du jour » : une ligne par face à graver.
// ---------------------------------------------------------------------------
export const CSV_ENTETES = ["Commande", "Cliente", "Produit", "Option", "Face", "Texte", "Date", "Écriture", "Langue", "Décor", "Fichier"];
const estDate = (k) => /\bdate\b|ann[ée]e/i.test(String(k || ""));
const sansPrefixeFace = (k) => String(k || "").replace(/^[^·]+·\s*/, "");

// Lignes du CSV pour UN article (un verre d'un lot = un article).
function lignesCsvArticle(item, fichiersArticle) {
  const champs = item.fields || {};
  let c = null;
  try { c = consignesGravure(item); } catch { c = null; }
  const general = c?.general || [];
  const ecriture = (general.find((g) => /^(police|écriture|ecriture)$/i.test(g.k)) || {}).v || "";
  const langue = langueActive(champs) ? (langueDe(champs.langue)?.nom || champs.langue) : "Français";
  const decor = String(champs.decor || "").trim();
  const place = { texte: "autour du texte", date: "autour de la date", deux: "texte et date" }[champs.decorPlace || "texte"];
  const decorTxt = decor ? `${decor} (${place})` : "";
  const fichierPour = (side) => fichiersArticle
    .filter((f) => f.kind !== "texte" && (!side || !f.side || f.side === side))
    .map((f) => f.nom).join(" | ");

  const faces = [];
  if (c && c.faces && c.faces.length) {
    for (const f of c.faces) {
      if (f.vide) continue;
      const textes = (f.lignes || []).filter((l) => l.texte && !estDate(l.k)).map((l) => l.v);
      const dates = (f.lignes || []).filter((l) => estDate(l.k)).map((l) => l.v);
      const side = /fond/i.test(f.nom) ? "fond" : "face";
      faces.push({ face: f.nom, texte: textes.join(" / "), date: dates.join(" / "), fichier: fichierPour(side) });
    }
  }
  if (!faces.length) {
    const autres = c?.autres || [];
    const textes = autres.filter((l) => l.texte && !estDate(l.k)).map((l) => l.v);
    const dates = autres.filter((l) => estDate(l.k)).map((l) => l.v);
    // Le nom de la face, s'il est écrit en tête de la clé (« Face avant · Texte »).
    const nomFace = (autres.find((l) => /·/.test(l.k)) || {}).k?.split("·")[0]?.trim()
      || (fichiersArticle.find((f) => f.side)?.side === "fond" ? "Fond du verre" : "");
    if (!textes.length && !dates.length && c?.general?.length === 0 && !fichiersArticle.some((f) => f.kind !== "texte")) {
      // Rien à graver de lisible : on garde quand même la ligne avec le résumé.
      faces.push({ face: nomFace, texte: String(item.personalization || "").trim(), date: "", fichier: "" });
    } else {
      faces.push({ face: nomFace, texte: textes.join(" / "), date: dates.join(" / "), fichier: fichierPour(null) });
    }
  }
  // Lignes du tableau si consignes muettes (vieilles commandes) : au moins le texte des champs.
  if (faces.length === 1 && !faces[0].texte && !faces[0].date) {
    try {
      const lg = lignesGravure(item).filter((l) => !l.police);
      faces[0].texte = lg.filter((l) => !estDate(l.face)).map((l) => l.texte).join(" / ") || faces[0].texte;
      faces[0].date = lg.filter((l) => estDate(l.face)).map((l) => l.texte).join(" / ");
    } catch { /* on garde ce qu'on a */ }
  }
  return faces.map((f) => ({ face: sansPrefixeFace(f.face), texte: f.texte, date: f.date, ecriture, langue, decor: decorTxt, fichier: f.fichier }));
}

/** Tableau CSV (séparateur « ; », BOM UTF-8) : une ligne par face à graver, pour graver en série. */
export function csvDuJour(orders, options = {}) {
  const esc = (v) => `"${String(v === null || v === undefined ? "" : v).replace(/"/g, '""')}"`;
  const lignes = [CSV_ENTETES.map(esc).join(";")];
  for (const d of planDossier(orders, options)) {
    for (const { item } of d.articles) {
      const fichiersArticle = d.fichiers.filter((f) => f.item === item);
      const produit = `${item.name || item.slug || ""}${item.verre ? ` (verre ${item.verre}/${item.verres})` : ""}`;
      const option = item.variantDetail || item.variantTitle || "";
      for (const r of lignesCsvArticle(item, fichiersArticle)) {
        lignes.push([d.ref, d.cliente, produit, option, r.face, r.texte, r.date, r.ecriture, r.langue, r.decor, r.fichier ? r.fichier.split(" | ").map((n) => `${d.dossier}/${n}`).join(" | ") : ""].map(esc).join(";"));
      }
    }
  }
  return "﻿" + lignes.join("\r\n") + "\r\n";
}

/** Date de Paris au format AAAA-MM-JJ (nom du zip). */
export function dateParis(d = new Date()) {
  try { return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
  catch { return d.toISOString().slice(0, 10); }
}

/** Texte du LISEZ-MOI.txt à la racine du zip. */
export function lisezMoi(plan, { date = dateParis(), manquants = [] } = {}) {
  const nb = plan.reduce((s, d) => s + d.fichiers.length, 0);
  const L = [];
  L.push(`DOSSIER DE GRAVURE DU ${date} — Niv Création`);
  L.push(`${plan.length} commande${plan.length > 1 ? "s" : ""} · ${nb} fichier${nb > 1 ? "s" : ""} (commandes à préparer et en gravure, hors tests)`);
  L.push("");
  L.push("Contenu :");
  L.push("  gravure-du-jour.csv       tableau pour graver en série (une ligne par face : texte, date, écriture, langue, décor, fichier). S'ouvre dans Excel (séparateur « ; »).");
  L.push("  <REF>-<article>/          un dossier par commande :");
  L.push("     consignes.txt          ce que la cliente a choisi + les lignes à graver, face par face");
  L.push("     face.png / fond.png    le visuel capturé de chaque face (verreN-… pour un lot « chacun différent »)");
  L.push("     *.svg / *.png / *.jpg  images d'origine du site (modèle n°, motif, lettre fleurie, Noël… — SVG vectoriel quand il existe) et photos envoyées par la cliente");
  L.push("     gravure-…-<langue>-60x30mm.svg   texte dans une autre langue, lettres en tracés (aucune police à installer)");
  L.push("");
  L.push("⚠️ Les visuels capturés (face.png / fond.png) sont ceux montrés à la cliente : graver à la taille indiquée dans consignes.txt / la page Atelier.");
  L.push("");
  for (const d of plan) {
    L.push(`${d.dossier}/  — #${d.ref}${d.cliente ? ` · ${d.cliente}` : ""} · ${d.statut}`);
    for (const f of d.fichiers) L.push(`   ${f.nom}${f.titre && f.kind !== "texte" ? `   (${f.titre})` : ""}`);
  }
  if (manquants.length) {
    L.push("");
    L.push("FICHIERS MANQUANTS (impossibles à lire au moment de la préparation — à récupérer sur la page Atelier) :");
    for (const m of manquants) L.push(`  manquant : ${m}`);
  }
  L.push("");
  return L.join("\n");
}
