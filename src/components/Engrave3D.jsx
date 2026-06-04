"use client";

import { useEffect, useRef } from "react";

// Aperçu 3D d'un bijou à forme simple (collier barre / plaque).
// Vraie 3D WebGL (Three.js) : métal + reflets, gravure en RELIEF (bump map) sur
// les 4 faces, motif optionnel, sens haut/bas. À titre indicatif.

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

// Dessine motif (haut) + texte (empilé) sur un contexte donné.
function drawFace(ctx, { text, motifChar, fontKey, dir, ink, bevel }) {
  const { wPx, hPx } = TEX;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const atBottom = dir === "up"; // motif en bas si gravure de bas en haut
  let topReserve = 0, bottomReserve = 0;
  if (motifChar) {
    const mSize = wPx * 0.64;
    const my = atBottom ? hPx * 0.9 : hPx * 0.1;
    ctx.font = `${mSize}px "Segoe UI Symbol", "Apple Color Emoji", serif`;
    if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(motifChar, wPx / 2 + 1.2, my + 1.4); }
    ctx.fillStyle = ink; ctx.fillText(motifChar, wPx / 2, my);
    if (atBottom) bottomReserve = hPx * 0.2; else topReserve = hPx * 0.2;
  }
  let chars = (text || "").trim().split("");
  if (dir === "up") chars = chars.reverse();
  if (chars.length) {
    const fontFamily = FONT_MAP[fontKey] || FONT_MAP.playfair;
    const areaTop = topReserve;
    const areaH = hPx - topReserve - bottomReserve;
    const n = chars.length;
    const fontSize = Math.min(wPx * 0.64, (areaH * 0.96) / n);
    const lineH = fontSize * 1.0; // lettres serrées (comme une vraie gravure)
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    const totalH = n * lineH;
    const startY = areaTop + (areaH - totalH) / 2 + lineH / 2;
    for (let i = 0; i < n; i++) {
      const y = startY + i * lineH;
      if (bevel) { ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.fillText(chars[i], wPx / 2 + 1.1, y + 1.2); }
      ctx.fillStyle = ink; ctx.fillText(chars[i], wPx / 2, y);
    }
  }
}

// Couleur (albédo) : métal + texte gravé subtil.
function faceAlbedo(text, motifChar, finishKey, fontKey, dir) {
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
  drawFace(ctx, { text, motifChar, fontKey, dir, ink: f.ink, bevel: true });
  return c;
}

// Relief (bump) : fond blanc, gravure noire (creusée) — donne l'effet réel.
function faceBump(text, motifChar, fontKey, dir) {
  const { wPx, hPx } = TEX;
  const c = document.createElement("canvas");
  c.width = wPx; c.height = hPx;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, wPx, hPx);
  drawFace(ctx, { text, motifChar, fontKey, dir, ink: "#000000", bevel: false });
  return c;
}

export default function Engrave3D({ faces = [], finish = "silver", fontKey = "playfair", motifs = [], direction = "down" }) {
  const mountRef = useRef(null);
  const matsRef = useRef([]);
  const threeRef = useRef(null);

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
      const height = 360;

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

      const makeFaceMat = (text, motifChar) => {
        const map = new THREE.CanvasTexture(faceAlbedo(text, motifChar, finish, fontKey, direction));
        const bump = new THREE.CanvasTexture(faceBump(text, motifChar, fontKey, direction));
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
      const mRight = makeFaceMat(faces[2], mFor(2));
      const mLeft = makeFaceMat(faces[3], mFor(3));
      const mFront = makeFaceMat(faces[0], mFor(0));
      const mBack = makeFaceMat(faces[1], mFor(1));
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

  // Mise à jour textes / motif / police / sens
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const maxAniso = ctx.renderer.capabilities.getMaxAnisotropy();
    const order = [faces[0], faces[1], faces[2], faces[3]];
    mats.forEach((mat, i) => {
      const motifChar = motifs[i] || "";
      const oldMap = mat.map, oldBump = mat.bumpMap;
      const map = new THREE.CanvasTexture(faceAlbedo(order[i], motifChar, finish, fontKey, direction));
      const bump = new THREE.CanvasTexture(faceBump(order[i], motifChar, fontKey, direction));
      map.anisotropy = maxAniso; bump.anisotropy = maxAniso;
      map.colorSpace = THREE.SRGBColorSpace;
      mat.map = map; mat.bumpMap = bump; mat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
      if (oldBump) oldBump.dispose();
    });
  }, [faces, finish, fontKey, motifs, direction]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: "8px 0 4px" }}>
      <div ref={mountRef} style={{ width: "100%", height: 360, cursor: "grab", touchAction: "pan-y" }} />
      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
        ↔ Faites pivoter le bijou pour voir vos 4 faces
      </span>
      <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textAlign: "center", maxWidth: 340, fontStyle: "italic" }}>
        Aperçu 3D à titre indicatif — le rendu réel de la gravure peut légèrement varier.
      </span>
    </div>
  );
}
