export const metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions Générales de Vente de Niv Création : commande, prix, paiement, personnalisation, délais, droit de rétractation et garanties.",
};

const html = `
<p><em>Dernière mise à jour : juin 2026</em></p>

<h3>1. Identification du vendeur</h3>
<p>Niv Création — Atelier de personnalisation<br>E-mail : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a><br>SIRET : [À COMPLÉTER]<br>Siège social : [À COMPLÉTER]</p>

<h3>2. Objet</h3>
<p>Les présentes CGV régissent les ventes de produits personnalisés réalisés par Niv Création auprès de consommateurs particuliers ou professionnels.</p>

<h3>3. Prix et paiement</h3>
<p>Les prix sont indiqués en euros TTC. Le paiement s'effectue intégralement à la commande par carte bancaire via notre prestataire sécurisé Stripe. La commande n'est validée qu'après réception complète du paiement.</p>

<h3>4. Commande et personnalisation</h3>
<p>Chaque commande personnalisée donne lieu à un échange par e-mail pour la transmission de la photo / du texte à graver, puis à la validation d'un aperçu numérique. La fabrication ne démarre qu'après cette validation.</p>

<h3>5. Délais</h3>
<ul>
<li>Aperçu sous 24 à 48 h après réception de votre photo / texte</li>
<li>Fabrication : 2 à 5 jours ouvrés selon le produit</li>
<li>Expédition : 2 à 4 jours ouvrés</li>
</ul>

<h3>6. Droit de rétractation</h3>
<p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux produits personnalisés ou confectionnés selon les spécifications du consommateur. Voir notre <a href="/retours">politique de retour</a> pour les conditions d'annulation et de défaut.</p>

<h3>7. Garanties légales</h3>
<p>Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).</p>

<h3>8. Données personnelles</h3>
<p>Vos données sont traitées conformément à notre <a href="/confidentialite">politique de confidentialité</a>.</p>

<h3>9. Litiges et médiation</h3>
<p>En cas de litige, le client peut recourir gratuitement à un médiateur de la consommation en vue d'un règlement amiable, conformément aux articles L611-1 et suivants du Code de la consommation.</p>
<p>Médiateur de la consommation dont relève Niv Création : [À COMPLÉTER — nom et coordonnées du médiateur].</p>
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
