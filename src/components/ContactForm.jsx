"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const form = e.currentTarget;
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible.");
      setStatus("ok");
      form.reset();
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="notice" style={{ background: "#e9f6ec", borderColor: "#bfe2c6", color: "#256b34" }}>
        ✓ Merci ! Votre message a bien été envoyé. Nous vous répondrons très vite.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">Votre nom</label>
        <input id="name" name="name" type="text" required placeholder="Prénom Nom" />
      </div>
      <div className="field">
        <label htmlFor="email">Votre e-mail</label>
        <input id="email" name="email" type="email" required placeholder="vous@exemple.com" />
      </div>
      <div className="field">
        <label htmlFor="subject">Sujet</label>
        <input id="subject" name="subject" type="text" placeholder="Demande de personnalisation, devis…" />
      </div>
      <div className="field">
        <label htmlFor="message">Votre message</label>
        <textarea id="message" name="message" required placeholder="Décrivez votre projet ou votre question…" style={{ minHeight: 130 }} />
      </div>

      {status === "error" && (
        <div className="notice">
          {error}{" "}
          Vous pouvez aussi nous écrire directement à{" "}
          <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>.
        </div>
      )}

      <button type="submit" className="btn btn-gold btn-block" disabled={status === "sending"}>
        {status === "sending" ? "Envoi en cours…" : "Envoyer mon message"}
      </button>
    </form>
  );
}
