import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <NewsletterSignup />
        <div className="footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="footer-logo"
              src="https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.png?v=1780503911"
              alt="Niv Création — Atelier de personnalisation"
            />
            <p style={{ marginTop: 14, maxWidth: 320 }}>
              Atelier français de gravure et découpe laser. Bijoux, décorations
              de mariage et cadeaux personnalisés, gravés avec soin dans notre atelier.
            </p>
            <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>
            <a href="tel:+33766153102" style={{ display: "block", marginTop: 4 }}>07 66 15 31 02</a>
            <span style={{ display: "block", marginTop: 8 }}>6 rue d'Armaillé, 75017 Paris</span>
            <span style={{ display: "block", marginTop: 8 }}>Personnalisé en France</span>
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
            <Link href="/faq">Questions fréquentes (FAQ)</Link>
            <Link href="/a-propos">À propos</Link>
            <Link href="/contact">Nous contacter</Link>
            <Link href="/retours">Retours & Remboursements</Link>
            <Link href="/#personnalisation">La personnalisation</Link>
          </div>
          <div>
            <h4>Informations</h4>
            <Link href="/favoris">♥ Mes favoris</Link>
            <Link href="/retours">Politique de retour</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Niv Création — Tous droits réservés.</span>
          <span>
            Paiement sécurisé par Stripe ·{" "}
            <Link href="/gestion" style={{ color: "inherit", textDecoration: "underline" }}>
              Espace gestion
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
