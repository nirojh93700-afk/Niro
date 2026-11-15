// Rangement du fichier d'origine d'une facture (15/11/2026) : Firebase Storage + empreinte sha256.
// Utilisé par le classeur et par Achats & factures (le fichier lu est gardé avec l'achat).
import nodeCrypto from "crypto";
import { saveFactureFile } from "@/lib/stock";
import { FORMATS_FACTURE, TAILLE_MAX_FACTURE } from "@/lib/classeurFactures";

const txt = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// Utilisée aussi par Achats & factures (le fichier lu est gardé avec l'achat).
export async function rangerFichierFacture(fichier) {
  if (!fichier?.data) return null;
  const type = String(fichier.type || "").toLowerCase();
  if (!FORMATS_FACTURE.test(type)) return { error: "Format non pris en charge : PDF ou photo (JPG, PNG, WebP, HEIC)." };
  const buf = Buffer.from(String(fichier.data).replace(/^data:[^;]+;base64,/, ""), "base64");
  if (buf.length > TAILLE_MAX_FACTURE) return { error: "Fichier trop lourd (12 Mo au plus)." };
  const id = await saveFactureFile(buf, type);
  if (!id) return { error: "Le stockage des fichiers ne répond pas : réessayez." };
  return { id, nom: txt(fichier.name, 120) || "facture", type, taille: buf.length, sha: nodeCrypto.createHash("sha256").update(buf).digest("hex") };
}

