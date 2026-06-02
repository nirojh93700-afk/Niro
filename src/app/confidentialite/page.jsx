export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Niv Création : données collectées, finalités, conservation, vos droits RGPD, cookies et sécurité des paiements.",
};

const html = `
<h3>1. Données collectées</h3>
<p>Lors d'une commande sur notre site, nous collectons : nom, prénom, adresse postale, adresse e-mail, numéro de téléphone, données de paiement (traitées directement par notre prestataire de paiement <strong>Stripe</strong>, jamais stockées par nos soins), ainsi que la photo ou le texte fourni pour la personnalisation.</p>

<h3>2. Finalités</h3>
<ul>
<li>Traitement et expédition de votre commande</li>
<li>Communication par e-mail liée à votre commande (validation d'aperçu, suivi)</li>
<li>Réponse à vos demandes via le formulaire de contact</li>
<li>Respect de nos obligations légales et comptables</li>
</ul>

<h3>3. Conservation</h3>
<p>Vos données sont conservées le temps nécessaire à l'exécution de votre commande et selon les obligations légales (10 ans pour les factures).</p>

<h3>4. Vos droits (RGPD)</h3>
<p>Conformément au Règlement Général sur la Protection des Données, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Pour exercer ces droits, contactez : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a></p>

<h3>5. Cookies</h3>
<p>Notre site utilise uniquement un stockage local essentiel au fonctionnement de la boutique (mémorisation de votre panier). La page de paiement, gérée par Stripe, peut déposer des cookies nécessaires à la sécurité de la transaction. Nous n'utilisons pas de cookies publicitaires.</p>

<h3>6. Partage des données</h3>
<p>Vos données ne sont jamais vendues. Elles sont partagées uniquement avec nos prestataires techniques (Vercel pour l'hébergement, Stripe pour le paiement, La Poste / Mondial Relay pour la livraison, Resend pour l'envoi de nos e-mails) dans le strict cadre du traitement de votre commande.</p>

<h3>7. Sécurité</h3>
<p>Notre site est sécurisé en HTTPS. Les paiements sont traités par Stripe, certifié PCI DSS niveau 1 : vos numéros de carte ne transitent jamais par nos serveurs.</p>

<h3>8. Réclamation</h3>
<p>Vous pouvez déposer une réclamation auprès de la CNIL si vous estimez que vos droits ne sont pas respectés : <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>.</p>
`;

export default function ConfidentialitePage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Informations</span>
          <h2>Politique de confidentialité</h2>
          <p>Dernière mise à jour : juin 2026</p>
        </div>
        <div
          className="product-desc"
          style={{ borderTop: "none", paddingTop: 0 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
