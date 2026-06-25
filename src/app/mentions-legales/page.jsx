export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Niv Création : éditeur, hébergement, propriété intellectuelle.",
};

const html = `
<h3>Éditeur du site</h3>
<p>Niv Création — Atelier de personnalisation<br>Entreprise individuelle (micro-entrepreneur) — Nirojh Kamalanathan<br>SIREN : 105 914 774<br>Siège social : 6 rue d'Armaillé, 75017 Paris<br>E-mail : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a><br>Téléphone : <a href="tel:+33766153102">07 66 15 31 02</a></p>

<h3>Directeur de la publication</h3>
<p>Nirojh Kamalanathan</p>

<h3>Hébergement</h3>
<p>Le site est hébergé par Netlify, Inc.<br>512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis<br>Site : <a href="https://www.netlify.com" target="_blank" rel="noopener">netlify.com</a></p>

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
