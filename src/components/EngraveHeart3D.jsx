"use client";

import { useEffect, useRef, useState } from "react";

// Aperçu 3D du médaillon cœur ouvrable (4 faces gravables).
// Cœur en courbe paramétrique, extrudé, articulé sur une charnière (le « livre »).
// 4 faces : avant (couverture), page 1 (intérieur couverture), page 2 (intérieur fond),
// page 3 (dos). Finition argent ou bicolore (argent dehors / doré dedans). Photo possible
// sur une page intérieure. À titre indicatif.

const FINISH = {
  silver: { base: "#eaeaec", ink: "rgba(22,20,18,0.92)" },
  gold:   { base: "#e0b94a", ink: "rgba(35,26,8,0.92)" },
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

// Image (photo client) avec cache, pour la page intérieure.
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

const TEXW = 460, TEXH = 400; // canvas par face (ratio proche de la boîte du cœur)

function drawCover(ctx, img, W, H) {
  const ir = img.width / img.height, cr = W / H;
  let dw, dh;
  if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

// Découpe le texte en lignes qui tiennent dans maxW, et choisit la taille de police.
function layoutText(ctx, text, fontKey, maxW, maxH) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  for (let size = 64; size >= 16; size -= 2) {
    ctx.font = fontSpec(fontKey, size);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const lineH = size * 1.18;
    if (lines.length * lineH <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) {
      return { lines, size, lineH };
    }
  }
  return null;
}

// Dessine une face du cœur (couleur + texte gravé, ou photo).
function drawHeartFace(ctx, { text, fontKey, baseColor, ink, photo, bevel }) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEXW, TEXH);

  if (photo) {
    const img = getPhotoImg(photo);
    if (img && img.complete && img.naturalWidth) {
      // cadre photo dans la partie large du cœur
      const pw = TEXW * 0.6, ph = TEXH * 0.46;
      const px = (TEXW - pw) / 2, py = TEXH * 0.16;
      ctx.save();
      ctx.translate(px, py);
      ctx.beginPath();
      ctx.rect(0, 0, pw, ph);
      ctx.clip();
      drawCover(ctx, img, pw, ph);
      ctx.restore();
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const boxW = TEXW * 0.66;
  const boxTop = photo ? TEXH * 0.66 : TEXH * 0.14;
  const boxH = photo ? TEXH * 0.2 : TEXH * 0.5;
  const lay = layoutText(ctx, text, fontKey, boxW, boxH);
  if (lay) {
    ctx.font = fontSpec(fontKey, lay.size);
    const cy = boxTop + boxH / 2;
    const startY = cy - ((lay.lines.length - 1) * lay.lineH) / 2;
    lay.lines.forEach((line, i) => {
      const y = startY + i * lay.lineH;
      if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(line, TEXW / 2 + 1.1, y + 1.2); }
      ctx.fillStyle = ink; ctx.fillText(line, TEXW / 2, y);
    });
  }
}

function faceCanvas(opts) {
  const c = document.createElement("canvas");
  c.width = TEXW; c.height = TEXH;
  drawHeartFace(c.getContext("2d"), opts);
  return c;
}

