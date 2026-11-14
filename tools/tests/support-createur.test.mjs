// Support de téléphone à créer (14/11/2026) : vérification et prix de la création (fiche = paiement = atelier).
//   npm run test-support
import { supNormaliser, supSupplement, supManque, supResume, supConsignes, supPhotos, supVariantId, supTailleDeVariante } from "@/lib/supportCreateur";
import { SUP_DESSINS, SUP_LETTRES, SUP_EXEMPLE } from "@/lib/supportCreateurData";
import { getProductBySlug } from "@/lib/products";
import { consignesGravure } from "@/lib/consignesGravure";
import { optionsArticle } from "@/lib/optionsVendues";
import { oubliesAtelier } from "@/lib/controleAtelier";
import { photosEnvoyees } from "@/lib/apercuCote";
import { supplementsPayes, controlePrixEcrits } from "@/lib/textesPrix";

let ok = 0, ko = 0;
const v = (nom, cond, detail = "") => { if (cond) ok++; else { ko++; console.log("✗", nom, detail); } };
const base = { forme: "arche", taille: "standard", grave: true, ajoure: false, motif: "coeurs", densite: "moyen", piedMotif: true, angle: 13, cable: true, police: "playfair" };
const texte = { type: "texte", texte: "Camille", police: "allura", s: 1, x: 200, y: 300 };

// --- vérification ---
v("création simple acceptée", supNormaliser({ ...base, els: [texte] })?.els.length === 1);
v("forme inconnue refusée", supNormaliser({ ...base, forme: "etoile", els: [texte] }) === null);
v("taille inconnue refusée", supNormaliser({ ...base, taille: "geant", els: [texte] }) === null);
v("gravure cochée sans élément refusée", supNormaliser({ ...base, els: [] }) === null);
v("texte vide refusé", supNormaliser({ ...base, els: [{ ...texte, texte: "   " }] }) === null);
v("texte coupé à 30 caractères", supNormaliser({ ...base, els: [{ ...texte, texte: "x".repeat(80) }] }).els[0].texte.length === 30);
v("écriture inconnue → playfair", supNormaliser({ ...base, els: [{ ...texte, police: "comic" }] }).els[0].police === "playfair");
v("13 éléments refusés", supNormaliser({ ...base, els: Array.from({ length: 13 }, () => texte) }) === null);
const d = supNormaliser({ ...base, els: [{ type: "dessin", n: 27, src: "data:image/png;base64,AAAA", url: "/n-importe/quoi.png" }] });
v("dessin : adresse refaite depuis la table", d.els[0].src === SUP_DESSINS["27"].src && !("url" in d.els[0]));
v("dessin inconnu refusé", supNormaliser({ ...base, els: [{ type: "dessin", n: 999 }] }) === null);
const l = supNormaliser({ ...base, els: [{ type: "lettre", L: "c", nom: "Camille", police: "cinzel" }] });
v("lettre : majuscule, image et bande de la table", l.els[0].L === "C" && l.els[0].src === SUP_LETTRES.C.src && Array.isArray(l.els[0].b));
v("photo en données refusée (pas envoyée)", supNormaliser({ ...base, els: [{ type: "photo", src: "data:image/jpeg;base64,AAAA" }] }) === null);
v("photo d'un autre site refusée", supNormaliser({ ...base, els: [{ type: "photo", src: "https://exemple.fr/a.jpg" }] }) === null);
const ph = supNormaliser({ ...base, els: [{ type: "photo", src: "data:image/jpeg;base64,AAAA", url: "/api/img/AbCdEf123456" }] });
v("photo envoyée : l'adresse du site est gardée", ph.els[0].src === "/api/img/AbCdEf123456");
v("photo d'exemple acceptée", supNormaliser({ ...base, els: [{ type: "photo", src: "data:…", url: SUP_EXEMPLE }] })?.els[0].src === SUP_EXEMPLE);
const nu = supNormaliser({ ...base, grave: false, els: [texte] });
v("sans gravure : les éléments ne sont pas gardés", nu.els.length === 0 && nu.grave === false);
v("réglages hors liste remis aux valeurs sûres", (() => { const x = supNormaliser({ ...base, angle: 45, motif: "zèbre", densite: "trop", els: [texte] }); return x.angle === 13 && x.motif === "coeurs" && x.densite === "moyen"; })());
v("place bornée", (() => { const x = supNormaliser({ ...base, els: [{ ...texte, x: 99999, y: -5, s: 50 }] }).els[0]; return x.x === 400 && x.y === 0 && x.s === 2.2; })());

