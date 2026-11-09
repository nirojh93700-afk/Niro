// npm run test-traduction : gravure traduite (07/11/2026) — garde-fou, décor sur la date, atelier.
import { manqueLangue, phraseConnue, estTraduit, resumeLangue, textesEnLangue, aTexteEnLangue, languesDeLaCommande } from "@/lib/traductionGravure";
import { verreGrave } from "@/lib/prixVerres";
import { texteAvecDecor } from "@/lib/decorTexte";
import { parcoursEtat } from "@/lib/parcoursGuide";
import { getProductBySlug } from "@/lib/products";
import { consignesGravure } from "@/lib/consignesGravure";
import { oubliesAtelier } from "@/lib/controleAtelier";
let ok = 0, ko = 0;
const t = (nom, c) => { if (c) ok++; else { ko++; console.log("✗", nom); } };
const vin = getProductBySlug("verre-a-vin-grave");
const base = { mode: "texte", police: "playfair" };
t("français : rien à confirmer", manqueLangue({ ...base, texte: "Merci" }) === null);
t("phrase connue", phraseConnue("Merci !", "ta") === "நன்றி");
const fv = { ...base, langue: "ta", texteSource: "Merci", texte: "நன்றி" };
t("traduit", estTraduit(fv));
t("sans case : bloqué", manqueLangue(fv) && /Cochez/.test(manqueLangue(fv)));
t("sans case : bouton grisé", parcoursEtat(vin, fv).ok === false);
t("traduction en cours", /arrive/.test(manqueLangue({ ...fv, texte: "" })));
t("traduction en cours : grisé", parcoursEtat(vin, { ...fv, texte: "" }).ok === false);
const okFv = { ...fv, tradOk: "oui" };
t("case cochée : ok", manqueLangue(okFv) === null && parcoursEtat(vin, okFv).ok === true);
t("direct : pas de case", manqueLangue({ ...base, langue: "ar", direct: "oui", texte: "شكرا" }) === null);
t("résumé", /Tamoul/.test(resumeLangue(okFv)) && /Merci/.test(resumeLangue(okFv)));
t("décor texte par défaut", texteAvecDecor("texte", "A", { decor: "♥" }) === "♥ A ♥" && texteAvecDecor("date", "2026", { decor: "♥" }) === "2026");
t("décor date", texteAvecDecor("date", "2026", { decor: "♥", decorPlace: "date" }) === "♥ 2026 ♥" && texteAvecDecor("texte", "A", { decor: "♥", decorPlace: "date" }) === "A");
t("décor deux", texteAvecDecor("texte2", "2026", { decor: "★", decorPlace: "deux" }) === "★ 2026 ★");
const item = { slug: "verre-a-vin-grave", name: "Verre", fields: { ...okFv, date: "12.06.2026", decor: "♥", decorPlace: "deux" } };
const c = consignesGravure(item);
const tout = JSON.stringify(c);
t("atelier : langue écrite", /Tamoul/.test(tout) && /Texte tapé/.test(tout));
t("atelier : date décorée", tout.includes("♥ 12.06.2026 ♥"));
t("atelier : texte décoré", tout.includes("♥ நன்றி ♥"));
t("contrôle atelier : rien d'oublié", oubliesAtelier(item).length === 0);

