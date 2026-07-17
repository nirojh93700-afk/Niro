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

        <div
          style={{
            background: "#fbf4e6",
            border: "1px solid #e7d3a1",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          <strong style={{ color: "var(--gold-dark)", fontSize: "1.05rem" }}>
            Une création personnalisée en bois ou une décoration sur mesure ?
          </strong>
          <p style={{ margin: "8px 0 14px", color: "var(--ink-soft)", fontSize: "0.95rem" }}>
            Prénoms, gravure, déco de mariage, objets uniques… Dites-nous votre
            idée et contactez-nous directement :
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn btn-gold" href="mailto:contact.nivcreation@gmail.com">
              ✉️ Par e-mail
            </a>
            <a className="btn btn-outline" href="tel:+33766153102">
              📞 07 66 15 31 02
            </a>
          </div>
        </div>

        <ContactForm />

        <div className="contact-cards">
          <a className="contact-card" href="mailto:contact.nivcreation@gmail.com">
            <span className="ci">✉️</span>
            <span><b>Par e-mail</b><small>contact.nivcreation@gmail.com</small></span>
          </a>
          <a className="contact-card" href="tel:+33766153102">
            <span className="ci">📞</span>
            <span><b>Par téléphone</b><small>07 66 15 31 02</small></span>
          </a>
        </div>
      </div>
    </section>
  );
}
