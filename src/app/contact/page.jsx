import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact — Niv Création",
  description:
    "Une question, un projet sur mesure, une demande de devis pour un mariage ? Contactez l'atelier Niv Création.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 620 }}>
        <div className="section-head">
          <span className="eyebrow">Contact</span>
          <h2>Parlons de votre projet</h2>
          <p>
            Une idée de cadeau, une demande sur mesure ou un devis pour votre
            mariage ? Écrivez-nous, nous répondons avec plaisir.
          </p>
        </div>

        <ContactForm />

        <p style={{ textAlign: "center", marginTop: 28, color: "var(--ink-soft)" }}>
          Ou directement par e-mail :{" "}
          <a href="mailto:contact.nivcreation@gmail.com" style={{ color: "var(--gold-dark)" }}>
            contact.nivcreation@gmail.com
          </a>
          <br />
          Par téléphone :{" "}
          <a href="tel:+33766153102" style={{ color: "var(--gold-dark)" }}>
            07 66 15 31 02
          </a>
        </p>
      </div>
    </section>
  );
}
