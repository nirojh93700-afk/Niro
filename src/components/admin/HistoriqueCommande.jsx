// Historique d'une commande (02/11/2026, gérant, commande 04AT1IG4 : « l'historique de devis… les images
// qu'on a envoyées, l'image qu'elle a sélectionnée, y a rien »). Devis / factures liés, images échangées
// dans le fil, et la note de l'atelier (le choix de la cliente). Données calculées par /api/admin/orders.
const STATUTS = { brouillon: "brouillon", envoye: "envoyé", vu: "vu", accepte: "accepté", paye: "payé", annule: "annulé" };
const euros = (n) => `${(Number(n) || 0).toFixed(2).replace(".", ",")} €`;
const date = (v) => { const d = new Date(typeof v === "number" ? v : Date.parse(v || "")); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }); };

export default function HistoriqueCommande({ order, papier = false, sansNote = false }) {
  const devis = order?.devisLies || [];
  const images = order?.imagesEchangees || [];
  const note = sansNote ? "" : String(order?.adminNote || "").trim();
  if (!devis.length && !images.length && !note) return null;
  const envoyees = images.filter((x) => x.de === "atelier");
  const recues = images.filter((x) => x.de === "cliente");
  const taille = papier ? 64 : 92;
  const vignettes = (liste) => (
    <div className="hc-vigs">
      {liste.map((x) => (
        <a key={x.src} href={x.src} target="_blank" rel="noreferrer" className="hc-vig" style={{ width: taille }} title={x.subject || ""}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={x.src} alt={x.subject || "Image"} loading="lazy" style={{ width: taille, height: taille }} />
          <span>{date(x.at)}</span>
        </a>
      ))}
    </div>
  );
  return (
    <div className={`hc${papier ? " hc-papier" : ""}`}>
      <div className="hc-titre">🗂️ Historique de la commande</div>
      {note ? (
        <div className="hc-note"><strong>📝 Choix de la cliente / note de l&apos;atelier :</strong> {note}</div>
      ) : null}
      {devis.length ? (
        <div className="hc-bloc">
          <div className="hc-sous">🧾 Devis et factures ({devis.length})</div>
          <ul className="hc-devis">
            {devis.map((q) => (
              <li key={q.id} className={q.principal ? "principal" : ""}>
                <div className="hc-ligne1">
                  <a href={q.lien} target="_blank" rel="noreferrer"><strong>{q.number || (q.type === "facture" ? "Facture" : "Devis")}</strong></a>
                  <span className={`hc-chip ${q.type}`}>{q.type === "facture" ? "Facture" : "Devis"}</span>
                  {q.status ? <span className={`hc-chip st-${q.status}`}>{STATUTS[q.status] || q.status}</span> : null}
                  {q.principal ? <span className="hc-chip lien">payé par cette commande</span> : !q.lie ? <span className="hc-chip autre">autre devis de la cliente</span> : null}
                  <span className="hc-tot">{euros(q.total)}</span>
                  <span className="hc-date">{date(q.createdAt)}</span>
                </div>
                {q.lignes?.length ? (
                  <div className="hc-lignes">{q.lignes.map((l, i) => <div key={i}>{l.qty > 1 ? `${l.qty} × ` : ""}{l.desc} — {euros(l.price)}</div>)}</div>
                ) : null}
                {q.note && !papier ? <div className="hc-dnote">{q.note}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {envoyees.length ? (
        <div className="hc-bloc">
          <div className="hc-sous">🖼️ Images envoyées à la cliente ({envoyees.length}) · toucher pour voir en grand</div>
          {vignettes(envoyees)}
        </div>
      ) : null}
      {recues.length ? (
        <div className="hc-bloc">
          <div className="hc-sous">📷 Images reçues de la cliente ({recues.length})</div>
          {vignettes(recues)}
        </div>
      ) : null}
      {!papier ? <div className="hc-pied">Tous les messages : bouton « 💬 Communications &amp; aperçu » ci-dessous.</div> : null}
    </div>
  );
}
