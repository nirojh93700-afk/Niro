"use client";

import { useState, useEffect } from "react";
import { formatEuro } from "@/lib/format";
import { products } from "@/lib/products";

// Tous les articles du stock (un par variante) pour la liste « Retirer du stock ».
// Articles du site : sert à retirer le stock ET à calculer la livraison comme sur le site (poids, lettre/colis, seuils offerts…).
const ARTICLES_SITE = products.flatMap((p) => (p.variants || []).map((v) => ({
  id: v.id, stockId: v.stockId || v.id, label: `${p.name} — ${v.title}`,
  poids: Number(v.weight) || Number(p.weight) || 200, lettre: Boolean(p.letter),
})));

// Réglage « la cliente peut changer le nombre » (maquette validée le 01/11/2026,
// https://claude.ai/artifact/UajL1z3fV5Fu5GF36voVcf). Une ligne « suit le nombre » : rattachée à un
// produit vendu par lots → prix des lots de la fiche (remise montrée à la cliente) ; sinon (gravure)
// prix de la ligne pour la 1re pièce puis « prix des suivantes » pour chaque pièce en plus.
function BlocQuantite({ qte, setQte, lignes, setLigne }) {
  return (
    <div style={{ border: "1px dashed var(--gold)", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.9rem" }}>
        <input type="checkbox" checked={Boolean(qte.modifiable)} onChange={(e) => setQte({ ...qte, modifiable: e.target.checked })} style={{ marginTop: 3 }} />
        <span><strong>La cliente peut changer le nombre</strong><br />
          <small style={{ color: "var(--ink-soft)" }}>Boutons − 1 + sur son devis. Ligne rattachée à un produit vendu par lots : prix des lots de la fiche, remise montrée. Ligne de gravure : prix de la ligne pour la 1re pièce, puis le prix des suivantes.</small></span>
      </label>
      {qte.modifiable && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: "0.85rem", alignItems: "center" }}>
            Au moins <input type="number" min="1" value={qte.min} onChange={(e) => setQte({ ...qte, min: e.target.value })} style={{ width: 64, padding: 6, border: "1px solid var(--line)", borderRadius: 8 }} />
            au plus <input type="number" min="1" value={qte.max} onChange={(e) => setQte({ ...qte, max: e.target.value })} style={{ width: 64, padding: 6, border: "1px solid var(--line)", borderRadius: 8 }} />
          </div>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: "0.84rem", background: "var(--cream)", borderRadius: 8, padding: "6px 8px" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", flex: "1 1 220px", minWidth: 0 }}>
                <input type="checkbox" checked={Boolean(l.suit)} onChange={(e) => setLigne(i, { suit: e.target.checked })} />
                <span style={{ overflowWrap: "anywhere" }}>Suit le nombre : {l.desc || `ligne ${i + 1}`}</span>
              </label>
              {l.suit && !l.variantId ? (
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>Prix des suivantes (€)
                  <input type="number" min="0" step="0.01" value={l.prixSuivant ?? ""} placeholder={String(l.price || "")} onChange={(e) => setLigne(i, { prixSuivant: e.target.value })}
                    style={{ width: 80, padding: 6, border: "1px solid var(--line)", borderRadius: 8 }} />
                </label>
              ) : l.suit ? <small style={{ color: "var(--ink-soft)" }}>prix des lots de la fiche</small> : null}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

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
  const [qte, setQte] = useState({ modifiable: false, min: 1, max: 12 });
  const [edQte, setEdQte] = useState(null); // { id, qte, lignes } : réglage d'un devis existant

  async function load() {
    const res = await fetch("/api/admin/quotes", { headers: { "x-admin-key": adminKey } });
    if (res.ok) {
      const d = await res.json();
      setQuotes(d.quotes || []);
      setFirebase(d.firebase);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function sendQuote(q) {
    const to = (q.client?.email || "").trim() || prompt("E-mail du destinataire ?");
    if (!to) { setMsg("Indique une adresse e-mail."); return; }
    setMsg("Envoi en cours…");
    const res = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "send", id: q.id, email: to }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(d.ok ? `Devis envoyé par e-mail à ${d.to} ✓` : (d.error || "Échec de l'envoi."));
  }

  async function basculerPanier(q, off) {
    try {
      const res = await fetch("/api/admin/quotes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action: "panier", id: q.id, off }) });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setQuotes((prev) => prev.map((x) => (x.id === q.id ? { ...x, panierOff: off } : x)));
    } catch { /* rien changé */ }
  }

  async function removeQuote(q) {
    if (!confirm(`Supprimer définitivement ${q.number} ?`)) return;
    const res = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "delete", id: q.id }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.ok) { setMsg(`${q.number} supprimé ✓`); load(); } else setMsg(d.error || "Échec de la suppression.");
  }

  const total = items.reduce((s, it) => s + (parseInt(it.qty, 10) || 0) * (parseFloat(it.price) || 0), 0);

  async function create() {
    setMsg("");
    const res = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ type, client, items, note, qte }),
    });
    const d = await res.json();
    if (d.ok) {
      setMsg(`${type === "facture" ? "Facture" : "Devis"} ${d.number} créé ✓`);
      setClient({ name: "", email: "", address: "" });
      setItems([{ desc: "", qty: 1, price: "" }]);
      setNote("");
      setQte({ modifiable: false, min: 1, max: 12 });
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
              <select value={it.variantId || ""} title="Produit du site : retire le stock quand le devis est payé ET sert à calculer la livraison comme sur le site"
                onChange={(e) => { const a = ARTICLES_SITE.find((x) => x.id === e.target.value); setItems(items.map((x, j) => j === i ? { ...x, variantId: a ? a.id : "", stockId: a ? a.stockId : "", boite: a && a.lettre ? x.boite : false } : x)); }}
                style={{ gridColumn: "1 / -1", padding: "6px 8px", border: "1px dashed var(--line)", borderRadius: 8, fontSize: "0.82rem", color: it.variantId ? "inherit" : "var(--ink-soft)" }}>
                <option value="">📦 Article du site : aucun (ligne libre — indiquez le poids)</option>
                {ARTICLES_SITE.map((a) => <option key={a.id} value={a.id}>📦 Article du site : {a.label}</option>)}
              </select>
              {(() => {
                const a = ARTICLES_SITE.find((x) => x.id === it.variantId);
                return (
                  <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.82rem", color: "var(--ink-soft)" }}
                    title="Poids d'UNE pièce, emballage compris. À corriger pour une grosse commande ou une demande spéciale : la livraison que le client choisit sur le devis suit ce poids.">
                    ⚖️ Poids d'une pièce (g)
                    <input type="number" min="0" step="1" inputMode="numeric" placeholder={a ? `auto : ${a.poids}` : "Ex : 150"} value={it.weight || ""}
                      onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))}
                      style={{ width: 104, padding: "6px 8px", border: "1px dashed var(--line)", borderRadius: 8 }} />
                    {a && a.lettre ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input type="checkbox" checked={Boolean(it.boite)} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, boite: e.target.checked } : x))} /> en boîte rigide (colis)
                      </span>
                    ) : null}
                    <span>{a || Number(it.weight) > 0 ? "" : "sans article ni poids : pas de choix de livraison pour le client"}</span>
                  </label>
                );
              })()}
            </div>
          ))}
          <button className="btn btn-outline" style={{ justifySelf: "start", padding: "4px 12px" }}
            onClick={() => setItems([...items, { desc: "", qty: 1, price: "" }])}>+ Ligne</button>

          {type === "devis" && (
            <BlocQuantite qte={qte} setQte={setQte} lignes={items}
              setLigne={(i, patch) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))} />
          )}

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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <a className="btn btn-outline" href={`/document/${q.id}`} target="_blank" rel="noopener"
              style={{ padding: "4px 12px", fontSize: "0.85rem" }}>
              Ouvrir / copier le lien
            </a>
            <button className="btn btn-gold" onClick={() => sendQuote(q)}
              style={{ padding: "4px 12px", fontSize: "0.85rem" }}>
              ✉️ Envoyer par e-mail
            </button>
            {q.type !== "facture" && q.status !== "paye" && (
              <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                onClick={() => setEdQte(edQte?.id === q.id ? null : { id: q.id, qte: { modifiable: Boolean(q.qte?.modifiable), min: q.qte?.min || 1, max: q.qte?.max || 12 }, lignes: (q.items || []).map((it) => ({ ...it })) })}>
                🔢 Nombre modifiable{q.qte?.modifiable ? " ✓" : ""}
              </button>
            )}
            {q.type !== "facture" && q.status !== "paye" && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", padding: "4px 6px" }}
                title="Sur la page du devis : choix d'un emballage cadeau et d'autres articles du site, réglés ensemble au panier">
                <input type="checkbox" checked={q.panierOff !== true} onChange={(e) => basculerPanier(q, !e.target.checked)} />
                Emballage et autres articles
              </label>
            )}
            <button className="btn btn-outline" onClick={() => removeQuote(q)}
              style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f" }}>
              Supprimer
            </button>
          </div>
          {edQte?.id === q.id && (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <BlocQuantite qte={edQte.qte} setQte={(v) => setEdQte({ ...edQte, qte: v })} lignes={edQte.lignes}
                setLigne={(i, patch) => setEdQte({ ...edQte, lignes: edQte.lignes.map((x, j) => (j === i ? { ...x, ...patch } : x)) })} />
              <button className="btn btn-gold" style={{ justifySelf: "start", padding: "4px 14px" }} onClick={async () => {
                const res = await fetch("/api/admin/quotes", {
                  method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                  body: JSON.stringify({ action: "quantite", id: q.id, qte: edQte.qte, lignes: edQte.lignes.map((l) => ({ suit: Boolean(l.suit), prixSuivant: l.prixSuivant })) }),
                });
                const d = await res.json().catch(() => ({}));
                if (d.ok) { setMsg(`${q.number} : réglage enregistré ✓`); setEdQte(null); load(); } else setMsg(d.error || "Échec.");
              }}>Enregistrer</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
