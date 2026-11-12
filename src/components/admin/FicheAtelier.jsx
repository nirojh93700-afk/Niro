"use client";

// FICHE ATELIER : affiche, pour chaque article d'une commande, TOUS les réglages
// choisis par la cliente (emplacement, taille, position, textes, polices, motif,
// fond, options) + un visuel reconstruit du verre, pour graver à l'identique.

import { texteAvecDecor } from "@/lib/decorTexte";
import { langueActive } from "@/lib/traductionGravure";
import { classeLangue } from "@/lib/policeLangueClient";
import ImagesOrigine from "@/components/admin/ImagesOrigine";
import { getProductBySlug } from "@/lib/products";
import { MODELES, layoutLabel } from "@/lib/modeles";
import { getFontLabel, getFontClass } from "@/lib/fonts";
import { MOTIF_LIST } from "@/components/Motif";
import ModeleArt from "@/components/ModeleArt";
import PhotosEmail from "@/components/admin/PhotosEmail";
import ImagesEchangees from "@/components/admin/ImagesEchangees";
import MessagesEmail from "@/components/admin/MessagesEmail";
import { eclaterParVerre } from "@/lib/orderSpec";
import { TableGravure, policeDeGravure } from "@/lib/engravingSheet";
import FicheDevis from "@/components/admin/FicheDevis";
import OptionsVendues from "@/components/admin/OptionsVendues";
import { positionTexteCristal, LIBELLE_POSITION } from "@/lib/cristalTexte";
import VarBadge from "@/components/admin/VarBadge";
import ApercuClient from "@/components/admin/ApercuClient";
import Apercu3DCommande, { a3D } from "@/components/admin/Apercu3DCommande";
import ApercuPapeterie, { aApercuPapeterie } from "@/components/admin/ApercuPapeterie";
import { aEmplacement, cotesDeLArticle, photosEnvoyees } from "@/lib/apercuCote";
import { lienCorriger, creationDe } from "@/lib/creationOutil";
import PiecesCreation from "@/components/admin/PiecesCreation";

// Lignes de texte gravées (verres à message), reconstruites depuis les réglages.
function textLinesOf(item, product) {
  const fields = item.fields || {};
  const lines = (product?.personalizationFields || [])
    .filter((f) => (f.type === "text" || f.type === "textarea" || !f.type) && !f.noPreview)
    .flatMap((f) => String(fields[f.key] || "").split("\n").map((s) => s.trim()).filter(Boolean).map((s, i) => (i === 0 ? texteAvecDecor(f.key, s, fields) : s)));
  const fontField = (product?.personalizationFields || []).find((f) => f.type === "font");
  const fontKey = fontField ? fields[fontField.key] : null;
  // Texte dans une autre langue (07/11/2026) : son écriture Noto.
  const cl = langueActive(fields) ? classeLangue(fields.langue) : "";
  return { lines, fontClass: cl || getFontClass(fontKey || "playfair") };
}

const motifLabel = (id) => (MOTIF_LIST.find((m) => m.id === id) || {}).label || id;