export default function EngraveHeart3D({
  faces = [], finish = "silver", fontKey = "playfair", photo = "", height = 380, showHint = true,
}) {
  const mountRef = useRef(null);
  const matsRef = useRef([]);     // [avant, page1, page2, page3]
  const threeRef = useRef(null);
  const [tick, setTick] = useState(0);

  // Couleurs par face selon la finition (bicolore = argent dehors / doré dedans).
  function faceColors() {
    const outer = "silver";
    const inner = finish === "bicolore" ? "gold" : (finish === "gold" ? "gold" : "silver");
    return [outer, inner, inner, outer]; // avant, page1, page2, page3
  }

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
      camera.position.set(0, 0.4, 7.2);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.2));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      // --- Forme cœur (paramétrique, pointe en bas) ---
      const raw = [];
      const N = 140;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        raw.push(new THREE.Vector2(x, y));
      }
      // bornes + mise à l'échelle (hauteur ~2.2)
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      raw.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      const scale = 2.2 / (maxY - minY);
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const pts = raw.map((p) => new THREE.Vector2((p.x - cx) * scale, (p.y - cy) * scale));
      const shape = new THREE.Shape(pts);

      // bornes du cœur centré
      const HW = (maxX - minX) / 2 * scale;  // demi-largeur
      const HH = (maxY - minY) / 2 * scale;  // demi-hauteur
      const hingeX = -HW * 0.96;             // charnière au bord gauche
      const T = 0.12;                        // épaisseur d'un battant

      // UV remappées sur la boîte englobante (pour caler le canvas).
      function shapeGeo() {
        const g = new THREE.ShapeGeometry(shape, 24);
        g.computeBoundingBox();
        const bb = g.boundingBox;
        const pos = g.attributes.position;
        const uv = g.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const u = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x);
          const v = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y);
          uv.setXY(i, u, v);
        }
        uv.needsUpdate = true;
        return g;
      }

      const colors = faceColors();
      const faceMat = (idx) => {
        const fc = FINISH[colors[idx]] || FINISH.silver;
        const withPhoto = (idx === 1) && photo; // photo sur la page 1 (intérieur)
        const map = new THREE.CanvasTexture(faceCanvas({
          text: faces[idx] || "", fontKey, baseColor: fc.base, ink: fc.ink, photo: withPhoto ? photo : "", bevel: true,
        }));
        map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshPhysicalMaterial({
          map, color: 0xffffff, metalness: 1.0, roughness: 0.28,
          clearcoat: 0.9, clearcoatRoughness: 0.18, envMapIntensity: 1.3,
        });
      };
      const metalMat = (key) => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color((FINISH[key] || FINISH.silver).base),
        metalness: 1.0, roughness: 0.26, clearcoat: 0.95, clearcoatRoughness: 0.14, envMapIntensity: 1.35,
      });

      // Construit un battant (Group articulé) : corps métal + 2 faces gravées.
      function makeLeaf(zCenter, frontIdx, backIdx, frontColorKey, backColorKey) {
        const group = new THREE.Group();
        group.position.set(hingeX, 0, zCenter);

        const inner = new THREE.Group();
        inner.position.set(-hingeX, 0, 0); // recentre le cœur, pivot au bord gauche

        // corps métal (épaisseur)
        const ext = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
        ext.translate(0, 0, -T / 2);
        const body = new THREE.Mesh(ext, metalMat(frontColorKey));
        inner.add(body);

        // face avant (vers +z)
        const fMat = faceMat(frontIdx);
        const front = new THREE.Mesh(shapeGeo(), fMat);
        front.position.z = T / 2 + 0.004;
        inner.add(front);

        // face arrière (vers -z) : géométrie tournée de 180° autour de Y
        const bMat = faceMat(backIdx);
        const back = new THREE.Mesh(shapeGeo(), bMat);
        back.rotation.y = Math.PI;
        back.position.z = -T / 2 - 0.004;
        inner.add(back);

        group.add(inner);
        return { group, fMat, bMat };
      }

      // leaf2 = fond (fixe) : face avant = page2 (intérieur), dos = page3 (extérieur)
      const leaf2 = makeLeaf(-T / 2, 2, 3, colors[2], colors[3]);
      // leaf1 = couverture (mobile) : face avant = avant (extérieur), dos = page1 (intérieur)
      const leaf1 = makeLeaf(+T / 2, 0, 1, colors[0], colors[1]);
      scene.add(leaf2.group, leaf1.group);

      // ordre des matériaux pour la mise à jour : [avant, page1, page2, page3]
      matsRef.current = [leaf1.fMat, leaf1.bMat, leaf2.fMat, leaf2.bMat];

      // --- Charnière (cylindre doré strié) ---
      const spineMat = metalMat(finish === "silver" ? "silver" : "gold");
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, HH * 1.7, 24), spineMat);
      spine.position.set(hingeX, 0, 0);
      scene.add(spine);
      // anneaux de la charnière
      for (let i = -3; i <= 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 10, 24), metalMat("silver"));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(hingeX, i * (HH * 1.7 / 8), 0);
        scene.add(ring);
      }

      // --- Bélière + chaîne (collées au sommet de la charnière) ---
      const spineTopY = HH * 0.85;           // sommet du cylindre de charnière
      const bail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 16, 32), metalMat("silver"));
      bail.position.set(hingeX, spineTopY + 0.1, 0);
      scene.add(bail);
      const chainMat = metalMat("gold");
      const mkChain = (sign) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(hingeX, spineTopY + 0.2, 0),
          new THREE.Vector3(hingeX + sign * 0.5, spineTopY + 0.9, 0),
          new THREE.Vector3(hingeX + sign * 0.85, spineTopY + 1.5, 0)
        );
        return new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 8, false), chainMat);
      };
      scene.add(mkChain(-1), mkChain(1));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(hingeX * 0.3, 0, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.7;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

      const clock = new THREE.Clock();
      let raf;
      const animate = () => {
        const t = clock.getElapsedTime();
        // ouverture/fermeture douce : le cœur s'entrouvre (reste UN cœur, pas deux)
        const open = 0.42 + 0.34 * Math.sin(t * 0.5); // ~5°..43°
        leaf1.group.rotation.y = -Math.max(0.06, open);
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

  // Rafraîchit quand la photo est chargée.
  useEffect(() => {
    const img = getPhotoImg(photo);
    if (img && !img.complete) {
      const on = () => setTick((t) => t + 1);
      img.addEventListener("load", on, { once: true });
      return () => img.removeEventListener("load", on);
    }
  }, [photo]);

  // Rafraîchit une fois les polices chargées.
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Mise à jour des textes / finition / police / photo.
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const colors = faceColors();
    const order = [faces[0], faces[1], faces[2], faces[3]];
    mats.forEach((mat, i) => {
      const fc = FINISH[colors[i]] || FINISH.silver;
      const withPhoto = (i === 1) && photo;
      const old = mat.map;
      const map = new THREE.CanvasTexture(faceCanvas({
        text: order[i] || "", fontKey, baseColor: fc.base, ink: fc.ink, photo: withPhoto ? photo : "", bevel: true,
      }));
      map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.needsUpdate = true;
      if (old) old.dispose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces, finish, fontKey, photo, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ Le cœur s'ouvre pour révéler vos 4 faces gravées
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
