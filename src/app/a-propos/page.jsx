import Link from "next/link";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "À propos — l'atelier Niv Création",
  description:
    "Niv Création, atelier artisanal français de gravure et découpe laser. Notre histoire, nos matériaux et notre engagement pour des créations personnalisées et durables.",
};

export default async function AProposPage() {
  let apropos = "";
  try { apropos = (await getSettings())?.apropos || ""; } catch { /* défaut */ }
  return (
    <>
      <section className="hero" style={{ padding: "64px 0" }}>
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Notre histoire</span>
            <h1>L'art de graver vos émotions</h1>
            <p>
              Niv Création est un atelier artisanal français spécialisé dans la
              gravure et la découpe laser. Nous personnalisons par gravure vos
              bijoux, cristaux et cadeaux, et nous dessinons, gravons et
              découpons nos créations en bois sur mesure — pour célébrer vos
              moments les plus précieux.
            </p>
            <Link href="/boutique" className="btn btn-gold">Découvrir nos créations</Link>
          </div>
          <div className="hero-visual">
            <Image
              src={getProductBySlug("menu-de-mariage-bois-grave").images[0]}
              alt="Atelier Niv Création"
              width={700}
              height={700}
              priority
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          {apropos ? (
            <div
              className="product-desc"
              style={{ borderTop: "none", paddingTop: 0 }}
              dangerouslySetInnerHTML={{ __html: apropos }}
            />
          ) : (
            <div className="product-desc" style={{ borderTop: "none", paddingTop: 0 }}>
              <h3>Un savoir-faire artisanal</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Notre métier, c'est la précision du laser : graver un prénom sur un
                bijou ou un cristal, et dessiner puis découper les arches délicates
                d'un numéro de table en bois. Une même exigence de finition sur
                chaque pièce que nous personnalisons.
              </p>

              <h3>Des matériaux choisis avec soin</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Nous sélectionnons des matériaux nobles et durables : bois clairs,
                acier inoxydable 316L hypoallergénique, acrylique premium. Des
                pièces conçues pour traverser le temps et rester aussi belles
                qu'au premier jour.
              </p>

              <h3>La personnalisation au cœur de notre métier</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Prénoms, dates, messages, photos gravées… Nous donnons vie à vos
                idées pour en faire des objets chargés de sens. Chaque commande est
                réalisée sur mesure, à la main, dans notre atelier.
              </p>
            </div>
          )}

          <div className="trust" style={{ borderRadius: "var(--radius)", marginTop: 28 }}>
            <div className="trust-grid">
              <div className="trust-item"><span>🪵</span><strong>Fait main</strong><small>en France</small></div>
              <div className="trust-item"><span>✦</span><strong>Sur mesure</strong><small>100% personnalisable</small></div>
              <div className="trust-item"><span>♻️</span><strong>Matériaux durables</strong><small>nobles & résistants</small></div>
              <div className="trust-item"><span>💌</span><strong>Cadeau parfait</strong><small>pour chaque occasion</small></div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link href="/contact" className="btn btn-outline">Une question ? Contactez-nous</Link>
          </div>
        </div>
      </section>
    </>
  );
}
