// Images DU SITE choisies par la cliente → le fichier d'origine à télécharger pour graver (gérant, 05/11/2026 :
// « chaque fois qu'un client choisit des images qui sont sur le site, tu me donnes les images d'origine… pour
// que je puisse télécharger et graver comme les photos »).
// Pur : lit la ligne de commande (spec) et le catalogue du code ; renvoie [{ titre, src, nom, note }].
// `src` = un fichier du site (même adresse) : jamais une capture d'écran ni une vignette réduite. Quand un fichier
// plus grand que celui de la fiche existe (dossier public/origines, copie octet pour octet de ce qu'il a donné),
// c'est lui qui est donné.
import { getProductBySlug } from "@/lib/products";
import { MOTIFS } from "@/lib/motifs";
import { MODELES, imageDesign } from "@/lib/modeles";
import { NOEL_IMAGES } from "@/lib/fetes";
import { CG_MODELES, CG_DESSINS, CG_ZODIAQUE, CG_DOSSIER } from "@/lib/cristauxGraves";
import { mpLignes } from "@/lib/marquePages";
import { CN_FACES, cnLignes } from "@/lib/carnet";
import VECTORIEL from "@/lib/vectoriel";

// Dessins du site redessinés en traits (tools/gravure/vectoriser-tout.py) : public/vectoriel/<même chemin>.svg.
const VEC = new Set(VECTORIEL);
export function svgPour(src) {
  const k = String(src || "").split("?")[0].replace(/\.[a-z0-9]+$/i, "");
  return VEC.has(k) ? `/vectoriel${k}.svg` : null;
}

// Fichiers d'origine plus grands que ceux de la fiche (copiés tels quels depuis docs/maquettes/assets).
const NOEL_ORIGINE = { 26: "/origines/noel/noel-26.jpg", 27: "/origines/noel/noel-27.jpg" };
const sansAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function nomFichier(src, base) {
  const ext = (String(src).split("?")[0].match(/\.([a-z0-9]+)$/i) || [, "png"])[1].toLowerCase();
  const propre = sansAccent(base).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${propre || "image"}.${ext}`;
}
const estSite = (src) => typeof src === "string" && src.startsWith("/") && !src.startsWith("/api/img/");

function noel(n) {
  const im = NOEL_IMAGES.find((m) => String(m.n) === String(n).trim());
  if (!im) return null;
  return { titre: `Modèle de Noël n° ${im.n} — ${im.nom}`, src: NOEL_ORIGINE[im.n] || im.src, svg: svgPour(im.src), nom: nomFichier(im.src, `noel-${im.n}-${im.nom}`) };
}

// Une série de réglages (un verre, ou l'article entier) → ses images du site.
function depuisChamps(produit, champs, prefixe = "") {
  const out = [];
  const p = (t) => (prefixe ? `${prefixe} · ${t}` : t);
  for (const f of produit?.personalizationFields || []) {
    const v = champs?.[f.key];
    if (typeof v !== "string" || !v.trim()) continue;
    const val = v.trim();
    if (f.type === "stylepicker") {
      const src = produit.styleImages?.[val];
      if (src) out.push({ titre: p(`Modèle n° ${val}`), src, nom: nomFichier(src, `${produit.slug}-modele-${val}`) });
    } else if (f.type === "lettering") {
      const o = (f.options || []).find((x) => x.value === val);
      if (o?.image) out.push({ titre: p(o.label || val), src: o.image, nom: nomFichier(o.image, `${produit.slug}-${val}`),
        note: "Photo d'exemple d'une pièce déjà gravée dans ce style : il n'existe pas de fichier à graver à part." });
    } else if (f.type === "lettreFleurie") {
      const src = f.image || produit.parcoursGuide?.alphabet || "/produits/alphabet-fleuri.jpg";
      out.push({ titre: p(`Lettre fleurie « ${val.toUpperCase()} »`), src, nom: nomFichier(src, `alphabet-fleuri-lettre-${val}`),
        note: `L'alphabet complet : la lettre ${val.toUpperCase()} est dedans.` });
    } else if (f.type === "motif") {
      const m = MOTIFS.find((x) => x.value === val);
      const src = m ? (m.kind === "image" ? m.url : m.thumb) : null;
      if (src) out.push({ titre: p(`${String(f.label || "Motif").replace(/\s*\(.*\)\s*$/, "")} : ${m.label}`), src, nom: nomFichier(src, `motif-${m.value}`) });
    }
  }
  // Modèle de Noël (champ ajouté par fetes.js, pas toujours dans la liste du code).
  if (champs?.noelModele) { const n = noel(champs.noelModele); if (n) out.push({ ...n, titre: p(n.titre) }); }
  return out;
}

