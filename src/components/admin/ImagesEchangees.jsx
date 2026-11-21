// Dernière image échangée avec la cliente, EN GRAND, dans la fiche atelier (08/11/2026, commande 1COCUCLN,
// gérant : « pourquoi y a pas l'image qu'elle demande, même si c'est un devis on a échangé par mail, je veux les
// dernières images qu'ils ont validées dans les commandes »). Source : `order.imagesEchangees` (fil + dossier du
// site, la plus récente en premier, calculé par /api/admin/orders). La plus récente = l'aperçu validé ou la
// dernière image reçue ; les précédentes restent en vignettes pour comparer. Rien si aucune image.
const date = (v) => { const d = new Date(Number(v) || 0); return Number.isNaN(d.getTime()) || !v ? "" : d.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }); };
const DE = { atelier: "envoyée par l'atelier", cliente: "envoyée par la cliente" };
// Téléchargement du FICHIER D'ORIGINE, tel que reçu, sans aucune retouche (21/11/2026, gérant : « dans la commande,
// il faut que j'aie l'image du client sans rien changer, pour télécharger »). /api/img/<id>?dl= = les mêmes octets.
const lienDl = (src, nom) => (/^\/api\/img\/[A-Za-z0-9_-]+$/.test(String(src)) ? `${src}?dl=${encodeURIComponent(nom)}` : src);
const BTN = { display: "inline-block", marginTop: 6, padding: "6px 12px", borderRadius: 999, background: "#1d170b", color: "#f3e8d3", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" };

export default function ImagesEchangees({ order, print = false, compact = false }) {
  const images = Array.isArray(order?.imagesEchangees) ? order.imagesEchangees : [];
  const nom = (x, i) => `image-${order?.ref || "commande"}-${x.de === "atelier" ? "atelier" : "cliente"}-${i + 1}`;
  if (!images.length) return null;
  const [derniere, ...autres] = images;
  const grand = print ? 220 : compact ? 200 : 320;
  const petit = print ? 56 : 72;
  return (
    <div className="img-ech" style={{ margin: "8px 0 10px", padding: "10px 12px", border: "2px solid var(--gold, #c9a24b)", borderRadius: 10, background: "#fffdf8" }}>
      <div style={{ fontWeight: 800, color: "var(--gold-dark, #a98935)", fontSize: "0.92rem", marginBottom: 6 }}>
        🖼️ Dernière image de l&apos;échange — {DE[derniere.de] || "échangée"}{derniere.at ? ` le ${date(derniere.at)}` : ""}
      </div>
      <a href={derniere.src} target="_blank" rel="noreferrer" title={derniere.subject || "Voir en grand"} style={{ display: "inline-block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={derniere.src} alt={derniere.subject || "Dernière image échangée"} style={{ display: "block", maxWidth: "100%", width: grand, height: "auto", borderRadius: 8, border: "1px solid #e6d7b8", background: "#fff" }} />
      </a>
      {!print ? <div><a href={lienDl(derniere.src, nom(derniere, 0))} download style={BTN}>⬇ Télécharger l&apos;image d&apos;origine</a></div> : null}
      {derniere.subject ? <div style={{ fontSize: "0.8rem", color: "#6b5d48", marginTop: 4 }}>{derniere.subject}</div> : null}
      <div style={{ fontSize: "0.8rem", color: "#6b5d48", marginTop: 2 }}>
        C&apos;est la plus récente des images échangées (aperçu envoyé, image reçue par le formulaire ou le bouton « Répondre ») : à comparer avec le devis avant de graver.
      </div>
      {autres.length && !print ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: "0.78rem", color: "#8a7a56", marginBottom: 4 }}>Les précédentes ({autres.length}) · toucher pour voir en grand</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {autres.map((x, i) => (
              <div key={x.src} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <a href={x.src} target="_blank" rel="noreferrer" title={`${DE[x.de] || ""}${x.at ? ` · ${date(x.at)}` : ""}${x.subject ? ` · ${x.subject}` : ""}`} style={{ textDecoration: "none", color: "#8a7a56", fontSize: "0.7rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.src} alt="" loading="lazy" style={{ width: petit, height: petit, objectFit: "cover", borderRadius: 8, border: "1px solid #e6d7b8", background: "#f3e8d3", display: "block" }} />
                <span>{x.de === "atelier" ? "atelier" : "cliente"} · {date(x.at).split(" ").slice(0, 2).join(" ")}</span>
              </a>
              <a href={lienDl(x.src, nom(x, i + 1))} download style={{ fontSize: "0.72rem", color: "#a98935", fontWeight: 700, textDecoration: "none" }}>⬇ Télécharger</a>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
