"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ShieldAlert, Cpu, Activity, RefreshCw } from "lucide-react";

interface CinematicOverlayProps {
  onStart: () => void;
  isStarted: boolean;
  suspenseFactor: number;
  isRevealed: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onDeveloperClick: () => void;
}

// 1. Sleek Text Scrambler Component
function ScrambleText({ text, creepText, active }: { text: string; creepText: string; active: boolean }) {
  const [displayText, setDisplayText] = useState(text);
  const chars = "XYZØΨΩ☠☣☤ΞΛΠΣΦΨΩabcdefghijklmnopqrstuvwxyz0123456789";

  useEffect(() => {
    if (!active) {
      setDisplayText(text);
      return;
    }

    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.06) {
        setDisplayText(creepText);
      } else if (rand < 0.35) {
        // Scramble letters
        let scrambled = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") {
            scrambled += " ";
          } else {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setDisplayText(scrambled);
      } else {
        setDisplayText(text);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [active, text, creepText]);

  return <span>{displayText}</span>;
}

// 2. Cursor Trail HTML5 Canvas Component
function CursorTrailCanvas({ suspenseFactor }: { suspenseFactor: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number; age: number; maxAge: number }[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (suspenseFactor > 0.05) {
        // Emit a new point based on mouse coordinates
        pointsRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          age: 0,
          maxAge: 35 + suspenseFactor * 45, // Trail length grows with suspense
        });

        // Limit points
        if (pointsRef.current.length > 250) {
          pointsRef.current.shift();
        }

        // Draw connecting glowing trail
        ctx.beginPath();
        for (let i = 0; i < pointsRef.current.length; i++) {
          const pt = pointsRef.current[i];
          pt.age++;

          if (pt.age >= pt.maxAge) {
            pointsRef.current.splice(i, 1);
            i--;
            continue;
          }

          const ratio = 1 - pt.age / pt.maxAge;
          const radius = (2 + suspenseFactor * 10) * ratio; // Thickness grows with suspense
          
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Glow red color with transparency
          ctx.strokeStyle = `rgba(239, 68, 68, ${ratio * suspenseFactor * 0.95})`;
          ctx.lineWidth = radius * 2;

          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [suspenseFactor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[99]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// MAIN OVERLAY COMPONENT
export default function CinematicOverlay({
  onStart,
  isStarted,
  suspenseFactor,
  isRevealed,
  isMuted,
  onToggleMute,
  onDeveloperClick,
}: CinematicOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [breathingScale, setBreathingScale] = useState(1);
  const [isFlickering, setIsFlickering] = useState(false);
  const [calibrationCount, setCalibrationCount] = useState(0);

  // 1. Simulate cinematic loading bar
  useEffect(() => {
    if (isStarted) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoadingFinished(true);
          return 100;
        }
        // Realistic step-wise progress increments
        const step = Math.floor(Math.random() * 6) + 2;
        return Math.min(prev + step, 100);
      });
    }, 200 + Math.random() * 200);

    return () => clearInterval(interval);
  }, [isStarted]);

  // 2. Global container breathing animation loop
  useEffect(() => {
    if (!isStarted || isRevealed) return;

    let animFrame: number;
    const loop = () => {
      const time = Date.now();
      // Speeds up and deepens as suspense builds
      const rate = 0.002 + suspenseFactor * 0.007;
      const amplitude = 0.0015 + suspenseFactor * 0.0085;
      
      const scale = 1.0 + Math.sin(time * rate) * amplitude;
      setBreathingScale(scale);

      // Flickering layout events trigger randomly at high suspense
      if (suspenseFactor > 0.45) {
        if (Math.random() > 0.982) {
          setIsFlickering(true);
          setTimeout(() => setIsFlickering(false), 80 + Math.random() * 150);
        }
      }

      animFrame = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animFrame);
  }, [isStarted, isRevealed, suspenseFactor]);

  if (isRevealed) return null;

  return (
    <div 
      className={`absolute inset-0 w-full h-full z-20 flex flex-col justify-between transition-opacity duration-[1500ms] ${
        isFlickering ? "opacity-30" : "opacity-100"
      }`}
      style={{
        transform: `scale(${breathingScale})`,
        fontFamily: "var(--font-outfit)",
      }}
    >
      {/* ALWAYS VISIBLE CONTROLS */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-4">
        {isStarted && (
          <span className="text-[10px] text-gray-500 tracking-[0.25em] uppercase font-mono bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
            Neural Syncing: {(100 - suspenseFactor * 30).toFixed(1)}%
          </span>
        )}
        <button
          onClick={onToggleMute}
          className="p-3 rounded-full bg-black/50 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* CURSOR TRAIL */}
      <CursorTrailCanvas suspenseFactor={suspenseFactor} />

      {/* 1. LOADING SCREEN SCENE */}
      {!isStarted && (
        <div className="fixed inset-0 w-full h-full bg-[#060608] z-[90] flex flex-col justify-between p-8 md:p-12 items-center text-center">
          {/* Subtle Ambient Glow inside loader */}
          <div className="ambient-glow" />

          {/* Top Brand Name */}
          <div className="mt-8 z-10 select-none">
            <h2 className="text-sm font-serif tracking-[0.6em] text-primary/70 uppercase">
              AURA TECHNOLOGIES
            </h2>
          </div>

          {/* Loader Body */}
          <div className="flex flex-col items-center max-w-lg w-full z-10">
            <h1 className="text-3xl md:text-4xl font-light font-serif tracking-wider text-white mb-6 animate-pulse">
              Welcome! Loading your surprise...
            </h1>
            
            {/* Cinematic loading bar */}
            <div className="w-full h-[2px] bg-white/5 rounded-full mb-4 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(195,159,97,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between w-full font-mono text-[10px] text-gray-500 tracking-widest uppercase">
              <span>Initializing Audio Synthesizer</span>
              <span>{progress}%</span>
            </div>

            {/* Glowing CTA Button when complete */}
            <div className="h-16 mt-8 flex items-center justify-center">
              {loadingFinished && (
                <button
                  onClick={onStart}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary/80 to-primary text-black font-semibold text-xs tracking-[0.25em] rounded uppercase transition-all duration-500 shadow-[0_0_20px_rgba(195,159,97,0.35)] hover:shadow-[0_0_35px_rgba(195,159,97,0.6)] hover:scale-105 active:scale-95 cursor-pointer font-serif animate-bounce"
                >
                  Enter Experience
                </button>
              )}
            </div>
          </div>

          {/* Disclaimer at Bottom */}
          <div className="mb-8 z-10 flex items-center gap-3 text-gray-500 max-w-sm select-none">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-primary/40" />
            <p className="text-[10px] text-left leading-relaxed tracking-wider">
              IMPORTANT: This experience features dynamic lighting, subtle motion parallax, and immersive synthesized audio. Adjust your volume.
            </p>
          </div>
        </div>
      )}

      {/* 2. THE ELEGANT LANDING PAGE UI */}
      {isStarted && (
        <div className="w-full h-full flex flex-col justify-between p-6 md:p-8 pointer-events-none">
          
          {/* HEADER */}
          <header className="w-full flex justify-between items-center z-30 select-none">
            <div 
              className="text-lg md:text-xl font-serif tracking-[0.4em] text-white cursor-pointer pointer-events-auto"
              onClick={onDeveloperClick}
            >
              [ A U R A ]
            </div>
            
            <nav className="hidden md:flex gap-8 text-[11px] font-mono tracking-[0.25em] text-gray-400">
              <span className="hover:text-primary transition-colors cursor-pointer pointer-events-auto">
                <ScrambleText text="RESONANCE" creepText="WE SEE YOU" active={suspenseFactor > 0.4} />
              </span>
              <span className="hover:text-primary transition-colors cursor-pointer pointer-events-auto">
                <ScrambleText text="BIOMETRICS" creepText="HEAR US NOW" active={suspenseFactor > 0.5} />
              </span>
              <span className="hover:text-primary transition-colors cursor-pointer pointer-events-auto">
                <ScrambleText text="NEURAL NET" creepText="NO ESCAPE" active={suspenseFactor > 0.6} />
              </span>
              <span 
                className="hover:text-primary transition-colors cursor-pointer pointer-events-auto text-primary/80"
                onClick={onDeveloperClick}
              >
                CREDITS
              </span>
            </nav>
          </header>

          {/* MAIN TYPOGRAPHY HERO SECTION */}
          <main className="flex-grow flex flex-col justify-center items-center text-center my-8 z-10 select-none">
            <div className="max-w-xl md:max-w-2xl">
              <h2 className="text-[11px] font-mono tracking-[0.5em] text-primary mb-4 uppercase">
                <ScrambleText 
                  text="SPECTRAL HARMONIZATION MODULE" 
                  creepText="YOU CANNOT RUN AWAY" 
                  active={suspenseFactor > 0.3} 
                />
              </h2>
              
              <h1 className="text-4xl md:text-6xl font-light font-serif tracking-widest text-white mb-6 uppercase">
                <ScrambleText 
                  text="AURA COGNITIVE MODULE" 
                  creepText="WHO IS IN THE DARK" 
                  active={suspenseFactor > 0.5} 
                />
              </h1>
              
              <p className="text-xs md:text-sm text-gray-400 font-light tracking-widest leading-relaxed max-w-lg mx-auto">
                <ScrambleText 
                  text="Synchronizing light oscillation patterns and low-frequency resonant soundscapes to align cognitive load profiles." 
                  creepText="It beats faster... can you hear it? Behind you. The eyes watch from the shadow." 
                  active={suspenseFactor > 0.6} 
                />
              </p>
            </div>
          </main>

          {/* BOTTOM GRID PANEL (MOCK METRICS) */}
          <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 z-20">
            {/* CARD 1: RESONANCE COEFF */}
            <div className="glass-panel p-5 rounded-lg flex flex-col justify-between h-32 md:h-36 relative overflow-hidden pointer-events-auto">
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <Cpu className="w-4 h-4 text-primary/60" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                    <ScrambleText text="Spectral Cohesion" creepText="WATCHING YOU" active={suspenseFactor > 0.4} />
                  </span>
                </div>
                <span className="text-[9px] font-mono text-green-500 uppercase px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded">
                  <ScrambleText text="Stable" creepText="DEAD" active={suspenseFactor > 0.6} />
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-serif tracking-wider text-white">
                  {suspenseFactor > 0.7 ? "ERROR_☠" : "99.82 Hz"}
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/60 transition-all duration-300"
                  style={{ width: `${99.82 - suspenseFactor * 40}%` }}
                />
              </div>
            </div>

            {/* CARD 2: PULSE GRAPH */}
            <div className="glass-panel p-5 rounded-lg flex flex-col justify-between h-32 md:h-36 relative overflow-hidden pointer-events-auto">
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <Activity className="w-4 h-4 text-primary/60" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                    <ScrambleText text="Pulse Sync" creepText="PULSE HIGH" active={suspenseFactor > 0.4} />
                  </span>
                </div>
                <span className="text-[9px] font-mono text-primary animate-pulse uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-end gap-1 h-12 w-full mt-2">
                {/* SVG Live visualizer */}
                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d={`M 0 15 Q 10 ${15 - Math.sin(Date.now() / 100) * 10} 20 15 T 40 15 T 60 ${
                      15 - Math.sin(Date.now() / 80) * (10 + suspenseFactor * 15)
                    } 80 15 T 100 15`}
                    fill="none"
                    stroke={suspenseFactor > 0.65 ? "#ef4444" : "#c39f61"}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="text-[9px] font-mono text-gray-500 tracking-wider flex justify-between">
                <span>BPM: {Math.round(46 + suspenseFactor * 87)}</span>
                <span>COHERENCE: {(99.2 - suspenseFactor * 32).toFixed(1)}%</span>
              </div>
            </div>

            {/* CARD 3: CALIBRATION INTERACTIVE TRIGGER */}
            <div 
              className={`glass-panel p-5 rounded-lg flex flex-col justify-between h-32 md:h-36 relative overflow-hidden pointer-events-auto transition-all cursor-pointer group ${
                suspenseFactor > 0.6 ? "hover:border-red-500/30" : "hover:border-primary/30"
              }`}
              onClick={() => {
                setCalibrationCount((prev) => prev + 1);
                // Trigger a local glitch trigger callback or effect in parent
                if (window && (window as any).glitchTrigger) {
                  (window as any).glitchTrigger();
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <RefreshCw className="w-4 h-4 text-primary/60 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                    <ScrambleText text="Self Calibration" creepText="DO NOT PRESS" active={suspenseFactor > 0.5} />
                  </span>
                </div>
              </div>
              
              <div className="text-left">
                <div className="text-sm font-serif tracking-wider text-white mb-1 group-hover:text-primary transition-colors">
                  <ScrambleText text="Calibrate System" creepText="LET THEM OUT" active={suspenseFactor > 0.4} />
                </div>
                <div className="text-[9px] font-mono text-gray-500">
                  Manual calibrations run: {calibrationCount}
                </div>
              </div>

              <div className="text-[9px] font-mono text-primary/50 tracking-wider">
                Click to realign spectral matrix &gt;
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
