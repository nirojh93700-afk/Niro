import Link from "next/link";

export const metadata = {
  title: "Politique de retour",
  description:
    "Politique de retour et de remboursement de Niv Création : annulation, articles personnalisés, conditions par catégorie de produit, défauts et délais.",
};

const html = `
<h2>Politique de retour</h2>
<p>Nos créations étant fabriquées sur mesure d'après vos spécifications, elles entrent dans la catégorie des biens personnalisés. Voici nos conditions adaptées à chaque catégorie de produits.</p>

<h3>Principe général (article L221-28 du Code de la consommation)</h3>
<p>Les produits personnalisés ne sont pas remboursables une fois la fabrication lancée — exception au droit de rétractation pour biens confectionnés selon les spécifications du consommateur.</p>

<h3>Articles non personnalisés (sans gravure / modèle vierge)</h3>
<p>Pour un article commandé <strong>sans personnalisation</strong> (option « sans gravure » / « sans texte », pièce vierge), vous bénéficiez du <strong>droit de rétractation légal de 14 jours</strong> à compter de la réception. Renvoyez-le neuf, non utilisé et dans son emballage d'origine (frais de retour à votre charge) : nous vous remboursons sous 14 jours après réception.</p>

<h3>Annulation avant fabrication</h3>
<ul>
<li><strong>Dans les 24 heures après la commande :</strong> remboursement intégral à 100 %.</li>
<li><strong>Au-delà de 24 h, avant validation de l'aperçu :</strong> remboursement moins 10 € à 15 € de frais de préparation (un de nos designers a été affecté à votre projet).</li>
<li><strong>Après validation de l'aperçu :</strong> la fabrication a démarré, votre commande n'est plus remboursable.</li>
</ul>

<h3>Conditions spécifiques par catégorie</h3>

<h4>Décoration &amp; Cadeaux bois (mariage, chambre enfant)</h4>
<ul>
<li>Annulation 24 h : 100 % remboursé</li>
<li>Après 24 h, avant gravure : moins 10 € de frais</li>
<li>Après gravure : non remboursable</li>
<li>Défaut à l'arrivée : photo sous 24 h, refonte gratuite</li>
</ul>

<h4>Bijoux gravés</h4>
<ul>
<li>Annulation 24 h : 100 % remboursé</li>
<li>Après 24 h, avant gravure : moins 10 € de frais</li>
<li>Après gravure : non remboursable</li>
<li>Défaut à l'arrivée : photo sous 14 jours, refonte ou remboursement</li>
</ul>

<h3>Retrait en main propre (click &amp; collect)</h3>
<p>Le retrait en main propre est proposé uniquement pour la décoration et le mariage, dans le secteur de l'atelier (Val-d'Oise et alentours), gratuitement et <strong>sur rendez-vous</strong>. C'est la cliente qui vient récupérer sa commande à l'atelier. Dès que votre commande est prête, nous vous prévenons par e-mail ou téléphone pour convenir d'un créneau ; vous présentez votre <strong>numéro de commande</strong> au retrait.</p>
<p><strong>Délai de retrait : 14 jours</strong> à compter de notre message vous indiquant que la commande est prête. Au-delà de ce délai, sans retrait de votre part, la commande — étant personnalisée et fabriquée sur mesure — <strong>ne pourra plus être ni remboursée, ni expédiée</strong>. Si vous habitez en dehors du secteur, contactez-nous <strong>avant de commander</strong>.</p>

<h3>Commandes événementielles (mariages notamment)</h3>
<p>Pour les commandes destinées à un événement à date fixe, contactez-nous AVANT toute commande à moins de 21 jours de l'événement pour confirmer la faisabilité. En cas de défaut, refonte URGENTE et livraison express prioritaire.</p>

<h3>Remboursements</h3>
<p>Les remboursements acceptés sont effectués sur le moyen de paiement d'origine (carte bancaire via Stripe), sous 14 jours après acceptation. Selon votre banque, l'apparition sur votre compte peut prendre quelques jours supplémentaires.</p>

<h3>Pas satisfait ?</h3>
<p>Quelle qu'en soit la raison, faites-le nous savoir à <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>. Nous ferons le nécessaire pour trouver une solution.</p>
`;

export default function RetoursPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Informations</span>
          <h2>Politique de retour</h2>
          <p>Dernière mise à jour : juin 2026</p>
        </div>
        <div
          className="product-desc"
          style={{ borderTop: "none", paddingTop: 0 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="notice" style={{ marginTop: 28 }}>
          Une question sur une commande ?{" "}
          <Link href="/contact" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
            Contactez-nous
          </Link>
          , nous sommes là pour vous aider.
        </div>
      </div>
    </section>
  );
}