// Plusieurs textes (bijou recto / verso, 09/11/2026) : une seule langue, chaque texte traduit.
const bj = { police: "playfair", langue: "es", langueCles: "recto,verso", rectoSource: "Maman", recto: "Mamá", versoSource: "Je t'aime", verso: "" };
t("2 textes : traduction en cours", /arrive/.test(manqueLangue(bj)));
const bjT = { ...bj, verso: "Te quiero" };
t("2 textes : case demandée", /Cochez/.test(manqueLangue(bjT)));
t("2 textes : case cochée ok", manqueLangue({ ...bjT, tradOk: "oui" }) === null);
t("2 textes : liste", textesEnLangue(bjT).length === 2 && aTexteEnLangue(bjT));
t("2 textes : résumé cite les deux", /Maman/.test(resumeLangue(bjT)) && /Je t'aime/.test(resumeLangue(bjT)));
const bjItem = { slug: "collier-double-coeur", name: "Collier", fields: { ...bjT, tradOk: "oui" } };
const cj = JSON.stringify(consignesGravure(bjItem));
t("2 textes : atelier voit les deux textes tapés", cj.includes("Maman") && cj.includes("Je t'aime") && /Espagnol/.test(cj));
t("2 textes : rien d'oublié", oubliesAtelier(bjItem).length === 0);
t("2 textes : commande signalée", languesDeLaCommande({ spec: [bjItem] }).some((l) => l.code === "es"));
t("prix verre : texte tapé seul ne grave rien", verreGrave({ rectoSource: "Maman", langueCles: "recto", langue: "es" }) === false);

// ── Fiches à part (09/11/2026) : carnet, marque-pages, gobelet, cristaux déjà gravés.
{
  const { aDesLettres, texteMontre, texteFrappe, champsLangueAPlat, alignerTextes } = await import("@/lib/traductionGravure");
  const { cnVide, cnTextes, cnPlein, cnNormaliser, cnPrixGravure, cnCleTexte, cnLibelleCle } = await import("@/lib/carnet");
  const { mpNormaliser, mpCalcul, mpTextes, mpLibelleCle } = await import("@/lib/marquePages");
  const G = await import("@/lib/gobeletParcours");
  const { engravingExtra } = await import("@/lib/engravingPrice");
  const FR = { langue: "", direct: "", tradOk: "" }, TA = { langue: "ta", direct: "", tradOk: "" };

  // Règles pures
  t("lettres : un mot oui, une date non", aDesLettres("Léa") && aDesLettres("அம்மா") && !aDesLettres("12.06.2026") && !aDesLettres(""));
  t("frappe en français : gravé tel quel", JSON.stringify(texteFrappe(FR, "Merci")) === JSON.stringify({ t: "Merci", ts: "" }));
  t("frappe traduite : part en français tapé", JSON.stringify(texteFrappe(TA, "Merci")) === JSON.stringify({ t: "", ts: "Merci" }));
  t("frappe traduite : une date n'est jamais traduite", JSON.stringify(texteFrappe(TA, "12.06.2026")) === JSON.stringify({ t: "12.06.2026", ts: "" }));
  t("champ : montre le français tapé", texteMontre(TA, "நன்றி", "Merci") === "Merci" && texteMontre(FR, "Merci", "") === "Merci" && texteMontre(TA, "2026", "") === "2026");
  t("à plat : français = rien de plus", Object.keys(champsLangueAPlat(FR, [{ key: "a", t: "Merci", ts: "" }])).length === 0);
  t("à plat : que des dates = rien de plus", Object.keys(champsLangueAPlat(TA, [{ key: "a", t: "2026", ts: "" }])).length === 0);
  const plat = champsLangueAPlat(TA, [{ key: "a", t: "நன்றி", ts: "Merci" }, { key: "b", t: "2026", ts: "" }, { key: "c", t: "", ts: "Maman" }]);
  t("à plat : clés, gravé, français tapé", plat.langue === "ta" && plat.langueCles === "a,c" && plat.a === "நன்றி" && plat.aSource === "Merci" && plat.cSource === "Maman" && !("b" in plat));
  t("à plat : traduction en cours = bloqué", /arrive/.test(manqueLangue(plat)));
  t("à plat : case demandée puis ok", /Cochez/.test(manqueLangue({ ...plat, c: "அம்மா" })) && manqueLangue(champsLangueAPlat({ ...TA, tradOk: "oui" }, [{ key: "a", t: "நன்றி", ts: "Merci" }])) === null);
  const dir = champsLangueAPlat({ langue: "ar", direct: "oui", tradOk: "" }, [{ key: "a", t: "شكرا", ts: "" }]);
  t("à plat : j'écris moi-même", dir.direct === "oui" && dir.a === "شكرا" && !("aSource" in dir) && manqueLangue(dir) === null);
  const al = alignerTextes({ langue: "ta", texte: "Merci", zPrenom: "லூனா", zPrenomSource: "Luna" }, ["texte", "zPrenom", "zVille"]);
  t("aligner : un texte sans français tapé repart en traduction", al.texte === "" && al.texteSource === "Merci" && al.zPrenom === "லூனா");
  const al2 = alignerTextes({ langue: "", texte: "", texteSource: "Merci" }, ["texte"]);
  t("aligner : retour au français", al2.texte === "Merci" && al2.texteSource === "");

  // Carnet
  const carnet = getProductBySlug("carnet-a5-grave");
  const v = cnVide();
  v.face.haut = { ...v.face.haut, k: "texte", t: "", ts: "Carnet de voyage", t2: "2026", ts2: "" };
  t("carnet : texte en cours de traduction compte déjà (prix stable)", cnPlein(v.face.haut) && cnPrixGravure(v) === 7);
  t("carnet : clés des textes", cnTextes(v).map((x) => x.key).join(",") === "cnFaceHaut,cnFaceHaut2" && cnCleTexte("dos", "basg", true) === "cnDosBasg2" && /Couverture · en haut/.test(cnLibelleCle("cnFaceHaut")));
  t("carnet : traduction en cours = bloqué", /arrive/.test(manqueLangue(champsLangueAPlat(TA, cnTextes(v)))));
  const longue = "பயண நாட்குறிப்பு — ஒரு மிக நீண்ட மொழிபெயர்ப்பு";
  v.face.haut.t = longue;
  const cn = cnNormaliser(carnet, { police: "playfair", v });
  t("carnet : la traduction n'est pas coupée, le français tapé ne part pas dans cn", cn.v.face.haut.t === longue && !("ts" in cn.v.face.haut));
  const cnPlat = champsLangueAPlat({ ...TA, tradOk: "oui" }, cnTextes(v));
  t("carnet : la 2ᵉ ligne (date) n'est pas traduite", cnPlat.langueCles === "cnFaceHaut" && manqueLangue(cnPlat) === null);
  const cnItem = { slug: "carnet-a5-grave", name: "Carnet", variantId: carnet.variants[0].id, fields: { cn, ...cnPlat } };
  const cc = JSON.stringify(consignesGravure(cnItem));
  t("carnet : atelier voit la langue, le français tapé et le texte gravé", /Tamoul/.test(cc) && cc.includes("Carnet de voyage") && cc.includes(longue) && /Couverture · en haut/.test(cc));
  t("carnet : rien d'oublié à l'atelier", oubliesAtelier(cnItem).length === 0);
  t("carnet : commande signalée", languesDeLaCommande({ spec: [cnItem] }).some((l) => l.code === "ta"));
  t("carnet français : pas de langue", languesDeLaCommande({ spec: [{ slug: "carnet-a5-grave", name: "Carnet", fields: { cn } }] }).length === 0);

  // Marque-pages
  const m1 = getProductBySlug("marque-page-bois-pompon");
  const E = (o) => ({ "face|haut": { k: "" }, "face|bas": { k: "" }, "dos|haut": { k: "" }, "dos|bas": { k: "" }, ...o });
  const slots = [{ c: "mp1-caramel", v: E({ "face|haut": { k: "texte", t: "ليا", ts: "Léa" }, "dos|bas": { k: "dessin", n: 92, t: "بول", ts: "Paul" } }) }, { c: "mp1-rouge", v: E({ "dos|haut": { k: "texte", t: "2026" } }) }];
  const mpT = mpTextes(slots, 1);
  t("marque-pages : clés des textes", mpT.map((x) => x.key).join(",") === "mp1FaceHaut,mp1DosBas,mp2DosHaut" && /Marque-page 2 · dos, en haut/.test(mpLibelleCle("mp2DosHaut", 1)));
  const mp = mpNormaliser(m1, { format: "n2", slots });
  const mpFr = mpNormaliser(m1, { format: "n2", slots: [{ c: "mp1-caramel", v: E({ "face|haut": { k: "texte", t: "Léa" }, "dos|bas": { k: "dessin", n: 92, t: "Paul" } }) }, slots[1]] });
  t("marque-pages : aucun supplément pour la langue", mpCalcul(m1, mp).total === mpCalcul(m1, mpFr).total && !("ts" in mp.slots[0].v["face|haut"]));
  const mpPlat = champsLangueAPlat({ langue: "ar", direct: "", tradOk: "oui" }, mpT);
  t("marque-pages : à plat", mpPlat.langueCles === "mp1FaceHaut,mp1DosBas" && mpPlat.mp1DosBasSource === "Paul" && manqueLangue(mpPlat) === null);
  const mpItem = { slug: m1.slug, name: "Marque-pages", fields: { mp, ...mpPlat } };
  const cm = JSON.stringify(consignesGravure(mpItem));
  t("marque-pages : atelier voit la langue et les textes tapés", /Arabe/.test(cm) && cm.includes("Léa") && cm.includes("Paul") && /Marque-page 1 · face, en haut/.test(cm));
  t("marque-pages : rien d'oublié à l'atelier", oubliesAtelier(mpItem).length === 0);
  t("marque-pages : commande signalée", languesDeLaCommande({ spec: [mpItem] }).some((l) => l.code === "ar"));

  // Gobelet : la liste d'éléments, la bascule de langue, l'arrivée de la traduction
  const gob = getProductBySlug("gobelet-isotherme-40oz");
  const cfg = gob.gobeletParcours;
  let f = G.gobeletEcrire({}, [{ kind: "dessin", num: 12, side: "face", zone: "milieu" }, { kind: "texte", texte: "Maman", police: "allura", side: "face", zone: "haut" }, { kind: "cadre", num: 82, nom: "2026", police: "allura", side: "face", zone: "bas" }]);
  t("gobelet français : aucun champ de langue", !Object.keys(f).some((k) => /^gt\d|^langue/.test(k)) && G.gobeletEtat(f).ok);
  const prixFr = G.gobeletSupplement(f, cfg).montant;
  // la cliente choisit le tamoul : le menu bascule le texte tapé vers « …Source »
  const aPlat = G.gobeletAPlat(f);
  t("gobelet : le menu voit le texte (pas la date)", aPlat.gt1 === "Maman" && !("gt2" in aPlat));
  f = G.gobeletDepuisAPlat(f, { ...aPlat, langue: "ta", langueCles: "gt1", gt1: "", gt1Source: "Maman", tradOk: "" });
  t("gobelet : traduction en cours = bloqué, prix inchangé", /arrive/.test(G.gobeletEtat(f).manque || "") && G.gobeletSupplement(f, cfg).montant === prixFr && f.gt1Source === "Maman");
  f = G.gobeletDepuisAPlat(f, { ...G.gobeletAPlat(f), gt1: "அம்மா" });
  t("gobelet : traduction arrivée, case demandée", /Cochez/.test(G.gobeletEtat(f).manque || "") && /அம்மா/.test(f.autour) && f.gt1 === "அம்மா" && f.langueCles === "gt1");
  f = G.gobeletDepuisAPlat(f, { ...G.gobeletAPlat(f), tradOk: "oui" });
  t("gobelet : case cochée = ok, aucun supplément pour la langue", G.gobeletEtat(f).ok && G.gobeletSupplement(f, cfg).montant === prixFr);
  // un 2ᵉ texte ajouté pendant que la gravure est traduite, puis le dessin retiré : les textes gardent leur français tapé
  let liste = G.gobeletListe(f);
  f = G.gobeletEcrire({ ...f, tradOk: "" }, [...liste, { kind: "texte", texte: "", source: "Merci", police: "allura", side: "gauche", zone: "milieu" }]);
  t("gobelet : 2ᵉ texte en traduction", f.langueCles === "gt1,gt3" && f.gt3Source === "Merci" && /arrive/.test(G.gobeletEtat(f).manque || ""));
  f = G.gobeletDepuisAPlat(f, { ...G.gobeletAPlat(f), gt3: "நன்றி", tradOk: "oui" });
  liste = G.gobeletListe(f);
  f = G.gobeletEcrire(f, liste.filter((e) => e.kind !== "dessin"));
  t("gobelet : élément retiré, textes et français tapé suivent", f.mode === "texte" && f.texte === "அம்மா" && f.gt1Source === "Maman" && f.gt3 === "நன்றி" && f.gt3Source === "Merci" && G.gobeletEtat(f).ok);
  const gItem = { slug: gob.slug, name: "Gobelet", variantId: gob.variants[0].id, fields: f };
  const cg = JSON.stringify(consignesGravure(gItem));
  t("gobelet : atelier voit la langue et les textes tapés", /Tamoul/.test(cg) && cg.includes("Maman") && cg.includes("Merci") && cg.includes("நன்றி"));
  t("gobelet : rien d'oublié à l'atelier", oubliesAtelier(gItem).length === 0);
  t("gobelet : commande signalée, résumé", languesDeLaCommande({ spec: [gItem] }).some((l) => l.code === "ta") && /Langue : Tamoul/.test(G.gobeletResume(f, cfg)));
  // retour au français : tout redevient comme avant
  const ap = G.gobeletAPlat(f);
  f = G.gobeletDepuisAPlat(f, { ...ap, langue: "", direct: "", tradOk: "", langueCles: "", gt1: ap.gt1Source, gt1Source: "", gt3: ap.gt3Source, gt3Source: "" });
  t("gobelet : retour au français", f.texte === "Maman" && /Merci/.test(f.autour) && !Object.keys(f).some((k) => /^gt\d/.test(k)) && !f.langueCles && G.gobeletEtat(f).ok);
  // plus aucun texte : la langue revient au français
  f = G.gobeletEcrire({ langue: "ta", tradOk: "oui" }, [{ kind: "dessin", num: 3, side: "face", zone: "milieu" }]);
  t("gobelet : sans texte, pas de langue", f.langue === "" && languesDeLaCommande({ spec: [{ slug: gob.slug, name: "Gobelet", fields: f }] }).length === 0);

  // Cristal déjà gravé : texte libre et zodiaque
  const cr = getProductBySlug("cristal-deja-grave");
  const vid = "cristal-grave-v-moyen";
  const crFr = { modele: "Dessin : Colibri", format: "Vertical", texte: "Merci", police: "playfair", textePos: "bas" };
  const crTa = { ...crFr, texte: "நன்றி", texteSource: "Merci", langue: "ta", tradOk: "oui" };
  t("cristal : aucun supplément pour la langue", engravingExtra(cr, crTa, vid).amount === engravingExtra(cr, crFr, vid).amount && engravingExtra(cr, crFr, vid).amount === 5);
  t("cristal : sans la case, refusé", /Cochez/.test(manqueLangue({ ...crTa, tradOk: "" })));
  const crItem = { slug: cr.slug, name: "Cristal déjà gravé", variantId: vid, fields: crTa };
  t("cristal : atelier, contrôle, commande signalée", /Tamoul/.test(JSON.stringify(consignesGravure(crItem))) && oubliesAtelier(crItem).length === 0 && languesDeLaCommande({ spec: [crItem] }).length === 1);
  const zo = { modele: "Signe du zodiaque : Lion", format: "Vertical", zOption: "tout", zPrenom: "لونا", zPrenomSource: "Luna", zDate: "24 nov. 2022 · 19:27", zVille: "باريس", zVilleSource: "Paris", police: "playfair", textePos: "bas", langue: "ar", langueCles: "zPrenom,zVille", tradOk: "oui" };
  const zoItem = { slug: cr.slug, name: "Cristal déjà gravé", variantId: vid, fields: zo };
  const cz = JSON.stringify(consignesGravure(zoItem));
  t("zodiaque : prix inchangé (+8 €), la date n'est pas dans les textes traduits", engravingExtra(cr, zo, vid).amount === 8 && textesEnLangue(zo).map((x) => x.cle).join(",") === "zPrenom,zVille");
  t("zodiaque : atelier voit Luna, Paris et l'arabe ; rien d'oublié", /Arabe/.test(cz) && cz.includes("Luna") && cz.includes("Paris") && oubliesAtelier(zoItem).length === 0);
}
console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
