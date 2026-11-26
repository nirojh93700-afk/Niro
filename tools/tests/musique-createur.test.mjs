// Plaque et porte-clés « musique à scanner » (26/11/2026) : lien, vérification, prix, géométrie, atelier (fiche = paiement = atelier).
//   npm run test-musique
import { createRequire } from "node:module";
import {
  musLireLien, musNormaliser, musSupplement, musManque, musResume, musConsignes, musPhotos, musVariantId, musGeo, musMatrice, musQrPath, musFichier,
  MUS_TAILLES, MUS_MODELES, MUS_MOUSQUETONS, MUS_PRIX, MUS_EXEMPLE,
} from "@/lib/musiqueCreateur";
import { getProductBySlug } from "@/lib/products";
import { consignesGravure } from "@/lib/consignesGravure";
import { optionsArticle } from "@/lib/optionsVendues";
import { oubliesAtelier } from "@/lib/controleAtelier";
import { photosEnvoyees } from "@/lib/apercuCote";
import { supplementsPayes, controlePrixEcrits } from "@/lib/textesPrix";
import { gravureDejaOfferte } from "@/lib/engravingPrice";

const jsQR = createRequire(import.meta.url)("jsqr");
let ok = 0, ko = 0;
const v = (nom, cond, detail = "") => { if (cond) ok++; else { ko++; console.log("✗", nom, detail); } };
const LIEN = "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3";
const base = { lien: LIEN + "?si=abc123", modele: "plaque", tl: "m", titre: "Notre chanson", dedi: "Léa & Tom · 14.06.2025", police: "allura", scan: true, mq: "dore" };

// --- le lien ---
v("lien vide = rien", musLireLien("  ") === null);
v("Spotify reconnu, ?si= retiré", musLireLien(LIEN + "?si=abc")?.url === LIEN && musLireLien(LIEN)?.plat === "Spotify");
v("spotify: accepté", musLireLien("spotify:track:7qiZfU4dY1lWllzX7mPBI3")?.url === LIEN);
v("lien dans une phrase", musLireLien("Écoute ça " + LIEN + " c'est top")?.ok === true);
v("Deezer, lien court", musLireLien("https://deezer.page.link/abc")?.plat === "Deezer" && musLireLien("https://link.deezer.com/s/xyz")?.plat === "Deezer");
v("Apple Music garde ?i=", musLireLien("https://music.apple.com/fr/album/x/1?i=2")?.url.endsWith("?i=2"));
v("YouTube et youtu.be", musLireLien("https://youtu.be/dQw4w9WgXcQ")?.plat === "YouTube" && musLireLien("music.youtube.com/watch?v=x")?.plat === "YouTube");
v("SoundCloud", musLireLien("https://soundcloud.com/a/b")?.plat === "SoundCloud");
v("autre site refusé", musLireLien("https://exemple.com/chanson")?.ok === false && musLireLien("https://spotify.com.pirate.io/x")?.ok === false);
v("javascript: refusé", musLireLien("javascript:alert(1)")?.ok !== true);
v("lien de 400 caractères refusé", musLireLien(LIEN + "?x=" + "a".repeat(400))?.ok === false);

