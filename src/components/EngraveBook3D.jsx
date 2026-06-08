"use client";

import { useEffect, useRef, useState } from "react";
import { drawMotifInBox, preloadMotifs } from "@/lib/motifCanvas";

// Aperçu 3D du médaillon LIVRE qui s'ouvre (forme rectangulaire).
// Feuillets reliés à gauche par une charnière dorée ; on tourne les pages une
// par une : Couverture / Page 1 / Page 2 / Page 3. Finition argent / or /
// bicolore (couverture argent, pages dorées). À titre indicatif.

const FINISH = {
  silver: { base: "#eaeaec", ink: "rgba(22,20,18,0.92)" },
  gold:   { base: "#e0b94a", ink: "rgba(40,30,8,0.92)" },
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

// Page de livre : portrait (légèrement plus haute que large).
const TEXW = 370, TEXH = 465;

function layoutText(ctx, text, fontKey, maxW, maxH) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  for (let size = 42; size >= 14; size -= 2) {
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

function drawPageFace(ctx, { text, motifVal, fontKey, baseColor, ink, bevel }) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TEXW, TEXH);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Motif en haut (si présent), texte en dessous.
  let topReserve = 0;
  if (motifVal) {
    const bandH = TEXH * 0.26;
    const cy = TEXH * 0.05 + bandH / 2;
    if (drawMotifInBox(ctx, motifVal, TEXW / 2, cy, TEXW * 0.66, bandH, ink, bevel)) {
      topReserve = bandH + TEXH * 0.05;
    }
  }
  const boxW = TEXW * 0.74;
  const boxTop = topReserve || TEXH * 0.14;
  const boxH = TEXH - boxTop - TEXH * 0.1;
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
  drawPageFace(c.getContext("2d"), opts);
  return c;
}

function smoothstep(p) { const x = Math.max(0, Math.min(1, p)); return x * x * (3 - 2 * x); }

