// 🧾 Classeur des factures (15/11/2026, maquette « Niv Admin »).
//   GET                    → { lignes, kpis, moisListe, fournisseurs, categories }
//   GET ?fichier=<id>      → le fichier d'origine (admin)
//   POST { action:"ajouter", fichier:{ name, type, data(base64) }, fournisseur, libelle, numero, date, montant, categorie, cible? }
//   POST { action:"modifier", id, fournisseur, libelle, numero, date, montant, categorie, aVerifier }
// Rien n'est supprimé : une facture se garde 10 ans.
import { isAdmin, getFactures, ajouterFacture, modifierFacture, getFactureFile, getPurchases, getSettings, FACTURE_CATEGORIES } from "@/lib/stock";
import { etatClasseur } from "@/lib/classeurFactures";
import { rangerFichierFacture } from "@/lib/facturesServeur";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const txt = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : new Date().toISOString().slice(0, 10));
const montant = (v) => { const n = Math.round(Number(String(v ?? "").replace(",", ".")) * 100) / 100; return Number.isFinite(n) && n >= 0 && n < 1e6 ? n : 0; };
const cat = (v) => (FACTURE_CATEGORIES[v] ? v : "autre");

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const url = new URL(req.url);
  const f = url.searchParams.get("fichier");
  if (f) {
    const file = await getFactureFile(f);
    if (!file) return Response.json({ error: "Fichier introuvable." }, { status: 404 });
    return new Response(file.data, { headers: { "Content-Type": file.contentType, "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
  }
  const [factures, purchases, settings] = await Promise.all([getFactures(), getPurchases(), getSettings().catch(() => ({}))]);
  const e = etatClasseur({ factures, purchases, expenses: Array.isArray(settings?.expenses) ? settings.expenses : [] });
  return Response.json({ ...e, categories: FACTURE_CATEGORIES });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  if (b?.action === "ajouter") {
    const fichier = await rangerFichierFacture(b.fichier);
    if (!fichier) return Response.json({ error: "Ajoutez la photo ou le PDF de la facture." }, { status: 400 });
    if (fichier.error) return Response.json({ error: fichier.error }, { status: 400 });
    const rec = {
      fournisseur: txt(b.fournisseur, 80) || "Fournisseur", libelle: txt(b.libelle, 160), numero: txt(b.numero, 60),
      date: date(b.date), montant: montant(b.montant), categorie: cat(b.categorie), fichier, aVerifier: b.aVerifier === true,
    };
    if (b.cible?.type === "achat" && b.cible.id) rec.achatId = txt(b.cible.id, 60);
    if (b.cible?.type === "depense" && b.cible.id) rec.depenseId = txt(b.cible.id, 60);
    const f = await ajouterFacture(rec);
    return Response.json({ ok: true, facture: f });
  }

  if (b?.action === "modifier" && b.id) {
    const patch = {};
    if ("fournisseur" in b) patch.fournisseur = txt(b.fournisseur, 80);
    if ("libelle" in b) patch.libelle = txt(b.libelle, 160);
    if ("numero" in b) patch.numero = txt(b.numero, 60);
    if ("date" in b) patch.date = date(b.date);
    if ("montant" in b) patch.montant = montant(b.montant);
    if ("categorie" in b) patch.categorie = cat(b.categorie);
    if ("aVerifier" in b) patch.aVerifier = b.aVerifier === true;
    const f = await modifierFacture(String(b.id), patch);
    if (!f) return Response.json({ error: "Facture introuvable." }, { status: 404 });
    return Response.json({ ok: true, facture: f });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
