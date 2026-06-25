"use client";

import { useState } from "react";

// Message d'aide adapté À CHAQUE produit. Priorité au champ `requestHint` posé
// sur le produit (products.js) ; sinon repli intelligent selon la catégorie/type.
function hintFor(product) {
  if (product?.requestHint) return product.requestHint;
  const cat = product?.category;
  const type = (product?.type || product?.name || "votre création").toLowerCase();
  if (cat === "verres")
    return "Ex. : logo d'entreprise, citation ou phrase, date, gravure des deux côtés, format ou quantité particulière…";
  if (cat === "mariage")
    return "Ex. : thème et couleurs, date du mariage, nombre d'exemplaires, prénoms, format ou bois souhaité…";
  return `Décrivez votre idée pour ${type} : texte, dimensions, quantité, délai souhaité…`;
}

function introFor(product) {
  const what = product?.type || product?.name || "ce produit";
  return `Une demande particulière pour ${what} ?`;
}

export default function CustomRequestBox({ product }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "ok" | "error"
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Merci d'indiquer votre nom, votre e-mail et votre demande.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const fullMessage =
        `${message.trim()}\n\n— — —\n` +
        `Demande envoyée depuis la fiche produit : ${product?.name || ""}` +
        (product?.slug ? ` (/produit/${product.slug})` : "");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: `Demande sur mesure — ${product?.name || "produit"}`,
          message: fullMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "L'envoi a échoué. Réessayez.");
        setStatus("error");
        return;
      }
      setStatus("ok");
      setMessage("");
    } catch {
      setError("Erreur réseau. Réessayez.");
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        marginTop: 14,
        fontSize: "0.86rem",
        color: "var(--ink-soft)",
        background: "#fbf4e6",
        border: "1px solid #e7d3a1",
        borderRadius: 12,
        padding: "12px 14px",
        lineHeight: 1.5,
      }}
    >
      <strong style={{ color: "var(--gold-dark)" }}>{introFor(product)}</strong>
      <br />
      Décrivez ce que vous souhaitez : je vous réponds avec une proposition et un{" "}
      <strong>devis</strong>. Vous ne payez que si le montant vous convient.

      {!open && status !== "ok" && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              border: "none",
              background: "var(--gold-dark)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 9,
              padding: "9px 16px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Faire une demande particulière
          </button>
        </div>
      )}

      {open && status !== "ok" && (
        <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={hintFor(product)}
            rows={4}
            maxLength={1500}
            style={{
              width: "100%",
              borderRadius: 9,
              border: "1px solid #e7d3a1",
              padding: "10px 12px",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              resize: "vertical",
              background: "#fff",
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              style={{
                flex: "1 1 140px",
                borderRadius: 9,
                border: "1px solid #e7d3a1",
                padding: "9px 12px",
                fontSize: "0.9rem",
                background: "#fff",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre e-mail"
              style={{
                flex: "1 1 180px",
                borderRadius: 9,
                border: "1px solid #e7d3a1",
                padding: "9px 12px",
                fontSize: "0.9rem",
                background: "#fff",
              }}
            />
          </div>
          {error && <div style={{ color: "#b3261e", fontSize: "0.85rem" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                border: "none",
                background: "var(--gold-dark)",
                color: "#fff",
                fontWeight: 600,
                borderRadius: 9,
                padding: "9px 16px",
                cursor: status === "sending" ? "default" : "pointer",
                opacity: status === "sending" ? 0.7 : 1,
                fontSize: "0.9rem",
              }}
            >
              {status === "sending" ? "Envoi…" : "Envoyer ma demande"}
            </button>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              ou{" "}
              <a href="mailto:contact.nivcreation@gmail.com" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
                écrivez-nous
              </a>{" "}
              ·{" "}
              <a href="tel:+33766153102" style={{ color: "var(--gold-dark)", fontWeight: 600, whiteSpace: "nowrap" }}>
                07 66 15 31 02
              </a>
            </span>
          </div>
        </form>
      )}

      {status === "ok" && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 9,
            background: "#e7f4ea",
            border: "1px solid #bfe3c8",
            color: "#1d6b35",
            fontWeight: 600,
          }}
        >
          Demande envoyée ✦ Je reviens vers vous avec une proposition et un devis. Vous ne réglez que si le montant vous convient.
        </div>
      )}
    </div>
  );
}
