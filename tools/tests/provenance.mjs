// Provenance des clientes (09/11/2026). `npm run test-provenance`.
import { classerSource, nettoyerProvenance, compacterProvenance, lireProvenanceCompacte, majProvenance, statsProvenance, lienMarque, estInterne, hoteDe, court, TAILLE_META } from "@/lib/provenance";
import { pastilleProvenance, passeProvenance, choixProvenance } from "@/lib/fileCommandes";
let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };
const cle = (x) => classerSource(x).cle;

// --- classement des sources ---
v(cle({ referrer: "https://www.google.com/" }) === "google", "google.com → google");
v(cle({ referrer: "https://www.google.fr/search?q=x" }) === "google", "google.fr → google");
v(cle({ referrer: "android-app://com.google.android.googlequicksearchbox/" }) === "google", "appli Google → google");
v(cle({ referrer: "https://l.instagram.com/?u=abc" }) === "instagram", "l.instagram.com → instagram");
v(classerSource({ referrer: "https://l.instagram.com/" }).nom === "Instagram", "nom Instagram");
v(cle({ referrer: "https://www.tiktok.com/@x" }) === "tiktok", "tiktok.com → tiktok");
v(cle({ ttclid: "abc" }) === "tiktok", "ttclid → tiktok");
v(cle({ fbclid: "abc" }) === "facebook", "fbclid seul → facebook");
v(cle({ fbclid: "abc", referrer: "https://l.instagram.com/" }) === "instagram", "fbclid + référent Instagram → instagram");
v(cle({ referrer: "https://m.facebook.com/" }) === "facebook", "m.facebook.com → facebook");
v(cle({ gclid: "abc" }) === "google", "gclid → google");
v(cle({ referrer: "https://www.pinterest.fr/pin/1" }) === "pinterest", "pinterest.fr → pinterest");
v(cle({ referrer: "https://pin.it/abc" }) === "pinterest", "pin.it → pinterest");
v(cle({ referrer: "https://mail.google.com/" }) === "email", "mail.google.com → email (pas google)");
v(cle({ utm_source: "newsletter" }) === "email", "utm_source=newsletter → email");
v(cle({ utm_source: "brevo", utm_medium: "email" }) === "email", "utm_medium=email → email");
v(cle({ utm_source: "instagram", referrer: "https://www.google.com/" }) === "instagram", "utm prioritaire sur le référent");
v(cle({ utm_source: "TikTok", gclid: "x" }) === "tiktok", "utm prioritaire sur l'identifiant de clic, majuscules acceptées");
v(cle({ referrer: "https://nivcreation.fr/boutique" }) === "direct", "référent nivcreation.fr = direct");
v(cle({ referrer: "https://www.nivcreation.fr/" }) === "direct", "référent www.nivcreation.fr = direct");
v(cle({ referrer: "https://checkout.stripe.com/c/pay" }) === "direct", "retour de la page de paiement = direct");
v(cle({}) === "direct" && cle() === "direct", "rien → direct");
const autre = classerSource({ referrer: "https://www.bing.com/search" });
v(autre.cle === "autre" && autre.nom === "bing.com", "autre site : nom = son adresse");
v(classerSource({ utm_source: "blog-partenaire" }).cle === "autre", "utm inconnu → autre");
v(estInterne("") && estInterne("https://niv-creation--niv-creation.europe-west4.hosted.app/") && !estInterne("https://www.google.com"), "estInterne");
v(hoteDe("https://www.Google.com/search?q=a") === "google.com", "hoteDe retire www et le chemin");

