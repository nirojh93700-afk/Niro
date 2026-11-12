"use client";

// =============================================================================
// GESTION → TESTS → FICHIERS LASER À ESSAYER (12/11/2026)
// Gérant : « fais une catégorie test dans admin… envoie-moi des tests pour que j'essaie sur la machine si ça fonctionne,
// les découpes, la gravure, pour les trois maquettes ; tu mets pas en ligne ». Les fichiers sont fabriqués à partir des trois
// maquettes (support de téléphone, arbre de vie, décoration à suspendre) par tools/maquettes/fichiers-laser-test.cjs :
// taille réelle en mm, rouge = découpe, noir = gravure (textes déjà en tracés). Rien n'est vendu sur le site.
// =============================================================================
import PageHead from "@/components/admin/PageHead";
import TESTS from "@/lib/testsLaser.json";

function mm(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }

export default function TestsLaserPage() {
  const nb = TESTS.groupes.reduce((n, g) => n + g.fichiers.length, 0);
  return (
    <div>
      <PageHead
        eyebrow="Tests"
        title="Fichiers laser à essayer"
        subtitle="Les trois maquettes (support de téléphone, arbre de vie, décoration à suspendre) transformées en vrais fichiers pour la machine. À essayer sur des chutes avant de vendre quoi que ce soit : rien n'est en vente sur le site."
        kpis={[{ label: "Essais", value: TESTS.groupes.length }, { label: "Fichiers", value: nb }, { label: "Préparés le", value: "12/11/2026" }]}
      />

      <div className="fq-card" style={{ marginTop: 12, borderLeftColor: "var(--ash-gold, #c9a24b)" }}>
        <strong style={{ fontSize: 14 }}>Comment les essayer</strong>
        <ol style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "var(--ash-ink, #2b2216)" }}>
          <li>Téléchargez le fichier (bouton « Télécharger »), puis ouvrez-le dans le logiciel du laser (xTool Creative Space : Importer).</li>
          <li>Vérifiez la taille : elle est déjà en millimètres, à l'échelle 100 %. Ne la changez pas.</li>
          <li><b style={{ color: "#d0021b" }}>Rouge = découpe</b> (traits fins) · <b>noir = gravure</b> (zones pleines). Réglez chaque couleur comme d'habitude pour du contreplaqué 3 mm ou de l'acrylique 3 mm.</li>
          <li>Les textes sont déjà en tracés : aucune police à installer.</li>
          <li>Dites-moi ce qui marche et ce qui ne marche pas (taille, découpe, gravure, assemblage) : je corrige avant la mise en vente.</li>
        </ol>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", marginTop: 14 }}>
        {TESTS.groupes.map((g) => (
          <section key={g.id} className="fq-card" style={{ gap: 10 }}>
            <img src={g.apercu} alt={`Aperçu : ${g.titre}`} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10, background: "#f4ece0" }} />
            <div>
              <strong style={{ fontSize: 15 }}>{g.titre}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--ash-muted, #7a6d58)", lineHeight: 1.45 }}>{g.sous}</p>
            </div>
            {g.fichiers.map((f) => (
              <div key={f.nom} style={{ border: "1px solid var(--ash-line, #e7dcc8)", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="fq-pill">{f.matiere}</span>
                  <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{mm(f.w)} × {mm(f.h)} mm</span>
                  <span style={{ fontSize: 12, color: "var(--ash-muted, #7a6d58)" }}>{f.gravure ? "découpe + gravure" : "découpe seule"}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{f.titre}</div>
                {f.note ? <div style={{ fontSize: 12.5, color: "var(--ash-muted, #7a6d58)", lineHeight: 1.4 }}>{f.note}</div> : null}
                <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5, color: "var(--ash-muted, #7a6d58)", overflowWrap: "anywhere" }}>{f.nom}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="fq-btn sm" href={f.url} download={f.nom}>Télécharger</a>
                  <a className="fq-btn sm ghost" href={f.url} target="_blank" rel="noreferrer">Voir le fichier</a>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
