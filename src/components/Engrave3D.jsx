"use client";

import { useEffect, useRef } from "react";

// Aperçu 3D photo-réaliste d'un bijou à forme simple (collier barre / plaque).
// Vraie 3D WebGL (Three.js) : métal + vernis, reflets de studio, bélière + chaîne,
// gravure sur les 4 faces. Le client fait pivoter et voit son texte en direct.

const FINISH = {
  silver: { base: "#d7d7d7", ink: "rgba(40,38,34,0.92)" },
  gold:   { base: "#d4af37", ink: "rgba(60,42,8,0.92)" },
  rose:   { base: "#dba8a1", ink: "rgba(70,34,30,0.92)" },
  black:  { base: "#2d2d2d", ink: "rgba(222,222,222,0.95)" },
  rainbow:{ base: "#cfd6dd", ink: "rgba(40,35,40,0.9)" },
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
const TEX = { wPx: 170, hPx: Math.round(170 * (BAR.H / BAR.W)) };

function faceCanvas(text, motifChar, finishKey, fontKey) {
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
  } else {
    ctx.fillStyle = f.base;
  }
  ctx.fillRect(0, 0, wPx, hPx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Motif (symbole) en haut de la face, le cas échéant.
  let topOffset = 0;
  if (motifChar) {
    const mSize = wPx * 0.7;
    const my = hPx * 0.11;
    ctx.font = `${mSize}px "Apple Color Emoji", "Segoe UI Symbol", serif`;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillText(motifChar, wPx / 2 + 1.2, my + 1.2);
    ctx.fillStyle = f.ink;
    ctx.fillText(motifChar, wPx / 2, my);
    topOffset = hPx * 0.2;
  }

  const chars = (text || "").trim().split("");
  if (chars.length) {
    const fontFamily = FONT_MAP[fontKey] || FONT_MAP.playfair;
    const areaH = hPx - topOffset;
    const n = chars.length;
    const fontSize = Math.min(wPx * 0.58, (areaH * 0.9) / n);
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    const step = areaH / (n + 1);
    for (let i = 0; i < n; i++) {
      const y = topOffset + step * (i + 1);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillText(chars[i], wPx / 2 + 1.2, y + 1.2);
      ctx.fillStyle = f.ink;
      ctx.fillText(chars[i], wPx / 2, y);
    }
  }
  return c;
}

export default function Engrave3D({ faces = [], finish = "silver", fontKey = "playfair", motif = null }) {
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
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0.65, 7.6);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(3, 6, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(-4, 1, 2);
      scene.add(fill);

      const f = FINISH[finish] || FINISH.silver;

      const mFor = (i) => (motif && motif.face === i + 1 ? motif.char : "");
      const makeFaceMat = (text, motifChar) => {
        const tex = new THREE.CanvasTexture(faceCanvas(text, motifChar, finish, fontKey));
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshPhysicalMaterial({
          map: tex, color: 0xffffff, metalness: 1.0, roughness: 0.3,
          clearcoat: 0.85, clearcoatRoughness: 0.22, envMapIntensity: 1.25,
        });
      };
      const metalMat = () => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(f.base), metalness: 1.0, roughness: 0.26,
        clearcoat: 0.9, clearcoatRoughness: 0.18, envMapIntensity: 1.3,
      });

      // Barre gravée (6 faces : +x,-x,+y,-y,+z,-z)
      const geo = new THREE.BoxGeometry(BAR.W, BAR.H, BAR.D, 1, 1, 1);
      const mRight = makeFaceMat(faces[2], mFor(2));
      const mLeft = makeFaceMat(faces[3], mFor(3));
      const mFront = makeFaceMat(faces[0], mFor(0));
      const mBack = makeFaceMat(faces[1], mFor(1));
      const materials = [mRight, mLeft, metalMat(), metalMat(), mFront, mBack];
      matsRef.current = [mFront, mBack, mRight, mLeft];
      const bar = new THREE.Mesh(geo, materials);
      scene.add(bar);

      // Bélière (anneau) au sommet
      const bailGeo = new THREE.TorusGeometry(0.12, 0.028, 16, 32);
      const bail = new THREE.Mesh(bailGeo, metalMat());
      bail.position.set(0, BAR.H / 2 + 0.12, 0);
      scene.add(bail);

      // Chaîne (deux tubes qui remontent en V)
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

      threeRef.current = { THREE, renderer, scene, materials, geo, envMap, pmrem, bailGeo };

      let raf;
      const animate = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
      animate();

      const onResize = () => {
        const w = mount.clientWidth || 320;
        renderer.setSize(w, height);
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
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
        envMap.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour des textes / police sur les faces (sans recréer la scène)
  useEffect(() => {
    const ctx = threeRef.current;
    const mats = matsRef.current;
    if (!ctx || !mats.length) return;
    const { THREE } = ctx;
    const order = [faces[0], faces[1], faces[2], faces[3]];
    mats.forEach((mat, i) => {
      const old = mat.map;
      const motifChar = motif && motif.face === i + 1 ? motif.char : "";
      const tex = new THREE.CanvasTexture(faceCanvas(order[i], motifChar, finish, fontKey));
      tex.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.needsUpdate = true;
      if (old) old.dispose();
    });
  }, [faces, finish, fontKey, motif]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "8px 0 4px" }}>
      <div ref={mountRef} style={{ width: "100%", height: 360, cursor: "grab", touchAction: "pan-y" }} />
      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
        ↔ Faites pivoter le bijou pour voir vos 4 faces gravées
      </span>
    </div>
  );
}
