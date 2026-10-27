// Marque-pages (27/10/2026) : prix, règles des emplacements, stock et atelier — les totaux des maquettes vérifiées.
import assert from "node:assert/strict";
import { getProductBySlug } from "@/lib/products";
import { mpNormaliser, mpCalcul, mpResume, mpAutorise } from "@/lib/marquePages";
import { consignesGravure } from "@/lib/consignesGravure";
import { oubliesAtelier } from "@/lib/controleAtelier";
import { optionsArticle } from "@/lib/optionsVendues";

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const m1 = getProductBySlug("marque-page-bois-pompon"), m2 = getProductBySlug("marque-page-bois-oiseau"), m3 = getProductBySlug("marque-page-metal-peinture");
ok(m1 && m2 && m3, "les trois fiches existent");
const E = (o) => ({ "face|haut": { k: "" }, "face|bas": { k: "" }, "dos|haut": { k: "" }, "dos|bas": { k: "" }, ...o });
const tot = (p, mp) => mpCalcul(p, mpNormaliser(p, mp)).total;

// Modèle 1 seul + dessin 12 face milieu + « Léa » dos haut + cadre 92 « Paul » dos milieu = 23,90 € (maquette v12)
const a = { format: "seul", slots: [{ c: "mp1-caramel", v: E({ "face|bas": { k: "dessin", n: 12 }, "dos|haut": { k: "texte", t: "Léa" }, "dos|bas": { k: "dessin", n: 92, t: "Paul" } }) }] };
ok(tot(m1, a) === 23.9, "modèle 1 : 23,90 €");
// Coffret de 2 + « Paul » + dessin 7 = 32,70 €
const b = { format: "coffret2", slots: [{ c: "mp1-rouge", v: E({ "face|haut": { k: "texte", t: "Paul" } }) }, { c: "mp1-sable", v: E({ "face|bas": { k: "dessin", n: 7 } }) }] };
ok(tot(m1, b) === 32.7, "coffret de 2 : 32,70 €");
// Stock : une pièce par couleur + la boîte de 2
const cb = mpCalcul(m1, mpNormaliser(m1, b));
ok(JSON.stringify(cb.stock) === JSON.stringify([["mp1-rouge", 1], ["mp1-sable", 1], ["mp-boite-2", 1]]), "stock décompté");
ok(cb.enBoite, "coffret = colis");
// « Léa » en haut + dessin 33 au milieu sur la face = 16,90 € (v13)
ok(tot(m1, { format: "seul", slots: [{ c: "mp1-blond", v: E({ "face|haut": { k: "texte", t: "Léa" }, "face|bas": { k: "dessin", n: 33 } }) }] }) === 16.9, "16,90 €");
// Modèle 2 : face en haut = texte ou photo (17,90 €), face à côté = texte seul (un dessin y est refusé)
ok(tot(m2, { format: "seul", slots: [{ c: "mp2-blond", v: E({ "face|haut": { k: "photo", src: "/api/img/abcdef12" } }) }] }) === 17.9, "modèle 2 photo face haut 17,90 €");
ok(tot(m2, { format: "seul", slots: [{ c: "mp2-blond", v: E({ "face|bas": { k: "dessin", n: 12 } }) }] }) === 13.9, "modèle 2 : dessin refusé à côté de la fenêtre");
ok(mpAutorise(2, "face", "bas").join() === "texte", "modèle 2 face bas = texte");
// Numéros refusés (97, 99, 103) et photo venant d'ailleurs ignorée
ok(tot(m1, { format: "seul", slots: [{ c: "mp1-blond", v: E({ "face|bas": { k: "dessin", n: 97 } }) }] }) === 9.9, "n° 97 refusé");
ok(tot(m1, { format: "seul", slots: [{ c: "mp1-blond", v: E({ "face|bas": { k: "photo", src: "data:image/png;base64,AAAA" } }) }] }) === 13.9, "photo non envoyée : comptée, mais lien ignoré");
// Métal : pas de gravure, Papillon 19,90 €, coffret de 4 = 4 tableaux + boîte 7,90
ok(tot(m3, { format: "seul", slots: [{ c: "mp3-papillon", v: E({ "face|haut": { k: "texte", t: "x" } }) }] }) === 19.9, "métal : texte ignoré");
ok(tot(m3, { format: "coffret4", slots: ["mp3-amandier", "mp3-iris", "mp3-nympheas", "mp3-roses"].map((c) => ({ c })) }) === 71.5, "métal coffret de 4 : 71,50 €");
// Formats / couleurs invalides
ok(mpNormaliser(m1, { format: "coffret2", slots: [{ c: "mp1-rouge" }] }) === null, "nombre de pièces faux = refusé");
ok(mpNormaliser(m1, { format: "seul", slots: [{ c: "mp2-blond" }] }) === null, "couleur d'un autre modèle = refusée");
// Atelier : un bloc par pièce et par côté, rien d'oublié
const mpA = mpNormaliser(m1, a);
const item = { slug: m1.slug, fields: { mp: mpA } };
const c = consignesGravure(item);
ok(c.faces.length === 2 && c.faces[1].lignes.length === 2, "atelier : face + dos");
ok(c.faces[1].lignes.some((l) => /Paul/.test(l.v) && l.img), "atelier : cadre 92 avec vignette");
ok(c.general.some((g) => g.k === "Police"), "atelier : police");
ok(oubliesAtelier(item).length === 0, "contrôle atelier : rien d'oublié");
ok(optionsArticle({ slug: m1.slug, fields: { mp: mpNormaliser(m1, b) } }).some((o) => /Boîte/.test(o.libelle)), "vendu en plus : la boîte");
ok(/Marque-page 2 : Gris sable/.test(mpResume(m1, mpNormaliser(m1, b))), "résumé par pièce");
console.log(`✓ marque-pages : ${n} vérifications`);
