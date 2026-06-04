"use client";

import { useEffect, useRef, useState } from "react";
import { FLOWER_URLS, GLYPHS } from "@/lib/motifs";

// Aperçu 3D d'un bijou à forme simple (collier barre / plaque).
// Vraie 3D WebGL (Three.js) : métal + reflets, gravure en relief sur les 4 faces.
// Motifs : vrais dessins (images) ou symboles. À titre indicatif.

const FINISH = {
  silver: { base: "#d7d7d7", ink: "rgba(22,20,18,0.92)" },
  gold:   { base: "#d4af37", ink: "rgba(35,26,8,0.92)" },
  rose:   { base: "#dba8a1", ink: "rgba(45,24,22,0.92)" },
  black:  { base: "#2d2d2d", ink: "rgba(235,235,235,0.92)" },
  rainbow:{ base: "#cfd6dd", ink: "rgba(25,22,24,0.9)" },
};

const FONT_MAP = {
  playfair: "Georgia, 'Times New Roman', serif",
  cinzel: "Georgia, serif",
  "cinzel-deco": "Georgia, serif",
  montserrat: "Arial, Helvetica, sans-serif",
  inter: "Arial, Helvetica, sans-serif",
  "great-vibes": "'Snell Roundhand', 'Brush Script MT', cursive",
  allura: "'Snell Roundhand', 'Brush Script MT', cursive",
  pacifico: "'Bradley Hand', cursive",
};

const BAR = { W: 0.5, H: 2.6, D: 0.5 };
const TEX = { wPx: 180, hPx: Math.round(180 * (2.6 / 0.5)) };

const VS_TEXT = String.fromCharCode(0xFE0E); // force le rendu monochrome (anti emoji couleur)

// Vraies polices du site (variables CSS posées par next/font) → utilisées dans le canvas.
const FONT_VAR = {
  playfair: "--font-display", cinzel: "--font-cinzel", "cinzel-deco": "--font-cinzel-deco",
  montserrat: "--font-montserrat", "great-vibes": "--font-great-vibes", allura: "--font-allura",
  pacifico: "--font-pacifico", inter: "--font-body",
};
const SCRIPT_FONTS = new Set(["great-vibes", "allura", "pacifico"]);
function fontSpec(fontKey, sizePx) {
  let fam = FONT_MAP[fontKey] || FONT_MAP.playfair;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(FONT_VAR[fontKey] || "").trim();
    if (v) fam = `${v}, ${fam}`;
  } catch { /* ignore */ }
  const weight = SCRIPT_FONTS.has(fontKey) ? 400 : 600;
  return `${weight} ${sizePx}px ${fam}`;
}

const imageCache = new Map();
function getFlowerImg(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imageCache.set(url, img);
  return img;
}

// Détoure une fleur : fond clair → transparent, lignes sombres → noir net.
// Retourne un canvas (noir sur transparent) prêt à dessiner, ou null si pas prêt.
const processedCache = new Map();
function getProcessedFlower(url) {
  if (processedCache.has(url)) return processedCache.get(url);
  const img = getFlowerImg(url);
  if (!img.complete || !img.naturalWidth) return null;
  const scale = Math.min(1, 700 / Math.max(img.naturalWidth, img.naturalHeight));
  const oc = document.createElement("canvas");
  oc.width = Math.max(1, Math.round(img.naturalWidth * scale));
  oc.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const octx = oc.getContext("2d");
  octx.drawImage(img, 0, 0, oc.width, oc.height);
  let data;
  try { data = octx.getImageData(0, 0, oc.width, oc.height); }
  catch { processedCache.set(url, img); return img; } // si lecture impossible, image brute
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let a = 255 - lum;            // sombre → opaque, clair → transparent
    a = a < 45 ? 0 : Math.min(255, (a - 45) * 1.7);
    d[i] = 12; d[i + 1] = 12; d[i + 2] = 12; d[i + 3] = a;
  }
  octx.putImageData(data, 0, 0);
  processedCache.set(url, oc);
  return oc;
}

