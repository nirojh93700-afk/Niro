"use client";

// Devis dont la cliente choisit le nombre de pièces (maquette validée le 01/11/2026 :
// https://claude.ai/artifact/UajL1z3fV5Fu5GF36voVcf). − 1 + ; remises des lots de la fiche
// montrées (cases « Lot de 2 / Lot de 4 », ligne verte « Remise … », ancien prix barré,
// « Vous économisez … ») ; le total, la livraison, le code promo et le paiement suivent.
// Le calcul est celui de `devisQuantite.js`, refait côté serveur au paiement.

import { useState } from "react";
import DocumentActions from "@/components/DocumentActions";
import { appliquerQuantite, paliersRemise } from "@/lib/devisQuantite";

const euro = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const VERT = "#2f7a4f";

export default function DevisInteractif({ q, cfg, livraison, avant, apres }) {
  const [n, setN] = useState(cfg.depart);
  const app = appliquerQuantite(q, cfg, n);
  const paliers = paliersRemise(cfg);
  const mot = cfg.mot || "pièce";
  const pl = (k) => `${k} ${mot}${k > 1 ? "s" : ""}`;
  const actif = (k) => {
    if (!paliers.length) return false;
    const tailles = paliers.map((p) => p.k).filter((x) => x > 1);
    const grand = Math.max(...tailles);
    if (k === grand) return n >= grand;
    if (k === 1) return n < grand && !tailles.includes(n);
    return n === k || (n > grand && n % grand === k);
  };
  let conseil = "";
  const prochain = paliers.find((p) => p.k > n && p.remise > 0);
  if (prochain && prochain.k - n === 1) {
    conseil = `Avec ${n === 1 ? `un 2ᵉ ${mot}` : `1 ${mot} de plus`}, vous profitez du lot de ${prochain.k} : remise de ${euro(prochain.remise)}.`;
  }
  const btn = { width: 44, height: 44, border: 0, background: "var(--cream)", fontSize: "1.2rem", cursor: "pointer", color: "var(--ink)" };
  const ligne = { padding: "8px 6px", borderBottom: "1px solid var(--line)", verticalAlign: "top" };

  return (
    <>
      <div className="doc-sheet" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "32px 28px", boxShadow: "var(--shadow)" }}>
        {avant}

        <div className="no-print" style={{ marginTop: 22 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Nombre de {mot}s</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden" }}>
              <button type="button" style={{ ...btn, opacity: n <= cfg.min ? 0.35 : 1 }} disabled={n <= cfg.min} onClick={() => setN(n - 1)} aria-label={`Un ${mot} de moins`}>−</button>
              <output style={{ minWidth: 46, textAlign: "center", fontWeight: 700, fontVariantNumeric: "tabular-nums" }} aria-live="polite">{n}</output>
              <button type="button" style={{ ...btn, opacity: n >= cfg.max ? 0.35 : 1 }} disabled={n >= cfg.max} onClick={() => setN(n + 1)} aria-label={`Un ${mot} de plus`}>+</button>
            </div>
            <small style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Même gravure sur chaque {mot}. Le total se met à jour tout seul.</small>
          </div>
          {paliers.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${paliers.length}, minmax(0,1fr))`, gap: 8, marginTop: 12 }}>
              {paliers.map((p) => {
                const on = actif(p.k);
                return (
                  <div key={p.k} style={{ border: `1.5px solid ${on ? "var(--gold-dark)" : "var(--line)"}`, borderRadius: 12, padding: "10px 6px", textAlign: "center", fontSize: "0.8rem", lineHeight: 1.35, background: on ? "#fffaf0" : "#fff", boxShadow: on ? "0 0 0 3px rgba(194,161,78,.18)" : "none" }}>
                    {p.k === 1 ? `1 ${mot}` : `Lot de ${p.k}`}
                    <b style={{ display: "block", fontSize: "0.95rem", fontVariantNumeric: "tabular-nums" }}>{euro(p.prix)}</b>
                    {p.remise > 0 ? (
                      <>
                        <s style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>{euro(p.base)}</s><br />
                        <span style={{ display: "inline-block", marginTop: 4, background: "#e8f3ec", color: VERT, borderRadius: 999, padding: "2px 8px", fontWeight: 700, fontSize: "0.74rem" }}>−{euro(p.remise)}</span>
                      </>
                    ) : (
                      <span style={{ display: "block", fontSize: "0.74rem", color: "var(--ink-soft)", marginTop: 6 }}>prix de base</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {conseil ? <div style={{ marginTop: 10, background: "#e8f3ec", color: "#225c3b", borderRadius: 10, padding: "10px 12px", fontSize: "0.86rem" }}>{conseil}</div> : null}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: "0.92rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-soft)", borderBottom: "2px solid var(--line)" }}>
              <th style={{ padding: "8px 6px" }}>Désignation</th>
              <th style={{ padding: "8px 6px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {app.affichage.map((l, i) => (
              <tr key={i}>
                <td style={{ ...ligne, color: l.remise ? VERT : undefined, fontWeight: l.remise ? 600 : undefined }}>
                  {l.desc}
                  {!l.remise && l.qty > 1 ? <small style={{ color: "var(--ink-soft)" }}> ({euro(l.price)} × {l.qty})</small> : null}
                </td>
                <td style={{ ...ligne, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: l.remise ? VERT : undefined, fontWeight: l.remise ? 600 : undefined }}>
                  {l.remise ? `−${euro(-l.montant)}` : euro(l.montant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: "right", marginTop: 16, fontSize: "1.2rem" }}>
          <strong>{livraison ? "Total des articles" : "Total"} : {euro(app.total)}</strong>
        </div>
        {app.remise > 0 ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center", marginTop: 4, fontSize: "0.9rem" }}>
            <s style={{ color: "var(--ink-soft)" }}>{euro(app.total + app.remise)}</s>
            <span style={{ background: "#e8f3ec", color: VERT, borderRadius: 999, padding: "3px 10px", fontWeight: 700, fontSize: "0.82rem" }}>Vous économisez {euro(app.remise)}</span>
          </div>
        ) : null}
        <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--ink-soft)" }}>TVA non applicable, art. 293 B du CGI</div>

        {apres}
      </div>

      <DocumentActions id={q.id} type={q.type} status={q.status} clientEmail={q.client?.email || ""} totalArticles={app.total} livraison={livraison} n={n} />
    </>
  );
}
