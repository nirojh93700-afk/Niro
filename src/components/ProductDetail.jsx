"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { formatEuro, roundTo90 } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import { getProductInfo } from "@/lib/productInfo";
import { engravingExtra } from "@/lib/engravingPrice";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import PhotoUpload, { CLOUDINARY_READY } from "./PhotoUpload";
import Engrave3D from "./Engrave3D";
import EngraveHeart3D from "./EngraveHeart3D";
import EngraveBook3D from "./EngraveBook3D";
import EngraveEnvelope3D from "./EngraveEnvelope3D";
import EngravePlate3D from "./EngravePlate3D";
import EngraveGourmette3D from "./EngraveGourmette3D";
import Model3D from "./Model3D";
import MotifPicker from "./MotifPicker";
import LetteringPicker from "./LetteringPicker";
import DesignAssistant from "./DesignAssistant";
import BadgeDesigner from "./BadgeDesigner";
import ModeleDesigner from "./ModeleDesigner";
import ModeleEngraveLayer from "./ModeleEngraveLayer";
import MotifEngraveLayer from "./MotifEngraveLayer";
import { Motif } from "./Motif";
import { MODELES, defaultModele, layoutLabel, imageDesign } from "@/lib/modeles";
import { MOTIF_LIST } from "./Motif";
import PhotoEngraveLayer from "./PhotoEngraveLayer";
import TextEngraveLayer from "./TextEngraveLayer";
import Glass3D from "./Glass3D";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [personalization, setPersonalization] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [preparing, setPreparing] = useState(false); // capture du visuel en cours
  const [error, setError] = useState("");
  const [photoLayout, setPhotoLayout] = useState(null); // taille/position du logo gravé (face)
  const [textLayout, setTextLayout] = useState(null); // taille/position du texte gravé (face)
  const [photoLayoutFond, setPhotoLayoutFond] = useState(null); // idem côté fond (mode "les deux")
  const [textLayoutFond, setTextLayoutFond] = useState(null);
  const [activeSide, setActiveSide] = useState("face"); // côté en cours de réglage (mode "les deux")
  const [motifLayoutFond, setMotifLayoutFond] = useState(null); // placement du dessin au fond
  const [modeleLayout, setModeleLayout] = useState(null); // taille/position d'un modèle de gravure
  const [show3d, setShow3d] = useState(false); // aperçu 3D du verre (rotatif)

  const [stockMap, setStockMap] = useState({});
  const [images, setImages] = useState(product.images);
  const [promos, setPromos] = useState({});
  const [isWide, setIsWide] = useState(true); // ordinateur vs mobile (pour la place du 3D)
  const [showMini, setShowMini] = useState(false); // mini 3D flottant (mobile)
  const photoRef = useRef(null);
  const big3dRef = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const upd = () => setIsWide(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  // Mobile : le mini 3D flottant apparaît quand la photo est sortie de l'écran
  // et que le grand 3D (en bas) n'est pas encore visible.
  useEffect(() => {
    if (isWide || !(product.engrave3d || product.engraveHeart3d || product.engraveBook3d || product.engraveEnvelope3d || product.engravePlate3d || product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d)) { setShowMini(false); return; }
    // Méthode fiable : on calcule les positions à chaque défilement.
    // Le mini 3D ne s'affiche QUE tant qu'on n'a pas atteint le grand 3D
    // (il est encore plus bas). Dès qu'on l'a vu/dépassé, plus de mini —
    // donc rien sur la description ni le pied de page.
    const compute = () => {
      const photo = photoRef.current;
      const big = big3dRef.current;
      if (!photo || !big) { setShowMini(false); return; }
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const pr = photo.getBoundingClientRect();
      const br = big.getBoundingClientRect();
      const photoVisible = pr.bottom > 0 && pr.top < vh;
      const bigStillBelow = br.top > vh * 0.6; // le grand 3D est encore plus bas
      setShowMini(!photoVisible && bigStillBelow);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [isWide, product.engrave3d, product.engraveHeart3d, product.engraveBook3d, product.engraveEnvelope3d, product.engravePlate3d, product.engraveGourmette3d, product.engraveSilicone3d, product.engraveLeather3d, product.engraveBar3d]);
  useEffect(() => {
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => setStockMap(d.stock || {}))
      .catch(() => {});
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        const ov = d.images?.[product.slug];
        if (ov && ov.length && !product.lockImages) setImages(ov);
        setPromos(d.promos || {});
      })
      .catch(() => {});
  }, [product.slug]);

  // Valeurs par défaut des champs (ex. texte + date pré-remplis et actifs).
  useEffect(() => {
    const defaults = {};
    (product.personalizationFields || []).forEach((f) => {
      if (f.default !== undefined) defaults[f.key] = f.default;
    });
    if (Object.keys(defaults).length) setFieldValues((prev) => ({ ...defaults, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  const variant = product.variants[variantIndex];
  const hasImages = images.length > 0;
  const hasVariantImages = product.variants.some((v) => v.image);

  // Sélectionne une variante et, si elle a une photo, l'affiche dans la galerie.
  // Quand le client choisit l'emplacement, on bascule sur la bonne photo repère.
  useEffect(() => {
    if (!product.engrave) return;
    const emp = fieldValues["emplacement"];
    const eff = emp === "deux" ? activeSide : emp; // mode "les deux" : on suit le côté en cours
    let target = -1;
    if (eff === "fond" && product.fondImage) target = images.indexOf(product.fondImage);
    else if (eff === "face" && product.engraveImage) target = images.indexOf(product.engraveImage);
    if (target >= 0) setActiveImg(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues["emplacement"], activeSide]);

  function selectVariant(i) {
    setVariantIndex(i);
    const img = product.variants[i]?.image;
    if (img) {
      const idx = images.indexOf(img);
      if (idx >= 0) setActiveImg(idx);
    }
  }
  const info = getProductInfo(product.slug);
  const variantStock = stockMap[variant.stockId || variant.id];
  const soldOut = typeof variantStock === "number" && variantStock <= 0;
  const salePrice = promos[variant.id];
  const hasPromo = typeof salePrice === "number" && salePrice < variant.price;
  // Supplément de gravure (pages de texte en plus de la couverture).
  const engrave = engravingExtra(product, fieldValues);
  const basePrice = hasPromo ? salePrice : variant.price;
  const unitPrice = basePrice + engrave.amount;
  // Prix conseillé (comparaison « moins cher qu'ailleurs »), sauf si vraie promo en cours.
  const refMarkup = Number(product.refMarkup) || 0;
  const refPrice = !hasPromo && refMarkup > 0
    ? Math.round((variant.price * (1 + refMarkup / 100) + engrave.amount) * 100) / 100
    : 0;
  // Prix barré "permanent" défini sur la variante (deux prix ronds : barré + prix de vente).
  const hasCompare = !hasPromo && typeof variant.compareAt === "number" && variant.compareAt > variant.price;
  const comparePrice = hasCompare ? Math.round((variant.compareAt + engrave.amount) * 100) / 100 : 0;
  const comparePct = hasCompare ? Math.round((1 - variant.price / variant.compareAt) * 100) : 0;
  // Prix barré arrondi en ,90 — uniquement pour les bijoux.
  const old90 = (x) => (product.category === "bijoux" ? roundTo90(x) : x);
  // "Fabriqué" pour ce qu'elle fabrique (bois/mariage), "Gravé" pour les pièces
  // sourcées qu'elle personnalise par gravure (bijoux, cristaux, etc.).
  const madeHere = product.category === "mariage" || product.slug === "plaque-de-porte-enfant";
  const originLabel = madeHere ? "Fabriqué en France" : "Personnalisé en France";

  // Champs de gravure visibles : selon la variante, et selon un champ requis
  // (ex. « sur quelle page ? » n'apparaît que si une photo a été ajoutée).
  const visibleFields = (product.personalizationFields || []).filter(
    (f) =>
      (!f.variantContains || variant.title.includes(f.variantContains)) &&
      (!f.requiresField || (fieldValues[f.requiresField] || "").toString().trim()) &&
      (!f.showIfEmplacement || fieldValues["emplacement"] === f.showIfEmplacement) &&
      (!f.showIfField || fieldValues[f.showIfField] === f.showIfValue)
  );

  function setField(key, value) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Libellé lisible d'une valeur (police, couleur, liste déroulante).
  function valueLabel(field, value) {
    if (!value) return "";
    if (field.type === "font") return getFontLabel(value);
    if (field.options) return field.options.find((o) => o.value === value)?.label || value;
    return value;
  }

  // Construit le texte de personnalisation.
  //  - forClient = true  : version courte et propre pour la cliente (panier/checkout),
  //                        SANS les détails techniques (taille, position, emplacement…).
  //  - forClient = false : version COMPLÈTE pour l'atelier (admin / e-mail / fiche).
  function buildPersonalization(forClient = false) {
    if (product.personalizationFields) {
      const parts = visibleFields
        .filter((f) => f.type !== "note" && f.type !== "modele")
        // Côté cliente : on ne garde que les textes saisis (pas emplacement, police, etc.).
        .filter((f) => !forClient || f.type === "text" || f.type === "textarea" || !f.type)
        .map((f) => {
          const raw = (fieldValues[f.key] || "").toString().trim();
          if (!raw) return null;
          return forClient ? valueLabel(f, raw) : `${f.label} : ${valueLabel(f, raw)}`;
        })
        .filter(Boolean);
      // Modèle de gravure.
      const mField = visibleFields.find((f) => f.type === "modele");
      if (mField) {
        const tpl = MODELES[mField.template];
        const mv = fieldValues[mField.key];
        if (tpl && mv && mv.text) {
          const mLayout = mv.layout || tpl.layout || tpl.style || "stack";
          const styleLabel = layoutLabel(tpl, mLayout);
          if (forClient) {
            // Version cliente : juste les textes gravés (ou le nom du visuel choisi).
            const clTexts = tpl.lines
              .filter((l) => !l.below || mv.addText !== false)
              .map((l) => (mv.text[l.key] || "").trim())
              .filter(Boolean);
            parts.push(`Gravure : ${clTexts.length ? clTexts.join(" / ") : styleLabel}`);
          } else {
            const lines = tpl.lines
              .filter((l) => !l.below || mv.addText !== false)
              .map((l) => {
                const t = (mv.text[l.key] || "").trim();
                return t ? `${t} (${getFontLabel((mv.fonts || {})[l.key] || l.font)})` : null;
              })
              .filter(Boolean);
            if (lines.length) parts.push(`Modèle « ${tpl.label} »${styleLabel ? ` (${styleLabel})` : ""} : ${lines.join(" / ")}`);
            else parts.push(`Modèle « ${tpl.label} » (${styleLabel})`);
            if (mLayout === "badge") parts.push(`Fond du badge : ${mv.bg === "plein" ? "plein" : "sans fond (au trait)"}`);
            if (mv.motif && mv.motif !== "aucun") {
              parts.push(`Motif : ${(MOTIF_LIST.find((x) => x.id === mv.motif) || {}).label || mv.motif}`);
            }
            if (modeleLayout?.label) parts.push(modeleLayout.label.charAt(0).toUpperCase() + modeleLayout.label.slice(1));
          }
        }
      }
      // Côté cliente : on s'arrête là (pas de mesures ni de positions).
      if (forClient) {
        if (photoSrc) parts.push("Photo personnalisée");
        return parts.join(" · ");
      }
      // Taille + position du logo / texte gravé (éditeur interactif), pour l'atelier.
      if (product.engrave && photoSrc && photoLayout?.label) {
        parts.push(`Gravure FACE — logo/photo : ${photoLayout.label}`);
      }
      if (product.engrave && previewLines.length > 0 && textLayout?.label) {
        parts.push(`Gravure FACE — ${textLayout.label}`);
      }
      // Mode "les deux" : placement du fond.
      if (dualMode && photoSrcFond && photoLayoutFond?.label) {
        parts.push(`Gravure FOND — photo : ${photoLayoutFond.label}`);
      }
      if (dualMode && (fieldValues["texteFond"] || "").trim() && textLayoutFond?.label) {
        parts.push(`Gravure FOND — ${textLayoutFond.label}`);
      }
      if (dualMode && fieldValues["fondType"] === "dessin" && fieldValues["motifFond"] && fieldValues["motifFond"] !== "aucun" && motifLayoutFond?.label) {
        parts.push(`Gravure FOND — dessin « ${fieldValues["motifFond"]} » : ${motifLayoutFond.label}`);
      }
      return parts.join(" · ");
    }
    return personalization.trim();
  }

  // Police et couleur sélectionnées (pour l'aperçu en direct).
  const fontField = visibleFields.find((f) => f.type === "font");
  const colorField = visibleFields.find((f) => f.type === "color");
  const photoField = visibleFields.find((f) => f.type === "photo");
  const photoUrl = photoField ? fieldValues[photoField.key] : "";
  // Modèle emblème (badge prêt à personnaliser) : génère une image (data URL)
  // qui passe par le même pipeline d'aperçu que la photo/logo.
  const badgeField = visibleFields.find((f) => f.type === "badge");
  const badgeUrl = badgeField ? fieldValues[badgeField.key] : "";
  // Affichable si c'est une vraie image : URL externe (http), data:, ou chemin
  // interne (/api/img/... renvoyé par le téléversement). Le badge a priorité s'il est rempli.
  const photoCandidate = badgeUrl || photoUrl;
  const photoSrc = photoCandidate && (photoCandidate.startsWith("http") || photoCandidate.startsWith("data:") || photoCandidate.startsWith("/")) ? photoCandidate : "";
  // Modèle de gravure (page dédiée propulsée par le moteur partagé).
  const modeleField = visibleFields.find((f) => f.type === "modele");
  const modeleTemplate = modeleField?.template;
  const modeleVal = modeleField ? (fieldValues[modeleField.key] && fieldValues[modeleField.key].text ? fieldValues[modeleField.key] : defaultModele(modeleTemplate)) : null;
  // Emplacement de la gravure : face avant, ou fond (vue de dessus, zone ronde).
  // Sur une page "modèle", on part sur la face par défaut pour montrer l'aperçu d'emblée.
  const emplacement = fieldValues["emplacement"] || (modeleField ? "face" : undefined);
  const dualMode = emplacement === "deux"; // graver les DEUX côtés (face + fond)
  const side = dualMode ? activeSide : (emplacement === "fond" ? "fond" : "face"); // côté affiché
  const isFond = side === "fond";
  const editCfg = isFond && product.engraveFond ? product.engraveFond : product.engrave;
  const mainSrc = images[activeImg];
  const onFaceImg = images[activeImg] === product.engraveImage;
  const onFondImg = images[activeImg] === product.fondImage;
  const showEditor = Boolean(product.engrave) && ((side === "face" && onFaceImg) || (side === "fond" && onFondImg));
  // Photo dédiée au fond (mode "les deux")
  const photoUrlFond = fieldValues["photoFond"] || "";
  const photoSrcFond = photoUrlFond && (photoUrlFond.startsWith("http") || photoUrlFond.startsWith("data:") || photoUrlFond.startsWith("/")) ? photoUrlFond : "";
  // Matière de l'échantillon témoin (aperçu) selon le type de produit.
  const material =
    product.category === "cristaux" ? "crystal" : product.category === "mariage" ? "wood" : "metal";
  const previewFontClass = getFontClass(fieldValues[fontField?.key] || "playfair");
  const previewColor = (colorField && fieldValues[colorField.key]) || "#3a2f1d";

  // Lignes de texte à montrer dans l'aperçu (champs texte non vides).
  const previewLines = visibleFields
    .filter((f) => (f.type === "text" || f.type === "textarea" || !f.type) && !f.noPreview)
    .flatMap((f) => (fieldValues[f.key] || "").split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  // Option « décor autour du texte » : encadre la 1re ligne du symbole choisi (★ ♥ ✿ ◆ •).
  const decorSym = fieldValues["decor"];
  if (decorSym && previewLines.length) {
    previewLines[0] = `${decorSym} ${previewLines[0]} ${decorSym}`;
  }
  // Mode "les deux" : la photo et le texte affichés dépendent du côté en cours (face / fond).
  const editPhotoSrc = (dualMode && side === "fond") ? photoSrcFond : photoSrc;
  let editLines;
  if (dualMode && side === "fond") {
    editLines = (fieldValues["texteFond"] || "").split("\n").map((l) => l.trim()).filter(Boolean);
  } else if (dualMode && side === "face") {
    editLines = ["texte", "texte2"].flatMap((k) => (fieldValues[k] || "").split("\n")).map((l) => l.trim()).filter(Boolean);
    if (decorSym && editLines.length) editLines[0] = `${decorSym} ${editLines[0]} ${decorSym}`;
  } else {
    editLines = previewLines;
  }
  const setPhotoLayoutSide = (dualMode && side === "fond") ? setPhotoLayoutFond : setPhotoLayout;
  const setTextLayoutSide = (dualMode && side === "fond") ? setTextLayoutFond : setTextLayout;
  const hasTextFields = visibleFields.some(
    (f) => f.type === "text" || f.type === "textarea" || !f.type
  );

  // Aperçu 3D (bijoux à forme simple, ex. collier barre) : textes des faces + finition.
  const faceTexts = visibleFields
    .filter((f) => f.type === "text" || f.type === "textarea" || !f.type)
    .map((f) => fieldValues[f.key] || "");
  const FINISH_MAP = {
    "argenté": "silver", "argente": "silver", "doré": "gold", "dore": "gold",
    "noir": "black", "or rose": "rose", "arc en ciel": "rainbow",
  };
  const finish3d = FINISH_MAP[(variant.title || "").toLowerCase()] || "silver";
  const motifVals = [1, 2, 3, 4].map((i) => fieldValues["motif" + i] || "");
  const motifPositions = [1, 2, 3, 4].map((i) => (fieldValues["motifPos" + i] === "below" ? "below" : "above"));
  const direction3d = fieldValues["sens"] === "down" ? "down" : "up";

  // Aperçu 3D cœur ouvrable (médaillon) : 4 faces + finition (argent / bicolore) + photo.
  // Aperçu 3D automatique (gravure) — utilisé seulement s'il n'y a PAS de fichier 3D fourni.
  const any3d = (product.engrave3d || product.engraveHeart3d || product.engraveBook3d || product.engraveEnvelope3d || product.engravePlate3d || product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) && !product.model3d;
  // Bracelet à plaque (gourmette / silicone / cuir / barre fine) : texte gravé sur la plaque.
  const gourmetteText = fieldValues["texte"] || "";
  const _bt = (variant.title || "").toLowerCase();
  const braceletFinish = _bt.includes("rose")
    ? "rose"
    : _bt.includes("dor")
      ? "gold"
      : _bt.includes("noir")
        ? "black"
        : "silver";
  const braceletBand = product.engraveLeather3d ? "leather" : product.engraveSilicone3d ? "silicone" : product.engraveBar3d ? "finechain" : "chain";
  const braceletFin = product.engraveGourmette3d ? "silver" : braceletFinish;
  const braceletSlim = Boolean(product.engraveBar3d);
  // Plaque acier : recto / verso, texte + photo (sur la face choisie).
  const plateFaces = [fieldValues["recto"] || "", fieldValues["verso"] || ""];
  const plateTitle = (variant.title || "").toLowerCase();
  const plateFinish = plateTitle.includes("dor")
    ? "gold"
    : (plateTitle.includes("noir") && !plateTitle.includes("argent"))
      ? "black"
      : "silver";
  // Collier enveloppe : la plaque sort et montre recto / verso.
  const envFaces = [fieldValues["recto"] || "", fieldValues["verso"] || ""];
  const envTitle = (variant.title || "").toLowerCase();
  const envFinish = envTitle.includes("rose")
    ? "rose"
    : envTitle.includes("argent")
      ? "silver"
      : "gold";
  const envTwoSided = (variant.title || "").includes("Recto-Verso");
  // Médaillon livre : couverture + 3 pages intérieures (texte + motif + position).
  const bookFaces = [
    fieldValues["couverture"] || "",
    fieldValues["page1"] || "",
    fieldValues["page2"] || "",
    fieldValues["page3"] || "",
  ];
  const bookMotifs = [1, 2, 3, 4].map((i) => fieldValues["motif" + i] || "");
  const bookMotifPositions = [1, 2, 3, 4].map((i) => fieldValues["motifPos" + i] || "hd");
  const bookTitle = (variant.title || "").toLowerCase();
  const bookFinish = bookTitle.includes("argent") && bookTitle.includes("dor")
    ? "bicolore"
    : bookTitle.includes("dor")
      ? "gold"
      : "silver";
  // Médaillon livre : 5 faces (couverture, 3 pages, dos).
  const heartFaces = [
    fieldValues["cover"] || "",
    fieldValues["page1"] || "",
    fieldValues["page2"] || "",
    fieldValues["page3"] || "",
    fieldValues["backcover"] || "",
  ];
  const finishHeart = (variant.title || "").toLowerCase().includes("bicolore") ? "bicolore" : "silver";
  const heartPhoto = photoSrc; // photo réelle uniquement (url/data)
  // Page choisie pour la photo (la cliente la place où elle veut).
  const HEART_PAGE_INDEX = { cover: 0, page1: 1, page2: 2, page3: 3, backcover: 4 };
  const heartPhotoIndex = HEART_PAGE_INDEX[fieldValues["photoPage"]] ?? 1;

  function loadImg(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  }
  // Compose le visuel EXACT : la photo du verre + l'image/photo choisie, posée
  // dans la zone gravable. 100 % fiable (canvas + fichiers même origine), contrairement
  // à une capture d'écran du DOM (qui n'arrivait pas à inclure l'image Next.js).
  async function composeOnGlass(glassUrl, artUrl, box) {
    const [g, a] = await Promise.all([loadImg(glassUrl), loadImg(artUrl)]);
    const W = g.naturalWidth || 800, H = g.naturalHeight || 800;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.drawImage(g, 0, 0, W, H);
    const zx = box.left * W, zy = box.top * H, zw = box.width * W, zh = box.height * H;
    const ar = (a.naturalWidth || 1) / (a.naturalHeight || 1);
    let dw = zw, dh = zw / ar;
    if (dh > zh) { dh = zh; dw = zh * ar; }
    ctx.drawImage(a, zx + (zw - dw) / 2, zy + (zh - dh) / 2, dw, dh);
    return c.toDataURL("image/jpeg", 0.9);
  }
  // Résout la vraie font-family d'une classe (.fnt-cinzel…) au moment du rendu.
  const _famCache = {};
  function fontFamilyFor(cls) {
    const key = cls || "fnt-playfair";
    if (_famCache[key]) return _famCache[key];
    const s = document.createElement("span");
    s.className = key; s.style.cssText = "position:absolute;visibility:hidden"; s.textContent = "Ag";
    document.body.appendChild(s);
    const fam = getComputedStyle(s).fontFamily || "serif";
    document.body.removeChild(s);
    return (_famCache[key] = fam);
  }
  // Motif (ancre, étoile…) teinté à la couleur de gravure, en canvas.
  async function tintedMotif(id, color, sizePx) {
    try {
      const im = await loadImg(`/motifs/${id}.svg`);
      const s = Math.max(2, Math.round(sizePx));
      const c = document.createElement("canvas"); c.width = s; c.height = s;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0, s, s);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color; ctx.fillRect(0, 0, s, s);
      return c;
    } catch { return null; }
  }
  // Dessine un modèle (texte + motif) à la main sur le verre (ou sur fond
  // transparent pour le fichier à graver). 100 % fiable : vraies polices via canvas.
  async function renderModele(mv, template, color, { glassUrl, box }) {
    const tpl = MODELES[template];
    let cw, ch, rx, ry, rw, rh, g = null;
    if (glassUrl) {
      g = await loadImg(glassUrl);
      cw = g.naturalWidth || 800; ch = g.naturalHeight || 800;
      rx = box.left * cw; ry = box.top * ch; rw = box.width * cw; rh = box.height * ch;
    } else {
      rw = Math.round(box.width * 1000); rh = Math.round(box.height * 1000);
      cw = rw; ch = rh; rx = 0; ry = 0;
    }
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext("2d");
    if (g) ctx.drawImage(g, 0, 0, cw, ch);
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }
    if (tpl) {
      const text = mv?.text || {}, fonts = mv?.fonts || {};
      const layout = mv?.layout || tpl.layout || "stack";
      const cx = rx + rw / 2;
      const get = (k) => { const l = tpl.lines.find((x) => x.key === k); if (!l) return null; const txt = (text[k] || "").trim() || l.placeholder || ""; return txt ? { txt, cls: fonts[k] || l.font, em: l.em || 1, bold: l.bold, mid: k === "mid" } : null; };
      const subLine = tpl.lines.find((l) => l.below);
      const subTxt = subLine && mv?.addText !== false ? ((text[subLine.key] || "").trim() || subLine.placeholder || "") : "";
      const rows = [];
      if (layout === "classic") {
        const t = get("top"), m = get("mid"), b = get("bot");
        if (t) rows.push({ k: "text", ...t });
        rows.push({ k: "flourish" });
        if (m) rows.push({ k: "text", ...m });
        rows.push({ k: "flourish" });
        if (b) rows.push({ k: "text", ...b });
        if (mv?.motif && mv.motif !== "aucun") rows.push({ k: "motif", id: mv.motif, em: 0.95 });
      } else {
        tpl.lines.filter((l) => !l.below).forEach((l) => { const r = get(l.key); if (r) rows.push({ k: "text", ...r }); });
        if (mv?.motif && mv.motif !== "aucun") rows.push({ k: "motif", id: mv.motif, em: 1.15 });
      }
      if (subTxt && subLine) rows.push({ k: "text", txt: subTxt, cls: fonts[subLine.key] || subLine.font, em: subLine.em || 0.5 });

      let base = Math.min(rw * 0.2, rh * 0.2);
      const gap = () => base * 0.14;
      const measure = () => {
        let totalH = 0, maxW = 0;
        for (const r of rows) {
          const fs = base * (r.em || 1);
          if (r.k === "flourish") { totalH += base * 0.5; maxW = Math.max(maxW, base * 3.6); }
          else if (r.k === "motif") { totalH += fs; maxW = Math.max(maxW, fs); }
          else { ctx.font = `${r.bold ? "700 " : ""}${fs}px ${fontFamilyFor(r.cls)}`; const w = ctx.measureText(r.txt).width * (r.mid ? 1.7 : 1); totalH += fs * 1.1; maxW = Math.max(maxW, w); }
          totalH += gap();
        }
        return { totalH, maxW };
      };
      let { totalH, maxW } = measure();
      const fit = Math.min(rw / (maxW || 1), rh / (totalH || 1), 1);
      if (fit < 1) { base *= fit; ({ totalH, maxW } = measure()); }

      ctx.fillStyle = color; ctx.strokeStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      let y = ry + (rh - totalH) / 2;
      for (const r of rows) {
        const fs = base * (r.em || 1);
        if (r.k === "flourish") {
          const fy = y + base * 0.25, half = base * 1.7;
          ctx.lineWidth = Math.max(1, base * 0.04);
          ctx.beginPath(); ctx.moveTo(cx - half, fy); ctx.lineTo(cx + half, fy); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx - half, fy, base * 0.07, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + half, fy, base * 0.07, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(cx, fy - base * 0.13); ctx.lineTo(cx + base * 0.1, fy); ctx.lineTo(cx, fy + base * 0.13); ctx.lineTo(cx - base * 0.1, fy); ctx.closePath(); ctx.fill();
          y += base * 0.5 + gap();
        } else if (r.k === "motif") {
          const m = await tintedMotif(r.id, color, fs);
          if (m) ctx.drawImage(m, cx - fs / 2, y, fs, fs);
          y += fs + gap();
        } else {
          ctx.font = `${r.bold ? "700 " : ""}${fs}px ${fontFamilyFor(r.cls)}`;
          const ty = y + fs * 0.55;
          if (r.mid) {
            const tw = ctx.measureText(r.txt).width, sx = tw / 2 + fs * 0.45, ss = fs * 0.5;
            const star = await tintedMotif("etoile", color, ss);
            if (star) { ctx.drawImage(star, cx - sx - ss / 2, ty - ss / 2, ss, ss); ctx.drawImage(star, cx + sx - ss / 2, ty - ss / 2, ss, ss); }
          }
          ctx.fillText(r.txt, cx, ty);
          y += fs * 1.1 + gap();
        }
      }
    }
    return cv.toDataURL(glassUrl ? "image/jpeg" : "image/png", 0.92);
  }
  async function uploadDataUrl(dataUrl) {
    if (!dataUrl) return null;
    try {
      const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, productSlug: product.slug }) });
      const data = await res.json();
      if (res.ok && data.ref) return "/api/img/" + data.ref;
    } catch { /* ignore */ }
    return null;
  }

  async function handleAdd() {
    if (soldOut || preparing) return;
    // Vérifie les champs de gravure obligatoires (selon l'option choisie).
    if (product.personalizationFields) {
      const missing = visibleFields.find(
        (f) => f.type !== "note" && f.type !== "modele" && !f.optional && !(fieldValues[f.key] || "").trim()
      );
      // Modèle de gravure : au moins un texte requis (sauf si le champ est facultatif).
      if (modeleField && !modeleField.optional) {
        const mv = fieldValues[modeleField.key];
        const hasText = mv && mv.text && Object.values(mv.text).some((t) => (t || "").trim());
        if (!hasText) {
          setError("Merci d'indiquer le texte à graver.");
          return;
        }
      }
      if (missing) {
        setError(`Merci d'indiquer : ${missing.label}.`);
        return;
      }
    }
    setError("");

    // Visuel EXACT préparé par le client (verre + image/photo posée) + source du
    // fichier à graver, composés de façon fiable (canvas). Pour l'aperçu panier,
    // l'e-mail et la page atelier.
    let previewImage = null, previewImageFond = null, artworkImage = null, artworkImageFond = null;
    if (product.engrave && hasImages) {
      setPreparing(true);
      try {
        const dsg = (modeleField && modeleVal && modeleVal.layout) ? imageDesign(modeleTemplate, modeleVal.layout) : null;
        const glass = images[activeImg] || images[0];
        const faceBox = (product.engrave && product.engrave.box) || { left: 0.2, top: 0.2, width: 0.6, height: 0.6 };
        const fondBox = (product.engraveFond && product.engraveFond.box) || { left: 0.3, top: 0.3, width: 0.4, height: 0.4 };
        // FACE : photo envoyée, sinon design image choisi (Fête des pères).
        const faceArt = photoSrc || (dsg ? dsg.dark : null);
        if (faceArt) {
          // Cas fiable : on compose l'image/photo sur le verre (canvas).
          artworkImage = faceArt;
          const composed = await composeOnGlass(glass, faceArt, faceBox);
          previewImage = (await uploadDataUrl(composed)) || composed;
        } else if (modeleField) {
          // Cas texte/motif (ex. Classique) : on dessine le modèle sur le verre (canvas).
          const composed = await renderModele(modeleVal, modeleTemplate, "#3a2f1d", { glassUrl: glass, box: faceBox });
          previewImage = (await uploadDataUrl(composed)) || composed;
          const art = await renderModele(modeleVal, modeleTemplate, "#3a2f1d", { glassUrl: null, box: faceBox });
          artworkImage = (await uploadDataUrl(art)) || art;
        }
        // FOND (mode « les deux ») : photo du fond si fournie (texte/motif : pas d'image fixe).
        if (dualMode) {
          const fondArt = photoSrcFond || null;
          if (fondArt) {
            artworkImageFond = fondArt;
            const composedF = await composeOnGlass(product.fondImage || glass, fondArt, fondBox);
            previewImageFond = (await uploadDataUrl(composedF)) || composedF;
          }
        }
      } catch { /* ignore */ }
      setPreparing(false);
    }

    // Fiche atelier : tous les réglages choisis (emplacement, taille, position,
    // textes, polices, motif, fond, options, photo…) pour graver à l'identique.
    const itemSpec = {
      slug: product.slug,
      name: product.name,
      variantTitle: variant.title,
      emplacement: emplacement || "face",
      deuxEmplacement: fieldValues["deuxEmplacement"] === "oui",
      modeleTemplate: modeleTemplate || null,
      modele: modeleField ? modeleVal : null,
      photoSrc: photoSrc || null,
      previewImage, previewImageFond, artworkImage, artworkImageFond,
      layout: { photo: photoLayout || null, text: textLayout || null, modele: modeleLayout || null, photoFond: photoLayoutFond || null, textFond: textLayoutFond || null, motifFond: motifLayoutFond || null },
      // on évite de stocker deux fois le modèle (déjà dans "modele")
      fields: (() => { const { modele, ...rest } = fieldValues; return rest; })(),
      personalization: buildPersonalization(),
    };
    addItem({
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      price: unitPrice,
      // Vignette panier = le visuel EXACT choisi par le client (sinon photo produit).
      image: previewImage || photoSrc || images[0] || null,
      // Côté cliente : récap court (les détails techniques restent pour l'atelier).
      personalization: buildPersonalization(true),
      fields: product.engravingPricing ? { ...fieldValues } : undefined,
      spec: itemSpec,
      pickup: Boolean(product.pickup),
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="container">
      <div className="product-layout">
        {/* Galerie */}
        <div>
          <div className={`gallery-main${modeleField ? " toolbar-bottom" : ""}`} ref={photoRef}>
            {hasImages ? (
              <Image
                className="gallery-bg"
                src={mainSrc}
                alt={`${product.name} — visuel ${activeImg + 1}`}
                width={800}
                height={800}
                priority
              />
            ) : (
              <div
                className="placeholder"
                style={{ width: "100%", height: "100%", fontSize: "3rem" }}
              >
                Niv Création
              </div>
            )}
            {/* Sur une VRAIE photo produit : la gravure se superpose directement */}
            {hasImages && product.category === "cristaux" && photoSrc && (
              <div className="crystal-photo-overlay">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc} alt="Aperçu de la gravure photo" />
              </div>
            )}
            {/* Logo / photo envoyé par le client, superposé sur la photo du
                produit (hors cristal), dans la zone de gravure réglée. */}
            {/* Éditeur interactif (glisser + redimensionner + mesure cm) si activé */}
            {hasImages && showEditor && editPhotoSrc && !modeleField && (
              <PhotoEngraveLayer key={`photo-${side}`} photoSrc={editPhotoSrc} cfg={editCfg} light={isFond} onChange={setPhotoLayoutSide} />
            )}
            {/* Bascule Face / Fond quand on grave les deux côtés */}
            {hasImages && dualMode && showEditor && (
              <div className="side-toggle">
                <button type="button" className={side === "face" ? "on" : ""} onClick={() => setActiveSide("face")}>Face</button>
                <button type="button" className={side === "fond" ? "on" : ""} onClick={() => setActiveSide("fond")}>Fond</button>
              </div>
            )}
            {/* Calque MODÈLE de gravure — sur la face (pas sur le fond en mode "les deux") */}
            {hasImages && showEditor && modeleField && !(dualMode && side === "fond") && (
              <ModeleEngraveLayer
                key={isFond ? "modele-fond" : "modele-face"}
                template={modeleTemplate}
                value={modeleVal}
                color="#3a2f1d"
                cfg={editCfg}
                onChange={setModeleLayout}
              />
            )}
            {/* Fête des pères, côté FOND (mode "les deux") : un DESSIN au choix */}
            {hasImages && showEditor && modeleField && dualMode && side === "fond" && fieldValues["fondType"] === "dessin" && fieldValues["motifFond"] && fieldValues["motifFond"] !== "aucun" && (
              <MotifEngraveLayer key="motif-fond" motifId={fieldValues["motifFond"]} color="#3a2f1d" cfg={editCfg} onChange={setMotifLayoutFond} />
            )}
            {/* Sinon : simple superposition du logo (zone fixe) */}
            {hasImages && !product.engrave && product.category !== "cristaux" && (product.previewPhoto || product.preview) && photoSrc && (
              <div className="engrave-overlay engrave-overlay-photo" style={product.previewPhoto || product.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="eo-photo" src={photoSrc} alt="Aperçu du logo / de la photo gravé" />
              </div>
            )}
            {/* Gravure écrite directement sur la photo du produit. Ne s'affiche
                QUE si la zone de gravure a été réglée dans l'admin (product.preview),
                pour éviter un texte mal placé sur les photos non réglées. */}
            {/* Texte : éditeur interactif (déplaçable + taille) si activé */}
            {hasImages && showEditor && editLines.length > 0 && (!modeleField || (dualMode && side === "fond" && fieldValues["fondType"] === "texte")) && (
              <TextEngraveLayer
                key={`text-${side}`}
                lines={editLines}
                fontClass={previewFontClass}
                color={previewColor}
                cfg={editCfg}
                onChange={setTextLayoutSide}
              />
            )}
            {/* Sinon : texte centré sur la zone fixe */}
            {hasImages && !product.engrave && previewLines.length > 0 && product.preview && (
              <div className="engrave-overlay" style={product.preview}>
                {previewLines.map((line, i) => (
                  <span key={i} className={`eo-line ${previewFontClass}`} style={{ color: previewColor }}>
                    {line}
                  </span>
                ))}
              </div>
            )}
            {/* Flèches précédent / suivant pour parcourir les photos */}
            {hasImages && images.length > 1 && (
              <>
                <button type="button" className="gallery-arrow gallery-arrow-prev" aria-label="Photo précédente"
                  onClick={() => setActiveImg((activeImg - 1 + images.length) % images.length)}>‹</button>
                <button type="button" className="gallery-arrow gallery-arrow-next" aria-label="Photo suivante"
                  onClick={() => setActiveImg((activeImg + 1) % images.length)}>›</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={img}
                  className={i === activeImg ? "active" : ""}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Voir le visuel ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Aperçu 3D rotatif (verre) — prototype (côté avant uniquement) */}
          {product.engrave && (emplacement === "face" || emplacement === "deux") && !modeleField && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShow3d((v) => !v)}
                style={{ width: "100%", padding: "10px 16px" }}
              >
                {show3d ? "Masquer l'aperçu 3D" : "↻ Voir le verre en 3D (le faire tourner)"}
              </button>
              {show3d && (
                <div style={{ marginTop: 10, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "#f3efe7" }}>
                  <Glass3D photoSrc={photoSrc} lines={previewLines} fontKey={fieldValues[fontField?.key] || "playfair"} photoLayout={photoLayout} textLayout={textLayout} cfg={product.engrave} />
                </div>
              )}
            </div>
          )}

          {(product.category === "mariage" || product.category === "cadeaux") && (
            <div
              style={{
                marginTop: 14,
                fontSize: "0.84rem",
                color: "var(--ink-soft)",
                background: "#fbf4e6",
                border: "1px solid #e7d3a1",
                borderRadius: 10,
                padding: "10px 12px",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--gold-dark)" }}>Une demande précise&nbsp;?</strong>
              <br />
              Personnalisation particulière ou projet sur mesure :{" "}
              <a href="mailto:contact.nivcreation@gmail.com" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
                écrivez-moi
              </a>{" "}
              ou appelez le{" "}
              <a href="tel:+33766153102" style={{ color: "var(--gold-dark)", fontWeight: 600, whiteSpace: "nowrap" }}>
                07 66 15 31 02
              </a>
              .
            </div>
          )}

          {product.model3d && (
            <div style={{ marginTop: 14, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "#faf7f1" }}>
              <Model3D src={product.model3d} />
            </div>
          )}

          {any3d && isWide && (
            <>
              <div className="engrave3d-sticky">
                {(product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) ? (
                  <EngraveGourmette3D text={gourmetteText} fontKey={fieldValues[fontField?.key] || "playfair"} finish={braceletFin} band={braceletBand} slim={braceletSlim} decor={product.decor3d || ""} />
                ) : product.engravePlate3d ? (
                  <EngravePlate3D faces={plateFaces} motifPos={fieldValues["textPos"]} photo={photoSrc} photoFace={fieldValues["photoFace"] || "recto"} finish={plateFinish} fontKey={fieldValues[fontField?.key] || "playfair"} />
                ) : product.engraveEnvelope3d ? (
                  <EngraveEnvelope3D faces={envFaces} finish={envFinish} twoSided={envTwoSided} fontKey={fieldValues[fontField?.key] || "playfair"} />
                ) : product.engraveBook3d ? (
                  <EngraveBook3D faces={bookFaces} motifs={bookMotifs} motifPositions={bookMotifPositions} finish={bookFinish} fontKey={fieldValues[fontField?.key] || "playfair"} />
                ) : product.engraveHeart3d ? (
                  <EngraveHeart3D faces={heartFaces} finish={finishHeart} fontKey={fieldValues[fontField?.key] || "playfair"} photo={heartPhoto} photoIndex={heartPhotoIndex} />
                ) : (
                  <Engrave3D faces={faceTexts} finish={finish3d} fontKey={fieldValues[fontField?.key] || "playfair"} motifs={motifVals} direction={direction3d} motifPositions={motifPositions} />
                )}
              </div>
              <div className="engrave3d-spacer" aria-hidden="true" />
            </>
          )}
        </div>

        {/* Infos & achat */}
        <div className="product-info">
          <div className="breadcrumb">
            <Link href="/boutique">Boutique</Link>
            {" / "}
            <Link href={`/boutique?cat=${product.category}`}>
              {getCategoryLabel(product.category)}
            </Link>
          </div>
          <h1>{product.title}</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead">
            {hasPromo ? (
              <>
                <span className="price-old">{formatEuro(old90(variant.price))}</span>{" "}
                <span className="price-sale">{formatEuro(unitPrice)}</span>{" "}
                <span className="promo-badge" style={{ position: "static" }}>
                  -{Math.round((1 - salePrice / variant.price) * 100)}%
                </span>
              </>
            ) : hasCompare ? (
              <>
                <span className="price-old">{formatEuro(old90(comparePrice))}</span>{" "}
                <span className="price-sale">{formatEuro(unitPrice)}</span>{" "}
                <span className="promo-badge" style={{ position: "static" }}>-{comparePct}%</span>
              </>
            ) : refPrice ? (
              <>
                <span className="price-ref-label">Prix conseillé</span>{" "}
                <span className="price-old">{formatEuro(old90(refPrice))}</span>{" "}
                <span className="price-sale">{formatEuro(unitPrice)}</span>
              </>
            ) : (
              formatEuro(unitPrice)
            )}
          </div>
          {engrave.amount > 0 && (
            <p style={{ margin: "-12px 0 16px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              dont <strong>{formatEuro(engrave.amount)}</strong> en plus
              {engrave.pages > 0 && ` · ${engrave.pages} page${engrave.pages > 1 ? "s" : ""} de texte`}
              {engrave.photo && " · photo gravée"}
            </p>
          )}

          {product.variants.length > 1 && (
            <div className="field">
              <label>{hasVariantImages ? "Choisissez votre modèle" : "Choisissez votre option"}</label>
              <div className="variant-swatches">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`variant-swatch${i === variantIndex ? " active" : ""}${v.image ? " has-img" : ""}`}
                    onClick={() => selectVariant(i)}
                    aria-pressed={i === variantIndex}
                  >
                    {v.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image} alt="" />
                    )}
                    <span className="vs-title">{v.title}</span>
                    <span className="vs-price">
                      {typeof v.compareAt === "number" && v.compareAt > v.price && (
                        <span className="vs-old">{formatEuro(old90(v.compareAt))}</span>
                      )}
                      <span className="vs-now">{formatEuro(v.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Champs de gravure dynamiques (selon l'option choisie) */}
          {product.personalizationFields ? (
            <div style={{ marginBottom: 6 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12 }}>
                Personnalisation — gravure
              </p>
              {visibleFields.map((f) => {
                if (f.type === "note") {
                  return (
                    <div key={f.key}>
                      {f.text && <p className="perso-hint">{f.text}</p>}
                      {f.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image} alt={f.imageAlt || "Conseils pour réussir votre photo"} className="perso-hint-img" />
                      )}
                    </div>
                  );
                }
                if (f.type === "photo") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <PhotoUpload value={fieldValues[f.key] || ""} onChange={(url) => setField(f.key, url)} productSlug={product.slug} />
                      {f.text && <p className="perso-hint" style={{ marginTop: 8 }}>{f.text}</p>}
                    </div>
                  );
                }
                if (f.type === "badge") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <BadgeDesigner value={fieldValues[f.key] || ""} onChange={(u) => setField(f.key, u)} />
                      {f.text && <p className="perso-hint" style={{ marginTop: 8 }}>{f.text}</p>}
                    </div>
                  );
                }
                if (f.type === "modele") {
                  return (
                    <div className="field" key={f.key}>
                      {f.label && <label>{f.label}</label>}
                      <ModeleDesigner template={f.template} value={fieldValues[f.key]} onChange={(val) => setField(f.key, val)} />
                      {f.text && <p className="perso-hint" style={{ marginTop: 8 }}>{f.text}</p>}
                    </div>
                  );
                }
                if (f.type === "motifniv") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <div className="modele-motifs">
                        {MOTIF_LIST.map((m) => (
                          <button type="button" key={m.id} className={`modele-motif-cell${(fieldValues[f.key] || "") === m.id ? " on" : ""}`} onClick={() => setField(f.key, m.id)} aria-label={m.label}>
                            {m.id === "aucun" ? <span className="modele-motif-none">Aucun</span> : <Motif id={m.id} color="#3a2f1d" size={38} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (f.type === "motif") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <MotifPicker value={fieldValues[f.key] || ""} onChange={(v) => setField(f.key, v)} />
                    </div>
                  );
                }
                if (f.type === "lettering") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <LetteringPicker value={fieldValues[f.key] || ""} onChange={(v) => setField(f.key, v)} options={f.options || []} />
                    </div>
                  );
                }
                if (f.type === "design") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <DesignAssistant prompt={fieldValues[f.promptKey] || ""} value={fieldValues[f.key] || ""} onChange={(u) => setField(f.key, u)} />
                      {f.text && <p className="perso-hint" style={{ marginTop: 8 }}>{f.text}</p>}
                    </div>
                  );
                }
                const labelEl = (
                  <label htmlFor={`pf-${f.key}`}>
                    {f.label}
                    {f.optional && (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>
                    )}
                  </label>
                );
                if (f.type === "select" && f.asChecks) {
                  const emp = fieldValues[f.key] || f.default || "";
                  const faceOn = emp === "face" || emp === "deux";
                  const fondOn = emp === "fond" || emp === "deux";
                  const setSides = (nf, nd) => {
                    let v = nf && nd ? "deux" : nf ? "face" : nd ? "fond" : "face";
                    setField(f.key, v);
                  };
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}</label>
                      <label className="modele-check"><input type="checkbox" checked={faceOn} onChange={(e) => setSides(e.target.checked, fondOn)} /><span>Graver sur la face avant</span></label>
                      <label className="modele-check"><input type="checkbox" checked={fondOn} onChange={(e) => setSides(faceOn, e.target.checked)} /><span>Graver au fond du verre</span></label>
                      {faceOn && fondOn && <p className="char-count" style={{ textAlign: "left", color: "var(--gold-dark)" }}>Les deux côtés : +7 €</p>}
                    </div>
                  );
                }
                if (f.type === "font" || f.type === "select" || f.type === "color") {
                  const opts = f.type === "font" ? FONTS.map((x) => ({ value: x.key, label: x.label })) : f.options || [];
                  return (
                    <div className="field" key={f.key}>
                      {labelEl}
                      <select
                        id={`pf-${f.key}`}
                        value={fieldValues[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                      >
                        <option value="">— Choisir —</option>
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                const max = f.maxLength || 80;
                const val = fieldValues[f.key] || "";
                return (
                  <div className="field" key={f.key}>
                    {labelEl}
                    {f.type === "textarea" ? (
                      <textarea
                        id={`pf-${f.key}`}
                        placeholder={f.placeholder || ""}
                        value={val}
                        maxLength={max}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        id={`pf-${f.key}`}
                        type="text"
                        placeholder={f.placeholder || ""}
                        value={val}
                        maxLength={max}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                    <span className="char-count">{val.length}/{max}</span>
                  </div>
                );
              })}

              {any3d && !isWide && (
                <div ref={big3dRef}>
                  {(product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) ? (
                    <EngraveGourmette3D text={gourmetteText} fontKey={fieldValues[fontField?.key] || "playfair"} finish={braceletFin} band={braceletBand} slim={braceletSlim} decor={product.decor3d || ""} />
                  ) : product.engravePlate3d ? (
                    <EngravePlate3D faces={plateFaces} motifPos={fieldValues["textPos"]} photo={photoSrc} photoFace={fieldValues["photoFace"] || "recto"} finish={plateFinish} fontKey={fieldValues[fontField?.key] || "playfair"} />
                  ) : product.engraveEnvelope3d ? (
                    <EngraveEnvelope3D faces={envFaces} finish={envFinish} twoSided={envTwoSided} fontKey={fieldValues[fontField?.key] || "playfair"} />
                  ) : product.engraveBook3d ? (
                    <EngraveBook3D faces={bookFaces} motifs={bookMotifs} motifPositions={bookMotifPositions} finish={bookFinish} fontKey={fieldValues[fontField?.key] || "playfair"} />
                  ) : product.engraveHeart3d ? (
                    <EngraveHeart3D faces={heartFaces} finish={finishHeart} fontKey={fieldValues[fontField?.key] || "playfair"} photo={heartPhoto} photoIndex={heartPhotoIndex} />
                  ) : (
                    <Engrave3D faces={faceTexts} finish={finish3d} fontKey={fieldValues[fontField?.key] || "playfair"} motifs={motifVals} direction={direction3d} motifPositions={motifPositions} />
                  )}
                </div>
              )}

              {(hasTextFields || photoField) && !product.noEngravePreview && (
                <div className="engrave-preview">
                  <span className="ep-label">
                    Aperçu témoin de la gravure
                    {fontField && fieldValues[fontField.key] ? ` — ${getFontLabel(fieldValues[fontField.key])}` : ""}
                  </span>
                  <div className={`ep-plate ${material}`}>
                    {photoSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="ep-crystal-photo" src={photoSrc} alt="" />
                    )}
                    {previewLines.length ? (
                      previewLines.map((line, i) => (
                        <span key={i} className={`ep-line ${previewFontClass}`} style={{ color: previewColor }}>
                          {line}
                        </span>
                      ))
                    ) : (
                      <span className="ep-empty">
                        {material === "crystal"
                          ? "Votre photo / texte apparaîtra ici, dans le cristal…"
                          : "Votre texte gravé apparaîtra ici…"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            product.personalizable && (
              <div className="field">
                <label htmlFor="perso">
                  {product.personalizationLabel || "Votre personnalisation"}
                  <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
                    {" "}
                    (facultatif ici, à confirmer après commande)
                  </span>
                </label>
                <textarea
                  id="perso"
                  placeholder="Ex : Prénom, date, message à graver…"
                  value={personalization}
                  onChange={(e) => setPersonalization(e.target.value)}
                  maxLength={300}
                />
              </div>
            )
          )}

          {error && <div className="notice">{error}</div>}

          <div className="qty-row">
            <div className="qty-stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Moins">
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} aria-label="Plus">
                +
              </button>
            </div>
            <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleAdd} disabled={soldOut || preparing}>
              {soldOut ? "Épuisé" : preparing ? "Préparation du visuel…" : added ? "Ajouté au panier" : "Ajouter au panier"}
            </button>
          </div>
          {typeof variantStock === "number" && (
            <p style={{ margintop: 0, fontSize: "0.85rem", color: soldOut ? "#b4452f" : "var(--ink-soft)" }}>
              {soldOut ? "Cette option est momentanément épuisée." : `En stock : ${variantStock}`}
            </p>
          )}

          {product.pickup && (
            <div style={{ marginTop: 12, background: "#fbf4e6", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
              <strong>📍 Retrait en main propre possible</strong> — atelier dans le <strong>Val-d'Oise (95)</strong> et alentours, gratuit, sur rendez-vous (choisissez l'option au paiement).
              <br />C'est vous qui venez récupérer votre commande à l'atelier, sous <strong>14 jours</strong> après notre message « commande prête ». Passé ce délai, la commande ne pourra plus être ni retirée, ni expédiée.
              <br />Vous habitez plus loin et souhaitez quand même venir récupérer ? Écrivez-nous <strong>avant de commander</strong> : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>.
            </div>
          )}

          <div className="hero-badges" style={{ marginTop: 8 }}>
            <div className="hero-badge">{originLabel}</div>
            <div className="hero-badge">Paiement sécurisé</div>
            <div className="hero-badge">Pièce personnalisée</div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>
            🕒 Personnalisé à la commande : fabrication 2 à 5 jours ouvrés + expédition 2 à 4 jours ouvrés.
          </p>

          <div
            className="product-desc"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />

          {info && (
            <div className="info-accordion">
              {info.material && (
                <details>
                  <summary>📏 Taille & Matériaux</summary>
                  <div className="info-body">{info.material}</div>
                </details>
              )}
              {info.usage && (
                <details>
                  <summary>✨ Personnalisation & Entretien</summary>
                  <div className="info-body">{info.usage}</div>
                </details>
              )}
              {info.returns && (
                <details>
                  <summary>🚚 Expédition & Retour</summary>
                  <div className="info-body">{info.returns}</div>
                </details>
              )}
            </div>
          )}

          {product.category === "bijoux" && (
            <div className="info-accordion" style={{ marginTop: 14 }}>
              <details>
                <summary>✨ Qualité &amp; soin</summary>
                <div className="info-body">Acier inoxydable de qualité, contrôlé avant l'envoi. Gravure laser durable. Personnalisé en France, avec soin.</div>
              </details>
              <details>
                <summary>🧼 Conseils d'entretien</summary>
                <div className="info-body">Évitez l'eau de Javel, le parfum et les produits ménagers. Rangez votre bijou à l'abri de l'humidité pour qu'il garde son éclat.</div>
              </details>
            </div>
          )}
        </div>
      </div>

      {any3d && !isWide && showMini && (
        <div className="engrave3d-mini">
          {(product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) ? (
            <EngraveGourmette3D text={gourmetteText} fontKey={fieldValues[fontField?.key] || "playfair"} finish={braceletFin} band={braceletBand} slim={braceletSlim} decor={product.decor3d || ""} height={200} showHint={false} />
          ) : product.engravePlate3d ? (
            <EngravePlate3D faces={plateFaces} motifPos={fieldValues["textPos"]} photo={photoSrc} photoFace={fieldValues["photoFace"] || "recto"} finish={plateFinish} fontKey={fieldValues[fontField?.key] || "playfair"} height={200} showHint={false} />
          ) : product.engraveEnvelope3d ? (
            <EngraveEnvelope3D faces={envFaces} finish={envFinish} twoSided={envTwoSided} fontKey={fieldValues[fontField?.key] || "playfair"} height={200} showHint={false} />
          ) : product.engraveBook3d ? (
            <EngraveBook3D faces={bookFaces} motifs={bookMotifs} motifPositions={bookMotifPositions} finish={bookFinish} fontKey={fieldValues[fontField?.key] || "playfair"} height={200} showHint={false} />
          ) : product.engraveHeart3d ? (
            <EngraveHeart3D faces={heartFaces} finish={finishHeart} fontKey={fieldValues[fontField?.key] || "playfair"} photo={heartPhoto} photoIndex={heartPhotoIndex} height={200} showHint={false} />
          ) : (
            <Engrave3D faces={faceTexts} finish={finish3d} fontKey={fieldValues[fontField?.key] || "playfair"} motifs={motifVals} direction={direction3d} motifPositions={motifPositions} height={200} showHint={false} />
          )}
        </div>
      )}
    </div>
  );
}