// Dessine motif (image ou symbole) + texte (empilé) sur un contexte donné.
function drawFace(ctx, { text, motifVal, fontKey, dir, motifPos, ink, bevel }) {
  const { wPx, hPx } = TEX;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const above = motifPos !== "below"; // motif au-dessus du nom par défaut
  let topReserve = 0, bottomReserve = 0;

  if (motifVal && FLOWER_URLS[motifVal]) {
    const pc = getProcessedFlower(FLOWER_URLS[motifVal]);
    if (pc) {
      const pw = pc.width || pc.naturalWidth;
      const ph = pc.height || pc.naturalHeight;
      let dw = wPx * 0.86;
      let dh = ph * (dw / pw);
      const maxH = hPx * 0.42;
      if (dh > maxH) { dh = maxH; dw = pw * (dh / ph); }
      const dx = (wPx - dw) / 2; // centré horizontalement
      const dy = above ? hPx * 0.03 : hPx - dh - hPx * 0.03;
      ctx.drawImage(pc, dx, dy, dw, dh);
      const used = dh + hPx * 0.05;
      if (above) topReserve = used; else bottomReserve = used;
    }
  } else if (motifVal && GLYPHS[motifVal]) {
    const mSize = wPx * 0.7;
    const my = above ? hPx * 0.1 : hPx * 0.9;
    const m = GLYPHS[motifVal] + VS_TEXT;
    ctx.font = `${mSize}px "Segoe UI Symbol", serif`;
    if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(m, wPx / 2 + 1.2, my + 1.4); }
    ctx.fillStyle = ink; ctx.fillText(m, wPx / 2, my);
    if (above) topReserve = hPx * 0.22; else bottomReserve = hPx * 0.22;
  }

  const chars = (text || "").trim().split("");
  if (chars.length) {
    const areaTop = topReserve;
    const areaBot = hPx - bottomReserve;
    const areaH = areaBot - areaTop;
    const n = chars.length;
    const fontSize = Math.min(wPx * 0.62, (areaH * 0.96) / n);
    const lineH = fontSize * 1.05; // serré
    ctx.font = fontSpec(fontKey, fontSize);
    // dir "up" : le nom commence en BAS et monte ; "down" : commence en haut.
    let firstY, stepY;
    if (dir === "up") { firstY = areaBot - lineH / 2; stepY = -lineH; }
    else { firstY = areaTop + lineH / 2; stepY = lineH; }
    for (let i = 0; i < n; i++) {
      const y = firstY + i * stepY;
      if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(chars[i], wPx / 2 + 1.1, y + 1.2); }
      ctx.fillStyle = ink; ctx.fillText(chars[i], wPx / 2, y);
    }
  }
}

function faceAlbedo(text, motifVal, finishKey, fontKey, dir, motifPos) {
  const { wPx, hPx } = TEX;
  const f = FINISH[finishKey] || FINISH.silver;
  const c = document.createElement("canvas");
  c.width = wPx; c.height = hPx;
  const ctx = c.getContext("2d");
  if (finishKey === "rainbow") {
    const g = ctx.createLinearGradient(0, 0, 0, hPx);
    g.addColorStop(0, "#ff9ec4"); g.addColorStop(0.34, "#9ec9ff");
    g.addColorStop(0.67, "#9effc0"); g.addColorStop(1, "#ffd89e");
    ctx.fillStyle = g;
  } else { ctx.fillStyle = f.base; }
  ctx.fillRect(0, 0, wPx, hPx);
  drawFace(ctx, { text, motifVal, fontKey, dir, motifPos, ink: f.ink, bevel: true });
  return c;
}

function faceBump(text, motifVal, fontKey, dir, motifPos) {
  const { wPx, hPx } = TEX;
  const c = document.createElement("canvas");
  c.width = wPx; c.height = hPx;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, wPx, hPx);
  drawFace(ctx, { text, motifVal, fontKey, dir, motifPos, ink: "#000000", bevel: false });
  return c;
}