function cristalDejaGrave(champs) {
  const m = String(champs?.modele || "");
  const nomChoisi = sansAccent(m.replace(/^[^:]*:\s*/, ""));
  const nNoel = m.match(/Noël n°\s*(\d+)/i);
  if (nNoel) { const n = noel(nNoel[1]); return n ? [n] : []; }
  const z = CG_ZODIAQUE.find((x) => sansAccent(x.nom) === nomChoisi);
  if (z && /zodiaque/i.test(m)) return [{ titre: `Signe du zodiaque : ${z.nom}`, src: `/origines/zodiaque/${z.k}.png`, nom: `zodiaque-${z.k}.png`,
    note: "Votre image d'origine : le prénom, la date et la ville sont ceux de l'exemple, à remplacer par ceux de la cliente." }];
  const d = CG_DESSINS.find((x) => sansAccent(x.nom) === nomChoisi);
  if (d && /dessin/i.test(m)) return [{ titre: `Dessin : ${d.nom}`, src: `${CG_DOSSIER}/dessin-${d.k}.webp`, nom: `dessin-${d.k}.webp` }];
  const mo = CG_MODELES.find((x) => sansAccent(x.nom) === nomChoisi);
  if (mo) return [{ titre: `Modèle gravé : ${mo.nom}`, src: `/origines/cristaux-graves/${mo.k}.jpg`, nom: `cristal-${mo.k}.jpg`, note: "Photo du cristal gravé de ce modèle." }];
  return [];
}

export function imagesOrigineArticle(item) {
  if (!item) return [];
  const produit = getProductBySlug(item.slug);
  const champs = item.fields || {};
  let out = [];
  if (item.slug === "cristal-deja-grave") out = cristalDejaGrave(champs);
  else if (produit?.marquePages && champs.mp && typeof champs.mp === "object") {
    (champs.mp.slots || []).forEach((s, i) => {
      for (const l of mpLignes(produit.marquePages.modele, s.v)) {
        if (estSite(l.img)) out.push({ titre: `Marque-page ${i + 1} · ${l.libelle} : ${l.valeur.replace(/,.*$/, "")}`, src: l.img, nom: nomFichier(l.img, `marque-page-${l.valeur.replace(/,.*$/, "")}`) });
      }
    });
  } else if (produit?.carnet && champs.cn && typeof champs.cn === "object") {
    for (const [s, nom] of CN_FACES) for (const l of cnLignes(champs.cn.v, s)) {
      if (estSite(l.img)) out.push({ titre: `${nom} · ${l.libelle} : ${l.valeur.replace(/,.*$/, "")}`, src: l.img, nom: nomFichier(l.img, `carnet-${s}-${l.zone}`) });
    }
  } else if (produit?.createur === "support" && champs.sup && typeof champs.sup === "object" && Array.isArray(champs.sup.els)) {
    // Support de téléphone créé par la cliente : le dessin ou la lettre fleurie de chaque élément (fichiers du site).
    if (champs.sup.grave) champs.sup.els.forEach((e, i) => {
      if (e.type === "dessin" && estSite(e.src)) out.push({ titre: `Élément ${i + 1} · Dessin n° ${e.n}`, src: e.src, nom: nomFichier(e.src, `support-dessin-${e.n}`) });
      if (e.type === "lettre" && estSite(e.src)) out.push({ titre: `Élément ${i + 1} · Lettre fleurie ${e.L}`, src: e.src, nom: nomFichier(e.src, `support-lettre-${e.L}`) });
    });
  } else if (produit) {
    const verres = Array.isArray(item.perGlass) && item.perGlass.length > 1 ? item.perGlass : null;
    if (verres) verres.forEach((g, i) => { out.push(...depuisChamps(produit, g, `Verre ${i + 1}`)); });
    else out = depuisChamps(produit, champs);
  }
  // Design image d'un modèle décoré (Fête des pères : Jack Daniel's, Route 66…) : le fichier à traits foncés.
  const tpl = item.modeleTemplate ? MODELES[item.modeleTemplate] : null;
  const d = tpl ? imageDesign(tpl, item.modele?.layout || tpl.layout) : null;
  if (d) out.push({ titre: `Design « ${d.name} »`, src: d.dark, nom: nomFichier(d.dark, `design-${d.id}`), note: "Le fichier du design utilisé par le site (traits foncés, fond transparent)." });
  // Une même image demandée deux fois (deux verres au même modèle) : une seule ligne.
  const vus = new Set();
  return out.filter((x) => estSite(x.src) && !vus.has(x.titre + x.src) && vus.add(x.titre + x.src))
    .map((x) => ({ ...x, svg: x.svg || svgPour(x.src) }));
}
