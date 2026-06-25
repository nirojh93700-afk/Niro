"use client";

import { useState, useEffect } from "react";
import { formatEuro } from "@/lib/format";

const STATUS_LABEL = { envoye: "Envoyé", paye: "Payé ✓", facture: "Facture", annule: "Annulé" };

export default function QuotesAdmin({ adminKey }) {
  const [quotes, setQuotes] = useState([]);
  const [firebase, setFirebase] = useState(true);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState("devis");
  const [client, setClient] = useState({ name: "", email: "", address: "" });
  const [items, setItems] = useState([{ desc: "", qty: 1, price: "" }]);
  const [note, setNote] = useState("");

  async function load() {
    const res = await fetch("/api/admin/quotes", { headers: { "x-admin-key": adminKey } });
    if (res.ok) {
      const d = await res.json();
      setQuotes(d.quotes || []);
      setFirebase(d.firebase);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const total = items.reduce((s, it) => s + (parseInt(it.qty, 10) || 0) * (parseFloat(it.price) || 0), 0);

  async function create() {
    setMsg("");
    const res = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ type, client, items, note }),
    });
    const d = await res.json();
    if (d.ok) {
      setMsg(`${type === "facture" ? "Facture" : "Devis"} ${d.number} créé ✓`);
      setClient({ name: "", email: "", address: "" });
      setItems([{ desc: "", qty: 1, price: "" }]);
      setNote("");
      setShowForm(false);
      load();
    } else {
      setMsg(d.error || "Échec.");
    }
  }

  if (!firebase) {
    return <div className="notice">La connexion à ton application (Firebase) est nécessaire pour les devis/factures. Voir l'onglet Réglages.</div>;
  }

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Crée un devis (gratuit) ou une facture à envoyer à une cliente. Tu obtiens un <strong>lien</strong> à lui transmettre :
        elle peut le voir, l'imprimer en PDF, et <strong>payer en ligne</strong>.
      </p>
      {msg && <div className="notice">{msg}</div>}

      <button className="btn btn-gold" style={{ marginBottom: 18 }} onClick={() => setShowForm((s) => !s)}>
        {showForm ? "Fermer" : "+ Nouveau devis / facture"}
      </button>

      {showForm && (
        <div className="admin-block" style={{ display: "grid", gap: 10 }}>
          <label className="admin-field">Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="devis">Devis (gratuit, à faire payer ensuite)</option>
              <option value="facture">Facture</option>
            </select>
          </label>
          <label className="admin-field">Nom de la cliente
            <input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Prénom Nom" />
          </label>
          <label className="admin-field">E-mail de la cliente
            <input value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="cliente@email.com" />
          </label>
          <label className="admin-field">Adresse (facultatif)
            <input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} />
          </label>

          <span className="admin-field" style={{ marginBottom: -4 }}>Lignes</span>
          {items.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 80px 28px", gap: 6, alignItems: "center" }}>
              <input placeholder="Désignation" value={it.desc}
                onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                style={{ padding: "8px", border: "1px solid var(--line)", borderRadius: 8 }} />
              <input type="number" min="1" value={it.qty} title="Quantité"
                onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))}
                style={{ padding: "8px", border: "1px solid var(--line)", borderRadius: 8 }} />
              <input type="number" min="0" step="0.01" placeholder="€" value={it.price} title="Prix unitaire"
                onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                style={{ padding: "8px", border: "1px solid var(--line)", borderRadius: 8 }} />
              <button className="btn btn-outline" style={{ padding: "4px 8px" }} title="Supprimer la ligne"
                onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : items)}>×</button>
            </div>
          ))}
          <button className="btn btn-outline" style={{ justifySelf: "start", padding: "4px 12px" }}
            onClick={() => setItems([...items, { desc: "", qty: 1, price: "" }])}>+ Ligne</button>

          <label className="admin-field">Demande du client / à fabriquer (recopie ici sa demande)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 70 }} placeholder="Ex. : gravure logo + date, sur les 2 faces, livraison avant le 12… (s'affichera automatiquement dans la commande une fois payée)" />
          </label>

          <div style={{ textAlign: "right", fontWeight: 700, color: "var(--gold-dark)" }}>Total : {formatEuro(total)}</div>
          <button className="btn btn-gold" onClick={create}>Créer le document</button>
        </div>
      )}

      {quotes.length === 0 && (
        <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucun devis/facture pour le moment.</p></div>
      )}
      {quotes.map((q) => (
        <div key={q.id} className="admin-block">
          <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
            <span className="admin-variant">
              <strong>{q.number}</strong> · {q.type === "facture" ? "Facture" : "Devis"}
              <span style={{ color: q.status === "paye" ? "#256b34" : "var(--ink-soft)", marginLeft: 6 }}>· {STATUS_LABEL[q.status] || q.status}</span>
            </span>
            <span className="admin-price">{formatEuro(q.total)}</span>
          </div>
          <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>{q.client?.name || "—"}{q.client?.email ? ` · ${q.client.email}` : ""}</div>
          <a className="btn btn-outline" href={`/document/${q.id}`} target="_blank" rel="noopener"
            style={{ marginTop: 8, padding: "4px 12px", fontSize: "0.85rem" }}>
            Ouvrir / copier le lien à envoyer
          </a>
        </div>
      ))}
    </>
  );
}
