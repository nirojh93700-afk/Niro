// /llms.txt — résumé de la boutique pour les assistants IA (ChatGPT, Claude, Perplexity…), format llmstxt.org.
// 24/11/2026 (gérant : « fais le llms.txt »). Fabriqué à chaque lecture à partir du catalogue EN LIGNE
// (mêmes produits, mêmes prix, mêmes masquages que le site) et de la FAQ officielle (src/lib/faq.js) :
// rien n'est recopié à la main, donc rien ne peut devenir faux quand un prix ou un produit change.
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue } from "@/lib/univers";
import { getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";
import { vacationActive } from "@/lib/vacation";
import { FAQ } from "@/lib/faq";
import { getGuides } from "@/lib/guides";
import { OCCASIONS } from "@/lib/occasions";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");
const euro = (n) => `${Number(n).toFixed(2).replace(/\.00$/, "").replace(".", ",")} €`;
const propre = (s) => String(s || "").replace(/\s+/g, " ").trim();

// Questions de la FAQ reprises telles quelles. « Aperçu avant la gravure » n'est pas repris :
// l'atelier ne promet pas d'aperçu (règle du gérant du 15/09/2026).
const FAQ_EXCLUES = [/aperçu/i];

export async function GET() {
  const [catalog, settings] = await Promise.all([
    getCatalog().catch(() => []),
    getSettings().catch(() => ({})),
  ]);
  const R = rangerCatalogue(catalog);
  const cfg = resolveShippingConfig(settings?.shipping);
  const L = [];

  L.push("# Niv Création");
  L.push("");
  L.push("> Atelier français de gravure et de découpe laser. Bijoux en acier gravés d'un prénom ou d'une date, cristaux photo 3D, verres, carafe et gobelets gravés, décoration de mariage, cadeaux de naissance, papeterie et petits cadeaux personnalisés. Chaque pièce est gravée à la commande dans notre atelier, en France, et livrée en France et en Europe.");
  L.push("");
  L.push("## L'essentiel");
  L.push("");
  L.push(`- Site : ${BASE}`);
  L.push(`- Contact : ${BRAND.contact} · formulaire : ${BASE}/contact`);
  L.push("- Personnalisation : texte (prénom, date, message), écriture au choix, motif ou photo selon le produit ; aperçu en direct sur chaque fiche.");
  L.push("- Image personnalisée : sur les verres, la carafe, le cristal et les autres créations gravées, l'atelier grave la photo, le logo ou le dessin du client ; une demande particulière est possible depuis chaque fiche.");
  L.push(vacationActive(settings?.vacation)
    ? "- Fabrication : forte demande, délai de confection actuel de 3 à 4 semaines minimum ; commandes traitées dans leur ordre d'arrivée."
    : "- Fabrication : 3 à 5 jours ouvrés, puis envoi suivi.");
  L.push(`- Livraison : bijoux en lettre suivie, livraison offerte dès ${euro(cfg.bijouxFreeThreshold)} d'achat de bijoux ; point relais et domicile pour les colis ; le montant exact s'affiche au paiement.`);
  L.push("- Paiement sécurisé par carte bancaire et PayPal ; paiement en plusieurs fois selon disponibilité.");
  L.push(`- Retours : un article personnalisé n'est ni repris ni remboursé (article L221-28 du Code de la consommation) ; les articles non personnalisés ont 14 jours de rétractation. Conditions : ${BASE}/retours`);
  L.push(`- Carte cadeau : ${BASE}/carte-cadeau`);
  L.push("");

  for (const u of R.univers) {
    L.push(`## ${u.nom}`);
    L.push("");
    if (u.accroche) { L.push(propre(u.accroche)); L.push(""); }
    for (const r of u.rayons) {
      if (r.bientot || !r.slugs.length) continue;
      const lignes = r.slugs.map((s) => R.carteDe(s)).filter((c) => c && c.href && c.u === u.id);
      if (!lignes.length) continue;
      if (u.rayons.length > 1) { L.push(`### ${r.nom}`); L.push(""); }
      for (const c of lignes) {
        const p = catalog.find((x) => x.slug === c.slug);
        const prix = c.lo ? (c.hi > c.lo ? `dès ${euro(c.lo)}` : euro(c.lo)) : "";
        const accroche = propre(p?.tagline);
        L.push(`- [${propre(c.name)}](${BASE}${c.href})${prix ? ` : ${prix}` : ""}${accroche ? `. ${accroche}` : ""}`);
      }
      L.push("");
    }
  }

  const occasions = [...OCCASIONS.filter((o) => o.slug === "noel"), ...OCCASIONS.filter((o) => o.slug !== "noel")];
  if (occasions.length) {
    L.push("## Idées cadeaux par occasion");
    L.push("");
    for (const o of occasions) L.push(`- [${propre(o.titre || o.label)}](${BASE}/offrir/${o.slug})`);
    L.push("");
  }

  const guides = getGuides();
  if (guides.length) {
    L.push("## Guides et conseils");
    L.push("");
    for (const g of guides) L.push(`- [${propre(g.title)}](${BASE}/idees/${g.slug}) : ${propre(g.description)}`);
    L.push("");
  }

  L.push("## Questions fréquentes");
  L.push("");
  for (const f of FAQ) {
    if (FAQ_EXCLUES.some((re) => re.test(f.q))) continue;
    if (vacationActive(settings?.vacation) && /délais/i.test(f.q)) continue;
    L.push(`### ${f.q}`);
    L.push("");
    L.push(propre(f.a));
    L.push("");
  }

  L.push("## Pages utiles");
  L.push("");
  L.push(`- [Toute la boutique](${BASE}/boutique)`);
  L.push(`- [Avis clients](${BASE}/avis)`);
  L.push(`- [Questions fréquentes](${BASE}/faq)`);
  L.push(`- [Conditions générales de vente](${BASE}/cgv)`);
  L.push(`- [À propos de l'atelier](${BASE}/a-propos)`);
  L.push("");

  return new Response(L.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