export default function EngraveBook3D({
  faces = [], motifs = [], finish = "silver", fontKey = "playfair", height = 400, showHint = true,
}) {
  const mountRef = useRef(null);
  const matsRef = useRef([]);
  const threeRef = useRef(null);
  const [tick, setTick] = useState(0);

  const NUM = Math.max(1, faces.length);

  // Couverture (0) + pages. Bicolore : couverture argent, pages dorées.
  function faceColors() {
    if (finish === "gold") return Array(NUM).fill("gold");
    if (finish === "bicolore") return Array.from({ length: NUM }, (_, i) => (i === 0 ? "silver" : "gold"));
    return Array(NUM).fill("silver");
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
      camera.position.set(-0.3, 0.2, 8.6);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.15); keyL.position.set(3, 6, 5); scene.add(keyL);
      const fillL = new THREE.DirectionalLight(0xffffff, 0.5); fillL.position.set(-4, 1, 2); scene.add(fillL);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      // --- Forme rectangulaire (coins arrondis) ---
      const RW = 1.55, RH = 1.95, RR = 0.16;
      const HW = RW / 2, HH = RH / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-HW + RR, -HH);
      shape.lineTo(HW - RR, -HH);
      shape.quadraticCurveTo(HW, -HH, HW, -HH + RR);
      shape.lineTo(HW, HH - RR);
      shape.quadraticCurveTo(HW, HH, HW - RR, HH);
      shape.lineTo(-HW + RR, HH);
      shape.quadraticCurveTo(-HW, HH, -HW, HH - RR);
      shape.lineTo(-HW, -HH + RR);
      shape.quadraticCurveTo(-HW, -HH, -HW + RR, -HH);

      const hingeX = -HW * 0.98;  // charnière au bord gauche
      const T = 0.07;             // épaisseur d'un feuillet

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

      const colors = faceColors();
      const faceMat = (idx) => {
        const fc = FINISH[colors[idx]] || FINISH.silver;
        const map = new THREE.CanvasTexture(faceCanvas({
          text: faces[idx] || "", motifVal: motifs[idx] || "", fontKey, baseColor: fc.base, ink: fc.ink, bevel: true,
        }));
        map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshPhysicalMaterial({
          map, color: 0xffffff, metalness: 1.0, roughness: 0.3,
          clearcoat: 0.85, clearcoatRoughness: 0.2, envMapIntensity: 1.25,
        });
      };
      const metalMat = (key) => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color((FINISH[key] || FINISH.silver).base),
        metalness: 1.0, roughness: 0.26, clearcoat: 0.95, clearcoatRoughness: 0.14, envMapIntensity: 1.35,
      });

      // Feuillets « page », reliés à gauche : Couverture, Page 1, Page 2, Page 3.
      const leaves = [];
      const matsByIdx = new Array(NUM);
      for (let k = 0; k < NUM; k++) {
        const group = new THREE.Group();
        group.position.set(hingeX, 0, (NUM - 1 - k) * (T + 0.008)); // couverture (k=0) devant
        const inner = new THREE.Group();
        inner.position.set(-hingeX, 0, 0); // recentre, pivot au bord gauche

        const ext = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
        ext.translate(0, 0, -T / 2);
        inner.add(new THREE.Mesh(ext, metalMat(colors[k])));

        const fMat = faceMat(k);
        const front = new THREE.Mesh(shapeGeo(), fMat);
        front.position.z = T / 2 + 0.003;
        inner.add(front);

        group.add(inner);
        scene.add(group);
        leaves.push(group);
        matsByIdx[k] = fMat;
      }
      matsRef.current = matsByIdx;

      // --- Charnière (cylindre doré strié) sur le côté ---
      const spineLen = HH * 1.95;
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, spineLen, 24), metalMat(finish === "silver" ? "silver" : "gold"));
      spine.position.set(hingeX, 0, 0);
      scene.add(spine);
      for (let i = -3; i <= 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.017, 10, 24), metalMat(finish === "silver" ? "silver" : "gold"));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(hingeX, i * (spineLen / 8), 0);
        scene.add(ring);
      }

      // --- Bélière + chaîne (sommet de la charnière) ---
      const topY = spineLen / 2;
      const bail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 16, 32), metalMat("silver"));
      bail.position.set(hingeX, topY + 0.12, 0);
      scene.add(bail);
      const chainMat = metalMat("gold");
      const mkChain = (sign) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(hingeX, topY + 0.22, 0),
          new THREE.Vector3(hingeX + sign * 0.5, topY + 0.95, 0),
          new THREE.Vector3(hingeX + sign * 0.85, topY + 1.6, 0)
        );
        return new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.02, 8, false), chainMat);
      };
      scene.add(mkChain(-1), mkChain(1));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(-0.35, -0.05, 0);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI / 2.6;
      controls.maxPolarAngle = Math.PI / 1.75;
      controls.update();

      threeRef.current = { THREE, renderer, scene };

      // Animation « livre » : on tourne les pages une par une, puis on referme.
      const OPEN = Math.PI * 0.92;
      const PERIOD = 15;
      const clock = new THREE.Clock();
      let raf;
      const animate = () => {
        const t = clock.getElapsedTime();
        const tt = (t % PERIOD) / PERIOD;
        const phase = tt < 0.5 ? (tt / 0.5) * NUM : (1 - (tt - 0.5) / 0.5) * NUM;
        for (let k = 0; k < NUM; k++) {
          leaves[k].rotation.y = -OPEN * smoothstep(phase - k);
        }
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

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTick((t) => t + 1));
    }
  }, []);

  // Précharge les images de motifs ; rafraîchit une fois chargées.
  useEffect(() => {
    preloadMotifs(motifs, () => setTick((t) => t + 1));
  }, [motifs]);

  // Mise à jour des faces (textes / motifs / finition / police).
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const colors = faceColors();
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      if (!mat) continue;
      const fc = FINISH[colors[i]] || FINISH.silver;
      const old = mat.map;
      const map = new THREE.CanvasTexture(faceCanvas({
        text: faces[i] || "", motifVal: motifs[i] || "", fontKey, baseColor: fc.base, ink: fc.ink, bevel: true,
      }));
      map.anisotropy = maxAniso; map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.needsUpdate = true;
      if (old) old.dispose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces, motifs, finish, fontKey, tick]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: showHint ? "8px 0 4px" : 0 }}>
      <div ref={mountRef} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />
      {showHint && (
        <>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            ↔ Le médaillon s'ouvre comme un livre — couverture + 3 pages
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
            Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
          </span>
        </>
      )}
    </div>
  );
}