// --- prix (gérant, 12/11) ---
const p = getProductBySlug("support-telephone-bois-grave");
const prix = (sup) => Math.round((p.variants.find((x) => x.id === supVariantId(sup.taille)).price + supSupplement(sup)) * 100) / 100;
v("la fiche est le créateur", p.createur === "support" && p.variants.length === 3);
v("petit sans rien = 12,90 €", prix(supNormaliser({ ...base, taille: "petit", grave: false, els: [] })) === 12.9);
v("standard + cœurs + texte + dessin = 24,90 €", prix(supNormaliser({ ...base, ajoure: true, els: [texte, { type: "dessin", n: 1 }] })) === 24.9);
v("grand + motif + texte + dessin = 27,90 €", prix(supNormaliser({ ...base, taille: "grand", ajoure: true, els: [texte, { type: "dessin", n: 1 }] })) === 27.9);
v("motif seul sur le petit = 15,90 €", prix(supNormaliser({ ...base, taille: "petit", grave: false, ajoure: true })) === 15.9);
v("taille ↔ option", supTailleDeVariante("support-tel-grand") === "grand" && supTailleDeVariante("support-tel-photo") === null);
v("suppléments écrits = suppléments payés", supplementsPayes(p).has(3) && controlePrixEcrits(p).length === 0, JSON.stringify(controlePrixEcrits(p)));

// --- ce qui manque ---
v("gravure sans élément : phrase", /Ajoutez un élément/.test(supManque({ ...base, els: [] })));
v("création prête : rien", supManque({ ...base, els: [texte] }) === "");

// --- atelier ---
const sup = supNormaliser({ ...base, ajoure: true, cable: false, els: [texte, { type: "dessin", n: 27 }, { type: "lettre", L: "C", nom: "Camille", police: "cinzel" }, { type: "photo", url: "/api/img/AbCdEf123456" }] });
const item = { slug: p.slug, name: p.name, variantId: "support-tel-standard", variantTitle: "Standard · 80 × 151 mm", fields: { sup } };
const c = consignesGravure(item);
const tout = JSON.stringify(c);
v("consignes : forme, taille, câble, motif", /Arche/.test(tout) && /80 × 151/.test(tout) && /SANS passage du câble/.test(tout) && /Cœurs/.test(tout));
v("consignes : les 4 éléments", c.faces[0].lignes.length === 4 && /Camille/.test(tout) && /Dessin n° 27/.test(tout) && /Lettre C/.test(tout));
v("consignes : écriture du texte", /Allura/.test(tout));
v("résumé en une ligne", /Arche/.test(supResume(sup)) && /Motif ajouré/.test(supResume(sup)) && /sans passage du câble/.test(supResume(sup)));
v("photos de la cliente", supPhotos(sup).length === 1 && photosEnvoyees(item).length === 1);
const opts = optionsArticle(item);
v("vendu en plus : 4 gravures + le motif", opts.length === 5 && opts.every((o) => o.montant === 3), JSON.stringify(opts));
v("aucun choix caché à l'atelier", oubliesAtelier(item).length === 0, JSON.stringify(oubliesAtelier(item)));
v("bois nu : dit à l'atelier", /aucun/.test(JSON.stringify(supConsignes(supNormaliser({ ...base, grave: false, els: [] })))));

console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
