"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CHAIN_COUNT = 13;
const SPHERE_R = 0.74;
const CHAIN_BASE_LENGTH = 4.6;
const LINK_TORUS_R = 0.11;
const LINK_TUBE_R = 0.028;
const LINK_SPACING = 0.21;

interface LinkRef {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  baseQuat: THREE.Quaternion;
  t: number;
}

interface ChainRef {
  group: THREE.Group;
  links: LinkRef[];
  direction: THREE.Vector3;
  perpA: THREE.Vector3;
  perpB: THREE.Vector3;
  swayPhase: number;
  swayFreq: number;
  progress: number;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ChainSeed {
  direction: THREE.Vector3;
  lengthMul: number;
}

function randomFrontChains(n: number, seed = 23): ChainSeed[] {
  const rand = mulberry32(seed);
  const results: ChainSeed[] = [];
  let attempts = 0;
  const minDot = 0.88;
  while (results.length < n && attempts < 800) {
    attempts++;
    const phi = rand() * Math.PI * 2;
    const z = 0.05 + rand() * 0.85;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const dir = new THREE.Vector3(
      Math.cos(phi) * r,
      Math.sin(phi) * r * 0.95,
      z,
    ).normalize();
    if (results.some((p) => dir.dot(p.direction) > minDot)) continue;
    results.push({ direction: dir, lengthMul: 0.65 + rand() * 0.7 });
  }
  while (results.length < n) {
    const phi = rand() * Math.PI * 2;
    const z = 0.1 + rand() * 0.8;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const dir = new THREE.Vector3(
      Math.cos(phi) * r,
      Math.sin(phi) * r * 0.95,
      z,
    ).normalize();
    results.push({ direction: dir, lengthMul: 0.65 + rand() * 0.7 });
  }
  return results;
}

function buildEnvScene(): THREE.Scene {
  const envScene = new THREE.Scene();

  const bg = new THREE.Mesh(
    new THREE.SphereGeometry(80, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0a0a10,
      side: THREE.BackSide,
      toneMapped: false,
    }),
  );
  envScene.add(bg);

  const orbs: Array<{ c: number; p: [number, number, number]; r: number }> = [
    { c: 0x8a8a9a, p: [22, 18, 12], r: 10 },
    { c: 0x303040, p: [-22, -8, 8], r: 9 },
    { c: 0xff5040, p: [-24, 4, -6], r: 7 },
    { c: 0x5078c8, p: [10, -16, 14], r: 6 },
    { c: 0xa8a8b8, p: [0, 25, -8], r: 9 },
    { c: 0x40404e, p: [12, -6, -20], r: 9 },
    { c: 0xc8d0e0, p: [4, 6, 20], r: 5 },
    { c: 0x6a6a78, p: [-8, 12, 18], r: 4 },
  ];
  orbs.forEach(({ c, p, r }) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 16),
      new THREE.MeshBasicMaterial({ color: c, toneMapped: false }),
    );
    m.position.set(p[0], p[1], p[2]);
    envScene.add(m);
  });

  return envScene;
}

