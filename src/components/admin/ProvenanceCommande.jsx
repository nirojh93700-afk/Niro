"use client";

// Bloc « Provenance de la cliente » de la fiche commande (09/11/2026) : 1re visite, dernière visite
// venue d'ailleurs, nombre de visites, lien marqué. Ancienne commande = « non relevée ».
import { provenanceDe, sourceDe, detailVisite, lienMarqueTexte, nomPage, couleurSource } from "@/lib/provenance";
import { dateFr } from "@/lib/fileCommandes";

function Source({ s }) {
  const extra = detailVisite(s.visite);
  return <span className="fq-pill line pv-src" title="D'où vient la cliente"><i style={{ background: couleurSource(s.cle) }} />Venue de : <b>{s.nom}</b>{extra ? ` · ${extra}` : ""}</span>;
}
function Quand({ v }) {
  return <span className="pv-sub">{v.date ? dateFr(v.date) : "date non relevée"}{v.page ? <> · arrivée sur <b>{nomPage(v.page)}</b></> : null}{v.referrer ? <> · depuis {v.referrer}</> : null}</span>;
}

export default function ProvenanceCommande({ order }) {
  let p = null, premiere = null, derniere = null;
  try {
    p = provenanceDe(order);
    if (p) { premiere = sourceDe(order, "premiere"); derniere = p.derniere ? sourceDe(order, "derniere") : null; }
  } catch { p = null; }
  if (!p || !premiere) {
    return <div className="cb"><p className="pv-aide" style={{ margin: 0 }}><b>Non relevée.</b> Commande passée avant la mise en place du relevé, ou visiteuse qui bloque le suivi dans son navigateur.</p></div>;
  }
  const t0 = Date.parse(premiere.visite.date || ""), t1 = Date.parse(order.createdAt || "");
  const jours = t0 && t1 && t1 > t0 ? Math.floor((t1 - t0) / 86400000) : 0;
  const marque = lienMarqueTexte(derniere ? derniere.visite : premiere.visite) || lienMarqueTexte(premiere.visite);
  return (
    <div className="cb pv-box-in">
      <dl>
        <dt>Première visite</dt><dd><Source s={premiere} /><Quand v={premiere.visite} /></dd>
        {derniere ? <><dt>Revenue avant d&apos;acheter</dt><dd><Source s={derniere} /><Quand v={derniere.visite} /></dd></> : null}
        <dt>Achat</dt><dd><span className="pv-sub" style={{ margin: 0 }}>{order.createdAt ? `${dateFr(order.createdAt)} · ` : ""}<b>{p.visites} visite{p.visites > 1 ? "s" : ""}</b> en tout{jours > 0 ? <> · <b>{jours} jour{jours > 1 ? "s" : ""}</b> entre la 1<sup>re</sup> visite et l&apos;achat</> : null}</span></dd>
        {marque ? <><dt>Lien marqué</dt><dd><span className="pv-sub" style={{ margin: 0 }}><span className="mono">{marque}</span></span></dd></> : null}
      </dl>
      <p className="pv-aide"><b>Ce que le site ne peut pas savoir :</b> les mots tapés dans Google et le nom du compte Instagram ou TikTok qui a partagé le lien.</p>
    </div>
  );
}
