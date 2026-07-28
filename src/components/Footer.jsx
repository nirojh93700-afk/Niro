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
              src="https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111"
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

            {/* Suivez-nous sur Instagram (QR à scanner + lien cliquable mobile) */}
            <div className="footer-insta">
              <a
                href="https://www.instagram.com/nivcreation.fr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Suivez Niv Création sur Instagram"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="footer-insta-qr" src="/instagram-qr.png" alt="QR code Instagram Niv Création" />
              </a>
              <div className="footer-insta-txt">
                <span className="fi-title">Suivez-nous sur Instagram</span>
                <a href="https://www.instagram.com/nivcreation.fr" target="_blank" rel="noopener noreferrer" className="fi-handle">
                  @nivcreation.fr
                </a>
                <span className="fi-sub">Scannez le code ou touchez le lien</span>
              </div>
            </div>
          </div>
          <div>
            <h4>Boutique</h4>
            <Link href="/boutique/bijoux?sub=femme">Bijoux femme</Link>
            <Link href="/boutique/bijoux?sub=homme">Bijoux homme</Link>
            <Link href="/boutique/mariage">Mariage & Réception</Link>
            <Link href="/boutique/cadeaux">Cadeaux & Déco</Link>
            <Link href="/boutique">Tout voir</Link>
          </div>
          <div>
            <h4>Aide</h4>
            <Link href="/faq">Questions fréquentes (FAQ)</Link>
            <Link href="/avis">Avis clients</Link>
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