export function ChainsScene({ broken }: { broken: boolean[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const brokenRef = useRef(broken);
  brokenRef.current = broken;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const getSize = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight,
    });

    const { w, h } = getSize();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const envScene = buildEnvScene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();
    envScene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    });

    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(3.5, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff3b30, 1.1);
    rimLight.position.set(-4.5, 1, -1);
    scene.add(rimLight);

    const coolFill = new THREE.DirectionalLight(0x4070ff, 0.45);
    coolFill.position.set(-1.5, -2, 3);
    scene.add(coolFill);

    const topRim = new THREE.DirectionalLight(0xffffff, 0.35);
    topRim.position.set(0, 6, -2);
    scene.add(topRim);

    const backHaloLight = new THREE.PointLight(0xb8c4e8, 3, 10, 1.2);
    backHaloLight.position.set(0, 0.3, -3.2);
    scene.add(backHaloLight);

    const silhouetteRim = new THREE.DirectionalLight(0xdde0f0, 0.8);
    silhouetteRim.position.set(0, 0.5, -5);
    scene.add(silhouetteRim);

    const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 96, 96);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x747480,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x14141c,
      emissiveIntensity: 0.45,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

    const innerGlowGeo = new THREE.SphereGeometry(SPHERE_R + 0.02, 64, 64);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);

    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);
    sphereGroup.add(sphere);
    sphereGroup.add(innerGlow);

    const linkGeo = new THREE.TorusGeometry(LINK_TORUS_R, LINK_TUBE_R, 12, 28);
    const torusZ = new THREE.Vector3(0, 0, 1);
    const worldUp = new THREE.Vector3(0, 1, 0);

    const chains: ChainRef[] = [];
    const chainSeeds = randomFrontChains(CHAIN_COUNT);

    for (let c = 0; c < CHAIN_COUNT; c++) {
      const { direction, lengthMul } = chainSeeds[c]!;
      const chainLength = CHAIN_BASE_LENGTH * lengthMul;
      const linksPerChain = Math.max(4, Math.round(chainLength / LINK_SPACING));
      const anchorPos = direction.clone().multiplyScalar(SPHERE_R);
      const endPos = direction
        .clone()
        .multiplyScalar(SPHERE_R + chainLength);

      let perpA = new THREE.Vector3().crossVectors(worldUp, direction);
      if (perpA.lengthSq() < 0.01) {
        perpA = new THREE.Vector3(1, 0, 0);
      }
      perpA.normalize();
      const perpB = new THREE.Vector3().crossVectors(direction, perpA).normalize();

      const group = new THREE.Group();
      sphereGroup.add(group);

      const links: LinkRef[] = [];

      const alignA = new THREE.Quaternion().setFromUnitVectors(torusZ, perpA);
      const alignB = new THREE.Quaternion().setFromUnitVectors(torusZ, perpB);

      for (let l = 0; l < linksPerChain; l++) {
        const t = linksPerChain === 1 ? 0 : l / (linksPerChain - 1);
        const basePos = new THREE.Vector3().lerpVectors(anchorPos, endPos, t);

        const mat = new THREE.MeshStandardMaterial({
          color: 0x7a7a80,
          metalness: 0.85,
          roughness: 0.38,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(linkGeo, mat);
        mesh.position.copy(basePos);

        const q = (l % 2 === 0 ? alignA : alignB).clone();
        mesh.quaternion.copy(q);

        group.add(mesh);
        links.push({
          mesh,
          basePos: basePos.clone(),
          baseQuat: q.clone(),
          t,
        });
      }

      chains.push({
        group,
        links,
        direction,
        perpA,
        perpB,
        swayPhase: c * 1.731,
        swayFreq: 0.22 + (c % 7) * 0.04,
        progress: 0,
      });
    }

    let rafId = 0;
    const clock = new THREE.Clock();
    let prevElapsed = 0;

    const tmpQuat = new THREE.Quaternion();
    const tmpEuler = new THREE.Euler();
    const tmpOffset = new THREE.Vector3();
    const tmpFall = new THREE.Vector3();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(elapsed - prevElapsed, 0.05);
      prevElapsed = elapsed;

      const slowBreath = Math.sin(elapsed * 0.42);
      const microFlutter = Math.sin(elapsed * 1.7) * 0.18;
      const breath = 1 + (slowBreath + microFlutter * 0.4) * 0.022;
      sphere.scale.setScalar(breath);
      innerGlow.scale.setScalar(breath);

      const sagY = 1.55 + slowBreath * 0.045 + Math.sin(elapsed * 0.27) * 0.025;
      const driftX = Math.sin(elapsed * 0.19 + 1.3) * 0.04;
      sphereGroup.position.set(driftX, sagY, 0);

      sphere.rotation.y = elapsed * 0.018;
      sphere.rotation.z = Math.sin(elapsed * 0.31) * 0.06;
      sphere.rotation.x = -0.08 + Math.sin(elapsed * 0.23) * 0.04;

      const currentBroken = brokenRef.current;
      const brokenCount = currentBroken.filter(Boolean).length;
      const allDone = brokenCount === CHAIN_COUNT;
      const ratio = brokenCount / CHAIN_COUNT;

      chains.forEach((chain, ci) => {
        const isBroken = currentBroken[ci] ?? false;
        const target = isBroken ? 1 : 0;
        chain.progress += (target - chain.progress) * Math.min(dt * 1.8, 1);

        const cp = chain.progress;
        const swayMag = 0.18 * (1 - cp);

        chain.links.forEach((link, li) => {
          const tipFactor = link.t * link.t;
          const swayPhase = chain.swayPhase + li * 0.35;
          const sx =
            Math.sin(elapsed * chain.swayFreq + swayPhase) * swayMag * tipFactor;
          const sy =
            Math.cos(elapsed * chain.swayFreq * 1.27 + swayPhase * 0.7) *
            swayMag *
            0.7 *
            tipFactor;

          tmpOffset.set(0, 0, 0);
          tmpOffset.addScaledVector(chain.perpA, sx);
          tmpOffset.addScaledVector(chain.perpB, sy);

          const linkProgress = Math.max(
            0,
            Math.min(1, cp * (1 + li * 0.15) - li * 0.05),
          );
          const eased = linkProgress * linkProgress * (3 - 2 * linkProgress);

          const fallStrength = eased * (1.2 + li * 0.3);
          tmpFall.set(0, -fallStrength * 2.5, 0);
          tmpFall.addScaledVector(chain.direction, eased * 0.6);
          tmpFall.x += Math.sin(ci * 7.3 + li * 1.7) * eased * 0.8;
          tmpFall.z += Math.cos(ci * 4.1 + li * 2.3) * eased * 0.8;

          link.mesh.position
            .copy(link.basePos)
            .add(tmpOffset)
            .add(tmpFall);

          tmpEuler.set(
            eased * Math.PI * 1.5 * Math.sin(ci + li),
            eased * Math.PI * Math.cos(ci * 0.7 + li),
            eased * Math.PI * 0.8 * Math.sin(ci * 1.3 + li * 0.5),
          );
          tmpQuat.setFromEuler(tmpEuler);
          link.mesh.quaternion.copy(link.baseQuat).multiply(tmpQuat);

          const mat = link.mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = 1 - eased * 0.98;
        });
      });

      const targetEmissive = allDone
        ? new THREE.Color(0xffb547)
        : ratio > 0
          ? new THREE.Color(0xff3b30)
          : new THREE.Color(0x000000);
      const targetIntensity = allDone ? 0.6 : ratio * 0.22;
      sphereMat.emissive.lerp(targetEmissive, Math.min(dt * 2, 1));
      sphereMat.emissiveIntensity +=
        (targetIntensity - sphereMat.emissiveIntensity) * Math.min(dt * 2, 1);

      const glowTarget = allDone ? 0.3 : ratio * 0.08;
      innerGlowMat.opacity += (glowTarget - innerGlowMat.opacity) * Math.min(dt * 2, 1);
      innerGlowMat.color.lerp(
        new THREE.Color(allDone ? 0xffb547 : 0xff3b30),
        Math.min(dt * 2, 1),
      );

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const { w: nw, h: nh } = getSize();
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      envTex.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      linkGeo.dispose();
      chains.forEach((chain) =>
        chain.links.forEach((l) =>
          (l.mesh.material as THREE.Material).dispose(),
        ),
      );
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  );
}
