"use client";

import { useEffect, useRef, useState } from "react";
import { drawMotifInBox, preloadMotifs } from "@/lib/motifCanvas";

// Aperçu 3D d'une plaque (dog tag) gravable RECTO / VERSO : texte, motif et
// PHOTO. La plaque se retourne pour montrer les deux faces ; la photo apparaît
// sur la face choisie par la cliente. À titre indicatif.

const FINISH = {
  silver: { base: "#d9dbdf", ink: "rgba(20,20,20,0.92)", metal: "#cfd1d4" },
  gold:   { base: "#d9b24a", ink: "rgba(40,30,8,0.92)",  metal: "#d4af37" },
  black:  { base: "#2c2c2e", ink: "rgba(238,238,238,0.94)", metal: "#26262a" },
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

const imgCache = new Map();
function getPhotoImg(url) {
  if (!url) return null;
  if (imgCache.has(url)) return imgCache.get(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imgCache.set(url, img);
  return img;
}
function drawContain(ctx, img, x, y, W, H) {
  const ir = img.width / img.height, cr = W / H;
  let dw, dh;
  if (ir > cr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
  ctx.drawImage(img, x + (W - dw) / 2, y + (H - dh) / 2, dw, dh);
}

const TEXW = 300, TEXH = 470;

function layoutText(ctx, text, fontKey, maxW, maxH) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  for (let size = 44; size >= 13; size -= 2) {
    ctx.font = fontSpec(fontKey, size);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const lineH = size * 1.2;
    if (lines.length * lineH <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) {
      return { lines, size, lineH };
    }
  }
  return null;
}

function drawTextBlock(ctx, text, fontKey, top, h, ink) {
  const lay = layoutText(ctx, text, fontKey, TEXW * 0.8, h);
  if (!lay) return;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = fontSpec(fontKey, lay.size);
  const cy = top + h / 2;
  const startY = cy - ((lay.lines.length - 1) * lay.lineH) / 2;
  lay.lines.forEach((line, i) => {
    ctx.fillStyle = ink;
    ctx.fillText(line, TEXW / 2, startY + i * lay.lineH);
  });
}

function drawPlateFace(ctx, { text, motifVal, motifPos, photo, fontKey, baseColor, ink }) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEXW, TEXH);

  const photoImg = photo ? getPhotoImg(photo) : null;
  const hasPhoto = photoImg && photoImg.complete && photoImg.naturalWidth;
  const above = motifPos !== "below"; // pour texte/motif relativement à la photo

  if (hasPhoto) {
    // Photo + texte : selon "above" le texte est au-dessus ou en dessous.
    const photoH = TEXH * 0.6, textH = TEXH * 0.28;
    if (above) {
      drawTextBlock(ctx, text, fontKey, TEXH * 0.05, textH, ink);
      drawContain(ctx, photoImg, TEXW * 0.12, TEXH * 0.38, TEXW * 0.76, photoH * 0.92);
    } else {
      drawContain(ctx, photoImg, TEXW * 0.12, TEXH * 0.05, TEXW * 0.76, photoH * 0.92);
      drawTextBlock(ctx, text, fontKey, TEXH * 0.68, textH, ink);
    }
    return;
  }

  // Pas de photo : motif (optionnel) + texte centré.
  let topReserve = 0, botReserve = 0;
  if (motifVal) {
    const bandH = TEXH * 0.26;
    const cy = above ? TEXH * 0.05 + bandH / 2 : TEXH * 0.95 - bandH / 2;
    if (drawMotifInBox(ctx, motifVal, TEXW / 2, cy, TEXW * 0.6, bandH, ink, false)) {
      if (above) topReserve = bandH + TEXH * 0.05; else botReserve = bandH + TEXH * 0.05;
    }
  }
  const top = topReserve || TEXH * 0.12;
  const h = TEXH - top - (botReserve || TEXH * 0.12);
  drawTextBlock(ctx, text, fontKey, top, h, ink);
}

function faceCanvas(opts) {
  const c = document.createElement("canvas");
  c.width = TEXW; c.height = TEXH;
  drawPlateFace(c.getContext("2d"), opts);
  return c;
}

function smoothstep(p) { const x = Math.max(0, Math.min(1, p)); return x * x * (3 - 2 * x); }

