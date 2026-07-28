import Link from "next/link";
import { getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";

export const metadata = {
  title: "Questions fréquentes (FAQ)",
  description:
    "Toutes les réponses sur la personnalisation, la gravure, les délais, la livraison et les retours chez Niv Création.",
};

const FAQ = [
  {
    q: "Quels sont les délais de fabrication et de livraison ?",
    a: "Chaque pièce est personnalisée à la commande : comptez 3 à 5 jours ouvrés de fabrication. Vous avez 24 h pour modifier votre commande avant le lancement (ou cochez « fabrication immédiate » au paiement pour un démarrage direct). Une fois prête, elle est expédiée en colis suivi et vous recevez le numéro de suivi par e-mail ; le délai de livraison dépend ensuite du transporteur.",
  },
  {
    q: "Comment se passe la personnalisation (gravure) ?",
    a: "Sur chaque fiche produit, vous saisissez votre texte (prénom, date, message…), choisissez la police de gravure et, selon le produit, un motif ou une photo. Un aperçu s'affiche en direct pour visualiser le rendu avant de commander.",
  },
  {
    q: "Puis-je voir un aperçu avant la gravure définitive ?",
    a: "Oui. Pour les commandes personnalisées, nous pouvons vous envoyer par e-mail un aperçu à valider avant de lancer la gravure : vous validez ou demandez une modification en un clic.",
  },
  // NB : la réponse « frais de livraison » est générée dans FaqPage (seuil de
  // livraison offerte lu dans les réglages admin — Gestion → 🚚 Livraison).
  {
    q: "Proposez-vous le retrait en main propre ?",
    a: "Oui, pour les décorations et créations de mariage uniquement (pas les bijoux), gratuitement et sur rendez-vous, dans le Val-d'Oise (95) et les départements voisins. L'option s'affiche au paiement si votre code postal est éligible.",
  },
  {
    q: "Puis-je retourner un article personnalisé ?",
    a: "Un article personnalisé à votre demande (gravé ou découpé sur mesure) est unique : il ne peut être ni repris ni remboursé (article L221-28 du Code de la consommation). Vous pouvez annuler dans les 24 h suivant la commande, avant le lancement de la fabrication. Les articles non personnalisés bénéficient du droit de rétractation de 14 jours.",
  },
  {
    q: "Que faire si mon article arrive abîmé ou avec un défaut ?",
    a: "Envoyez-nous une photo dans les 14 jours suivant la réception (24 h pour les commandes de mariage urgentes) : nous refaisons la pièce ou nous vous remboursons, sans frais.",
  },
  {
    q: "Les bijoux sont-ils hypoallergéniques ?",
    a: "Oui : nos bijoux sont en acier inoxydable 316L (qualité chirurgicale), sans nickel, adapté aux peaux sensibles. Ils ne noircissent pas et résistent à l'eau du quotidien.",
  },
  {
    q: "Comment entretenir ma gravure ?",
    a: "Essuyez votre bijou avec un chiffon doux après un port prolongé, et évitez le contact direct avec parfums et crèmes. La gravure laser est définitive : elle ne s'efface pas.",
  },
  {
    q: "Puis-je commander pour un mariage avec une date proche ?",
    a: "Oui, mais à moins de 15 jours de l'événement, contactez-nous avant de commander pour confirmer la faisabilité. Une livraison express est possible.",
  },
];

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  // Seuil « livraison offerte » : suit les tarifs réglés dans l'admin.
  const settings = await getSettings().catch(() => ({}));
  const cfg = resolveShippingConfig(settings?.shipping);
  const seuil = `${String(cfg.bijouxFreeThreshold).replace(".", ",")} €`;
  const faq = [
    ...FAQ.slice(0, 3),
    {
      q: "Quels sont les frais de livraison ?",
      a: `Les bijoux voyagent en Lettre Suivie, avec livraison offerte dès ${seuil} d'achat. Les décorations (bois, mariage) sont expédiées en colis suivi, avec un tarif selon la quantité. Le montant exact s'affiche automatiquement au moment du paiement.`,
    },
    ...FAQ.slice(3),
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
