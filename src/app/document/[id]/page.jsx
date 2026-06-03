import { notFound } from "next/navigation";
import { getQuote } from "@/lib/firebase";
import DocumentActions from "@/components/DocumentActions";

export const dynamic = "force-dynamic";

function euro(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return ""; }
}

export const metadata = { robots: { index: false } };

export default async function DocumentPage({ params }) {
  const q = await getQuote(params.id);
  if (!q) notFound();
  const isFacture = q.type === "facture";
  const titre = isFacture ? "Facture" : "Devis";

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="doc-sheet" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "32px 28px", boxShadow: "var(--shadow)" }}>
          {/* En-tête */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.png?v=1780503911" alt="Niv Création" style={{ height: 64, borderRadius: 8 }} />
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.5 }}>
                Niv Création — Atelier de personnalisation<br />
                contact.nivcreation@gmail.com · 07 66 15 31 02
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h1 style={{ margin: 0, color: "var(--gold-dark)", fontSize: "1.6rem" }}>{titre}</h1>
              <div style={{ fontWeight: 700 }}>{q.number}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{fmtDate(q.createdAt)}</div>
            </div>
          </div>

          {/* Client */}
          <div style={{ marginTop: 24, fontSize: "0.92rem" }}>
            <strong>Adressé à :</strong><br />
            {q.client?.name || "—"}<br />
            {q.client?.email ? <>{q.client.email}<br /></> : null}
            {q.client?.address ? <span style={{ whiteSpace: "pre-line" }}>{q.client.address}</span> : null}
          </div>

          {/* Lignes */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: "0.92rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ink-soft)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px 6px" }}>Désignation</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Qté</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>P.U.</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(q.items || []).map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 6px" }}>{it.desc}</td>
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>{it.qty}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{euro(it.price)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{euro(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "right", marginTop: 16, fontSize: "1.2rem" }}>
            <strong>Total : {euro(q.total)}</strong>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            TVA non applicable, art. 293 B du CGI
          </div>

          {q.note ? (
            <p style={{ marginTop: 20, fontSize: "0.88rem", color: "var(--ink-soft)", whiteSpace: "pre-line", background: "var(--cream)", padding: 12, borderRadius: 8 }}>{q.note}</p>
          ) : null}

          {!isFacture && (
            <p style={{ marginTop: 16, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Devis valable 30 jours. La fabrication démarre après acceptation et paiement.
            </p>
          )}
        </div>

        <DocumentActions id={q.id} type={q.type} status={q.status} />
      </div>
    </section>
  );
}
