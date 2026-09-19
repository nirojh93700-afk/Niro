import Link from "next/link";

export const metadata = { title: "Merci — votre carte cadeau est en route", robots: { index: false } };

export default function CarteCadeauMerciPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 620, textAlign: "center" }}>
        <div className="section-head">
          <span className="eyebrow">Carte cadeau</span>
          <h2>Merci, c'est tout bon</h2>
          <p>
            Votre paiement est bien reçu. La carte cadeau part par e-mail au destinataire — tout de
            suite, ou à la date que vous avez choisie — avec votre petit mot et son code personnel.
            Vous recevez aussi une confirmation par e-mail.
          </p>
        </div>
        <Link href="/boutique" className="btn btn-gold">Retour à la boutique</Link>
      </div>
    </section>
  );
}
