import { firebaseReady, storeCustomerUpload } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Reçoit une photo (data URL) envoyée par le client pour la gravure,
// la stocke dans la base (collection siteUploads) et renvoie une référence.
export async function POST(req) {
  if (!firebaseReady()) {
    return Response.json({ error: "Upload non configuré." }, { status: 503 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const dataUrl = body?.dataUrl;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return Response.json({ error: "Image invalide." }, { status: 400 });
  }
  // Limite ~5 Mo (base64)
  if (dataUrl.length > 7_000_000) {
    return Response.json({ error: "Image trop lourde (5 Mo max)." }, { status: 400 });
  }
  const id = await storeCustomerUpload(dataUrl, {
    productSlug: body.productSlug || "",
  });
  if (!id) return Response.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  return Response.json({ ok: true, ref: id });
}
