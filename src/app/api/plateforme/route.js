// =============================================================================
// API Plateforme (Lior) — lecture + écriture, protégée par mot de passe
// -----------------------------------------------------------------------------
// GET  → { clients, stats, settings }
// POST → { action, ... } : createClient | updateClient | deleteClient
//        | saveKeys | saveReglages | check (test des sites en ligne)
// Auth : en-tête x-platform-key = PLATFORM_PASSWORD (ou ADMIN_PASSWORD).
// =============================================================================

import { NextResponse } from "next/server";
import { getData, saveData, computeStats, slugify, saveSiteHtml, deleteSiteHtml } from "@/lib/plateforme-store";

export const dynamic = "force-dynamic";

// Rien n'est publié ni ajouté automatiquement : un site n'est mis en ligne que
// lorsque la propriétaire dépose son fichier (action saveSite). On nettoie une
// seule fois une éventuelle fiche HB Auto-Clé ajoutée automatiquement par une
// version précédente (si elle n'a pas été retravaillée), pour ne rien laisser
// en ligne avant validation du client.
async function ensureCleanup(data) {
  if (data.settings?.hbCleaned) return data;
  const i = data.clients.findIndex((c) => c.id === "hb-auto-cle");
  if (i !== -1) {
    const c = data.clients[i];
    const intacte = (!c.keys || Object.keys(c.keys).length === 0) && !c.abonnement?.formule;
    if (intacte) {
      data.clients.splice(i, 1); // fiche non retravaillée : on la retire
    } else if (c.site?.on) {
      data.clients[i].site = { on: false }; // fiche gardée mais dépubliée
    }
    try { await deleteSiteHtml("hb-auto-cle"); } catch {}
  }
  data.settings = { ...data.settings, hbCleaned: true };
  return await saveData(data);
}

function attendu() {
  return (process.env.PLATFORM_PASSWORD || process.env.ADMIN_PASSWORD || "").trim();
}
function autorise(req) {
  const exp = attendu();
  if (!exp) return true; // aucun mot de passe configuré = mode démo
  return (req.headers.get("x-platform-key") || "").trim() === exp;
}

export async function GET(req) {
  if (!autorise(req)) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  const data = await ensureCleanup(await getData());
  return NextResponse.json({ clients: data.clients, stats: computeStats(data.clients), settings: data.settings });
}

export async function POST(req) {
  if (!autorise(req)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  const data = await getData();

  switch (action) {
    case "createClient": {
      const c = body.client || {};
      const id = slugify(c.nom);
      if (data.clients.some((x) => x.id === id)) {
        return NextResponse.json({ error: "Une cliente porte déjà ce nom." }, { status: 400 });
      }
      data.clients.push({
        id,
        nom: c.nom || "Nouvelle cliente",
        domaine: c.domaine || "",
        etatSite: c.etatSite || "preparation",
        abonnement: c.abonnement || { formule: null, prix: 0, etat: "aucun" },
        adminUrl: c.adminUrl || null,
        depuis: new Date().toISOString().slice(0, 7),
        keys: {},
      });
      break;
    }
    case "updateClient": {
      const c = body.client || {};
      const i = data.clients.findIndex((x) => x.id === c.id);
      if (i === -1) return NextResponse.json({ error: "Cliente introuvable." }, { status: 404 });
      data.clients[i] = { ...data.clients[i], ...c, keys: data.clients[i].keys };
      break;
    }
    case "deleteClient": {
      data.clients = data.clients.filter((x) => x.id !== body.id);
      break;
    }
    case "saveKeys": {
      const i = data.clients.findIndex((x) => x.id === body.id);
      if (i === -1) return NextResponse.json({ error: "Cliente introuvable." }, { status: 404 });
      data.clients[i].keys = { ...(data.clients[i].keys || {}), ...(body.keys || {}) };
      break;
    }
    case "saveReglages": {
      data.settings = { ...data.settings, ...(body.settings || {}) };
      break;
    }
    case "saveSite": {
      // Héberge le HTML du site dans Lior et donne un lien public /site/<id>.
      const i = data.clients.findIndex((x) => x.id === body.id);
      if (i === -1) return NextResponse.json({ error: "Cliente introuvable." }, { status: 404 });
      const html = String(body.html || "");
      if (!html.trim()) return NextResponse.json({ error: "Le fichier du site est vide." }, { status: 400 });
      await saveSiteHtml(body.id, html);
      data.clients[i].site = { on: true, url: `/site/${body.id}`, bytes: html.length, updatedAt: new Date().toISOString().slice(0, 10) };
      if (data.clients[i].etatSite === "preparation") data.clients[i].etatSite = "en-ligne";
      break;
    }
    case "deleteSite": {
      const i = data.clients.findIndex((x) => x.id === body.id);
      if (i !== -1) {
        await deleteSiteHtml(body.id);
        data.clients[i].site = { on: false };
      }
      break;
    }
    case "check": {
      // Teste réellement si chaque site répond (sans clé, simple ping HTTP).
      const results = {};
      await Promise.all(
        data.clients
          .filter((c) => c.domaine)
          .map(async (c) => {
            const url = c.domaine.startsWith("http") ? c.domaine : `https://${c.domaine}`;
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 8000);
              const res = await fetch(url, { method: "GET", signal: ctrl.signal, redirect: "follow" });
              clearTimeout(t);
              results[c.id] = { online: res.ok || res.status < 500, status: res.status };
            } catch {
              results[c.id] = { online: false, status: 0 };
            }
          })
      );
      return NextResponse.json({ results });
    }
    default:
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  const saved = await saveData(data);
  return NextResponse.json({ clients: saved.clients, stats: computeStats(saved.clients), settings: saved.settings });
}
