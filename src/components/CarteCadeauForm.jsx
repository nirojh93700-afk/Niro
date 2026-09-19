"use client";

import { useState } from "react";
import { MONTANTS_CARTE } from "@/lib/carteCadeau";

// =============================================================================
// FORMULAIRE DE LA CARTE CADEAU — fidèle à la maquette validée le 19/09/2026 :
// visuel de la carte à gauche (le montant s'y affiche en direct), montants,
// petit mot, destinataire, envoi tout de suite ou à une date choisie.
// Le paiement passe par une session Stripe dédiée (/api/carte-cadeau).
// =============================================================================
export default function CarteCadeauForm() {
  const [montant, setMontant] = useState(50);
  const [destName, setDestName] = useState("");
  const [destEmail, setDestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [quand, setQuand] = useState("maintenant"); // "maintenant" | "date"
  const [sendAt, setSendAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function payer(e) {
    e.preventDefault();
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail.trim())) {
      setErr("Indiquez l'adresse e-mail du destinataire.");
      return;
    }
    if (quand === "date" && !sendAt) {
      setErr("Choisissez la date d'envoi, ou passez en envoi immédiat.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/carte-cadeau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant,
          destName: destName.trim(),
          destEmail: destEmail.trim(),
          message: message.trim(),
          sendAt: quand === "date" && sendAt ? sendAt : "",
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Le paiement n'a pas pu être préparé.");
      window.location.href = j.url;
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  // Date minimale proposée : demain (l'envoi immédiat couvre aujourd'hui).
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <form className="gc-flex" onSubmit={payer}>
      <div className="gc-card">
        <div className="gc-visuel">
          <div>
            <div className="gc-marque">NiV CRÉATION</div>
            <div className="gc-lib">Carte cadeau</div>
          </div>
          <div className="gc-montant">{montant} €</div>
        </div>
        <p className="gc-note">
          Envoyée par e-mail, jamais de prix caché : le destinataire voit le montant et votre mot,
          rien d'autre. Code personnel, valable un an, en une ou plusieurs fois.
        </p>
      </div>

      <div className="gc-form">
        <div className="gc-label">Choisissez le montant</div>
        <div className="gc-montants">
          {MONTANTS_CARTE.map((m) => (
            <button type="button" key={m} className={m === montant ? "on" : ""} onClick={() => setMontant(m)}>
              {m} €
            </button>
          ))}
        </div>

        <label className="gc-label" htmlFor="gc-nom">Le prénom du destinataire <small>(facultatif)</small></label>
        <input id="gc-nom" value={destName} maxLength={60} onChange={(e) => setDestName(e.target.value)} placeholder="Camille" />

        <label className="gc-label" htmlFor="gc-mot">Votre petit mot <small>(facultatif, écrit dans l'e-mail)</small></label>
        <textarea id="gc-mot" rows={3} value={message} maxLength={180} onChange={(e) => setMessage(e.target.value)} placeholder="Joyeux anniversaire ! Choisis la pièce qui te ressemble." />
        <div className="gc-cnt">{message.length} / 180</div>

        <label className="gc-label" htmlFor="gc-mail">L'adresse e-mail du destinataire</label>
        <input id="gc-mail" type="email" required value={destEmail} onChange={(e) => setDestEmail(e.target.value)} placeholder="camille@exemple.fr" />

        <div className="gc-label">Quand l'envoyer ?</div>
        <div className="gc-quand">
          <label><input type="radio" name="quand" checked={quand === "maintenant"} onChange={() => setQuand("maintenant")} /> Tout de suite après le paiement</label>
          <label><input type="radio" name="quand" checked={quand === "date"} onChange={() => setQuand("date")} /> À une date choisie</label>
          {quand === "date" ? (
            <input type="date" min={demain} value={sendAt} onChange={(e) => setSendAt(e.target.value)} aria-label="Date d'envoi" />
          ) : null}
        </div>

        {err ? <p className="gc-err">{err}</p> : null}
        <button className="btn btn-gold gc-payer" type="submit" disabled={busy}>
          {busy ? "Un instant…" : `Offrir cette carte — ${montant} €`}
        </button>
        <p className="gc-note">Paiement sécurisé Stripe. La carte part seulement une fois le paiement confirmé.</p>
      </div>
    </form>
  );
}
