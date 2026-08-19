// Page guide « Idées & conseils » — /idees/<slug>
//
// Le texte reproduit fidèlement les maquettes validées (docs/maquettes/guide-*.html),
// habillé aux couleurs du site (classes .guide-* dans globals.css).
//
// Les PRODUITS, eux, sont lus dans le catalogue en direct : prix, photo et nom
// suivent Gestion automatiquement, un produit masqué disparaît de la page, et un
// nouveau produit de la catégorie s'ajoute tout seul en bas (règles `auto`).
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, GUIDES, GUIDE_SLUGS, produitsEnPlus } from "@/lib/guides";
import { getCatalog } from "@/lib/catalog";
import { guideHtmlComplet, grilleHtml, repartirNouveaux } from "@/lib/guideHtml";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const g = getGuide(params.slug);
  if (!g) return { title: "Guide introuvable" };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/idees/${g.slug}` },
    openGraph: {
      title: g.title,
      description: g.description,
      url: `/idees/${g.slug}`,
      type: "article",
      images: g.image ? [g.image] : undefined,
    },
  };
}

export default async function GuidePage({ params }) {
  const g = getGuide(params.slug);
  if (!g) notFound();

  // Catalogue réel (produits visibles uniquement). En cas de souci de base de
  // données, la page reste lisible : seul le texte s'affiche.
  const catalogue = await getCatalog().catch(() => []);
  const parSlug = new Map(catalogue.map((p) => [p.slug, p]));

  const autres = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4);

  // AUTOMATIQUE — un produit ajouté dans Gestion se place TOUT SEUL dans la page :
  // on cherche d'abord la section qui lui ressemble (un nouveau collier femme va
  // avec les colliers femme) ; ce qui ne trouve pas sa place est regroupé en bas.
  const nouveaux = produitsEnPlus(g, catalogue, 8);
  const { parBloc, restants } = repartirNouveaux(g.blocs, parSlug, nouveaux);

  // Texte du guide + grilles à jour (nouveautés incluses dans les bonnes sections).
  let contenu = guideHtmlComplet(g.blocs, parSlug, parBloc);

  if (restants.length) {
    contenu +=
      '<div class="band"><section class="wrap">' +
      '<h2 class="serif">Nos autres modèles à découvrir</h2>' +
      "<p>D'autres créations de notre atelier qui correspondent à cette page — " +
      "cette sélection s'actualise à mesure que de nouvelles pièces arrivent.</p>" +
      grilleHtml(restants.map((p) => ({ produit: p, cta: "" }))) +
      "</section></div>";
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");

  // Données structurées : fil d'Ariane + questions fréquentes (rich results Google).
  const donnees = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: base },
        { "@type": "ListItem", position: 2, name: "Idées & conseils", item: `${base}/idees` },
        { "@type": "ListItem", position: 3, name: g.nav, item: `${base}/idees/${g.slug}` },
      ],
    },
  ];
  if (g.faq.length) {
    donnees.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.r },
      })),
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
      />

      <nav className="guide-fil" aria-label="Fil d'Ariane">
        <div className="container">
          <Link href="/">Accueil</Link>
          <span aria-hidden="true">›</span>
          <Link href="/idees">Idées &amp; conseils</Link>
          <span aria-hidden="true">›</span>
          <span>{g.nav}</span>
        </div>
      </nav>

      <header className="guide-hero">
        <div className="container">
          <div className="guide-eyebrow">{g.eyebrow}</div>
          <h1 className="serif">{g.h1}</h1>
          <p>{g.chapo}</p>
          <span className="guide-rule" />
        </div>
      </header>

      {/* Le guide est rendu en UN SEUL bloc : le texte des maquettes et les grilles
          de produits (construites à partir du catalogue en direct) sont assemblés
          côté serveur. C'est ce qui garantit un HTML cohérent, sans coupure au
          milieu d'une section. */}
      <article className="guide" dangerouslySetInnerHTML={{ __html: contenu }} />

      <section className="guide-autres">
        <div className="container">
          <h2 className="serif">À lire aussi</h2>
          <div className="guide-autres-liste">
            {autres.map((a) => (
              <Link key={a.slug} href={`/idees/${a.slug}`} className="guide-autre">
                <span className="guide-autre-nav">{a.nav}</span>
                <span className="guide-autre-titre">{a.title}</span>
              </Link>
            ))}
          </div>
          <p className="guide-retour">
            <Link href="/idees" className="link-underline">← Tous nos guides</Link>
          </p>
        </div>
      </section>
    </>
  );
}
