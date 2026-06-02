import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand-name">Niv Création</div>
            <p style={{ marginTop: 0, maxWidth: 320 }}>
              Atelier français de gravure et découpe laser. Bijoux, décorations
              de mariage et cadeaux personnalisés, fabriqués à la main avec soin.
            </p>
          </div>
          <div>
            <h4>Boutique</h4>
            <Link href="/boutique?cat=bijoux">Bijoux personnalisés</Link>
            <Link href="/boutique?cat=mariage">Mariage & Réception</Link>
            <Link href="/boutique?cat=cadeaux">Cadeaux & Déco</Link>
            <Link href="/boutique">Tout voir</Link>
          </div>
          <div>
            <h4>Aide</h4>
            <Link href="/#atelier">Notre atelier</Link>
            <Link href="/#personnalisation">La personnalisation</Link>
            <a href="mailto:contact.nivcreation@gmail.com">Nous contacter</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>
            <span style={{ display: "block", marginTop: 8 }}>Fabriqué en France 🇫🇷</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Niv Création — Tous droits réservés.</span>
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </div>
    </footer>
  );
}
