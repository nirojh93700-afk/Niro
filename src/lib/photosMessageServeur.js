// Côté serveur seulement : relit les photos jointes pour que l'agent les REGARDE
// avant de préparer sa réponse (même format que les pièces jointes Gmail).
import { getCustomerUpload } from "@/lib/firebase";
import { nettoyerPhotos } from "@/lib/photosMessage";

export async function imagesPourAgent(ids) {
  const out = [];
  for (const id of nettoyerPhotos(ids)) {
    try {
      const d = await getCustomerUpload(id);
      const m = String(d || "").match(/^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,(.+)$/s);
      if (!m || m[2].length > 4.8 * 1024 * 1024) continue;
      out.push({ mimeType: m[1].replace("image/jpg", "image/jpeg"), data: m[2] });
    } catch { /* photo illisible : l'agent travaille sans */ }
  }
  return out;
}
