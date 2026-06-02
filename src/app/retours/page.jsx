import Link from "next/link";

export const metadata = {
  title: "Retours & Remboursements",
  description:
    "Politique de retour et de remboursement de Niv Création : droit de rétractation, articles personnalisés, produits défectueux, délais et procédure.",
};

export default function RetoursPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Informations</span>
          <h2>Retours & Remboursements</h2>
          <p>Dernière mise à jour : juin 2026</p>
        </div>

        <div className="product-desc" style={{ borderTop: "none", paddingTop: 0 }}>
          <p>
            Chez <strong>Niv Création</strong>, chaque pièce est réalisée à la
            main, souvent personnalisée pour vous. Voici nos conditions de retour
            et de remboursement, dans le respect du Code de la consommation
            français.
          </p>

          <h3>1. Articles personnalisés (gravure, prénoms, dates…)</h3>
          <p>
            Conformément à l'<strong>article L221-28 du Code de la consommation</strong>,
            les articles confectionnés sur mesure ou personnalisés à votre
            demande <strong>ne bénéficient pas du droit de rétractation</strong>
            et ne peuvent être ni repris ni échangés, sauf en cas de défaut de
            fabrication ou d'erreur de notre part (voir §3).
          </p>
          <p>
            Avant la mise en fabrication, nous vous invitons à bien vérifier les
            informations de personnalisation (orthographe, dates, choix de
            couleur). En cas de doute, contactez-nous : nous validons ensemble
            avant de graver.
          </p>

          <h3>2. Articles non personnalisés — droit de rétractation (14 jours)</h3>
          <p>
            Pour un article standard, non personnalisé, vous disposez d'un délai
            de <strong>14 jours</strong> à compter de la réception pour exercer
            votre droit de rétractation, sans avoir à vous justifier.
          </p>
          <ul>
            <li>L'article doit être <strong>neuf, non utilisé</strong> et dans son emballage d'origine.</li>
            <li>Les <strong>frais de retour</strong> sont à votre charge.</li>
            <li>Le remboursement intervient sous 14 jours après réception du retour.</li>
          </ul>

          <h3>3. Article défectueux, abîmé ou erreur de notre part</h3>
          <p>
            Si votre commande arrive <strong>endommagée</strong>, présente un
            <strong> défaut</strong> ou ne correspond pas à votre demande (erreur
            de gravure de notre part), nous nous engageons à la
            <strong> refaire gratuitement</strong> ou à vous
            <strong> rembourser intégralement</strong> (produit + frais de port),
            au choix.
          </p>
          <ul>
            <li>Signalez-le sous <strong>14 jours</strong> après réception.</li>
            <li>Joignez <strong>une ou plusieurs photos</strong> du problème.</li>
            <li>Les frais de retour éventuels sont alors <strong>à notre charge</strong>.</li>
          </ul>

          <h3>4. Comment faire une demande</h3>
          <p>Écrivez-nous à l'adresse suivante en précisant :</p>
          <ul>
            <li>Votre <strong>numéro de commande</strong> et votre nom</li>
            <li>Le <strong>motif</strong> du retour ou de la demande</li>
            <li>Des <strong>photos</strong> si l'article est défectueux</li>
          </ul>
          <p>
            📧{" "}
            <a href="mailto:contact.nivcreation@gmail.com" style={{ color: "var(--gold-dark)" }}>
              contact.nivcreation@gmail.com
            </a>
          </p>
          <p>
            Nous vous répondons sous 48 h ouvrées avec la marche à suivre et,
            le cas échéant, l'adresse de retour.
          </p>

          <h3>5. Remboursements</h3>
          <ul>
            <li>
              Les remboursements sont effectués sur le <strong>moyen de paiement
              d'origine</strong> (carte bancaire via Stripe).
            </li>
            <li>
              Délai : <strong>sous 14 jours</strong> après acceptation du retour
              ou réception de l'article retourné.
            </li>
            <li>
              Selon votre banque, l'apparition sur votre compte peut prendre
              quelques jours supplémentaires.
            </li>
          </ul>

          <h3>6. Annulation de commande</h3>
          <p>
            Pour un article personnalisé, l'annulation n'est possible que
            <strong> avant le lancement de la fabrication</strong>. Contactez-nous
            au plus vite après votre commande si vous souhaitez l'annuler ou la
            modifier.
          </p>

          <div className="notice" style={{ marginTop: 28 }}>
            Une question sur une commande ?{" "}
            <Link href="/contact" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
              Contactez-nous
            </Link>
, nous sommes là pour vous aider.
          </div>
        </div>
      </div>
    </section>
  );
}
