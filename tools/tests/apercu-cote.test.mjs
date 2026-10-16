// npm run test-apercu-cote — verre face / fond / les deux : chaque côté avec SA photo et SON texte
// (16/10/2026, commande 10OPUHMO : 2ᵉ photo absente de l'atelier, texte du fond posé sur la face).
import { cotesDeLArticle, contenuCote, photosEnvoyees, lignesDuCote } from "../../src/lib/apercuCote.js";
import { consignesGravure } from "../../src/lib/consignesGravure.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.log("✗", nom); } };

const deux = { slug: "verre-a-whisky-grave", variantId: "verre-whisky-grave", emplacement: "deux", photoSrc: "/api/img/A",
  fields: { emplacement: "deux", photo: "/api/img/A", photoFond: "/api/img/B", texte: "Super papa", texteFond: "Au fond", decor: "♥", police: "cinzel-deco" },
  layout: { photo: { cx: 0.5, cy: 0.46, size: 0.3 }, text: { cx: 0.5, cy: 0.82, fitScale: 0.02 }, photoFond: { cx: 0.5, cy: 0.5, size: 0.32 }, textFond: { cx: 0.5, cy: 0.71, fitScale: 0.02 } } };
t("les deux côtés", cotesDeLArticle(deux).join() === "face,fond");
const face = contenuCote(deux, "face"), fond = contenuCote(deux, "fond");
t("face : sa photo", face.photo === "/api/img/A");
t("face : SON texte seulement, avec le décor", face.lines.join("|") === "♥ Super papa ♥");
t("fond : sa photo", fond.photo === "/api/img/B");
t("fond : son texte", fond.lines.join("|") === "Au fond");
t("fond : photo du fond du verre", /fond/.test(fond.glass || ""));
t("fond : sa place", fond.photoLayout?.size === 0.32 && fond.textLayout?.cy === 0.71);
const ph = photosEnvoyees(deux);
t("deux photos envoyées", ph.length === 2 && /face/.test(ph[0].titre) && /fond/.test(ph[1].titre));
const c = consignesGravure(deux);
t("tableau : bloc Face avant + bloc Fond du verre", c.faces.map((f) => f.nom).join() === "Face avant,Fond du verre");
t("tableau : texte du fond dans le bloc du fond", c.faces[1].lignes.some((l) => l.v === "Au fond"));
t("tableau : texte de la face hors du bloc du fond", !c.faces[1].lignes.some((l) => l.v === "Super papa"));

const fondSeul = { slug: "verre-a-whisky-grave", emplacement: "fond", photoSrc: "/api/img/C", fields: { emplacement: "fond", photo: "/api/img/C", texte: "Léo" }, layout: { photo: { size: 0.2 } } };
t("fond seul : un côté", cotesDeLArticle(fondSeul).join() === "fond");
t("fond seul : la photo principale va au fond", contenuCote(fondSeul, "fond").photo === "/api/img/C");
t("fond seul : le texte principal va au fond", contenuCote(fondSeul, "fond").lines.join() === "Léo");
t("une seule photo", photosEnvoyees(fondSeul).length === 1);

t("face seule : texte + date", lignesDuCote({ texte: "A", texte2: "12.06" }, "face", false).join("|") === "A|12.06");
t("autre produit : photo simple", photosEnvoyees({ slug: "cristal-photo-3d-vertical", photoSrc: "/api/img/D" }).length === 1);

console.log(`${ok} vérifications au vert, ${ko} en échec`);
if (ko) process.exit(1);
