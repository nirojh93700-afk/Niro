import { isAdmin, getEtiquettesAdresses, modifierEtiquettesAdresses, getSettings, setSettings } from "@/lib/stock";
import { adresseCollee } from "@/lib/etiquettes";

export const dynamic = "force-dynamic";

// Gestion → Étiquettes d'adresse : adresses collées à la main (Etsy ou autre), gardées sur le site.
// GET → { adresses:[{ id, site, texte, at }] }
// POST { action:"add", texte, site } · { action:"remove", ids:[…] } → même réponse.
// Adresse de RETOUR de l'atelier (23/11/2026) : GET renvoie aussi { retour } ;
// POST { action:"retour", texte } l'enregistre dans les réglages (settings.etiquettes.retour),
// jamais dans le code (le code de Gestion est lisible par tous).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const retour = String((await getSettings().catch(() => null))?.etiquettes?.retour || "");
  return Response.json({ adresses: await getEtiquettesAdresses(), retour });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  if (b.action === "add") {
    const texte = String(b.texte || "").slice(0, 600).trim();
    if (!adresseCollee(texte)) return Response.json({ error: "Adresse incomplète : le nom, la rue, puis le code postal et la ville." }, { status: 400 });
    const site = String(b.site || "Etsy").slice(0, 30);
    const adresses = await modifierEtiquettesAdresses((l) => [...l, { id: `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, site, texte, at: new Date().toISOString() }]);
    return Response.json({ adresses });
  }
  if (b.action === "retour") {
    const texte = String(b.texte || "").replace(/\r/g, "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 5).join("\n").slice(0, 300);
    const avant = (await getSettings(true).catch(() => null))?.etiquettes || {};
    await setSettings({ etiquettes: { ...avant, retour: texte } });
    return Response.json({ ok: true, retour: texte });
  }
  if (b.action === "remove") {
    const ids = new Set((Array.isArray(b.ids) ? b.ids : [b.id]).map(String));
    const adresses = await modifierEtiquettesAdresses((l) => l.filter((x) => !ids.has(String(x.id))));
    return Response.json({ adresses });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
