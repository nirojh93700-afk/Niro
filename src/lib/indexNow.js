// IndexNow (24/11/2026, gérant : « branche IndexNow ») : prévient Bing (et Yandex, Seznam, Naver…)
// dès qu'une page du site apparaît, change ou disparaît, au lieu d'attendre qu'ils repassent.
// Lancé par le battement toutes les heures. Il compare le plan du site (sitemap.js) et une empreinte
// de chaque fiche produit (nom, prix, photo, masquage) avec le passage précédent, puis n'envoie que
// les adresses nouvelles, modifiées ou retirées. Le 1er passage envoie tout le plan du site.
// Clé publique (c'est voulu) : vérifiée par les moteurs dans /<clé>.txt (public/).
import crypto from "node:crypto";
import sitemap from "@/app/sitemap";
import { getCatalog } from "@/lib/catalog";
import { getJobNote, setJobNote } from "@/lib/stock";

export const INDEXNOW_KEY = "7f8fc88e140177843ad7d2b9734ec706";
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");
const NOTE = "indexNow";

const court = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 10);

// Empreinte de chaque adresse : les fiches changent quand leur nom, leur prix ou leur photo change ;
// les autres pages sont seulement suivies (nouvelle / retirée).
export async function empreintesDuSite() {
  const [plan, catalog] = await Promise.all([sitemap(), getCatalog().catch(() => [])]);
  const parSlug = new Map(catalog.map((p) => [p.slug, p]));
  const sigs = {};
  for (const e of plan) {
    const url = e.url;
    const m = url.match(/\/produit\/([^/?#]+)$/);
    const p = m ? parSlug.get(m[1]) : null;
    sigs[url] = p
      ? court(JSON.stringify([p.name, p.title, (p.variants || []).map((v) => [v.id, v.price, v.compareAt]), (p.images || [])[0], p.badge]))
      : "1";
  }
  return sigs;
}

// Adresses à signaler : nouvelles, modifiées, retirées (un retrait se signale aussi : le moteur
// vérifie alors la page et l'oublie). Fonction pure, testée.
export function adressesChangees(avant, apres) {
  if (!avant) return Object.keys(apres);
  const out = [];
  for (const [u, s] of Object.entries(apres)) if (avant[u] !== s) out.push(u);
  for (const u of Object.keys(avant)) if (!(u in apres)) out.push(u);
  return out;
}

export async function envoyerIndexNow(urls) {
  if (!urls.length) return { envoye: 0 };
  const host = new URL(BASE).host;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10000) }),
      signal: ctrl.signal,
    });
    return { envoye: urls.length, statut: r.status, ok: r.status === 200 || r.status === 202 };
  } finally { clearTimeout(t); }
}

export async function runIndexNow({ force = false } = {}) {
  // Seulement le vrai site (jamais une copie locale ou une autre adresse).
  if (!/^https:\/\/(www\.)?nivcreation\.fr$/.test(BASE)) return { skipped: "pas le site en ligne" };
  const note = await getJobNote(NOTE, true).catch(() => null);
  const apres = await empreintesDuSite();
  const urls = force ? Object.keys(apres) : adressesChangees(note?.sigs || null, apres);
  if (!urls.length) return { envoye: 0 };
  const r = await envoyerIndexNow(urls);
  // L'état n'avance que si l'envoi a été accepté : sinon on réessaiera au prochain passage.
  await setJobNote(NOTE, {
    at: new Date().toISOString(),
    sigs: r.ok ? apres : (note?.sigs || null),
    dernier: { at: new Date().toISOString(), nb: urls.length, statut: r.statut || null, exemples: urls.slice(0, 5) },
  });
  return r;
}
