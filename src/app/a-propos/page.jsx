import Link from "next/link";
import { getSettings, getReviews } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";
import { vacationActive } from "@/lib/vacation";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

// Page À propos enrichie (24/11/2026, maquette https://claude.ai/artifact/Nr46B2aRXE5QYHvXTSUNHk, « applique »).
// Pour les clientes, Google et les IA : ce que fait l'atelier, comment se passe une commande, les matières,
// les garanties, des questions et l'identité de l'entreprise. Aucun nom de personne ; l'atelier est « en France ».
// La note des avis, le seuil de livraison offerte et le délai sont lus en direct (rien d'écrit à la main).

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");
const euro = (n) => `${Number(n).toFixed(2).replace(/\.00$/, "").replace(".", ",")} €`;

export const metadata = {
  alternates: { canonical: "/a-propos" },
  title: "À propos — notre atelier de gravure en France",
  description:
    "Niv Création, atelier français de gravure et de découpe laser : bijoux gravés, cristal photo 3D, verres, mariage et cadeaux personnalisés, gravés à la commande en France.",
};

const UNIVERS = [
  { nom: "Bijoux gravés", d: "Colliers et bracelets en acier inoxydable, gravés d'un prénom, d'une date ou d'un mot.", img: "/produits/collier-coeur-grave-1.jpg", href: "/boutique/bijoux" },
  { nom: "Cristal photo 3D", d: "Votre photo gravée en relief à l'intérieur d'un bloc de cristal, avec ou sans socle lumineux.", img: "/produits/cristal-h-couple.jpg", href: "/cristaux" },
  { nom: "Verres, carafe & gobelets", d: "Verres à vin, flûtes, verres à whisky et carafe gravés de vos prénoms, d'un logo ou d'un dessin.", img: "/produits/verre_whisky_papa_monde_banniere.jpg", href: "/boutique/verres" },
  { nom: "Mariage", d: "Numéros de table, menus et décoration en bois, dessinés et découpés dans notre atelier.", img: "/produits/numero_table_arche_geometrique_relief_bois.jpeg", href: "/boutique/mariage" },
  { nom: "Bébé & Enfant", d: "Couverts, puzzles en bois, plaque de porte et veilleuse au prénom de l'enfant.", img: "/produits/couverts_enfants_ex_prenom.jpg", href: "/boutique/enfants" },
  { nom: "Papeterie & petits cadeaux", d: "Marque-pages, carnets, porte-clés et petites attentions à graver.", img: "/marque-pages/m1/ambiance.jpg", href: "/boutique/papeterie" },
];

const MATIERES = [
  ["Acier inoxydable", "pour les bijoux : il se porte au quotidien et garde sa gravure nette."],
  ["Cristal optique", "pour les blocs photo 3D : la gravure apparaît en relief, à l'intérieur."],
  ["Verre", "pour les verres et la carafe : la gravure ressort en blanc givré."],
  ["Bois", "contreplaqué et bois clairs pour la décoration, les jeux et la papeterie, dessinés et découpés sur place."],
];

