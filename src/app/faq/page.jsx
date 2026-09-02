import Link from "next/link";
import { getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";
import { vacationActive } from "@/lib/vacation";
import { FAQ } from "@/lib/faq";

export const metadata = {
  title: "Questions fréquentes (FAQ)",
  description:
    "Toutes les réponses sur la personnalisation, la gravure, les délais, la livraison et les retours chez Niv Création.",
};


export const dynamic = "force-dynamic";

export default async function FaqPage() {
  // Seuil « livraison offerte » : suit les tarifs réglés dans l'admin.
  const settings = await getSettings().catch(() => ({}));
  const cfg = resolveShippingConfig(settings?.shipping);
  const seuil = `${String(cfg.bijouxFreeThreshold).replace(".", ",")} €`;
  // Mode « délai allongé » actif → la réponse sur les délais suit le bandeau
  // (3 à 4 semaines) au lieu du 3-5 jours habituel (cohérence, 01/09/2026).
  const enDelaiAllonge = Boolean(vacationActive(settings?.vacation));
  const faqBase = enDelaiAllonge
    ? FAQ.map((f, i) => (i === 0 ? {
        q: f.q,
        a: "Chaque pièce est personnalisée à la commande. En raison d'une forte demande, notre délai de confection est actuellement de 3 à 4 semaines minimum — les commandes sont traitées dans leur ordre d'arrivée. Vous avez 24 h pour modifier votre commande avant le lancement. Une fois prête, elle est expédiée en colis suivi et vous recevez le numéro de suivi par e-mail ; le délai de livraison dépend ensuite du transporteur.",
      } : f))
    : FAQ;
  const faq = [
    ...faqBase.slice(0, 3),
    {
      q: "Quels sont les frais de livraison ?",
      a: `Les bijoux voyagent en Lettre Suivie, avec livraison offerte dès ${seuil} d'achat. Les décorations (bois, mariage) sont expédiées en colis suivi, avec un tarif selon la quantité. Le montant exact s'affiche automatiquement au moment du paiement.`,
    },
    ...faqBase.slice(3),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="container" style={{ maxWidth: 760, padding: "40px 16px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <span className="eyebrow">Besoin d'aide ?</span>
      <h1>Questions fréquentes</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Les réponses aux questions qu'on nous pose le plus souvent. Vous ne trouvez pas la vôtre ?{" "}
        <Link href="/contact" className="link-underline">Écrivez-nous</Link>, nous répondons rapidement.
      </p>
      <div style={{ marginTop: 26, display: "grid", gap: 10 }}>
        {faq.map((f, i) => (
          <details key={i} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
            <p style={{ margin: "10px 0 2px", color: "var(--ink-soft)", lineHeight: 1.6 }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
