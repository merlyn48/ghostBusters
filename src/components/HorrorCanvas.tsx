"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Glitch, Noise } from "@react-three/postprocessing";

interface HorrorCanvasProps {
  suspenseFactor: number; // 0 to 1
  isRevealed: boolean;
}

// 1. Cursor Spotlight (Flashlight)
function FlashlightSpotlight({ suspenseFactor }: { suspenseFactor: number }) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!spotlightRef.current || !targetRef.current) return;

    // Map mouse pointer (-1 to 1) to 3D coordinates on a viewport plane
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;

    // Smoothly interpolate spotlight position to mouse position
    spotlightRef.current.position.x = THREE.MathUtils.lerp(spotlightRef.current.position.x, x, 0.1);
    spotlightRef.current.position.y = THREE.MathUtils.lerp(spotlightRef.current.position.y, y, 0.1);

    // Spotlight target follows mouse slightly offset
    targetRef.current.position.x = THREE.MathUtils.lerp(targetRef.current.position.x, x * 0.3, 0.1);
    targetRef.current.position.y = THREE.MathUtils.lerp(targetRef.current.position.y, y * 0.3, 0.1);

    // Flickering when suspense is high
    let flicker = 1.0;
    if (suspenseFactor > 0.45) {
      // As factor goes from 0.45 to 1.0, the flicker probability increases
      const threshold = 1.0 - (suspenseFactor - 0.45) * 0.45;
      if (Math.random() > threshold) {
        flicker = Math.random() > 0.6 ? 0.05 : 0.3; // drops to near dark
      }
    }

    // Flashlight gets dimmer and reddish as suspense intensifies
    spotlightRef.current.intensity = (25 - suspenseFactor * 15) * flicker;
  });

  return (
    <>
      <primitive object={new THREE.Object3D()} ref={targetRef} position={[0, 0, 0]} />
      <spotLight
        ref={spotlightRef}
        target={targetRef.current || undefined}
        position={[0, 0, 7]}
        angle={0.45}
        penumbra={0.7}
        intensity={25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
        color={suspenseFactor > 0.65 ? "#ff3333" : "#fff2e6"} // turns scary blood red
      />
    </>
  );
}

// 2. Central Floating Geometric Monolith / Artifact
function FloatingArtifact({ suspenseFactor }: { suspenseFactor: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // Floating motion (breathing)
      meshRef.current.position.y = Math.sin(t * 1.1) * 0.25;
      
      // Continuous slow rotation
      meshRef.current.rotation.x = t * 0.12;
      meshRef.current.rotation.y = t * 0.18;

      // Mouse interactive tilt
      meshRef.current.rotation.x += state.pointer.y * 0.12;
      meshRef.current.rotation.y += state.pointer.x * 0.12;

      // Scale breathing - increases slightly with high suspense
      const scaleMultiplier = 1.0 + Math.sin(t * 2.5) * (0.02 + suspenseFactor * 0.03);
      meshRef.current.scale.setScalar(scaleMultiplier);
    }

    if (innerCoreRef.current) {
      // Rapid pulsation of the inner core
      const pulseRate = 3.0 + suspenseFactor * 7.0; // beats faster as suspense builds
      const pulse = 0.5 + Math.sin(t * pulseRate) * 0.15;
      innerCoreRef.current.scale.setScalar(pulse);
    }
  });

  const outerColor = suspenseFactor > 0.6 ? "#1c0b0b" : "#0d0e12";
  const innerColor = suspenseFactor > 0.6 ? "#ff2222" : "#dcae5b"; // Red core vs gold core

  return (
    <group>
      {/* Outer Luxury Glass Shell */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.7, 0]} />
        <meshPhysicalMaterial
          color={outerColor}
          roughness={0.08}
          metalness={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.4}
          thickness={1.2}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* Pulsing Core */}
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color={innerColor} />
      </mesh>
    </group>
  );
}

// 3. Volumetric Floating Ember / Dust Particles
function DustParticles({ count = 250, suspenseFactor }: { count?: number; suspenseFactor: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random stable positions and phase values
  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;     // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16; // Z
      phs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, phs];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const array = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Speed up vertical motion in suspense phase
      const speed = 0.012 + suspenseFactor * 0.025;
      array[i3 + 1] += speed;

      // Small sideways oscillation
      array[i3] += Math.sin(t * 0.4 + phases[i]) * 0.004;

      // Recirculate particle if it flows past the top boundary
      if (array[i3 + 1] > 6) {
        array[i3 + 1] = -6;
        array[i3] = (Math.random() - 0.5) * 16;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const emberColor = suspenseFactor > 0.65 ? "#ff3c00" : "#eec785";

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={emberColor}
        transparent
        opacity={0.6 + suspenseFactor * 0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// 4. Parallax Camera system
function ParallaxCamera({ suspenseFactor }: { suspenseFactor: number }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Slow camera drift (breathing camera)
    const driftX = Math.sin(t * 0.5) * 0.2;
    const driftY = Math.cos(t * 0.4) * 0.15;

    // Gentle camera parallax following the cursor in opposite direction
    const targetX = -state.pointer.x * (0.8 + suspenseFactor * 0.6) + driftX;
    const targetY = -state.pointer.y * (0.8 + suspenseFactor * 0.6) + 3 + driftY; // standard camera elevation at Y=3

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    
    // Point at center
    camera.lookAt(0, 0, 0);
  });

  return (
    <PerspectiveCamera
      makeDefault
      position={[0, 3, 7.5]}
      fov={50}
    />
  );
}

// MAIN CANVAS WRAPPER COMPONENT
export default function HorrorCanvas({ suspenseFactor, isRevealed }: HorrorCanvasProps) {
  // If revealed, we stop rendering R3F to optimize memory or hide the scary overlay
  if (isRevealed) return null;

  // Scale postprocessing aberration based on suspense
  const aberrationOffset = new THREE.Vector2(
    0.0005 + suspenseFactor * 0.0055, 
    0.0005 + suspenseFactor * 0.0055
  );

  return (
    <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
      <Canvas
        shadows="percentage"
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.12} />
        
        {/* Dim ambient light that turns red in high suspense */}
        <directionalLight 
          position={[0, 10, 0]} 
          intensity={0.2} 
          color={suspenseFactor > 0.6 ? "#ff2222" : "#ffffff"} 
        />

        <FloatingArtifact suspenseFactor={suspenseFactor} />
        
        <DustParticles count={220} suspenseFactor={suspenseFactor} />
        
        <FlashlightSpotlight suspenseFactor={suspenseFactor} />
        
        <ParallaxCamera suspenseFactor={suspenseFactor} />

        {/* Cinematic Post-Processing Effects */}
        <EffectComposer>
          {/* Soft bloom glow for emissive components */}
          <Bloom 
            luminanceThreshold={0.15} 
            luminanceSmoothing={0.8} 
            intensity={1.2 + suspenseFactor * 0.8} 
          />
          
          {/* Aberration splits light colors at viewport boundaries */}
          <ChromaticAberration 
            offset={aberrationOffset} 
            radialModulation={true} 
          />

          {/* Glitch filter - activates during horror phase */}
          <Glitch
            active={suspenseFactor > 0.4}
            delay={new THREE.Vector2(2.0 - suspenseFactor * 1.5, 4.0 - suspenseFactor * 2.5)}
            duration={new THREE.Vector2(0.08, 0.25)}
            strength={new THREE.Vector2(0.15, 0.45)}
            ratio={0.75}
          />

          {/* Dynamic Film Grain noise */}
          <Noise 
            opacity={0.06 + suspenseFactor * 0.14} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
