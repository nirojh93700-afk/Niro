// Sommaire des guides « Idées & conseils » — /idees
import Link from "next/link";
import { getGuides } from "@/lib/guides";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Idées & conseils — cadeaux personnalisés et gravure",
  description:
    "Nos guides pour bien choisir un cadeau personnalisé : quoi faire graver, quel bijou offrir, comment préparer une déco de mariage, comprendre le cristal photo 3D.",
  alternates: { canonical: "/idees" },
};

export default function IdeesPage() {
  const guides = getGuides();
  return (
    <>
      <header className="guide-hero">
        <div className="container">
          <div className="guide-eyebrow">Niv Création · Idées &amp; conseils</div>
          <h1 className="serif">Nos guides pour bien choisir</h1>
          <p>
            Choisir un cadeau personnalisé demande souvent deux ou trois décisions :
            le modèle, le texte à graver, le bon moment pour commander. Voici nos
            conseils, rassemblés par occasion.
          </p>
          <span className="guide-rule" />
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="guide-index">
            {guides.map((g) => (
              <Link key={g.slug} href={`/idees/${g.slug}`} className="guide-tuile">
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image} alt="" loading="lazy" />
                ) : (
                  <span className="guide-tuile-vide" />
                )}
                <span className="guide-tuile-corps">
                  <span className="guide-tuile-nav">{g.nav}</span>
                  <strong className="serif">{g.h1}</strong>
                  <span className="guide-tuile-desc">{g.description}</span>
                  <span className="guide-tuile-cta">Lire le guide →</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="guide-retour">
            <Link href="/boutique" className="link-underline">← Voir toute la boutique</Link>
          </p>
        </div>
      </section>
    </>
  );
}
