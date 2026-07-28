import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/customerAuth";
import { getSiteOrders } from "@/lib/firebase";
import { getCagnotte, getSettings } from "@/lib/stock";
import EspaceLogin from "@/components/EspaceLogin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace", robots: { index: false, follow: false } };

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; } };

const STEPS = [
  { label: "Commande confirmée", desc: "Reçue et confirmée" },
  { label: "En préparation", desc: "Gravure en cours" },
  { label: "Expédiée", desc: "Colis en route" },
  { label: "Livrée", desc: "Colis remis" },
];
const REACHED = { a_preparer: 0, en_gravure: 1, expediee: 2, livree: 3 };
const statusChip = (s) => {
  if (s === "livree") return { t: "Livrée", bg: "#e3efe4", c: "#2f6b3d" };
  if (s === "expediee") return { t: "Expédiée", bg: "#f7ead0", c: "#8a6414" };
  if (s === "en_gravure") return { t: "En préparation", bg: "#efe4f2", c: "#6b4a7a" };
  if (s === "annulee") return { t: "Annulée", bg: "#f3e2df", c: "#a24336" };
  if (s === "remboursee") return { t: "Remboursée", bg: "#eee", c: "#666" };
  return { t: "Commande confirmée", bg: "#f7ead0", c: "#8a6414" };
};

function Timeline({ status }) {
  const reached = REACHED[status] ?? 0;
  return (
    <table width="100%" style={{ textAlign: "center", borderCollapse: "collapse" }}><tbody><tr>
      {STEPS.map((step, i) => {
        const done = i <= reached, current = i === reached + 1;
        const bg = done ? "#2e8b57" : current ? "#c9a24b" : "#e6ddc8";
        const color = done || current ? "#fff" : "#a99";
        return (
          <td key={i} width="25%" style={{ verticalAlign: "top", padding: "0 3px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, color, margin: "0 auto", lineHeight: "30px", fontWeight: 700 }}>{done ? "✓" : i + 1}</div>
            <div style={{ fontSize: 11.5, marginTop: 6, color: done || current ? "#2b2620" : "#b3a88f", fontWeight: current ? 700 : 500 }}>{step.label}</div>
            <div style={{ fontSize: 10, marginTop: 2, color: current ? "#8a6414" : "#b3a88f" }}>{step.desc}</div>
          </td>
        );
      })}
    </tr></tbody></table>
  );
}

export default async function EspacePage({ searchParams }) {
  const email = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!email) return <EspaceLogin error={searchParams?.erreur} />;

  const all = (await getSiteOrders(500)) || [];
  const orders = all
    .filter((o) => (o.customerEmail || "").toLowerCase() === email && !o.test)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const cag = await getCagnotte(email);
  let cashbackPct = 5;
  try { cashbackPct = Number((await getSettings()).cashbackPercent) || 0; } catch { /* défaut 5 */ }
  const firstName = (orders[0]?.customerName || "").split(" ")[0] || "";
  const active = orders.find((o) => !["livree", "annulee", "remboursee"].includes(o.status)) || orders[0];

  const card = { background: "#fff", border: "1px solid #e6d7b8", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(60,45,15,.05)" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a24b", fontWeight: 700 }}>Mon espace</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: "normal", color: "#241a0c", margin: 0 }}>Bonjour{firstName ? ` ${firstName}` : ""} 👋</h1>
        </div>
        <a href="/api/espace/logout" style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Se déconnecter</a>
      </div>

      {/* Cagnotte */}
      <div style={{ ...card, background: "linear-gradient(150deg,#241a0c,#3a2c12)", border: "none", color: "#f3e8d3", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#e2c67e" }}>Ma cagnotte fidélité</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 40, color: "#fff", fontWeight: "bold", margin: "4px 0 2px" }}>{euro(cag.balance)}</div>
          <div style={{ fontSize: 13, color: "#c9b78d" }}>Utilisable à votre prochaine commande (jusqu&apos;à 50 % du panier).</div>
          {cag.balance > 0 && cag.expiresAt ? (
            <div style={{ fontSize: 12, color: "#b8a67a", marginTop: 4 }}>Valable jusqu&apos;au {fmtDate(cag.expiresAt)}.</div>
          ) : null}
        </div>
        {cashbackPct > 0 && (
          <div style={{ background: "rgba(226,198,126,.15)", border: "1px solid rgba(226,198,126,.4)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e2c67e" }}>+{String(cashbackPct).replace(".", ",")} %</div>
            <div style={{ fontSize: 11, color: "#c9b78d" }}>de cagnotte<br />sur chaque achat</div>
          </div>
        )}
      </div>

      {/* Suivi de la commande en cours */}
      {active && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div><strong>Commande #{active.ref || active.id?.slice(-6)}</strong> <span style={{ color: "#8a7d63", fontSize: 13 }}>· {fmtDate(active.createdAt)} · {euro(active.total)}</span></div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: statusChip(active.status).bg, color: statusChip(active.status).c }}>{statusChip(active.status).t}</span>
          </div>
          <Timeline status={active.status} />
          <div style={{ marginTop: 16, textAlign: "center" }}>
            {active.tracking ? (
              <>
                <div style={{ fontSize: 13, color: "#7a7060", marginBottom: 8 }}>N° de suivi : <strong>{active.tracking}</strong></div>
                <a href={`https://parcelsapp.com/fr/tracking/${encodeURIComponent(active.tracking)}`} target="_blank" rel="noreferrer" className="btn btn-gold" style={{ padding: "9px 18px" }}>Suivre mon colis →</a>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#8a7d63" }}>Votre numéro de suivi apparaîtra ici dès l&apos;expédition.</div>
            )}
          </div>
        </div>
      )}

      {/* Historique */}
      <div style={card}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a24b", fontWeight: 700, marginBottom: 12 }}>Historique de mes achats</div>
        {orders.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>Aucune commande pour l&apos;instant. <a href="/boutique">Découvrir la boutique →</a></p>
        ) : (
          <table width="100%" style={{ borderCollapse: "collapse", fontSize: 13 }}><tbody>
            {orders.map((o) => {
              const ch = statusChip(o.status);
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid #efe6d0" }}>
                  <td style={{ padding: "10px 4px" }}>
                    <strong>{(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ") || "Commande"}</strong><br />
                    <span style={{ color: "#8a7d63" }}>{fmtDate(o.createdAt)} · #{o.ref || o.id?.slice(-6)}</span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 700 }}>{euro(o.total)}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: ch.bg, color: ch.c }}>{ch.t}</span>
                  </td>
                </tr>
              );
            })}
          </tbody></table>
        )}
      </div>
    </div>
  );
}
