"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { formatEuro, roundTo90 } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import { getProductInfo } from "@/lib/productInfo";
import CrystalSizeGuide from "@/components/CrystalSizeGuide";
import { engravingExtra } from "@/lib/engravingPrice";
import { packagingExtra } from "@/lib/packaging";
import PayInfoModal from "@/components/PayInfo";
import { track, trackOnce } from "@/lib/track";
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
import CrystalTextDrag from "./CrystalTextDrag";
import DesignAssistant from "./DesignAssistant";
import BadgeDesigner from "./BadgeDesigner";
import ModeleDesigner from "./ModeleDesigner";
import CouvertsDesigner from "./CouvertsDesigner";
import CustomRequestBox from "./CustomRequestBox";
import ModeleEngraveLayer from "./ModeleEngraveLayer";
import MotifEngraveLayer from "./MotifEngraveLayer";
import { Motif } from "./Motif";
import { MODELES, defaultModele, layoutLabel, imageDesign } from "@/lib/modeles";
import { MOTIF_LIST } from "./Motif";
import PhotoEngraveLayer from "./PhotoEngraveLayer";
import TextEngraveLayer from "./TextEngraveLayer";
import Glass3D from "./Glass3D";
import ZoomThumb from "./ZoomThumb";

// Couleur d'aperçu de la gravure (foncé, pour la lisibilité à l'écran). Le rendu
// réel dépoli/givré est montré au client via une vraie photo d'exemple.
const ENGRAVE_PREVIEW = "#3a2f1d";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [personalization, setPersonalization] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [pkgSel, setPkgSel] = useState([]); // emballages payants choisis (ids)
  const [added, setAdded] = useState(false);
  const [preparing, setPreparing] = useState(false); // capture du visuel en cours
  const [error, setError] = useState("");
  const [photoLayout, setPhotoLayout] = useState(null); // taille/position du logo gravé (face)
  const [textLayout, setTextLayout] = useState(null); // taille/position du texte gravé (face)
  const [crystalTextPos, setCrystalTextPos] = useState(null);
  const [crystalZone, setCrystalZone] = useState(null); // zone de gravure réglée dans l'admin
  const [crystalPreviewActive, setCrystalPreviewActive] = useState(true); // affiche l'aperçu OU les photos produit // placement du texte sur l'aperçu cristal
  const [photoLayoutFond, setPhotoLayoutFond] = useState(null); // idem côté fond (mode "les deux")
  const [textLayoutFond, setTextLayoutFond] = useState(null);
  const [activeSide, setActiveSide] = useState("face"); // côté en cours de réglage (mode "les deux")
  const [motifLayoutFond, setMotifLayoutFond] = useState(null); // placement du dessin au fond
  const [modeleLayout, setModeleLayout] = useState(null); // taille/position d'un modèle de gravure
  const [show3d, setShow3d] = useState(false); // aperçu 3D du verre (rotatif)

  const [stockMap, setStockMap] = useState({});
  // Galerie initiale : si le produit a des galeries par modèle (genderPick),
  // on part de celle du 1er modèle (sinon toutes les photos mélangées).
  const [images, setImages] = useState(
    product.genderPick && product.variants?.[0]?.gallery?.length
      ? product.variants[0].gallery
      : product.images
  );
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
  // Statistiques « produit vu » : compteur intégré (1 fois/produit par session,
  // frugal) + Google Analytics (si un ID GA est réglé).
  useEffect(() => {
    trackOnce("vi-" + product.slug, "view_item", { slug: product.slug });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "view_item", {
        currency: "EUR",
        value: product.variants?.[0]?.price || 0,
        items: [{ item_id: product.slug, item_name: product.name, item_category: product.category }],
      });
    }
  }, [product.slug]);
  // Mobile : le mini 3D flottant apparaît quand la photo est sortie de l'écran
  // et que le grand 3D (en bas) n'est pas encore visible.
  useEffect(() => {
    if (isWide || !(product.engrave3d || product.engraveHeart3d || product.engraveBook3d || product.engraveEnvelope3d || product.engravePlate3d || product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d || product.crystal3d)) { setShowMini(false); return; }
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
  }, [isWide, product.engrave3d, product.engraveHeart3d, product.engraveBook3d, product.engraveEnvelope3d, product.engravePlate3d, product.engraveGourmette3d, product.engraveSilicone3d, product.engraveLeather3d, product.engraveBar3d, product.crystal3d]);
  useEffect(() => {
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => setStockMap(d.stock || {}))
      .catch(() => {});
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        const ov = d.images?.[product.slug];
        if (ov && ov.length && !product.lockImages && !product.genderPick) setImages(ov);
        setPromos(d.promos || {});
      })
      .catch(() => {});
  }, [product.slug]);
  // Zone de gravure du cristal réglée dans l'admin (/gestion/cristal-reglage).
  useEffect(() => {
    if (!product.crystal3d) return;
    fetch("/api/crystal-zones")
      .then((r) => r.json())
      .then((d) => { const z = d.zones?.[product.slug]; if (z && z.img) setCrystalZone(z); })
      .catch(() => {});
  }, [product.slug, product.crystal3d]);

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
    const v = product.variants[i];
    // Modèle avec sa propre galerie (genderPick) : on remplace la galerie entière
    // par les photos de ce modèle → Garçon = photos garçon, Fille = photos fille.
    if (v?.gallery?.length) {
      setImages(v.gallery);
      setActiveImg(0);
      return;
    }
    const img = v?.image;
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
  const engrave = engravingExtra(product, fieldValues, variant.id);
  // Supplément d'emballage (écrin / pochette choisis) — le sachet offert est inclus d'office.
  const pkg = packagingExtra(product, pkgSel);
  // Prix « si acheté séparément » = somme des emballages individuels (hors pack, hors offert).
  // Sert à afficher l'économie du pack (prix barré → prix pack).
  const pkgSinglesSum = Math.round((product.packaging?.options || [])
    .filter((x) => !/pack/i.test(x.name) && !x.free)
    .reduce((s, x) => s + (Number(x.price) || 0), 0) * 100) / 100;
  const basePrice = hasPromo ? salePrice : variant.price;
  const unitPrice = basePrice + engrave.amount + pkg.amount;
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
        .filter((f) => f.type !== "note" && f.type !== "modele" && f.type !== "couverts")
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
      // Couverts enfants : thème + un animal par couvert.
      const cField = visibleFields.find((f) => f.type === "couverts");
      if (cField) {
        const cv = fieldValues[cField.key];
        if (cv && cv.animals) {
          const th = (cField.themes || []).find((t) => t.key === cv.theme);
          const lines = (cField.pieces || [])
            .map((p) => {
              const ak = cv.animals[p.key];
              const al = ak ? ((th?.animals || []).find((a) => a.key === ak) || {}).label : null;
              return al ? `${p.label} : ${al}` : null;
            })
            .filter(Boolean);
          if (lines.length) {
            parts.push(forClient
              ? `Animaux (${th?.label || cv.theme}) — ${lines.join(", ")}`
              : `Thème ${th?.label || cv.theme} · ${lines.join(" · ")}`);
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
      // Cristal : placement du texte choisi par le client (glisser-déposer).
      if (product.crystal3d && previewLines.length > 0 && crystalTextPos?.label) {
        parts.push(`Texte gravé placé : ${crystalTextPos.label}`);
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
  // Quand la cliente charge/change sa photo, on réaffiche l'aperçu cristal.
  useEffect(() => { if (photoSrc) setCrystalPreviewActive(true); }, [photoSrc]);
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
  // Vidéo produit (mp4) : ajoutée EN PREMIER dans la galerie si le produit en a une.
  // Pour les produits sans vidéo, galleryMedia === images (aucun changement).
  const galleryMedia = product.video ? [product.video, ...images] : images;
  const activeMedia = galleryMedia[activeImg] ?? mainSrc;
  const activeIsVideo = /\.(mp4|webm|ogv|mov)$/i.test(String(activeMedia || ""));
  const onFaceImg = images[activeImg] === product.engraveImage;
  const onFondImg = images[activeImg] === product.fondImage;
  const showEditor = Boolean(product.engrave) && ((side === "face" && onFaceImg) || (side === "fond" && onFondImg));
  // Photo dédiée au fond (mode "les deux")
  const photoUrlFond = fieldValues["photoFond"] || "";
  const photoSrcFond = photoUrlFond && (photoUrlFond.startsWith("http") || photoUrlFond.startsWith("data:") || photoUrlFond.startsWith("/")) ? photoUrlFond : "";
  // Matière de l'échantillon témoin (aperçu) selon le type de produit.
  const material =
    product.crystal3d ? "crystal" : product.category === "mariage" ? "wood" : "metal";
  const previewFontClass = getFontClass(fieldValues[fontField?.key] || "playfair");
  const previewColor = (colorField && fieldValues[colorField.key]) || ENGRAVE_PREVIEW;

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
    return new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = "anonymous"; // évite le canvas "contaminé" sur iOS (CDN)
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
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
  // IMPORTANT : on charge le PNG (pas le SVG) — sur iOS, dessiner un SVG sur un
  // canvas le « contamine » et fait échouer toDataURL (verre vide). Le PNG, non.
  async function tintedMotif(id, color, sizePx) {
    try {
      const im = await loadImg(`/motifs/${id}.png`);
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
        (f) => f.type !== "note" && f.type !== "modele" && f.type !== "couverts" && !f.optional && !(fieldValues[f.key] || "").trim()
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
        // Base stable pour composer : le verre gravable propre (jamais une photo d'exemple).
        const glass = product.engraveImage || images[0];
        const faceBox = (product.engrave && product.engrave.box) || { left: 0.2, top: 0.2, width: 0.6, height: 0.6 };
        const fondBox = (product.engraveFond && product.engraveFond.box) || { left: 0.3, top: 0.3, width: 0.4, height: 0.4 };
        // FACE : photo envoyée, sinon design image choisi (Fête des pères) — version foncée.
        const faceArt = photoSrc || (dsg ? dsg.dark : null);
        if (faceArt) {
          // GARANTI : on montre au moins l'image/design choisi (même si le canvas
          // échoue sur certains tel.). Puis on tente la jolie compo sur le verre.
          artworkImage = faceArt;
          previewImage = faceArt;
          try {
            const composed = await composeOnGlass(glass, faceArt, faceBox);
            const up = await uploadDataUrl(composed);
            // On garde une URL/chemin (jamais un data: qui serait retiré à la
            // sauvegarde de la commande). Si l'envoi échoue, on garde le design.
            previewImage = up || faceArt;
          } catch { /* on garde faceArt */ }
        } else if (modeleField) {
          // Cas texte/motif (ex. Classique) : on dessine le modèle sur le verre (canvas).
          const composed = await renderModele(modeleVal, modeleTemplate, ENGRAVE_PREVIEW, { glassUrl: glass, box: faceBox });
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
      layout: { photo: photoLayout || null, text: textLayout || null, modele: modeleLayout || null, photoFond: photoLayoutFond || null, textFond: textLayoutFond || null, motifFond: motifLayoutFond || null, crystalText: crystalTextPos || null },
      // on évite de stocker deux fois le modèle (déjà dans "modele")
      fields: (() => { const { modele, ...rest } = fieldValues; return rest; })(),
      personalization: buildPersonalization(),
      packaging: pkg.labels.length ? pkg.labels.join(", ") : null, // emballage pour la fiche atelier
    };
    addItem({
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      price: unitPrice,
      // Vignette panier = le visuel composé ; sinon l'image/design choisi ; sinon photo produit.
      image: previewImage || photoSrc || artworkImage || images[0] || null,
      // Côté cliente : récap court (les détails techniques restent pour l'atelier).
      personalization: buildPersonalization(true),
      fields: product.engravingPricing ? { ...fieldValues } : undefined,
      packaging: pkg.chosen, // emballages choisis (ids) → recalcul serveur au paiement
      spec: itemSpec,
      pickup: Boolean(product.pickup),
      weight: (Number(variant.weight) || Number(product.weight) || 200) + (engrave.weight || 0) + (pkg.weight || 0), // poids (g) réel par taille + options (socle, emballage) — port & retrait corrects
      quantity,
    });
    // Statistiques « ajout au panier » : compteur intégré + Google Analytics.
    track("add_to_cart", { slug: product.slug, value: Number((unitPrice * quantity).toFixed(2)) });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "add_to_cart", {
        currency: "EUR",
        value: Number((unitPrice * quantity).toFixed(2)),
        items: [{ item_id: variant.id, item_name: product.name, item_variant: variant.title, price: unitPrice, quantity }],
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="container">
      <div className="product-layout">
        {/* Galerie */}
        <div>
          <div className={`gallery-main${modeleField ? " toolbar-bottom" : ""}${product.crystal3d ? " gallery-contain" : ""}`} ref={photoRef}>
            {activeIsVideo ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                className="gallery-bg gallery-video"
                src={activeMedia}
                poster={product.videoPoster || images[0]}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : hasImages ? (
              <Image
                className="gallery-bg"
                src={activeMedia}
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
            {/* Cristal 3D : dès que le client charge SA photo, elle s'affiche
                ici en GRAND dans un cristal (comme la maquette test). */}
            {product.crystal3d && photoSrc && crystalPreviewActive && (
              crystalZone ? (
                /* Aperçu RÉEL : la photo du client s'incruste dans la vraie photo du cristal,
                   à la zone réglée dans l'admin (/gestion/cristal-reglage). */
                <div className="crystal-hero crystal-real">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cr-bg" src={crystalZone.img} alt="" />
                  <div
                    className="cr-overlay"
                    style={{ left: crystalZone.left + "%", top: crystalZone.top + "%", width: crystalZone.width + "%", height: crystalZone.height + "%", transform: `perspective(900px) rotateX(${crystalZone.rx || 0}deg) rotateY(${crystalZone.ry || 0}deg) rotate(${crystalZone.rotation || 0}deg)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="cr-photo"
                      src={photoSrc}
                      alt="Votre photo dans le cristal"
                      style={{ opacity: crystalZone.opacity ?? 0.72, mixBlendMode: crystalZone.blend || "screen", filter: (crystalZone.bw ? "grayscale(1) " : "") + "contrast(1.12) brightness(1.08)" }}
                    />
                  </div>
                  <span className="ch-badge">✓ Votre aperçu</span>
                </div>
              ) : (
              <div className="crystal-hero">
                <div className="ch-wrap">
                  <div className={`ch-block${product.crystalShape ? " ch-" + product.crystalShape : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ch-photo" src={photoSrc} alt="Votre photo dans le cristal" />
                    {previewLines.length > 0 && (
                      <div className="ch-text" style={{ left: (crystalTextPos?.x ?? 50) + "%", top: (crystalTextPos?.y ?? 78) + "%", fontSize: `calc(clamp(1.1rem, 4vw, 1.9rem) * ${crystalTextPos?.scale ?? 1})` }}>
                        {previewLines.map((l, i) => (
                          <span key={i} className={previewFontClass}>{l}</span>
                        ))}
                      </div>
                    )}
                    <span className="ch-shine" aria-hidden="true" />
                  </div>
                </div>
                <span className="ch-badge">✓ Votre aperçu</span>
              </div>
              )
            )}
            {/* (L'aperçu de la photo se fait aussi dans la case « cristal » dédiée
                plus bas — pas de superposition sur la photo produit réelle,
                qui serait mal alignée.) */}
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
                color={ENGRAVE_PREVIEW}
                cfg={editCfg}
                onChange={setModeleLayout}
              />
            )}
            {/* Fête des pères, côté FOND (mode "les deux") : un DESSIN au choix */}
            {hasImages && showEditor && modeleField && dualMode && side === "fond" && fieldValues["fondType"] === "dessin" && fieldValues["motifFond"] && fieldValues["motifFond"] !== "aucun" && (
              <MotifEngraveLayer key="motif-fond" motifId={fieldValues["motifFond"]} color={ENGRAVE_PREVIEW} cfg={editCfg} onChange={setMotifLayoutFond} />
            )}
            {/* Sinon : simple superposition du logo (zone fixe) */}
            {hasImages && !product.engrave && !product.crystal3d && (product.previewPhoto || product.preview) && photoSrc && (
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
            {galleryMedia.length > 1 && (
              <>
                <button type="button" className="gallery-arrow gallery-arrow-prev" aria-label="Photo précédente"
                  onClick={() => { setActiveImg((activeImg - 1 + galleryMedia.length) % galleryMedia.length); setCrystalPreviewActive(false); }}>‹</button>
                <button type="button" className="gallery-arrow gallery-arrow-next" aria-label="Photo suivante"
                  onClick={() => { setActiveImg((activeImg + 1) % galleryMedia.length); setCrystalPreviewActive(false); }}>›</button>
              </>
            )}
          </div>
          {product.engrave && (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontStyle: "italic", margin: "10px 2px 0", lineHeight: 1.4 }}>
              Aperçu affiché en foncé pour la lisibilité. <strong>Le rendu réel sera dépoli (effet givré sur le verre)</strong>, à peu près comme la photo d'exemple.
            </p>
          )}
          {product.crystal3d && photoSrc && (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontStyle: "italic", margin: "10px 2px 0", lineHeight: 1.4 }}>
              Aperçu <strong>indicatif</strong> : votre photo est simplement posée sur une image du cristal pour vous donner une idée. Le rendu réel est une <strong>gravure 3D au laser à l'intérieur du cristal</strong>, retravaillée par notre atelier pour un résultat optimal.
            </p>
          )}
          {(galleryMedia.length > 1 || (product.crystal3d && photoSrc)) && (
            <div className="gallery-thumbs">
              {product.crystal3d && photoSrc && (
                <button
                  className={crystalPreviewActive ? "active" : ""}
                  onClick={() => setCrystalPreviewActive(true)}
                  aria-label="Voir votre aperçu"
                  title="Votre aperçu"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc} alt="" />
                </button>
              )}
              {galleryMedia.map((m, i) => {
                const isVid = /\.(mp4|webm|ogv|mov)$/i.test(String(m));
                return (
                  <button
                    key={m}
                    className={`${!crystalPreviewActive && i === activeImg ? "active" : ""}${isVid ? " thumb-video" : ""}`}
                    onClick={() => { setActiveImg(i); setCrystalPreviewActive(false); }}
                    aria-label={isVid ? "Voir la vidéo" : `Voir le visuel ${i + 1}`}
                  >
                    {isVid ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={m} muted playsInline preload="metadata" poster={product.videoPoster || images[0]} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m} alt="" />
                    )}
                  </button>
                );
              })}
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

          {!product.noCustomCta && (product.category === "mariage" || product.category === "cadeaux" || product.category === "verres" || product.category === "deco") && (
            <CustomRequestBox product={product} />
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
          <h1>{product.heading || product.title}</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          {product.rating?.count > 0 && (
            <button
              type="button"
              className="pd-rating"
              title="Voir les avis"
              onClick={() => document.getElementById("avis")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="pd-stars" aria-hidden="true">
                {"★★★★★".slice(0, Math.round(product.rating.avg))}
                <span className="pd-stars-empty">{"★★★★★".slice(Math.round(product.rating.avg))}</span>
              </span>
              <strong>{product.rating.avg.toFixed(1).replace(".", ",")}/5</strong>
              <span className="pd-rating-count">· {product.rating.count} avis</span>
            </button>
          )}
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

          {product.variants.length > 1 && product.genderPick && (
            <div className="field">
              <div className="step-label">1. Choisissez le modèle</div>
              <div className="gender-pick">
                {product.variants.map((v, i) => {
                  const g = /fille/i.test(v.title) ? "f" : "g";
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`gp-btn ${g}${i === variantIndex ? " active" : ""}`}
                      onClick={() => selectVariant(i)}
                      aria-pressed={i === variantIndex}
                    >
                      <span className="gp-dot" /> {g === "f" ? "Fille" : "Garçon"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.variants.length > 1 && !product.genderPick && (
            <div className="field">
              <label>{hasVariantImages ? "Choisissez votre modèle" : "Choisissez votre option"}</label>
              <div className={`variant-swatches${product.crystal3d ? " crystal-sizes" : ""}`}>
                {product.variants.map((v, i) => {
                  // Cristal : on scinde « Nom — dimensions (personnes) » comme la maquette.
                  const cm = product.crystal3d ? v.title.split(/\s+—\s+/) : null;
                  const vName = cm ? cm[0] : v.title;
                  const vSub = cm && cm[1] ? cm[1] : "";
                  // Stock de CETTE option : si à 0, on marque l'option « Épuisé ».
                  const vStock = stockMap[v.stockId || v.id];
                  const vOut = typeof vStock === "number" && vStock <= 0;
                  return (
                  <button
                    key={v.id}
                    type="button"
                    className={`variant-swatch${i === variantIndex ? " active" : ""}${v.image ? " has-img" : ""}${vOut ? " sold-out" : ""}`}
                    onClick={() => selectVariant(i)}
                    aria-pressed={i === variantIndex}
                  >
                    {vOut && <span className="vs-out">Épuisé</span>}
                    {v.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image} alt="" />
                    )}
                    <span className="vs-title">{vName}</span>
                    {vSub && <span className="vs-sub">{vSub}</span>}
                    <span className="vs-price">
                      {typeof v.compareAt === "number" && v.compareAt > v.price && (
                        <span className="vs-old">{formatEuro(old90(v.compareAt))}</span>
                      )}
                      <span className="vs-now">{formatEuro(v.price)}</span>
                    </span>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Champs de gravure dynamiques (selon l'option choisie) */}
          {product.personalizationFields ? (
            <div style={{ marginBottom: 6 }}>
              {product.genderPick ? (
                <div className="step-label">2. Personnalisez la gravure</div>
              ) : (
                <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12 }}>
                  Personnalisation — gravure
                </p>
              )}
              {visibleFields.map((f) => {
                if (f.type === "note") {
                  // La photo peut changer selon la taille choisie (ex. socle : petit → carré, autres → rectangle).
                  const noteImg = (f.imageByVariant && f.imageByVariant[variant.id]) || f.image;
                  return (
                    <div key={f.key}>
                      {f.text && <p className="perso-hint">{f.text}</p>}
                      {noteImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={noteImg} alt={f.imageAlt || "Conseils pour réussir votre photo"} className="perso-hint-img" />
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
                      <p className="photo-check-note">
                        Votre photo est vérifiée par notre atelier avant la gravure. Si elle est trop floue, trop sombre ou de qualité insuffisante pour un beau rendu, nous vous recontactons pour la confirmer ou en choisir une autre — afin que votre souvenir soit parfait.
                      </p>
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
                if (f.type === "couverts") {
                  return (
                    <CouvertsDesigner
                      key={f.key}
                      field={f}
                      value={fieldValues[f.key]}
                      onChange={(val) => setField(f.key, val)}
                      prenom={fieldValues["prenom"] || ""}
                      fontKey={fieldValues["police"] || ""}
                    />
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
                      <label className="modele-check"><input type="checkbox" checked={faceOn} onChange={(e) => setSides(e.target.checked, fondOn)} /><span>Graver sur la face avant</span></label>
                      <label className="modele-check"><input type="checkbox" checked={fondOn} onChange={(e) => setSides(faceOn, e.target.checked)} /><span>Graver au fond du verre</span></label>
                      {faceOn && fondOn && <p className="char-count" style={{ textAlign: "left", color: "var(--gold-dark)" }}>Les deux côtés : +7 €</p>}
                    </div>
                  );
                }
                if (f.type === "font" || f.type === "select" || f.type === "color") {
                  const opts = f.type === "font" ? FONTS.map((x) => ({ value: x.key, label: x.label })) : f.options || [];
                  // Option "à prix" (ex. socle) : le prix affiché dépend de la taille choisie.
                  const priceForOpt = (optValue) => {
                    if (!f.priced) return null;
                    const fe = (product.engravingPricing?.flatExtras || []).find((e) => e.key === f.key && e.value === optValue);
                    if (!fe) return null;
                    const amt = (fe.amountByVariant && fe.amountByVariant[variant.id] != null) ? fe.amountByVariant[variant.id] : (fe.amount || 0);
                    return amt > 0 ? amt : null;
                  };
                  return (
                    <div className="field" key={f.key}>
                      {labelEl}
                      <select
                        id={`pf-${f.key}`}
                        value={fieldValues[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                      >
                        <option value="">— Choisir —</option>
                        {opts.map((o) => {
                          const amt = priceForOpt(o.value);
                          const label = amt ? `${o.label} — +${amt.toFixed(2).replace(".", ",")} €` : o.label;
                          return <option key={o.value} value={o.value}>{label}</option>;
                        })}
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
                <>
                <div className="engrave-preview" ref={product.crystal3d ? big3dRef : null}>
                  <span className="ep-label">
                    Aperçu témoin de la gravure
                    {fontField && fieldValues[fontField.key] ? ` — ${getFontLabel(fieldValues[fontField.key])}` : ""}
                  </span>
                  <div className={`ep-plate ${material}`}>
                    {photoSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="ep-crystal-photo" src={photoSrc} alt="" />
                    )}
                    {material === "crystal" && <span className="ep-shine" aria-hidden="true" />}
                    {previewLines.length ? (
                      material === "crystal" ? (
                        <CrystalTextDrag lines={previewLines} fontClass={previewFontClass} onChange={setCrystalTextPos} />
                      ) : (
                        previewLines.map((line, i) => (
                          <span key={i} className={`ep-line ${previewFontClass}`} style={{ color: previewColor }}>
                            {line}
                          </span>
                        ))
                      )
                    ) : (
                      !photoSrc && (
                        <span className="ep-empty">
                          {material === "crystal"
                            ? "Votre photo apparaîtra ici, dans le cristal…"
                            : "Votre texte gravé apparaîtra ici…"}
                        </span>
                      )
                    )}
                  </div>
                  {material === "crystal" && previewLines.length > 0 && (
                    <span className="char-count" style={{ textAlign: "left", color: "var(--ink-soft)" }}>
                      ✋ Glissez le texte pour le placer, et la poignée dorée pour changer sa taille.
                    </span>
                  )}
                </div>
                </>
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

          {product.packaging?.on && product.packaging.options?.length > 0 && (
            <div style={{ margin: "6px 0 18px" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 3 }}>Votre emballage</div>
              <p style={{ margin: "0 0 10px", color: "var(--ink-soft)", fontSize: "0.83rem" }}>
                Choisissez votre présentation cadeau.
              </p>
              <div style={{ display: "grid", gap: 9 }}>
                {/* Sans emballage (choix par défaut) */}
                {(() => {
                  const none = pkgSel.length === 0;
                  return (
                    <button type="button" onClick={() => setPkgSel([])}
                      style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer", font: "inherit", border: none ? "1.5px solid var(--gold)" : "1.5px solid var(--line)", background: none ? "#fffaf0" : "var(--paper)", borderRadius: 12, padding: "11px 13px", boxShadow: none ? "0 0 0 2px rgba(194,161,78,.22)" : "none" }}>
                      <span style={{ fontSize: "1.3rem" }}>✖️</span>
                      <span style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: "0.9rem" }}>{none ? "✓ " : ""}Sans emballage cadeau</strong><span style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>Livré protégé, sans boîte</span></span>
                      <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: "0.85rem" }}>0 €</span>
                    </button>
                  );
                })()}
                {product.packaging.options.map((o) => {
                  const on = pkgSel[0] === o.id;
                  const isPack = /pack/i.test(o.name);
                  // Côté client, les packs s'affichent tous « Pack boîte cadeau »
                  // (dans l'admin ils gardent Pack Collier / Pack Bracelet).
                  const clientName = isPack ? "Pack boîte cadeau" : o.name;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setPkgSel([o.id])}
                      style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer", font: "inherit", border: on || isPack ? "1.5px solid var(--gold)" : "1.5px solid var(--line)", background: on ? "#fffaf0" : (isPack ? "linear-gradient(180deg,#fffaf0,#fff)" : "var(--paper)"), borderRadius: 12, padding: "11px 13px", boxShadow: on ? "0 0 0 2px rgba(194,161,78,.22)" : "none" }}
                    >
                      {o.photo ? <ZoomThumb photo={o.photo} label={clientName} size={40} /> : <span style={{ fontSize: "1.3rem" }}>{isPack ? "✨" : "🎁"}</span>}
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: "0.9rem" }}>{on ? "✓ " : ""}{clientName}{isPack && <span style={{ display: "inline-block", whiteSpace: "nowrap", background: "var(--gold)", color: "#1a1206", fontSize: "0.6rem", fontWeight: 800, letterSpacing: ".2px", borderRadius: 20, padding: "2px 8px", marginLeft: 6, verticalAlign: "middle" }}>MEILLEUR CHOIX</span>}</strong>
                        {o.desc && <span style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>{o.desc}</span>}
                      </span>
                      <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {isPack && pkgSinglesSum > o.price && (
                          <span style={{ color: "var(--ink-soft)", textDecoration: "line-through", fontWeight: 400, fontSize: "0.78rem", marginRight: 5 }}>{formatEuro(pkgSinglesSum)}</span>
                        )}
                        {o.price > 0 ? "+" + formatEuro(o.price) : "Offert"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="notice">{error}</div>}

          {/* Total « tout compris » (option + gravure + emballage) dans un encadré doré. */}
          {!soldOut && (
            <div className="pd-totbox">
              <span className="lab">Total tout compris</span>
              <span className="val">{formatEuro(unitPrice * quantity)}</span>
            </div>
          )}
          {/* Paiement en plusieurs fois — juste après le total, avant le bouton */}
          <p className="pd-nfois">
            💳 <strong>Payez en plusieurs fois sans frais</strong> — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €). <PayInfoModal label="En savoir plus" className="pd-nfois-link" />
          </p>
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
              {soldOut ? "Épuisé" : preparing ? "Préparation du visuel…" : added ? "Ajouté au panier ✓" : "Ajouter au panier"}
            </button>
          </div>
          {/* Stock masqué pour les clientes : on n'affiche QUE l'alerte « épuisé »
             (le compteur exact reste visible dans la gestion). */}
          {soldOut && (
            <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#b4452f" }}>
              Cette option est momentanément épuisée.
            </p>
          )}

          {product.pickup && (
            <div style={{ marginTop: 12, background: "#fbf4e6", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 14px", fontSize: "0.88rem" }}>
              <strong>📍 Retrait en main propre possible</strong> — atelier dans le <strong>Val-d'Oise (95)</strong> et alentours, gratuit, sur rendez-vous (choisissez l'option au paiement).
              <br /><span style={{ color: "#7a6f5c" }}>Proposé uniquement pour les articles de mariage.</span>
              <br />C'est vous qui venez récupérer votre commande à l'atelier, sous <strong>14 jours</strong> après notre message « commande prête ». Passé ce délai, la commande ne pourra plus être ni retirée, ni expédiée.
              <br />Vous habitez plus loin et souhaitez quand même venir récupérer ? Écrivez-nous <strong>avant de commander</strong> : <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a>.
            </div>
          )}

          <div className="trust-cards">
            <div className="tcard fr"><span className="ti">🇫🇷</span><span><b>{originLabel}</b><small>Dans notre atelier</small></span></div>
            <div className="tcard pay"><span className="ti">🔒</span><span><b>Paiement sécurisé</b><small>Carte &amp; PayPal</small></span></div>
            <div className="tcard hand"><span className="ti">✋</span><span><b>Fait main</b><small>Pièce unique</small></span></div>
            <div className="tcard ship"><span className="ti">🚚</span><span><b>Livraison suivie</b><small>Colis &amp; point relais</small></span></div>
          </div>
          <div className="pd-perso">
            <b>✦ Pièce personnalisée</b>
            <p>🕒 Personnalisé à la commande : fabrication 2 à 5 jours ouvrés + expédition 2 à 4 jours ouvrés.</p>
          </div>

          <div
            className="product-desc"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />

          {product.crystal3d && product.variants.length > 1 && (
            <CrystalSizeGuide horizontal={product.slug.includes("horizontal")} />
          )}

          {/* Argument « fait main » sur la déco & le mariage (vend le savoir-faire). */}
          {(product.category === "mariage" || product.category === "deco") && (
            <div style={{ background: "linear-gradient(135deg,#fbf4e6,#fffdf9)", border: "1px solid #e7d3a1", borderRadius: 14, padding: "16px 18px", margin: "18px 0 4px" }}>
              <strong style={{ color: "var(--gold-dark)", display: "block", marginBottom: 6 }}>✦ Fait main dans notre atelier français</strong>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: 1.55 }}>
                Chaque pièce est <strong>découpée et finie à la main chez nous</strong> — pas de production de masse, pas de fabrication en chaîne. La découpe laser permet des détails impossibles en grande série. Vous recevez une <strong>création unique</strong>, en matières naturelles, pensée pour durer et pour offrir.
              </p>
            </div>
          )}

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

      {(any3d || product.crystal3d) && !isWide && showMini && (photoSrc || previewLines.length > 0 || !product.crystal3d) && (
        <div className={`engrave3d-mini${product.crystal3d ? (crystalZone ? " crystal crystal-real" : " crystal") : ""}`}>
          {product.crystal3d && crystalZone ? (
            <div className="cm-real">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cr-bg" src={crystalZone.img} alt="" />
              <div
                className="cr-overlay"
                style={{ left: crystalZone.left + "%", top: crystalZone.top + "%", width: crystalZone.width + "%", height: crystalZone.height + "%", transform: `perspective(900px) rotateX(${crystalZone.rx || 0}deg) rotateY(${crystalZone.ry || 0}deg) rotate(${crystalZone.rotation || 0}deg)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cr-photo" src={photoSrc} alt="" style={{ opacity: crystalZone.opacity ?? 0.72, mixBlendMode: crystalZone.blend || "screen", filter: (crystalZone.bw ? "grayscale(1) " : "") + "contrast(1.12) brightness(1.08)" }} />
              </div>
            </div>
          ) : product.crystal3d ? (
            <div className={`cm-block${product.crystalShape ? " cm-" + product.crystalShape : ""}`}>
              {photoSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="cm-photo" src={photoSrc} alt="" />
              )}
              <span className="cm-shine" />
              {previewLines.length > 0 && (
                <div className="cm-text" style={{ left: (crystalTextPos?.x ?? 50) + "%", top: (crystalTextPos?.y ?? 78) + "%" }}>
                  {previewLines.map((l, i) => (
                    <span key={i} className={previewFontClass}>{l}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) ? (
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
