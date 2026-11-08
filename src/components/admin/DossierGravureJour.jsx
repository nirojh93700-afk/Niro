"use client";

// =============================================================================
// DOSSIER DE GRAVURE DU JOUR (page Atelier, 08/11/2026)
// Un bouton → un seul zip : un dossier par commande à préparer / en gravure (visuels capturés face / fond,
// images d'origine du site — SVG vectoriel quand il existe —, photos de la cliente, texte dans une autre
// langue en tracés, consignes.txt) + `gravure-du-jour.csv` (une ligne par face) + `LISEZ-MOI.txt`.
// Le plan vient de `src/lib/dossierGravure.js` ; ici on LIT chaque source dans le navigateur et on assemble
// le zip avec `zipStore` (le même que l'export Excel). Aucun appel qui écrit : lecture seule.
// =============================================================================
import { useState } from "react";
import { Ico } from "@/components/admin/AdminShell";
import { toast } from "@/components/admin/AdminToast";
import { zipStore } from "@/lib/exportClients";
import { planDossier, csvDuJour, lisezMoi, dateParis, commandesDuJour } from "@/lib/dossierGravure";

function loadImg(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("image illisible"));
    im.src = src;
  });
}
async function imagePng(src) {
  const im = await loadImg(src);
  const c = document.createElement("canvas");
  c.width = im.naturalWidth || 1000; c.height = im.naturalHeight || 1000;
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, "image/png"));
  if (!blob) throw new Error("conversion impossible");
  return new Uint8Array(await blob.arrayBuffer());
}
async function octets(url, headers) {
  const r = await fetch(url, { headers, cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
function telecharger(blob, nom) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/**
 * @param {{ orders: any[], sideConfig: Function, sidesOf: Function, adminKey?: string }} p
 */
export default function DossierGravureJour({ orders, sideConfig, sidesOf, adminKey = "" }) {
  const [etat, setEtat] = useState(null); // { fait, total }
  const nb = commandesDuJour(orders).length;

  async function construire() {
    if (!nb) { toast("Aucune commande à préparer ou en gravure : rien à mettre dans le dossier.", "info"); return; }
    const opts = { sideConfig, sidesOf };
    const plan = planDossier(orders, opts);
    const total = plan.reduce((s, d) => s + d.fichiers.length, 0);
    setEtat({ fait: 0, total });
    const fichiers = [];
    const manquants = [];
    let fait = 0;
    const headers = adminKey ? { "x-admin-key": adminKey } : {};
    for (const d of plan) {
      for (const f of d.fichiers) {
        const chemin = `${d.dossier}/${f.nom}`;
        try {
          if (f.kind === "texte") fichiers.push([chemin, f.contenu || ""]);
          else if (f.kind === "visuel") fichiers.push([chemin, await imagePng(f.src)]);
          else if (f.kind === "svgLangue") fichiers.push([chemin, await octets(f.url, headers)]);
          else {
            // Image d'origine ou photo : telle quelle (octets), sinon via le canvas (PNG).
            try { fichiers.push([chemin, await octets(f.src)]); }
            catch { fichiers.push([chemin, await imagePng(f.src)]); }
          }
        } catch (e) {
          manquants.push(`${chemin} (${String(e?.message || e).slice(0, 60)})`);
        }
        fait += 1;
        setEtat({ fait, total });
      }
    }
    const date = dateParis();
    fichiers.unshift(["gravure-du-jour.csv", csvDuJour(orders, opts)]);
    fichiers.unshift(["LISEZ-MOI.txt", lisezMoi(plan, { date, manquants })]);
    telecharger(zipStore(fichiers, "application/zip"), `gravure-du-jour-${date}.zip`);
    setEtat(null);
    toast(manquants.length ? `Dossier prêt : ${plan.length} commande${plan.length > 1 ? "s" : ""}, ${manquants.length} fichier${manquants.length > 1 ? "s" : ""} manquant${manquants.length > 1 ? "s" : ""} (listé${manquants.length > 1 ? "s" : ""} dans LISEZ-MOI.txt).` : `Dossier prêt : ${plan.length} commande${plan.length > 1 ? "s" : ""}, ${fichiers.length} fichiers.`, manquants.length ? "info" : "ok");
  }

  return (
    <button type="button" className="btn btn-gold" onClick={construire} disabled={Boolean(etat)} title="Un zip : un dossier par commande à préparer / en gravure + gravure-du-jour.csv"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Ico n="zip" />{etat ? ` Préparation… ${etat.fait}/${etat.total}` : ` Dossier de gravure du jour${nb ? ` (${nb})` : ""} · .zip`}
    </button>
  );
}
