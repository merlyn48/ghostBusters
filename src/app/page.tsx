"use client";

// Suppress deprecation warnings from third-party libraries (e.g., THREE.Clock in React Three Fiber)
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("THREE.Clock") || args[0].includes("PCFSoftShadowMap"))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { audioEngine } from "@/components/AudioEngine";
import CinematicOverlay from "@/components/CinematicOverlay";
import PrankReveal from "@/components/PrankReveal";

// Dynamically import the 3D Canvas with SSR disabled to prevent node-window compilation errors
const HorrorCanvas = dynamic(() => import("@/components/HorrorCanvas"), {
  ssr: false,
});

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
  const [suspenseFactor, setSuspenseFactor] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [partyMode, setPartyMode] = useState(false);

  // Easter Eggs state
  const [showFriendlyGhost, setShowFriendlyGhost] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);
  const [tinyGhosts, setTinyGhosts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  // Developer credits modal visibility
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Keyboard combo capture registers
  const [konamiIdx, setKonamiIdx] = useState(0);
  const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  const [wordIdx, setWordIdx] = useState(0);
  const targetWord = ["g", "h", "o", "s", "t"];

  // Click tracking for triple-click
  const lastClickTime = useRef(0);
  const clickCount = useRef(0);

  // 1. Initialize and bind manual glitch trigger function for the HUD
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).glitchTrigger = () => {
        audioEngine.triggerGlitch();
        // Advancing the suspense slightly on click to increase tension
        setSuspenseFactor((prev) => Math.min(prev + 0.12, 0.99));
      };
    }
  }, []);

  // 2. Main Experience Suspense Timeline
  useEffect(() => {
    if (!isStarted || isRevealed) return;

    // Total suspense countdown of 60 seconds
    const totalDuration = 60000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressFactor = Math.min(elapsed / totalDuration, 1);

      // We only start showing suspense indicators after 20 seconds (leaving first 20s completely innocent)
      let adjustedFactor = 0;
      if (elapsed > 20000) {
        adjustedFactor = (elapsed - 20000) / (totalDuration - 20000);
      }

      setSuspenseFactor(adjustedFactor);
      audioEngine.setSuspense(adjustedFactor);

      // Once countdown hits 100%, trigger the reveal scare sequence
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        triggerPrankReveal();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, isRevealed]);

  // 3. Global Key Event Handler (Easter Eggs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isRevealed) return;

      // A. "H" Key waves a friendly ghost
      if (e.key.toLowerCase() === "h") {
        setShowFriendlyGhost(true);
        setTimeout(() => setShowFriendlyGhost(false), 2600);
      }

      // B. Konami Code (Ghost Party Mode trigger)
      if (e.key === konamiCode[konamiIdx]) {
        if (konamiIdx === konamiCode.length - 1) {
          setPartyMode(true);
          triggerPrankReveal(true);
          setKonamiIdx(0);
        } else {
          setKonamiIdx((prev) => prev + 1);
        }
      } else {
        setKonamiIdx(0);
      }

      // C. Word Code "ghost" (Rainbow Haunted Mode)
      if (e.key.toLowerCase() === targetWord[wordIdx]) {
        if (wordIdx === targetWord.length - 1) {
          setRainbowMode(true);
          setWordIdx(0);
        } else {
          setWordIdx((prev) => prev + 1);
        }
      } else {
        setWordIdx(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [konamiIdx, wordIdx, isStarted, isRevealed]);

  // 4. Click tracker for Triple Click Spawns
  const handlePageClick = (e: React.MouseEvent) => {
    if (!isStarted || isRevealed) return;

    const now = Date.now();
    if (now - lastClickTime.current < 550) {
      clickCount.current += 1;
    } else {
      clickCount.current = 1;
    }
    lastClickTime.current = now;

    // Triple click triggered
    if (clickCount.current === 3) {
      const spawned: typeof tinyGhosts = [];
      // Generate 32 tiny floating ghost particles around the click location
      for (let i = 0; i < 32; i++) {
        spawned.push({
          id: Math.random() + i,
          x: e.clientX + (Math.random() - 0.5) * 160,
          y: e.clientY + (Math.random() - 0.5) * 160,
        });
      }
      setTinyGhosts(spawned);
      
      // Clear them from DOM after float animation finishes
      setTimeout(() => {
        setTinyGhosts([]);
      }, 4000);

      clickCount.current = 0;
    }
  };

  // 5. Initialize/Enter Experience Click
  const startExperience = async () => {
    setIsStarted(true);
    await audioEngine.start();
  };

  // 6. Sound Mute Toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMute(nextMute);
  };

  // 7. Trigger the Scare/Prank Reveal
  const triggerPrankReveal = (forceParty: boolean = false) => {
    if (forceParty) {
      setPartyMode(true);
    }
    setIsRevealed(true);
    audioEngine.triggerScream();

    // Transition from screaming to retro celebration music after 1.3 seconds
    setTimeout(() => {
      audioEngine.startCelebration();
    }, 1300);
  };

  // 8. Re-arm and reset prank website
  const restartExperience = async () => {
    audioEngine.stopAll();
    setIsRevealed(false);
    setSuspenseFactor(0);
    setPartyMode(false);
    setRainbowMode(false);
    setIsStarted(false);
  };

  // 9. Manual Toggle for Developer Credits
  const toggleCreditsModal = () => {
    setShowCreditsModal((prev) => !prev);
  };

  return (
    <div 
      className={`relative w-full min-h-screen overflow-hidden flex flex-col justify-between select-none ${
        rainbowMode ? "text-rainbow animate-pulse" : ""
      } ${
        // If high suspense, subtly shake the page periodically
        suspenseFactor > 0.75 && !isRevealed && Math.random() > 0.88 
          ? "page-shake" 
          : ""
      }`}
      onClick={handlePageClick}
    >
      {/* Dynamic inline styles for Easter egg particle floats */}
      <style>{`
        .ghost-particle {
          animation: floatUp 3.5s ease-out forwards;
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-350px) scale(0.4) rotate(45deg); opacity: 0; }
        }
        .credits-glow {
          box-shadow: 0 0 30px rgba(195,159,97,0.15);
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      {/* 3D WebGL Scene */}
      <HorrorCanvas suspenseFactor={suspenseFactor} isRevealed={isRevealed} />
      
      {/* Cinematic Film-Grain effect overlay */}
      <div className="film-grain" />

      {/* VHS Horizontal Scanning Lines overlay during horror buildup */}
      {suspenseFactor > 0.25 && !isRevealed && (
        <div 
          className="vhs-scanlines crt-flicker"
          style={{ opacity: suspenseFactor * 0.45 }}
        />
      )}

      {/* CORE EXPERIENCE HUD OVERLAYS */}
      <CinematicOverlay
        onStart={startExperience}
        isStarted={isStarted}
        suspenseFactor={suspenseFactor}
        isRevealed={isRevealed}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onDeveloperClick={toggleCreditsModal}
      />

      {/* THE PRANK SCREAMER / CELEBRATION REVEAL PAGE */}
      <PrankReveal
        isRevealed={isRevealed}
        onRestart={restartExperience}
        partyMode={partyMode}
        onToggleParty={() => setPartyMode(prev => !prev)}
      />

      {/* EASTER EGG LAYERS */}
      {/* A. Friendly Waving Ghost (Triggered by 'H') */}
      {showFriendlyGhost && (
        <div className="fixed bottom-24 right-10 z-[80] flex flex-col items-center animate-bounce">
          <div className="bg-white text-black text-xs font-serif font-bold tracking-widest uppercase px-4 py-2 rounded-lg shadow-2xl border-2 border-primary mb-3 relative">
            Boo! Just kidding 👋
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </div>
          {/* Animated SVG waving ghost */}
          <svg viewBox="0 0 50 50" className="w-20 h-20 fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <path d="M 25,5 C 15,5 11,15 11,25 C 11,35 13,45 15,45 C 17,45 19,41 25,45 C 31,41 33,45 35,45 C 37,45 39,35 39,25 C 39,15 35,5 25,5 Z" />
            <circle cx="21" cy="22" r="3" fill="black" />
            <circle cx="29" cy="22" r="3" fill="black" />
            <circle cx="25" cy="28" r="1.5" fill="red" />
            {/* Waving Arm */}
            <path d="M 39,22 Q 45,12 43,10" stroke="white" strokeWidth="4" strokeLinecap="round" className="origin-[39px_22px] animate-pulse" />
          </svg>
        </div>
      )}

      {/* B. Tiny Ghost click-spawns */}
      {tinyGhosts.map((g) => (
        <div
          key={g.id}
          className="fixed pointer-events-none z-[80] ghost-particle"
          style={{ left: g.x, top: g.y }}
        >
          {/* Mini Cute Ghost SVG */}
          <svg viewBox="0 0 20 20" className="w-6 h-6 fill-white/80 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            <path d="M 10,2 C 6,2 4,6 4,10 C 4,14 5,18 6,18 C 7,18 8,16 10,18 C 12,16 13,18 14,18 C 15,18 16,14 16,10 C 16,6 14,2 10,2 Z" />
            <circle cx="8" cy="8" r="1" fill="black" />
            <circle cx="12" cy="8" r="1" fill="black" />
          </svg>
        </div>
      ))}

      {/* C. Interactive Developer Credits Modal */}
      {showCreditsModal && (
        <div 
          className="fixed inset-0 w-full h-full bg-black/80 flex items-center justify-center z-[150] p-4 cursor-default"
          onClick={toggleCreditsModal}
        >
          <div 
            className="glass-panel p-6 md:p-8 rounded-lg max-w-sm w-full credits-glow text-center flex flex-col justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-serif text-primary uppercase tracking-[0.25em] mb-4 border-b border-white/10 pb-2 w-full">
              Developer Credits
            </h2>
            <div className="text-xs font-mono text-gray-400 space-y-3 mb-6 text-left w-full">
              <p className="flex justify-between border-b border-white/5 pb-1">
                <span>Director / Audio Synthesizer:</span>
                <span className="text-white">Count Devula</span>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-1">
                <span>Lead WebGL/3D developer:</span>
                <span className="text-white">Web Wraith</span>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-1">
                <span>UI motion & design designer:</span>
                <span className="text-white">CSS Spectre</span>
              </p>
              <p className="flex justify-between pb-1">
                <span>Glitches & Haunt designer:</span>
                <span className="text-white">Poltergeist UI</span>
              </p>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider italic mb-6">
              * Fully synthesized using the Web Audio API and WebGL Shader logic. No external sound assets are requested.
            </p>
            <button
              onClick={toggleCreditsModal}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs tracking-wider rounded uppercase transition-all duration-300 cursor-pointer font-serif"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