// --- nettoyage serveur ---
v(nettoyerProvenance(null) === null && nettoyerProvenance("x") === null && nettoyerProvenance([]) === null && nettoyerProvenance({}) === null, "provenance absente ou fausse → null");
const sale = nettoyerProvenance({
  premiere: { referrer: "https://l.instagram.com/?u=<script>alert(1)</script>", utm_source: "Insta\"gram", utm_medium: "bio", utm_campaign: "x".repeat(400), gclid: "SECRET-TOKEN-123", page: "/produit/collier?x=<img>#h", date: "2026-11-04T20:14:00Z", inconnu: { a: 1 } },
  derniere: { referrer: 42, utm_source: { $gt: "" }, page: "javascript:alert(1)", date: "n'importe quoi" },
  visites: "1e9", autre: "champ libre",
});
const plat = JSON.stringify(sale);
v(sale && sale.source === "instagram", "source recalculée au serveur (jamais crue du navigateur)");
v(!/[<>"'`\\]/.test(Object.values(sale.premiere).join("")) , "aucun caractère dangereux gardé");
v(!plat.includes("SECRET-TOKEN") && sale.premiere.clic === "gclid", "la valeur du gclid n'est jamais gardée, seulement son nom");
v(sale.premiere.utm_campaign.length <= 120 && Object.values(sale.premiere).every((x) => String(x).length <= 120), "chaînes de 120 caractères au plus");
v(sale.premiere.page === "/produit/collier", "page d'arrivée sans paramètres");
v(sale.visites === 999, "nombre de visites borné");
v(!plat.includes("champ libre") && !plat.includes("inconnu"), "aucun champ libre recopié");
v(sale.derniere && sale.derniere.source === "direct" && sale.derniere.date === "" && !sale.derniere.page.includes(":alert"), "dernière visite fausse : vidée, sans casser");
v(court({ a: 1 }) === "" && court(null) === "" && court("  a\n\tb  ") === "a b", "court()");
const simple = nettoyerProvenance({ premiere: { referrer: "https://www.google.com/", page: "/", date: "2026-11-04T20:14:00Z" }, visites: 1 });
v(simple.derniere === null && simple.nom === "Google" && simple.visites === 1, "une seule visite : pas de « dernière »");

// --- metadata Stripe ---
const gros = nettoyerProvenance({
  premiere: { referrer: "https://" + "sous-domaine-tres-long.".repeat(4) + "exemple.com/", utm_source: "s".repeat(60), utm_medium: "m".repeat(60), utm_campaign: "c".repeat(120), fbclid: 1, page: "/" + "p".repeat(119), date: "2026-11-04T20:14:00Z" },
  derniere: { referrer: "https://l.instagram.com/", utm_source: "t".repeat(60), utm_medium: "n".repeat(60), utm_campaign: "d".repeat(120), ttclid: 1, page: "/" + "q".repeat(119), date: "2026-11-07T17:02:00Z" },
  visites: 12,
});
const meta = compacterProvenance(gros);
v(meta.length > 0 && meta.length <= TAILLE_META && TAILLE_META < 500, `metadata sous la limite de Stripe (${meta.length} caractères)`);
v(compacterProvenance(null) === "" && compacterProvenance({}) === "", "rien à ranger → chaîne vide");
const normal = nettoyerProvenance({
  premiere: { referrer: "https://www.google.com/", page: "/produit/cristal-photo-3d-vertical", date: "2026-11-04T20:14:00Z" },
  derniere: { referrer: "https://l.instagram.com/", utm_source: "instagram", utm_medium: "bio", page: "/", date: "2026-11-07T17:02:00Z" },
  visites: 3,
});
const relu = lireProvenanceCompacte(compacterProvenance(normal));
v(JSON.stringify(relu) === JSON.stringify(normal), "aller-retour panier → Stripe → commande sans perte");
v(relu.source === "google" && relu.derniere.source === "instagram" && relu.visites === 3, "1re visite Google, revenue par Instagram, 3 visites");
v(lireProvenanceCompacte("") === null && lireProvenanceCompacte("{pas du json") === null && lireProvenanceCompacte("x".repeat(700)) === null && lireProvenanceCompacte('{"v":1}') === null, "metadata absente ou abîmée → null");

// --- navigateur (calcul pur) ---
const T = Date.parse("2026-11-04T20:00:00Z"), J = 86400000;
let e = majProvenance(null, { referrer: "https://www.google.com/", page: "/" }, { maintenant: T });
v(e.visites === 1 && e.premiere.referrer === "google.com" && e.derniere === null, "1re visite notée");
e = majProvenance(e, { referrer: "https://nivcreation.fr/", page: "/boutique" }, { nouvelleVisite: false, maintenant: T + 1000 });
v(e.visites === 1 && e.derniere === null, "page suivante de la même visite : rien ne change");
e = majProvenance(e, { referrer: "", page: "/" }, { maintenant: T + 2 * J });
v(e.visites === 2 && e.derniere === null && e.premiere.referrer === "google.com", "retour en direct : visite comptée, 1re visite gardée");
e = majProvenance(e, { referrer: "https://l.instagram.com/", utm_source: "instagram", utm_medium: "bio", page: "/" }, { maintenant: T + 3 * J });
v(e.visites === 3 && e.derniere.utm_source === "instagram" && e.premiere.referrer === "google.com", "revenue par Instagram : dernière visite mise à jour, 1re jamais écrasée");
const e2 = majProvenance(e, { page: "/" }, { maintenant: T + 31 * J });
v(e2.visites === 1 && e2.premiere.referrer === "" && e2.derniere === null, "après 30 jours : on repart de zéro");

// --- Gestion ---
const cmd = { total: 64.8, provenance: normal }, vieille = { total: 20 };
const pa = pastilleProvenance(cmd);
v(pa && pa.nom === "Google" && pa.extra === "puis revenue par Instagram", "pastille : Google · puis revenue par Instagram");
v(pastilleProvenance(vieille) === null, "ancienne commande : aucune pastille");
v(passeProvenance(cmd, "google") && !passeProvenance(cmd, "instagram") && passeProvenance(vieille, "inconnue") && !passeProvenance(cmd, "inconnue") && passeProvenance(vieille, ""), "filtre Provenance");
v(JSON.stringify(choixProvenance([cmd, vieille])) === JSON.stringify([["google", "Google"], ["inconnue", "Non relevée"]]) && choixProvenance([vieille]).length === 0, "choix du filtre : sources présentes seulement");
const s1 = statsProvenance([cmd, vieille, { total: 35.2, provenance: normal }], "premiere");
v(s1.commandes === 3 && s1.ca === 120 && s1.connues === 2 && s1.lignes[0].cle === "google" && s1.lignes[0].commandes === 2 && s1.lignes[0].ca === 100 && s1.lignes[0].panier === 50, "tableau par source (1re visite)");
v(s1.lignes[s1.lignes.length - 1].cle === "inconnue", "« non relevée » en dernier");
v(statsProvenance([cmd], "derniere").lignes[0].cle === "instagram", "bascule dernière visite");
v(lienMarque({ source: "instagram", medium: "bio" }) === "https://nivcreation.fr/?utm_source=instagram&utm_medium=bio", "lien de bio");
v(lienMarque({ source: "tiktok", campagne: "Réel Noël cristal", page: "/produit/collier-coeur-grave" }) === "https://nivcreation.fr/produit/collier-coeur-grave?utm_source=tiktok&utm_medium=publication&utm_campaign=reel-noel-cristal", "lien d'une publication");

console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);
