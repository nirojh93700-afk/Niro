// Vignettes des photos jointes à un message de cliente (01/11/2026).
// Toucher une vignette ouvre la photo en grand (nouvel onglet). Affiché dans
// Gestion (dossier, fil de commande) et sur la page « Réponse à valider ».
import { nettoyerPhotos, urlPhoto } from "@/lib/photosMessage";

export default function PhotosMessage({ photos, taille = 88 }) {
  const ids = nettoyerPhotos(photos);
  if (!ids.length) return null;
  return (
    <div style={{ margin: "8px 0 2px" }}>
      <div style={{ fontSize: 12.5, color: "#8a7a56", marginBottom: 6 }}>📷 {ids.length} photo{ids.length > 1 ? "s" : ""} jointe{ids.length > 1 ? "s" : ""} · toucher pour voir en grand</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ids.map((id, i) => (
          <a key={id} href={urlPhoto(id)} target="_blank" rel="noreferrer" title={`Photo ${i + 1}`}
            style={{ display: "block", width: taille, height: taille, borderRadius: 10, overflow: "hidden", border: "1px solid #e6d7b8", background: "#f3e8d3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPhoto(id)} alt={`Photo ${i + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </a>
        ))}
      </div>
    </div>
  );
}