// --- vérification de la création ---
const mus = musNormaliser(base);
v("création simple acceptée, lien nettoyé", mus?.lien === LIEN && mus.plat === "Spotify");
v("plaque : pas de mousqueton gardé", mus.mq === "");
v("sans lien : refusée", musNormaliser({ ...base, lien: "" }) === null && musNormaliser({ ...base, lien: "https://exemple.com" }) === null);
v("modèle / taille inconnus : refusés", musNormaliser({ ...base, modele: "vague" }) === null && musNormaliser({ ...base, tl: "xl" }) === null);
v("titre coupé à 28, dédicace à 36", musNormaliser({ ...base, titre: "x".repeat(80), dedi: "y".repeat(80) }).titre.length === 28 && musNormaliser({ ...base, dedi: "y".repeat(80) }).dedi.length === 36);
v("écriture inconnue → playfair", musNormaliser({ ...base, police: "comic" }).police === "playfair");
v("photo cochée sans photo envoyée : refusée", musNormaliser({ ...base, ph: "oui" }) === null && musNormaliser({ ...base, photo: "https://ailleurs.fr/x.jpg" }) === null && musNormaliser({ ...base, photo: "data:image/png;base64,AAAA" }) === null);
const PH = "/api/img/AbCdEf123456";
v("photo du site acceptée", musNormaliser({ ...base, photo: PH })?.photo === PH);
v("petite plaque + photo : refusée", musNormaliser({ ...base, tl: "p", photo: PH }) === null);
const porte = musNormaliser({ ...base, modele: "porte", tl: "p", photo: PH });
v("porte-clés petit + photo au dos : accepté, sans textes, mousqueton gardé", porte && porte.titre === "" && porte.dedi === "" && porte.scan === false && porte.mq === "dore");
v("mousqueton inconnu → argenté", musNormaliser({ ...base, modele: "porte", mq: "violet" }).mq === "argente");

// --- prix ---
v("photo + 5 €", MUS_PRIX.photo === 5 && musSupplement(porte) === 5 && musSupplement(mus) === 0);
const produit = getProductBySlug("plaque-musique-a-scanner");
v("le produit existe, 6 options", produit?.createur === "musique" && produit.variants.length === 6);
for (const m of MUS_MODELES) for (const t of MUS_TAILLES[m.id === "porte" ? "porte" : "plaque"]) v(`option ${m.id} ${t.id}`, produit.variants.some((x) => x.id === musVariantId(m.id, t.id)));
v("titre ≤ 55 caractères, sans le mot Spotify", produit.title.length <= 55 && !/spotify/i.test(produit.name + produit.title));
v("supplément payé connu du contrôle des prix", supplementsPayes(produit).has(5));
v("aucun prix écrit sans paiement", controlePrixEcrits(produit).length === 0, JSON.stringify(controlePrixEcrits(produit)));
v("code gravure offerte : pas sur ce produit (textes compris)", gravureDejaOfferte(produit) === true);

// --- ce qui manque sur la fiche ---
v("manque le lien", musManque({ lien: "" }).length === 1 && musManque({ lien: LIEN }).length === 0);
v("manque la photo", musManque({ lien: LIEN, ph: "oui" }).length === 1 && musManque({ lien: LIEN, ph: "oui", photoChoisie: true }).length === 0);

// --- géométrie ---
const g = musGeo(mus);
v("plaque moyenne 110 × 123,3 mm", g.w === 110 && Math.abs(g.h - 123.31) < 0.01);
v("QR dans la plaque, ≥ 3,2 cm partout", (() => { for (const m of MUS_MODELES) for (const t of MUS_TAILLES[m.id === "porte" ? "porte" : "plaque"]) for (const photo of ["", PH]) { if (photo && m.id !== "porte" && t.id === "p") continue; const x = musGeo({ ...base, modele: m.id, tl: t.id, photo }); if (x.qr.t < 32 || x.qr.x < 0 || x.qr.y < 0 || x.qr.x + x.qr.t > x.w || x.qr.y + x.qr.t > x.h) return false; } return true; })());
const gp = musGeo({ ...mus, photo: PH });
v("plaque + photo : en largeur, photo à gauche du QR, mêmes tailles", gp.h < gp.w && gp.photo.x < gp.qr.x && gp.photo.t === gp.qr.t && gp.photo.x + gp.photo.t < gp.qr.x);
const gd = musGeo(porte, "dos");
v("porte-clés : dos en miroir, photo seule, dans le carré", gd.miroir && !gd.qr && gd.photo.x > gd.w - gd.w * 0.833 && gd.photo.x + gd.photo.t < gd.w);
v("porte-clés : trou dans la patte", (() => { const a = musGeo(porte); return a.trou.cx > a.w * 0.833 && a.trou.cx + a.trou.r < a.w; })());

