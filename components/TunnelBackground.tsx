import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TunnelBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.025);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Performance optimization: Cap pixelRatio to 1.5 max to prevent GPU bottleneck on 4K/Retina displays
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, 
      powerPreference: "high-performance",
      precision: "mediump"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    // Clear old elements if any
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // --- CREATE CURVE FOR TUNNEL ---
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 45; i++) {
      points.push(new THREE.Vector3(
        Math.sin(i * 0.2) * 12 + (Math.random() - 0.5) * 3,
        Math.cos(i * 0.3) * 6 + (Math.random() - 0.5) * 3,
        i * -12
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);

    // --- CREATE TUNNEL GEOMETRY (Optimized vertex counts) ---
    const geometry = new THREE.TubeGeometry(curve, 70, 3.5, 8, false);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x333333, 
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const tunnel = new THREE.Mesh(geometry, material);
    scene.add(tunnel);

    // --- ADD FIBER CABLES (Brand Pink Glow Lines) ---
    const fiberGeo = new THREE.TubeGeometry(curve, 70, 0.12, 5, false);
    const fiberMat = new THREE.MeshBasicMaterial({ 
      color: 0xD35D88, // Brand Pink
      transparent: true,
      opacity: 0.85
    });
    const fiber = new THREE.Mesh(fiberGeo, fiberMat);
    fiber.position.x = 0.6; 
    fiber.position.y = -0.8;
    scene.add(fiber);

    // Second parallel fiber accent line
    const fiberGeo2 = new THREE.TubeGeometry(curve, 70, 0.08, 5, false);
    const fiberMat2 = new THREE.MeshBasicMaterial({ 
      color: 0xFF8DAA, 
      transparent: true,
      opacity: 0.6
    });
    const fiber2 = new THREE.Mesh(fiberGeo2, fiberMat2);
    fiber2.position.x = -0.7; 
    fiber2.position.y = 0.9;
    scene.add(fiber2);

    // --- PARTICLES FIELD (Optimized 400 count) ---
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 400;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 120; 
      posArray[i + 1] = (Math.random() - 0.5) * 120;
      posArray[i + 2] = -Math.random() * 600;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // --- MOUSE PARALLAX STATE ---
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // --- SCROLL ANIMATION STATE ---
    const cameraPositionState = { val: 0 };

    const trigger = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        gsap.to(cameraPositionState, {
          val: self.progress,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });

    // Refresh ScrollTrigger after DOM load
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // --- ANIMATION LOOP (With tab visibility check) ---
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Skip render if tab is hidden
      if (document.hidden) return;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Safe clamp loop ratio between 0.001 and 0.97
      const rawProgress = Math.max(0, Math.min(1, cameraPositionState.val));
      const loopTime = Math.max(0.001, Math.min(0.97, 0.95 * rawProgress + 0.005));
      
      const pos = curve.getPointAt(loopTime);
      const lookAtPos = curve.getPointAt(Math.min(loopTime + 0.03, 0.999));

      // Add subtle parallax offset based on cursor movement
      camera.position.x = pos.x + mouseX * 0.8;
      camera.position.y = pos.y - mouseY * 0.8;
      camera.position.z = pos.z;

      camera.lookAt(lookAtPos.x + mouseX * 0.4, lookAtPos.y - mouseY * 0.4, lookAtPos.z);
      
      const time = Date.now() * 0.001;
      fiberMat.opacity = 0.55 + Math.sin(time * 2.5) * 0.3;
      fiberMat2.opacity = 0.45 + Math.cos(time * 2.0) * 0.25;
      particleSystem.rotation.z = time * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    // --- CLEANUP ---
    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      trigger.kill();
      
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      material.dispose();
      fiberGeo.dispose();
      fiberMat.dispose();
      fiberGeo2.dispose();
      fiberMat2.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div id="canvas-container" ref={containerRef} className="fixed inset-0 z-0 bg-[#050505] pointer-events-none transform-gpu" />;
};

export default TunnelBackground;