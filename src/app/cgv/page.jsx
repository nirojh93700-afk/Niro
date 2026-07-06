export const metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions Générales de Vente de Niv Création : commande, prix, paiement, personnalisation, délais, droit de rétractation et garanties.",
};

const html = `
<p><em>Dernière mise à jour : juin 2026</em></p>

<h3>1. Identification du vendeur</h3>
<p>Niv Création — Atelier de personnalisation<br>Entreprise individuelle (micro-entrepreneur) — Niv Création<br>E-mail : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a><br>Téléphone : <a href="tel:+33766153102">07 66 15 31 02</a><br>SIRET : 105 914 774 00010<br>Siège social : 6 rue d'Armaillé, 75017 Paris</p>

<h3>2. Objet</h3>
<p>Les présentes CGV régissent les ventes de produits personnalisés réalisés par Niv Création auprès de consommateurs particuliers ou professionnels.</p>

<h3>3. Prix et paiement</h3>
<p>Les prix sont indiqués en euros. « TVA non applicable, art. 293 B du CGI » (Niv Création bénéficie de la franchise en base de TVA en tant que micro-entreprise). Le paiement s'effectue intégralement à la commande par carte bancaire via notre prestataire sécurisé Stripe. La commande n'est validée qu'après réception complète du paiement.</p>

<h3>4. Commande et personnalisation</h3>
<p>Pour une commande personnalisée, le client transmet par e-mail sa photo / son texte à graver. La fabrication démarre dès réception des éléments nécessaires à la personnalisation.</p>

<h3>5. Délais</h3>
<ul>
<li>Fabrication : 2 à 5 jours ouvrés selon le produit</li>
<li>Expédition : 2 à 4 jours ouvrés</li>
</ul>

<h3>6. Droit de rétractation</h3>
<p><strong>Articles personnalisés :</strong> conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux produits personnalisés ou confectionnés selon les spécifications du consommateur (articles gravés ou découpés sur mesure, photo ou texte fournis par le client).</p>
<p><strong>Articles non personnalisés :</strong> pour les articles vendus sans personnalisation (option « sans gravure » / « sans texte », modèle vierge), le client dispose d'un délai de rétractation de <strong>14 jours</strong> à compter de la réception pour retourner l'article, neuf, non utilisé et dans son état et emballage d'origine. Les frais de retour sont à la charge du client. Le remboursement intervient sous 14 jours après réception de l'article retourné.</p>
<p>Voir notre <a href="/retours">politique de retour</a> pour le détail des conditions d'annulation et de défaut.</p>

<h3>7. Garanties légales</h3>
<p>Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).</p>

<h3>8. Données personnelles</h3>
<p>Vos données sont traitées conformément à notre <a href="/confidentialite">politique de confidentialité</a>.</p>

<h3>9. Litiges et médiation</h3>
<p>En cas de litige, le client peut recourir gratuitement à un médiateur de la consommation en vue d'un règlement amiable, conformément aux articles L611-1 et suivants du Code de la consommation.</p>
<p>Médiateur de la consommation dont relève Niv Création : coordonnées communiquées prochainement (adhésion à un service de médiation en cours).</p>
<p>Le client peut également utiliser la plateforme européenne de Règlement en Ligne des Litiges (RLL) : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
<p>À défaut d'accord amiable, les tribunaux français sont seuls compétents.</p>

<h3>10. Acceptation</h3>
<p>Toute commande vaut acceptation pleine et entière des présentes CGV.</p>
`;

export default function CGVPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Informations</span>
          <h2>Conditions Générales de Vente</h2>
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
