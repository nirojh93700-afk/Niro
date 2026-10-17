// TEMPORAIRE (17/10/2026) : sert à rapatrier dans le site les photos encore hébergées sur l'ancien
// CDN de la boutique. Renvoie le fichier d'origine tel quel (aucune retouche). Seuls les fichiers de
// la liste ci-dessous sont servis. À SUPPRIMER une fois les photos copiées dans public/.
export const dynamic = "force-dynamic";

const BASE = "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/";
const NOMS = new Set([
  "610876bb-4b83-4b09-a722-356af9af8088.webp",
  "6eab4878-cbeb-4f83-9620-ea38e73359b9_png.webp",
  "Gemini_Generated_Image_nzbs5vnzbs5vnzbs.png",
  "Gemini_Generated_Image_rdfslxrdfslxrdfs.png",
  "IMG_6324.png",
  "IMG_6327.png",
  "IMG_6330.png",
  "IMG_6331.png",
  "IMG_6335.png",
  "IMG_6547.png",
  "IMG_6734.jpg",
  "IMG_6758.jpg",
  "IMG_7705.jpg",
  "IMG_7705_8e43e2a1-3cba-4e9e-8eaf-c38765e67998.jpg",
  "IMG_7706.jpg",
  "IMG_7707.jpg",
  "a0452f63-4f2b-4f6b-833d-e9f8772be649.webp",
  "d9bb3a81-dd45-421f-a4ec-fd5831d3d6b6.webp",
  "il_fullxfull.7864685290_a50j.jpg",
  "il_fullxfull.7864685296_55z9.jpg",
  "il_fullxfull.7864685300_7l25.jpg",
  "il_fullxfull.7864685302_iebi.jpg",
  "il_fullxfull.7864685306_sefx.jpg",
  "il_fullxfull.7912637465_7d0t.jpg",
  "il_fullxfull.8007440646_ooc0.jpg",
  "il_fullxfull.8007460522_d3ji.jpg",
  "il_fullxfull.8007460526_h2kk.jpg",
  "il_fullxfull.8055354789_4miu.jpg",
  "il_fullxfull.8055354801_l7f2.jpg",
  "il_fullxfull.8055379169_ip8s.jpg",
  "il_fullxfull.8084724218_jxik.jpg",
  "il_fullxfull.8086800434_d5ag.jpg",
  "il_fullxfull.8086801196_rxih.jpg",
  "il_fullxfull.8132632741_4nw4.jpg",
  "il_fullxfull.8132632743_pkdt.jpg",
  "il_fullxfull.8132632747_knt0.jpg",
  "il_fullxfull.8134708393_5e02.jpg",
]);

export async function GET(_req, { params }) {
  const nom = decodeURIComponent(params.nom || "");
  if (!NOMS.has(nom)) return new Response("", { status: 404 });
  try {
    const r = await fetch(BASE + encodeURIComponent(nom), { cache: "no-store" });
    if (!r.ok) return new Response("", { status: 502 });
    return new Response(await r.arrayBuffer(), {
      headers: { "Content-Type": r.headers.get("content-type") || "application/octet-stream", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("", { status: 502 });
  }
}
