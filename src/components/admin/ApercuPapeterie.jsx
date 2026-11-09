"use client";

// APERÇU DE LA COMMANDE, TEL QUE LA CLIENTE L'A VU (09/11/2026, gérant : « sur le carnet je sais pas comment la cliente
// a choisi la gravure… je veux l'aperçu de la commande, comment le client a choisi, pour toutes les commandes »).
// Le carnet, les marque-pages et le gobelet n'enregistrent pas d'image : on REDESSINE ici la gravure avec le MÊME
// code que leur fiche (Gravure du carnet, Signet des marque-pages, GobeletPreview), à partir des réglages enregistrés.
// Marche donc aussi pour les commandes déjà passées.

import "@/app/marque-pages.css";
import "@/app/marque-pages-site.css";
import { Gravure } from "@/components/carnet/CarnetFiche";
import { Signet, itemsDe } from "@/components/marquePages/MarquePagesFiche";
import GobeletPreview from "@/components/GobeletPreview";
import { cnNormaliser, cnFaceGravee, CN_FACES } from "@/lib/carnet";
import { mpNormaliser } from "@/lib/marquePages";
import { gobeletElements } from "@/lib/gobeletParcours";
import { useEffect } from "react";
import { langueActive, textesEnLangue } from "@/lib/traductionGravure";
import { chargerPoliceLangue } from "@/lib/policeLangueClient";

// Gravure dans une autre langue (09/11/2026) : l'aperçu prend l'écriture de la langue, comme sur la fiche.
function useLangue(item) {
  const f = item?.fields || {};
  const code = langueActive(f) ? f.langue : "";
  const lettres = code ? textesEnLangue(f).map((t) => t.grave).join("") : "";
  useEffect(() => { if (code && lettres) chargerPoliceLangue(code, lettres + "0123456789."); }, [code, lettres]);
  return code;
}

export const aApercuPapeterie = (p) => Boolean(p?.carnet || p?.marquePages || p?.gobeletParcours);

const legende = { fontSize: "0.72rem", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#5a4d2c", margin: "0 0 4px" };
const note = { fontSize: "0.74rem", color: "#888", marginTop: 4 };

function Carnet({ item, p, largeur }) {
  const langue = useLangue(item);
  const norme = cnNormaliser(p, item.fields?.cn);
  const v = (p.variants || []).find((x) => x.id === item.variantId) || p.variants?.[0];
  if (!norme || !v) return <div style={note}>Aperçu impossible : réglages du carnet absents.</div>;
  const couleur = String(v.title || "").toLowerCase();
  const photo = (side) => (side === "dos" ? `/carnet/dos-${couleur}.jpg` : v.image);
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {CN_FACES.map(([side, nom]) => (
        <div key={side} style={{ width: largeur, maxWidth: "100%" }}>
          <div style={legende}>{nom} · {v.title}</div>
          <div className="gallery-main" style={{ width: "100%", boxShadow: "none", borderRadius: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo(side)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <Gravure v={norme.v} side={side} couleur={couleur} police={norme.police} langue={langue} />
          </div>
          {!cnFaceGravee(norme.v, side) ? <div style={note}>Rien à graver sur cette face.</div> : null}
        </div>
      ))}
    </div>
  );
}

function MarquePages({ item, p, H }) {
  const langue = useLangue(item);
  const norme = mpNormaliser(p, item.fields?.mp);
  if (!norme) return <div style={note}>Aperçu impossible : réglages des marque-pages absents.</div>;
  const modele = p.marquePages.modele;
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
      {norme.slots.map((s, i) => {
        const v = (p.variants || []).find((x) => x.id === s.c);
        const items = itemsDe(s.v, norme.police, langue);
        return (
          <div key={i}>
            <div style={legende}>{norme.slots.length > 1 ? `Marque-page ${i + 1} · ` : ""}{v?.title || ""}</div>
            <div className="mq-apw" style={{ justifyContent: "flex-start" }}>
              {["face", "dos"].map((side) => <Signet key={side} modele={modele} side={side} items={items} H={H} couleur={v?.title} />)}
            </div>
            {p.marquePages.gravure && !items.length ? <div style={note}>Sans gravure.</div> : null}
          </div>
        );
      })}
    </div>
  );
}

// Mêmes repères que ceux que la fiche a montrés à la cliente (GobeletParcours : face seulement).
function compositionGobelet(item) {
  if (item.composition?.motifs) return item.composition;
  const zoneAp = { milieu: "principal", haut: "haut", bas: "bas", gauche: "gauche", droite: "droite" };
  const motifs = [];
  for (const e of gobeletElements(item.fields || {})) {
    if (e.side !== "face") continue;
    if (e.kind === "dessin" || e.kind === "cadre") motifs.push({ zone: zoneAp[e.zone], num: e.num });
    else motifs.push({ zone: zoneAp[e.zone], text: e.kind === "photo" ? "Photo" : e.kind === "lettre" ? e.lettre : (e.texte || "T") });
  }
  return { motifs };
}

function Gobelet({ item, p }) {
  const v = (p.variants || []).find((x) => x.id === item.variantId) || p.variants?.[0];
  const autres = gobeletElements(item.fields || {}).filter((e) => e.side !== "face").length;
  return (
    <div style={{ width: 240, maxWidth: "100%" }}>
      <div style={legende}>Face du gobelet · {v?.title || ""}</div>
      <GobeletPreview image={v?.image || p.images?.[0]} composition={compositionGobelet(item)} />
      {autres ? <div style={note}>+ {autres} élément{autres > 1 ? "s" : ""} sur les côtés ou à placer : voir « À graver ».</div> : null}
    </div>
  );
}

export default function ApercuPapeterie({ item, p, papier = false }) {
  if (p?.carnet) return <Carnet item={item} p={p} largeur={papier ? 150 : 230} />;
  if (p?.marquePages) return <MarquePages item={item} p={p} H={papier ? 170 : 240} />;
  if (p?.gobeletParcours) return <Gobelet item={item} p={p} />;
  return null;
}
