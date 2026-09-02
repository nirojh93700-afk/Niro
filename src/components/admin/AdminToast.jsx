"use client";

import { useEffect, useState } from "react";

// =============================================================================
// Retour visuel commun à TOUTE la gestion : « Enregistré ✓ » en bas de l'écran
// dès qu'un enregistrement admin réussit, « Échec » s'il rate — sans avoir à
// brancher chaque page une par une. Fonctionne en observant les appels réseau
// vers les routes admin qui ENREGISTRENT quelque chose (liste ci-dessous).
// Les envois (e-mails, newsletter, BAT, agents…) ne sont PAS concernés : chaque
// écran garde son propre message pour ces actions-là.
// Utilisation manuelle : toast("Texte", "ok" | "err" | "info").
// =============================================================================

const SAVE_ROUTES = {
  "/api/admin/settings": "Réglages enregistrés",
  "/api/admin/catalog": "Catalogue enregistré",
  "/api/admin/stock": "Stock enregistré",
  "/api/admin/images": "Photos enregistrées",
  "/api/admin/upload-model": "Modèle 3D enregistré",
  "/api/admin/taxonomy": "Catégories enregistrées",
  "/api/admin/promo": "Promotion enregistrée",
  "/api/admin/promo-codes": "Code promo enregistré",
  "/api/admin/reviews": "Avis enregistré",
  "/api/admin/orders": "Commande mise à jour",
  "/api/admin/cagnottes": "Cagnotte mise à jour",
  "/api/admin/scheduled": "Programmation enregistrée",
  "/api/admin/benefices": "Dépenses enregistrées",
  "/api/admin/restock-alerts": "Alertes de réassort mises à jour",
  "/api/admin/refund": "Remboursement effectué",
  "/api/admin/purchases": "Achat enregistré, stock mis à jour",
};
// Actions POST qui ne sont pas des enregistrements (lecture / envoi) → pas de toast.
const SKIP_ACTIONS = new Set(["checkPayment", "send", "list", "preview", "analyze"]);

export function toast(text, tone = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("niv:toast", { detail: { text, tone } }));
}

function routeOf(input) {
  try {
    const raw = typeof input === "string" ? input : input?.url || "";
    const path = new URL(raw, window.location.origin).pathname;
    return Object.keys(SAVE_ROUTES).find((r) => path === r || path.startsWith(r + "/")) || null;
  } catch { return null; }
}

function actionOf(init) {
  try {
    const b = init?.body;
    if (typeof b !== "string" || !b.startsWith("{")) return "";
    return String(JSON.parse(b).action || "");
  } catch { return ""; }
}

export default function AdminToast() {
  const [items, setItems] = useState([]);

  // Observe les enregistrements admin (une seule fois par page).
  useEffect(() => {
    if (window.__nivToastFetch) return undefined;
    const orig = window.fetch.bind(window);
    window.__nivToastFetch = true;
    window.fetch = async (input, init) => {
      const method = String(init?.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase();
      const route = method === "GET" || method === "HEAD" ? null : routeOf(input);
      if (!route || SKIP_ACTIONS.has(actionOf(init))) return orig(input, init);
      try {
        const res = await orig(input, init);
        if (res.ok) toast(SAVE_ROUTES[route] + " ✓", "ok");
        else toast(`Échec (${res.status}) — rien n'a été enregistré`, "err");
        return res;
      } catch (e) {
        toast("Erreur réseau — rien n'a été enregistré", "err");
        throw e;
      }
    };
    return () => { window.fetch = orig; delete window.__nivToastFetch; };
  }, []);

  // Affiche les messages (3 max, disparaissent tout seuls).
  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random().toString(36).slice(2);
      const it = { id, text: e.detail?.text || "", tone: e.detail?.tone || "ok" };
      setItems((l) => [...l.slice(-2), it]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), it.tone === "err" ? 6000 : 3200);
    };
    window.addEventListener("niv:toast", onToast);
    return () => window.removeEventListener("niv:toast", onToast);
  }, []);

  if (!items.length) return null;
  return (
    <div className="ash-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`ash-toast ${t.tone}`} onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}>
          <span className="ash-toast-ico" aria-hidden>{t.tone === "err" ? "!" : t.tone === "info" ? "i" : "✓"}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
