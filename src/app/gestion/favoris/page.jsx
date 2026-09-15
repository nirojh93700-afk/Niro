"use client";

import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { exportRows } from "@/lib/exportClients";

// =============================================================================
// GESTION → FAVORIS DES CLIENTES
// Ce que les clientes mettent de côté, par création et par cliente.
// LECTURE SEULE : aucun e-mail ne part d'ici (même règle que les alertes
// « retour en stock » — les envois restent à la main du gérant).
// =============================================================================

const euro = (n) => (typeof n === "number" ? n.toFixed(2).replace(".", ",") + " €" : "—");

const COLONNES = [
  { key: "name", label: "Création" },
  { key: "type", label: "Type" },
  { key: "n", label: "Favoris" },
  { key: "price", label: "Prix" },
  { key: "emails", label: "Clientes" },
];

export default function FavorisAdminPage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [ouvert, setOuvert] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/favoris", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setD(j);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  function exporter(format) {
    const rows = (d?.rows || []).map((r) => ({
      name: r.name, type: r.type, n: r.n, price: euro(r.price), emails: (r.emails || []).join(" · "),
    }));
    exportRows(format, rows, COLONNES, {
      basename: "favoris-clientes",
      title: "Favoris des clientes",
      subtitle: `${d?.total || 0} favoris · ${d?.clientes || 0} clientes · ${d?.produits || 0} créations`,
    });
  }

  if (!key) {
    return <PageHead eyebrow="Clients" title="Favoris des clientes" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;
  }

  return (
    <>
      <PageHead
        eyebrow="Clients"
        title="Favoris des clientes"
        subtitle="Ce que les clientes mettent de côté, avant d'acheter. Aucun e-mail ne part d'ici."
        actions={
          <div className="fv-exp">
            <button className="btn btn-outline" onClick={() => exporter("xlsx")}>Excel</button>
            <button className="btn btn-outline" onClick={() => exporter("csv")}>CSV</button>
            <button className="btn btn-outline" onClick={() => exporter("pdf")}>PDF</button>
          </div>
        }
        kpis={[
          { label: "Favoris enregistrés", value: d?.total ?? "—" },
          { label: "Clientes concernées", value: d?.clientes ?? "—" },
          { label: "Créations mises de côté", value: d?.produits ?? "—" },
          { label: "Ajoutés cette semaine", value: d?.semaine ?? "—", tone: (d?.semaine || 0) > 0 ? "good" : undefined },
        ]}
      />

      {err ? <p className="fv-err">{err}</p> : null}
      {!d ? <p>Chargement…</p> : null}

      {d && d.rows.length === 0 ? (
        <p className="fv-vide">
          Aucun favori enregistré pour l'instant. Les favoris n'arrivent ici que lorsqu'une cliente
          est <strong>connectée à son espace</strong> : ceux gardés dans un navigateur, sans compte,
          restent invisibles (ils remontent le jour où elle se connecte).
        </p>
      ) : null}

      {d && d.rows.length > 0 ? (
        <div className="fv-box">
          <table className="fv-t">
            <thead>
              <tr><th>Création</th><th className="num">Favoris</th><th>Clientes</th><th className="num">Prix</th></tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.slug}>
                  <td>
                    <span className="fv-prod">
                      <span className="fv-vign">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.image ? <img src={r.image} alt="" /> : null}
                      </span>
                      <span>
                        <b>{r.name}</b>
                        <small>{r.type}{r.soldOut ? " · en rupture" : ""}</small>
                      </span>
                    </span>
                  </td>
                  <td className="num"><span className="fv-pill">{r.n}</span></td>
                  <td className="fv-cli">
                    {ouvert === r.slug || r.emails.length <= 3
                      ? r.emails.join(" · ")
                      : `${r.emails.slice(0, 3).join(" · ")} …`}
                    {r.emails.length > 3 ? (
                      <button className="fv-plus" onClick={() => setOuvert(ouvert === r.slug ? "" : r.slug)}>
                        {ouvert === r.slug ? "réduire" : `voir les ${r.emails.length}`}
                      </button>
                    ) : null}
                  </td>
                  <td className="num">{euro(r.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {d && d.rows.length > 0 ? (
        <p className="fv-note">
          <strong>À quoi ça sert.</strong> Une création très mise en favori mais peu vendue, c'est
          souvent un prix ou une photo à revoir. Et la liste des clientes par création est une liste
          de relance toute prête le jour où vous faites une promotion — les envois se font depuis
          <strong> Clients → Messages clients</strong>, jamais d'ici.
        </p>
      ) : null}
    </>
  );
}