// --- le QR code est relu : il rend exactement le lien ---
function relire(lien) {
  const m = musMatrice(lien), n = m.length, k = 8, q = 4, N = (n + 2 * q) * k, d = new Uint8ClampedArray(N * N * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) { const i = (((r + q) * k + y) * N + (c + q) * k + x) * 4; d[i] = d[i + 1] = d[i + 2] = 0; }
  return jsQR(d, N, N)?.data;
}
for (const l of [LIEN, MUS_EXEMPLE, "https://music.apple.com/fr/album/x/1440833098?i=1440833543", "https://www.deezer.com/track/3135556", "https://youtu.be/dQw4w9WgXcQ"]) v("QR relu : " + l.slice(8, 30), relire(l) === l);
v("tracé du QR : autant de rectangles que de suites sombres", musQrPath(musMatrice(LIEN), 0, 0, 66).split("M").length > 100);

// --- fichier de l'atelier ---
const f = musFichier(mus, musMatrice(mus.lien), "", "");
v("fichier en mm, découpe rouge, QR noir", /width="118mm"/.test(f.svg) && f.svg.includes('stroke="#ff0000"') && f.svg.includes('id="qr-code"') && f.svg.includes('fill="#000000"'));
const fp = musFichier(porte, musMatrice(porte.lien), "data:image/jpeg;base64,AAAA", "");
v("porte-clés + photo : deux pièces, le dos à côté", fp.svg.includes('id="piece-dos"') && fp.svg.includes("retourner la pièce") && fp.svg.includes('id="photo-dos"') && !fp.svg.includes('id="photo-avant"'));
v("porte-clés sans photo : une pièce", !musFichier({ ...porte, photo: "" }, musMatrice(LIEN), "", "").svg.includes("piece-dos"));

// --- commande, atelier ---
v("résumé : modèle, taille, lien en clair", /Plaque simple/.test(musResume(mus)) && musResume(mus).includes(LIEN) && /Allura/.test(musResume(mus)));
const item = { slug: produit.slug, name: produit.name, variantId: "musique-plaque-m", fields: { mus }, personalization: musResume(mus) };
const c = consignesGravure(item);
v("consignes : lien et taille en tête", c.general.some((l) => l.v === LIEN) && c.general.some((l) => /110 × 123,3 mm/.test(l.v)));
v("consignes : titre, dédicace, scannez", c.faces[0].lignes.some((l) => /Notre chanson/.test(l.v)) && c.faces[0].lignes.some((l) => /Léa & Tom/.test(l.v)) && c.faces[0].lignes.some((l) => /oui, gravé/.test(l.v)));
const itemP = { slug: produit.slug, name: produit.name, variantId: "musique-porte-p", fields: { mus: porte } };
const cp = consignesGravure(itemP);
v("porte-clés : mousqueton + dos avec la photo", cp.general.some((l) => l.k === "Mousqueton" && l.v === "Doré") && cp.faces.length === 2 && cp.faces[1].lignes[0].img === PH);
const o = optionsArticle(itemP);
v("vendu en plus : photo 5 € + mousqueton à mettre", o.some((x) => x.montant === 5 && /Photo/.test(x.libelle)) && o.some((x) => x.physique && /doré/.test(x.detail)));
v("vendu en plus : rien pour une plaque sans photo", optionsArticle(item).length === 0);
v("photo de la cliente retrouvée", musPhotos(porte)[0] === PH && photosEnvoyees(itemP).some((p) => p.src === PH) && photosEnvoyees(item).length === 0);
v("contrôle atelier : aucun oubli", oubliesAtelier(item).length === 0 && oubliesAtelier(itemP).length === 0, JSON.stringify([oubliesAtelier(item), oubliesAtelier(itemP)]));
v("7 mousquetons", MUS_MOUSQUETONS.length === 7);

console.log(`musique à scanner : ${ok} vérifications justes${ko ? `, ${ko} FAUSSES` : ""}`);
process.exit(ko ? 1 : 0);
