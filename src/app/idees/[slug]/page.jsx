// Page guide « Idées & conseils » — /idees/<slug>
// Le contenu reproduit fidèlement les maquettes validées (docs/maquettes/guide-*.html),
// habillé aux couleurs du site (classes .guide-* dans globals.css).
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, GUIDES, GUIDE_SLUGS } from "@/lib/guides";

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

export default function GuidePage({ params }) {
  const g = getGuide(params.slug);
  if (!g) notFound();

  const autres = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4);
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

      <article className="guide" dangerouslySetInnerHTML={{ __html: g.html }} />

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