// Cristal photo : le même aperçu que celui vu par la cliente (bloc de verre, photo,
// texte à la place choisie), pour graver à l'identique. Mêmes classes que la fiche
// produit (.crystal-hero), posées dans un cadre carré de 300 px comme GlassPreview.
function CristalPreview({ item, p }) {
  const W = 300;
  const txt = textLinesOf(item, p);
  const pos = positionTexteCristal(item);
  return (
    <div className="gallery-main" style={{ width: W, maxWidth: "100%", borderRadius: 10, boxShadow: "none" }}>
      <div className="crystal-hero">
        <div className="ch-wrap">
          <div className={`ch-block${p?.crystalShape ? " ch-" + p.crystalShape : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.photoSrc && <img className="ch-photo" src={item.photoSrc} alt="" />}
            {txt.lines.length > 0 && (
              <div className="ch-text" style={{ left: pos.x + "%", top: pos.y + "%", fontSize: `calc(1.1rem * ${pos.scale})` }}>
                {txt.lines.map((l, i) => (
                  <span key={i} className={txt.fontClass}>{l}</span>
                ))}
              </div>
            )}
            <span className="ch-shine" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlassPreview({ item, papier = false }) {
  const p = getProductBySlug(item.slug);
  // Carnet, marque-pages, gobelet : la gravure redessinée comme sur leur fiche (09/11/2026).
  if (aApercuPapeterie(p)) return <ApercuPapeterie item={item} p={p} papier={papier} />;
  // Bijou à aperçu 3D : à l'écran, le MÊME aperçu 3D que la cliente a vu (05/11/2026, 0BHBVOXK).
  // Sur papier, la photo d'avant (un dessin 3D ne s'imprime pas).
  if (!papier && a3D(p)) return <Apercu3DCommande item={item} />;
  if (p?.crystal3d && (item.photoSrc || textLinesOf(item, p).lines.length)) return <CristalPreview item={item} p={p} />;
  // Verre face / fond / les deux (whisky, cocktail) : chaque côté tel que la cliente l'a vu.
  if (aEmplacement(p) && !item.modele) {
    const cotes = cotesDeLArticle(item);
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: "100%" }}>
        {cotes.map((side) => <ApercuClient key={side} item={item} side={side} largeur={cotes.length > 1 ? 220 : 300} />)}
      </div>
    );
  }
  // L'image enregistrée à l'ajout au panier = exactement ce que la cliente a vu (photo du produit + sa gravure) :
  // on la montre telle quelle (09/11/2026). Sauf un modèle d'avant le 05/11/2026 (0SJAY2KK : mauvais modèle capturé).
  const capture = typeof item.previewImage === "string" && /^(\/|https?:|data:image)/.test(item.previewImage) && item.previewImage !== item.photoSrc && !(item.modele && !item.designCapture);
  if (capture) {
    return (
      <div style={{ width: 300, maxWidth: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewImage} alt="Aperçu vu par la cliente" style={{ width: "100%", display: "block", borderRadius: 10, border: "1px solid #e7d9bd" }} />
        {item.previewImageFond ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewImageFond} alt="Aperçu du fond" style={{ width: "100%", display: "block", borderRadius: 10, border: "1px solid #e7d9bd", marginTop: 8 }} />
        ) : null}
        <div style={{ fontSize: "0.74rem", color: "#888", marginTop: 4 }}>Image enregistrée au moment de la commande.</div>
      </div>
    );
  }
  const isFond = item.emplacement === "fond";
  // Cristaux : on grave dans un cristal VIERGE (image « bloc »), jamais sur la
  // photo d'exemple déjà gravée (sinon la photo cliente se pose sur une gravure).
  const blockImg = p?.crystal3d ? (p?.images || []).find((i) => /bloc/.test(i)) : null;
  // Verre à vin 36 / 47 cl : la variante commandée porte sa propre photo vierge.
  // Bijou en plusieurs couleurs : la photo de la COULEUR commandée (Argenté, Or rose…),
  // jamais la 1re photo du produit (27/10/2026 : médaillon argenté montré en doré).
  const v = (p?.variants || []).find((x) => x.id === item.variantId);
  const img = blockImg || (isFond ? p?.fondImage : (v?.engraveImage || v?.image || p?.engraveImage)) || p?.images?.[0];
  if (!img) return null;
  const W = 300;
  const lay = item.layout?.modele || item.layout?.photo || item.layout?.text;
  const cx = lay?.cx ?? 0.5;
  const cy = lay?.cy ?? 0.45;
  const scale = lay?.scale ?? 0.1;
  const color = "#3a2f1d"; // fond du verre désormais clair → gravure foncée
  const txt = !item.modele && !item.photoSrc ? textLinesOf(item, p) : null;
  // Le texte ne déborde jamais de l'image (03/11/2026, fiche 1PCACXUM : « Mamy eveux 27/10/26 mon étoile »
  // sortait du bracelet) : la taille est réduite pour que la ligne la plus longue tienne dans 84 % de la largeur
  // (une lettre ≈ 0,6 de sa hauteur). Le texte complet reste dans le tableau « À graver ».
  const plusLongue = txt ? Math.max(1, ...txt.lines.map((l) => String(l).length)) : 1;
  const tailleTexte = Math.max(7, Math.min(scale * W, (W * 0.84) / (0.6 * plusLongue)));

  return (
    <div style={{ position: "relative", width: W, maxWidth: "100%", borderRadius: 10, overflow: "hidden", background: "#111" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" style={{ width: "100%", display: "block" }} />
      <div style={{ position: "absolute", left: `${cx * 100}%`, top: `${cy * 100}%`, transform: "translate(-50%,-50%)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
        {item.modele ? (
          <ModeleArt template={item.modeleTemplate} value={item.modele} color={color} base={Math.max(10, scale * W)} />
        ) : item.photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoSrc} alt="" style={{ width: scale * W * 2, filter: "grayscale(1) contrast(1.4)", opacity: 0.9 }} />
        ) : txt && txt.lines.length ? (
          txt.lines.map((line, i) => (
            <span key={i} className={txt.fontClass} style={{ color, fontSize: tailleTexte, whiteSpace: "nowrap" }}>{line}</span>
          ))
        ) : null}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: "0.85rem" }}>
      <span style={{ minWidth: 130, color: "#777", flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

/** Les réglages d'un article, SANS le visuel ni les boutons.
 *  Exporté pour que la fiche papier (FichePapier) puisse les placer dans sa
 *  propre mise en page A4, au lieu de réimprimer la version écran. */
export function ReglagesItem({ item, titre = true, police = true }) {
  if (!item) return null;
  const mv = item.modele;
  const tpl = item.modeleTemplate ? MODELES[item.modeleTemplate] : null;
  const layout = mv?.layout || tpl?.layout || tpl?.style || "stack";
  const lay = item.layout?.modele || item.layout?.photo || item.layout?.text;
  const pCrist = getProductBySlug(item.slug);
  const crist = pCrist?.crystal3d && String(item.fields?.texte || "").trim() ? positionTexteCristal(item) : null;
  // Police à graver, toujours dite (Playfair si la cliente a laissé celle proposée).
  const pol = police && !mv ? policeDeGravure(item) : null;
  return (
    <>
      {titre && (
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          {item.name}<VarBadge texte={item.variantDetail || item.variantTitle} grand />
        </div>
      )}
      <Row k="Emplacement" v={item.emplacement === "fond" ? "Au fond du verre" : "Face avant"} />
      {item.deuxEmplacement && <Row k="2e gravure" v="OUI (+7 €) — graver aussi au 2e endroit" />}
      {mv && tpl && (
        <>
          <Row k="Modèle" v={`${tpl.label} — style ${layoutLabel(tpl, layout)}`} />
          {tpl.lines.map((l) => {
            if (l.below && mv.addText === false) return null;
            const t = (mv.text?.[l.key] || "").trim();
            if (!t) return null;
            return <Row key={l.key} k={l.below ? "Texte ajouté" : l.label} v={`« ${t} »  ·  ${getFontLabel((mv.fonts || {})[l.key] || l.font)}`} />;
          })}
          {layout === "badge" && <Row k="Fond du badge" v={mv.bg === "plein" ? "Plein" : "Sans fond (au trait)"} />}
          {(layout === "classic" || layout === "stack") && mv.motif && mv.motif !== "aucun" && <Row k="Motif" v={motifLabel(mv.motif)} />}
        </>
      )}
      {pol && <Row k="Police" v={pol.defaut ? `${pol.label} (proposée, non changée par la cliente)` : pol.label} />}
      {item.photoSrc && !mv && <Row k="Logo / photo" v="fournie par la cliente (voir visuel)" />}
      {lay?.label && <Row k="Taille / position" v={lay.label} />}
      {crist && (
        <>
          <Row k="Place du texte" v={`${LIBELLE_POSITION[crist.region] || "au milieu"}${item.layout?.crystalText?.label && !crist.conflit ? ` (${item.layout.crystalText.label})` : ""}`} />
          {crist.conflit && (
            <div style={{ margin: "4px 0", padding: "6px 9px", borderRadius: 7, background: "#fff3e0", border: "1px solid #f0c27a", color: "#7a4a00", fontSize: "0.82rem", fontWeight: 600 }}>
              ⚠️ Elle a choisi « {LIBELLE_POSITION[crist.conflit.menu]} » dans le menu, mais son aperçu montrait le texte {LIBELLE_POSITION[crist.conflit.apercu] || "au milieu"}. L'aperçu ci-contre suit son choix du menu ({LIBELLE_POSITION[crist.conflit.menu]}).
            </div>
          )}
        </>
      )}
      {item.personalization && <Row k="Résumé" v={item.personalization} />}
    </>
  );
}

// Visuel + réglages + photo d'UN article (ou d'UN verre d'un lot « chacun différent »).
function SheetCorps({ item, titre = true }) {
  const enLot = Boolean(item.verre);
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <GlassPreview item={item} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <ReglagesItem item={item} titre={titre} />
        {/* Dans un lot, chaque verre a ses propres textes : on les met en clair
            (le « Résumé » seul ne suffit pas à lire quatre gravures différentes). */}
        {enLot ? <div style={{ margin: "6px 0" }}><TableGravure item={item} titre={false} /></div> : null}
        {photosEnvoyees(item).map((ph) => (
          <div key={ph.src} style={{ margin: "8px 0" }}>
            <a href={ph.src} download target="_blank" rel="noreferrer" className="btn btn-gold" style={{ padding: "7px 14px", fontSize: "0.82rem", display: "inline-block", textDecoration: "none" }}>
              ⬇ Télécharger la photo{enLot ? ` du verre ${item.verre}` : " du client"}{ph.titre.includes("—") ? ` (${ph.titre.split("— ")[1]})` : ""}
            </a>
          </div>
        ))}
        <ImagesOrigine item={item} compact />
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#888" }}>Tous les réglages (brut)</summary>
          <pre style={{ fontSize: "0.72rem", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#faf7f1", padding: 8, borderRadius: 6, marginTop: 6 }}>
            {JSON.stringify({ ...item, personalization: undefined }, null, 1)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function ItemSheet({ item }) {
  if (!item) return null;
  // Lot « chacun différent » : un encart PAR VERRE, avec SA photo et SES textes
  // (incident #1LTYHZ6D : 4 photos différentes, une seule affichée).
  const verres = eclaterParVerre(item);
  if (verres.length > 1) {
    return (
      <div style={{ padding: "12px 0", borderTop: "1px dashed #ddd" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          {item.name}<VarBadge texte={item.variantDetail || item.variantTitle} grand />
        </div>
        <div style={{ margin: "0 0 8px", padding: "8px 12px", background: "#fdecec", border: "2px solid #d64545", borderRadius: 8, color: "#b32b2b", fontWeight: 700, fontSize: "0.9rem" }}>
          ⚠️ Lot de {verres.length} verres, CHACUN DIFFÉRENT : {verres.length} photos et {verres.length} textes à graver — un verre = une gravure. Ne pas graver la même chose sur les {verres.length}.
        </div>
        {verres.map((v) => (
          <div key={v.verre} style={{ border: "1px solid #e7d3a1", borderRadius: 10, padding: 10, margin: "8px 0", background: "#fffdf8" }}>
            <div style={{ fontWeight: 800, color: "var(--gold-dark, #a98935)", marginBottom: 6, fontSize: "1rem" }}>Verre {v.verre} / {v.verres}</div>
            <SheetCorps item={v} titre={false} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ padding: "12px 0", borderTop: "1px dashed #ddd" }}>
      <SheetCorps item={item} />
    </div>
  );
}

export default function FicheAtelier({ spec, order, adminKey, print = false }) {
  const items = Array.isArray(spec) ? spec.filter(Boolean) : spec ? [spec] : [];
  // Commande sur devis (ou sans réglages enregistrés) : la demande écrite du
  // devis + la photo que la cliente a envoyée par e-mail (lue dans Gmail).
  if (!items.length && order) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", marginTop: 8 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>🛠️ Fiche atelier — à graver à l&apos;identique</div>
        <OptionsVendues order={order} />
        {order.demande && !print ? (
          <p style={{ margin: "4px 0 8px", padding: "8px 10px", background: "#eef4fb", border: "1px solid #c9dcef", borderRadius: 8, fontSize: "0.88rem" }}>
            <strong>📋 {order.quoteNumber ? `Devis ${order.quoteNumber} — ` : ""}ce que la cliente a demandé :</strong><br />{order.demande}
          </p>
        ) : null}
        {order.quoteEmballage ? <p style={{ margin: "0 0 8px", fontSize: "0.88rem" }}><strong>📦 Emballage du devis :</strong> {order.quoteEmballage}</p> : null}
        {/* Dernière image échangée (aperçu validé / image reçue par le site), en grand (08/11/2026). */}
        <ImagesEchangees order={order} print={print} />
        {/* Une carte par pièce du devis : quantité, texte, style, fichier à graver. */}
        <FicheDevis order={order} />
        <MessagesEmail email={order.customerEmail} depuis={order.createdAt} adminKey={adminKey} print={print} />
        <PhotosEmail email={order.customerEmail} adminKey={adminKey} print={print} />
      </div>
    );
  }
  if (!items.length) {
    return <p style={{ fontSize: "0.85rem", color: "#999", padding: "8px 0" }}>Aucun réglage détaillé enregistré pour cette commande (commande passée avant la mise en place de la fiche atelier).</p>;
  }
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>🛠️ Fiche atelier — à graver à l'identique</div>
      {/* Tout ce qui est vendu AVEC les pièces (emballage, coffret, socle, date, lot…),
          en clair et en tête — demande du gérant du 02/10/2026. */}
      {order ? <OptionsVendues order={order} /> : null}
      {Array.isArray(order?.alerteImage) && order.alerteImage.length ? (
        <div style={{ background: "#fdecec", border: "2px solid #d64545", borderRadius: 8, padding: "8px 12px", margin: "6px 0 10px", fontSize: "0.88rem" }}>
          <strong style={{ color: "#b32b2b" }}>⚠️ Date dans l&apos;image — à regarder avant de graver</strong>
          {order.alerteImage.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      ) : null}
      {/* Une image échangée APRÈS la commande (autre version envoyée par « Répondre », aperçu validé) prime sur celle du site (08/11/2026). */}
      <ImagesEchangees order={order} print={print} compact />
      {items.map((it, i) => {
        // Produit créé avec un outil (support de téléphone, arbre de vie, décoration) : le bouton ouvre la création de la cliente
        // dans le même outil, pour la corriger et fabriquer les fichiers de la machine (12/11/2026). Jamais sur le papier.
        const corriger = print ? null : lienCorriger(it, order);
        return (
          <div key={i}>
            <ItemSheet item={it} />
            {creationDe(it) ? <PiecesCreation id={creationDe(it).id} papier={!!print} /> : null}
            {corriger ? (
              <div style={{ margin: "0 0 10px", padding: "10px 12px", border: "1.5px solid #c9a24b", borderRadius: 10, background: "#fffaf0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <a className="fq-btn sm primary" href={corriger}>✎ Corriger dans l&apos;outil</a>
                <a className="fq-btn sm" href={`${corriger}&fichiers=1`}>⬇ Fichiers pour la machine</a>
                <span style={{ fontSize: "0.82rem", color: "#6b5d4a", flex: "1 1 200px", minWidth: 0, lineHeight: 1.4 }}>« Corriger » ouvre la création dans l'éditeur (texte, écriture, place et taille en millimètres). « Fichiers » refabrique les fichiers de la version gardée, à retélécharger quand vous voulez.</span>
              </div>
            ) : null}
          </div>
        );
      })}
      {/* Devis payé AVEC d'autres articles du site (02/11/2026) : la demande du devis aussi. */}
      {order?.surMesure ? (
        <div style={{ marginTop: 10 }}>
          {order.demande && !print ? (
            <p style={{ margin: "4px 0 8px", padding: "8px 10px", background: "#eef4fb", border: "1px solid #c9dcef", borderRadius: 8, fontSize: "0.88rem" }}>
              <strong>📋 {order.quoteNumber ? `Devis ${order.quoteNumber} — ` : ""}ce que la cliente a demandé :</strong><br />{order.demande}
            </p>
          ) : null}
          {order.quoteEmballage ? <p style={{ margin: "0 0 8px", fontSize: "0.88rem" }}><strong>📦 Emballage du devis :</strong> {order.quoteEmballage}</p> : null}
          <FicheDevis order={order} />
        </div>
      ) : null}
      {/* Une cliente peut renvoyer sa photo PAR E-MAIL après la commande (autre
         version, autre langue…) : on la montre ici aussi, sinon l'atelier
         grave la version du site sans le savoir (Rose Catarino #1Z17IKQ8,
         version portugaise reçue le 15/09 — remarque du gérant, 24/09/2026). */}
      {order?.customerEmail ? (
        <MessagesEmail email={order.customerEmail} depuis={order.createdAt} adminKey={adminKey} print={print} />
      ) : null}
      {order?.customerEmail ? (
        <PhotosEmail email={order.customerEmail} adminKey={adminKey} print={print} masquerSiVide
          titre="📎 Photo(s) renvoyée(s) par e-mail — à comparer avec celle de la commande : la plus récente est la bonne" />
      ) : null}
    </div>
  );
}
