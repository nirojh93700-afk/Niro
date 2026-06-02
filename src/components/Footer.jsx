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
            <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>
            <span style={{ display: "block", marginTop: 8 }}>Fabriqué en France 🇫🇷</span>
          </div>
          <div>
            <h4>Boutique</h4>
            <Link href="/boutique?cat=bijoux&sub=femme">Bijoux femme</Link>
            <Link href="/boutique?cat=bijoux&sub=homme">Bijoux homme</Link>
            <Link href="/boutique?cat=mariage">Mariage & Réception</Link>
            <Link href="/boutique?cat=cadeaux">Cadeaux & Déco</Link>
            <Link href="/boutique">Tout voir</Link>
          </div>
          <div>
            <h4>Aide</h4>
            <Link href="/a-propos">À propos</Link>
            <Link href="/contact">Nous contacter</Link>
            <Link href="/retours">Retours & Remboursements</Link>
            <Link href="/#personnalisation">La personnalisation</Link>
          </div>
          <div>
            <h4>Informations</h4>
            <Link href="/retours">Politique de retour</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
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
