"use client";

import { useEffect, useRef } from "react";

/**
 * Démo 3D réaliste (sans fichier externe) : pendentif cœur en or massif,
 * matériau PBR métallique, environnement studio, ombre de contact douce,
 * rotation automatique + au doigt. Sert à montrer le rendu 3D « pro ».
 */
export default function Demo3D({ height = 440 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed || !mountRef.current) return;

      const mount = mountRef.current;
      const width = mount.clientWidth || 360;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 8.4);

      // Environnement studio (reflets réalistes sur le métal)
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;

      // Lumières
      scene.add(new THREE.AmbientLight(0xffffff, 0.18));
      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(4, 7, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 30;
      key.shadow.bias = -0.0004;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffe8b0, 1.2);
      rim.position.set(-5, 2, -4);
      scene.add(rim);

      // Forme de cœur (extrudée) — pendentif
      const x = 0, y = 0;
      const heart = new THREE.Shape();
      heart.moveTo(x + 0.0, y + 0.6);
      heart.bezierCurveTo(x + 0.0, y + 0.9, x - 0.45, y + 1.25, x - 0.9, y + 1.25);
      heart.bezierCurveTo(x - 1.6, y + 1.25, x - 1.6, y + 0.35, x - 1.6, y + 0.35);
      heart.bezierCurveTo(x - 1.6, y - 0.2, x - 1.0, y - 0.75, x + 0.0, y - 1.35);
      heart.bezierCurveTo(x + 1.0, y - 0.75, x + 1.6, y - 0.2, x + 1.6, y + 0.35);
      heart.bezierCurveTo(x + 1.6, y + 0.35, x + 1.6, y + 1.25, x + 0.9, y + 1.25);
      heart.bezierCurveTo(x + 0.45, y + 1.25, x + 0.0, y + 0.9, x + 0.0, y + 0.6);

      const geo = new THREE.ExtrudeGeometry(heart, {
        depth: 0.42,
        bevelEnabled: true,
        bevelThickness: 0.16,
        bevelSize: 0.16,
        bevelSegments: 8,
        curveSegments: 48,
      });
      geo.center();
      geo.computeVertexNormals();

      const gold = new THREE.MeshStandardMaterial({
        color: 0xf2c25a,
        metalness: 1.0,
        roughness: 0.22,
        envMapIntensity: 1.25,
      });

      const group = new THREE.Group();
      const pendant = new THREE.Mesh(geo, gold);
      pendant.castShadow = true;
      pendant.scale.set(1.05, 1.05, 1.05);
      group.add(pendant);

      // Bélière (petit anneau en haut)
      const bail = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.09, 24, 48),
        gold
      );
      bail.position.set(0, 1.55, 0);
      bail.castShadow = true;
      group.add(bail);

      // Gravure « N » discrète au centre (léger relief creusé)
      group.rotation.x = -0.15;
      scene.add(group);

      // Ombre de contact (plan qui reçoit l'ombre)
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.ShadowMaterial({ opacity: 0.22 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.1;
      floor.receiveShadow = true;
      scene.add(floor);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.2;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = Math.PI * 0.3;
      controls.maxPolarAngle = Math.PI * 0.62;
      controls.target.set(0, 0.1, 0);
      controls.update();

      let raf;
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      const onResize = () => {
        const w = mount.clientWidth || 360;
        renderer.setSize(w, height);
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        geo.dispose();
        gold.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [height]);

  return (
    <div className="mq-3d">
      <div ref={mountRef} className="mq-3d-canvas" style={{ height }} />
      <span className="mq-3d-hint">↔ Tournez le bijou avec le doigt</span>
    </div>
  );
}