export default function EngravePlate3D({
  faces = [], motif = "", motifPos = "above", photo = "", photoFace = "recto",
  finish = "silver", fontKey = "playfair", height = 400, showHint = true,
}) {
  const mountRef = useRef(null);
  const matsRef = useRef([]); // [recto, verso]
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
      camera.position.set(0, 0.1, 7.6);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const f = FINISH[finish] || FINISH.silver;

      const metalMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(f.metal), metalness: 1.0, roughness: 0.28,
        clearcoat: 0.9, clearcoatRoughness: 0.16, envMapIntensity: 1.3,
      });
      // Face peu « miroir » → gravure (texte/photo) lisible.
      const faceMat = (text, withPhoto) => {
        const map = new THREE.CanvasTexture(faceCanvas({
          text, motifVal: motif, motifPos, photo: withPhoto ? photo : "", fontKey, baseColor: f.base, ink: f.ink,
        }));
        map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshPhysicalMaterial({
          map, emissiveMap: map, emissive: new THREE.Color(0x3a3a3a),
          color: 0xffffff, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.7,
        });
      };

      // Plaque (dog tag) : rectangle portrait à coins arrondis.
      const PW = 1.5, PH = 2.35, RR = 0.26, PT = 0.12;
      const shape = new THREE.Shape();
      const hw = PW / 2, hh = PH / 2;
      shape.moveTo(-hw + RR, -hh);
      shape.lineTo(hw - RR, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + RR);
      shape.lineTo(hw, hh - RR);
      shape.quadraticCurveTo(hw, hh, hw - RR, hh);
      shape.lineTo(-hw + RR, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - RR);
      shape.lineTo(-hw, -hh + RR);
      shape.quadraticCurveTo(-hw, -hh, -hw + RR, -hh);

      function shapeGeo() {
        const g = new THREE.ShapeGeometry(shape, 24);
        g.computeBoundingBox();
        const bb = g.boundingBox;
        const pos = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          uv.setXY(i,
            (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x),
            (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
        }
        uv.needsUpdate = true;
        return g;
      }

      const plate = new THREE.Group();
      // corps métal
      const ext = new THREE.ExtrudeGeometry(shape, { depth: PT, bevelEnabled: false });
      ext.translate(0, 0, -PT / 2);
      plate.add(new THREE.Mesh(ext, metalMat()));
      // face recto (+z)
      const rectoMat = faceMat(faces[0] || "", photoFace === "recto");
      const rectoMesh = new THREE.Mesh(shapeGeo(), rectoMat);
      rectoMesh.position.z = PT / 2 + 0.004;
      plate.add(rectoMesh);
      // face verso (-z) : on retourne la géométrie
      const versoMat = faceMat(faces[1] || "", photoFace === "verso");
      const versoMesh = new THREE.Mesh(shapeGeo(), versoMat);
      versoMesh.position.z = -PT / 2 - 0.004;
      versoMesh.rotation.y = Math.PI;
      plate.add(versoMesh);
      matsRef.current = [rectoMat, versoMat];

      // petit trou de suspension en haut
      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 16, 28), metalMat());
      hole.position.set(0, hh - 0.02, 0);
      plate.add(hole);
      scene.add(plate);

      // chaîne
      const topY = hh + 0.12;
      const chainMat = metalMat();
      const mkChain = (sign) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, hh, 0),
          new THREE.Vector3(sign * 0.55, topY + 0.7, 0),
          new THREE.Vector3(sign * 0.95, topY + 1.45, 0)
        );
        return new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 8, false), chainMat);
      };
      scene.add(mkChain(-1), mkChain(1));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, -0.05, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.7;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

      // Animation : montre le recto, se retourne pour le verso, revient. En boucle.
      const PERIOD = 11;
      const clock = new THREE.Clock();
      let raf;
      const animate = () => {
        const tt = (clock.getElapsedTime() % PERIOD) / PERIOD;
        let rotY;
        if (tt < 0.4) rotY = 0;
        else if (tt < 0.5) rotY = Math.PI * smoothstep((tt - 0.4) / 0.1);
        else if (tt < 0.9) rotY = Math.PI;
        else rotY = Math.PI * (1 - smoothstep((tt - 0.9) / 0.1));
        plate.rotation.y = rotY;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
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
            mm.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
          }
        });
        envMap.dispose(); pmrem.dispose(); renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchit quand la photo / les motifs sont chargés, ou les polices prêtes.
  useEffect(() => {
    const img = getPhotoImg(photo);
    if (img && !img.complete) {
      const on = () => setTick((t) => t + 1);
      img.addEventListener("load", on, { once: true });
      return () => img.removeEventListener("load", on);
    }
  }, [photo]);
  useEffect(() => { preloadMotifs([motif], () => setTick((t) => t + 1)); }, [motif]);
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Mise à jour des deux faces.
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const f = FINISH[finish] || FINISH.silver;
    [
      { text: faces[0] || "", withPhoto: photoFace === "recto" },
      { text: faces[1] || "", withPhoto: photoFace === "verso" },
    ].forEach((cfg, i) => {
      const mat = mats[i];
      if (!mat) return;
      const old = mat.map;
      const map = new THREE.CanvasTexture(faceCanvas({
        text: cfg.text, motifVal: motif, motifPos, photo: cfg.withPhoto ? photo : "", fontKey, baseColor: f.base, ink: f.ink,
      }));
      map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.emissiveMap = map; mat.needsUpdate = true;
      if (old) old.dispose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces, motif, motifPos, photo, photoFace, finish, fontKey, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ La plaque se retourne — recto et verso (la photo apparaît sur la face choisie)
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
