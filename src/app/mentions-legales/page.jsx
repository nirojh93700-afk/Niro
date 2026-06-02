export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Niv Création : éditeur, hébergement, propriété intellectuelle.",
};

const html = `
<h3>Éditeur du site</h3>
<p>Niv Création — Atelier de personnalisation<br>SIRET : [À COMPLÉTER]<br>Adresse : [À COMPLÉTER]<br>E-mail : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a></p>

<h3>Directeur de la publication</h3>
<p>[À COMPLÉTER — nom du responsable]</p>

<h3>Hébergement</h3>
<p>Le site est hébergé par Vercel Inc.<br>340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br>Site : <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></p>

<h3>Propriété intellectuelle</h3>
<p>L'ensemble du contenu du site (textes, images, logo, design) est la propriété exclusive de Niv Création, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</p>

<h3>Crédits photos</h3>
<p>Photos produits : Niv Création.</p>
`;

export default function MentionsLegalesPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="section-head" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Informations</span>
          <h2>Mentions légales</h2>
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