export default async function AProposPage() {
  const [settings, reviewsBySlug] = await Promise.all([
    getSettings().catch(() => ({})),
    getReviews().catch(() => ({})),
  ]);
  const apropos = settings?.apropos || "";
  const cfg = resolveShippingConfig(settings?.shipping);
  const vacances = vacationActive(settings?.vacation);
  const delai = vacances ? "dans leur ordre d'arrivée" : "en 3 à 5 jours ouvrés";

  const notes = [];
  for (const list of Object.values(reviewsBySlug || {})) for (const r of list || []) if (r.approved && r.rating) notes.push(r.rating);
  const nbAvis = notes.length;
  const moyenne = nbAvis ? Math.round((notes.reduce((s, n) => s + n, 0) / nbAvis) * 10) / 10 : 0;

  const ETAPES = [
    ["Vous personnalisez", "Sur la fiche, vous écrivez votre texte, choisissez l'écriture, un motif ou votre photo. L'aperçu se met à jour en direct."],
    ["Nous gravons", `Chaque pièce est gravée à la commande, une par une, dans notre atelier en France, ${delai}.`],
    ["Nous emballons", "Pochette, sac ou boîte cadeau selon votre choix : votre pièce part prête à offrir."],
    ["Vous recevez", "Envoi suivi en France et en Europe, en lettre suivie, en point relais ou à domicile."],
  ];
  const FAQ = [
    ["Où sont fabriqués vos produits ?", "Chaque pièce est gravée et personnalisée à la commande dans notre atelier, en France. Nos créations en bois y sont aussi dessinées et découpées."],
    ["Pouvez-vous graver une image qui m'est personnelle ?", "Oui. Sur les verres, la carafe, le cristal et les autres créations gravées, nous gravons votre photo, votre logo ou votre dessin. Depuis chaque fiche, le bouton « Faire une demande particulière » permet de nous décrire votre idée."],
    ["Combien de temps faut-il pour recevoir ma commande ?", vacances
      ? "Chaque pièce est gravée à la commande : le délai de confection actuel est indiqué sur chaque fiche et dans le panier. Votre colis part ensuite en envoi suivi."
      : "La gravure demande 3 à 5 jours ouvrés, puis votre colis part en envoi suivi. Le mode de livraison et son prix s'affichent avant le paiement."],
    ["Livrez-vous hors de France ?", "Oui, nous livrons en Europe. Choisissez votre pays dans le panier : le prix de la livraison s'affiche avant le paiement."],
    ["Faites-vous des commandes en quantité, pour un mariage ou une entreprise ?", "Oui : numéros de table, verres gravés au logo, cadeaux d'invités. Écrivez-nous depuis la page Contact, nous vous envoyons un devis."],
  ];

  const ld = [
    {
      "@context": "https://schema.org", "@type": "AboutPage", url: `${SITE}/a-propos`, name: "À propos de Niv Création",
      mainEntity: {
        "@type": "Organization", name: "Niv Création", url: SITE, email: BRAND.contact,
        description: "Atelier français de gravure et de découpe laser. Bijoux, cristal photo 3D, verres, mariage et cadeaux personnalisés, gravés à la commande en France.",
        identifier: { "@type": "PropertyValue", propertyID: "SIRET", value: "10591477400010" },
        address: { "@type": "PostalAddress", addressCountry: "FR" },
        areaServed: ["FR", "Europe"],
        hasMerchantReturnPolicy: [
          { "@type": "MerchantReturnPolicy", name: "Articles personnalisés", applicableCountry: "FR",
            returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" },
          { "@type": "MerchantReturnPolicy", name: "Articles non personnalisés", applicableCountry: "FR",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 14,
            returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/ReturnShippingFees" },
        ],
      },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <div className="ap2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section>
        <div className="w hero">
          <div>
            <p className="ey">Notre atelier</p>
            <h1>L'art de graver <em>vos émotions</em></h1>
            <p className="lead">Niv Création est un atelier français de gravure et de découpe laser. Nous gravons à la commande des bijoux, des cristaux photo 3D, des verres et des cadeaux, et nous dessinons puis découpons nos créations en bois, pour célébrer les moments qui comptent.</p>
            <ul className="faits"><li>Gravé à la commande en France</li><li>Aperçu en direct sur chaque fiche</li><li>Livraison suivie en France et en Europe</li></ul>
            <Link href="/boutique" className="btn2">Découvrir nos créations</Link>
          </div>
          <div className="mos">
            <Link href="/produit/cristal-photo-3d-horizontal"><img src="/produits/cristal-h-famille.jpg" alt="Cristal photo 3D gravé d'une photo de famille" /></Link>
            <Link href="/produit/carafe-a-whisky-gravee"><img src="/produits/carafe_gravee.jpg" alt="Carafe à whisky gravée" loading="lazy" /></Link>
            <Link href="/produit/collier-coeur-grave"><img src="/produits/collier-coeur-grave-1.jpg" alt="Collier cœur gravé d'un prénom" loading="lazy" /></Link>
          </div>
        </div>
      </section>

      {apropos ? (
        <section><div className="w"><div className="product-desc" style={{ borderTop: "none", paddingTop: 0 }} dangerouslySetInnerHTML={{ __html: apropos }} /></div></section>
      ) : null}

      <section className="sand">
        <div className="w">
          <p className="ey">Ce que nous gravons</p>
          <h2>Six familles de <em>créations</em></h2>
          <p className="lead">Chaque famille a sa page, avec les prix et l'aperçu de la gravure.</p>
          <div className="grid3">
            {UNIVERS.map((u) => (
              <Link key={u.nom} className="uni" href={u.href}>
                <img src={u.img} alt={u.nom} loading="lazy" />
                <div className="t"><h3>{u.nom}</h3><p>{u.d}</p><span>Voir les créations →</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="w">
          <p className="ey">Comment ça se passe</p>
          <h2>De votre idée <em>à votre colis</em></h2>
          <div className="steps">{ETAPES.map(([t, d]) => <div key={t} className="step"><b>{t}</b><p>{d}</p></div>)}</div>
        </div>
      </section>

      <section className="sand">
        <div className="w">
          <p className="ey">Nos matières</p>
          <h2>Des matières choisies <em>pour durer</em></h2>
          <ul className="mat mat4">{MATIERES.map(([t, d]) => <li key={t}><b>{t}</b> : {d}</li>)}</ul>
        </div>
      </section>

      <section>
        <div className="w">
          <p className="ey">Commandez en confiance</p>
          <h2>Ce qui est <em>garanti</em></h2>
          <div className="conf">
            <div>
              <b>Avis clients</b>
              {nbAvis ? (
                <><span className="stars" aria-hidden="true">{"★".repeat(Math.round(moyenne))}</span> {moyenne.toFixed(1).replace(".", ",")}/5 sur {nbAvis} avis. <Link href="/avis">Lire les avis</Link></>
              ) : (
                <>Les avis de nos clientes et clients. <Link href="/avis">Lire les avis</Link></>
              )}
            </div>
            <div><b>Paiement sécurisé</b>Carte bancaire et PayPal ; paiement en plusieurs fois selon disponibilité.</div>
            <div><b>Livraison suivie</b>Offerte dès {euro(cfg.bijouxFreeThreshold)} d'achat de bijoux ; le prix s'affiche avant le paiement.</div>
            <div><b>Retours</b>14 jours pour les articles non personnalisés ; une pièce gravée à votre nom n'est pas reprise, sauf défaut (garantie légale de 2 ans). <Link href="/retours">Conditions</Link></div>
          </div>
        </div>
      </section>

      <section className="sand">
        <div className="w">
          <p className="ey">Questions fréquentes</p>
          <h2>Vos questions sur <em>l'atelier</em></h2>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <p className="ident">Niv Création · entreprise française · SIRET 105 914 774 00010 · {BRAND.contact} · <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/cgv">Conditions de vente</Link></p>
          <div style={{ marginTop: 26 }}><Link href="/contact" className="btn2">Une question ? Contactez-nous</Link></div>
        </div>
      </section>
    </div>
  );
}