export default function Engrave3D({ faces = [], finish = "silver", fontKey = "playfair", motifs = [], direction = "up", motifPositions = [], height = 360, showHint = true }) {
  const mountRef = useRef(null);
  const matsRef = useRef([]);
  const threeRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed || !mountRef.current) return;

      const mount = mountRef.current;
      const width = mount.clientWidth || 320;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0.65, 7.6);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.2));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const f = FINISH[finish] || FINISH.silver;
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const mFor = (i) => motifs[i] || "";
      const pFor = (i) => (motifPositions[i] === "below" ? "below" : "above");

      const makeFaceMat = (text, motifVal, mPos) => {
        const map = new THREE.CanvasTexture(faceAlbedo(text, motifVal, finish, fontKey, direction, mPos));
        const bump = new THREE.CanvasTexture(faceBump(text, motifVal, fontKey, direction, mPos));
        map.anisotropy = maxAniso; bump.anisotropy = maxAniso;
        map.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshPhysicalMaterial({
          map, bumpMap: bump, bumpScale: 3, color: 0xffffff,
          metalness: 1.0, roughness: 0.26, clearcoat: 0.9, clearcoatRoughness: 0.16, envMapIntensity: 1.3,
        });
      };
      const metalMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(f.base), metalness: 1.0, roughness: 0.24,
        clearcoat: 0.95, clearcoatRoughness: 0.14, envMapIntensity: 1.35,
      });

      const geo = new THREE.BoxGeometry(BAR.W, BAR.H, BAR.D, 1, 1, 1);
      const mRight = makeFaceMat(faces[2], mFor(2), pFor(2));
      const mLeft = makeFaceMat(faces[3], mFor(3), pFor(3));
      const mFront = makeFaceMat(faces[0], mFor(0), pFor(0));
      const mBack = makeFaceMat(faces[1], mFor(1), pFor(1));
      const materials = [mRight, mLeft, metalMat(), metalMat(), mFront, mBack];
      matsRef.current = [mFront, mBack, mRight, mLeft];
      scene.add(new THREE.Mesh(geo, materials));

      const bailGeo = new THREE.TorusGeometry(0.12, 0.028, 16, 32);
      const bail = new THREE.Mesh(bailGeo, metalMat());
      bail.position.set(0, BAR.H / 2 + 0.12, 0);
      scene.add(bail);

      const chainMat = metalMat();
      const mkChain = (sign) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, BAR.H / 2 + 0.22, 0),
          new THREE.Vector3(sign * 0.5, 2.05, 0),
          new THREE.Vector3(sign * 0.85, 2.65, 0)
        );
        return new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 8, false), chainMat);
      };
      scene.add(mkChain(-1), mkChain(1));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.55, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.7;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

      let raf;
      const animate = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
      animate();

      const onResize = () => {
        const w = mount.clientWidth || 320;
        renderer.setSize(w, height);
        camera.aspect = w / height; camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        scene.traverse((o) => {
          if (o.isMesh) {
            o.geometry?.dispose();
            const mm = Array.isArray(o.material) ? o.material : [o.material];
            mm.forEach((m) => { if (m.map) m.map.dispose(); if (m.bumpMap) m.bumpMap.dispose(); m.dispose(); });
          }
        });
        envMap.dispose(); pmrem.dispose(); renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Précharge les images de motifs ; rafraîchit l'aperçu une fois chargées.
  useEffect(() => {
    let cancelled = false;
    (motifs || []).forEach((mv) => {
      const url = FLOWER_URLS[mv];
      if (url) {
        const img = getFlowerImg(url);
        if (!img.complete) img.addEventListener("load", () => { if (!cancelled) setTick((t) => t + 1); }, { once: true });
      }
    });
    return () => { cancelled = true; };
  }, [motifs]);

  // Rafraîchit une fois les polices du site chargées (sinon canvas = police de repli).
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Mise à jour textes / motifs / police / sens / position
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const order = [faces[0], faces[1], faces[2], faces[3]];
    mats.forEach((mat, i) => {
      const motifVal = motifs[i] || "";
      const mPos = motifPositions[i] === "below" ? "below" : "above";
      const oldMap = mat.map, oldBump = mat.bumpMap;
      const map = new THREE.CanvasTexture(faceAlbedo(order[i], motifVal, finish, fontKey, direction, mPos));
      const bump = new THREE.CanvasTexture(faceBump(order[i], motifVal, fontKey, direction, mPos));
      map.anisotropy = maxAniso; bump.anisotropy = maxAniso;
      map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.bumpMap = bump; mat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
      if (oldBump) oldBump.dispose();
    });
  }, [faces, finish, fontKey, motifs, direction, motifPositions, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ Faites pivoter le bijou pour voir vos 4 faces
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
