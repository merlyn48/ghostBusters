"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Share2, RotateCcw, PartyPopper } from "lucide-react";

interface PrankRevealProps {
  isRevealed: boolean;
  onRestart: () => void;
  partyMode: boolean;
  onToggleParty: () => void;
}

export default function PrankReveal({
  isRevealed,
  onRestart,
  partyMode,
  onToggleParty,
}: PrankRevealProps) {
  const [phase, setPhase] = useState<"hidden" | "screamer" | "celebrate">("hidden");
  const [copied, setCopied] = useState(false);
  const [bats, setBats] = useState<{ id: number; type: "bat" | "ghost"; left: number; delay: number; speed: number; scale: number }[]>([]);

  // 1. Manage phases of the reveal
  useEffect(() => {
    if (!isRevealed) {
      setPhase("hidden");
      return;
    }

    // Step A: Trigger the intense glitch screamer phase for 1.3 seconds
    setPhase("screamer");

    const timer = setTimeout(() => {
      // Step B: Transition to the celebratory party phase
      setPhase("celebrate");
    }, 1300);

    return () => clearTimeout(timer);
  }, [isRevealed]);

  // 2. Trigger Confetti loops during celebration phase
  useEffect(() => {
    if (phase !== "celebrate") return;

    // Initial big splash
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.55 },
      colors: partyMode 
        ? ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"] 
        : ["#c39f61", "#ffffff", "#8b5cf6", "#f43f5e", "#10b981"],
    });

    // Subseqent periodic blasts
    const interval = setInterval(() => {
      confetti({
        particleCount: 60,
        angle: Math.random() > 0.5 ? 60 : 120,
        spread: 60,
        origin: { x: Math.random() > 0.5 ? 0.15 : 0.85, y: 0.4 },
        colors: partyMode 
          ? ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
          : ["#c39f61", "#ffffff", "#f43f5e", "#3b82f6"],
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [phase, partyMode]);

  // 3. Generate flying bats and ghosts
  useEffect(() => {
    if (phase !== "celebrate") {
      setBats([]);
      return;
    }

    const temp: typeof bats = [];
    // Spawn 14 bats and ghosts
    for (let i = 0; i < 14; i++) {
      temp.push({
        id: i,
        type: Math.random() > 0.55 ? "bat" : "ghost",
        left: Math.random() * 85 + 5,
        delay: Math.random() * 7,
        speed: 5 + Math.random() * 5,
        scale: 0.35 + Math.random() * 0.7,
      });
    }
    setBats(temp);
  }, [phase]);

  // 4. Share prank link copying
  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (phase === "hidden") return null;

  return (
    <div 
      className={`fixed inset-0 w-full h-full z-[100] flex flex-col justify-center items-center overflow-hidden transition-all duration-700 ${
        phase === "screamer" 
          ? "bg-black" 
          : partyMode 
            ? "bg-gradient-to-tr from-purple-950 via-slate-900 to-red-950 animate-pulse" 
            : "bg-[#0b0c10]"
      }`}
    >
      {/* 1. CSS KEYFRAME ANIMATIONS INJECTED LOCALLY */}
      <style>{`
        .screamer-glitch {
          animation: screamer-shake 0.08s infinite alternate, screamer-color 0.15s infinite;
        }
        @keyframes screamer-shake {
          0% { transform: translate(3px, 5px) scale(1.05); }
          100% { transform: translate(-3px, -5px) scale(0.95); }
        }
        @keyframes screamer-color {
          0%, 100% { background-color: #000; filter: invert(0); }
          50% { background-color: #700; filter: invert(0.1); }
        }
        .skele-head {
          transform-origin: 50px 38px;
          animation: skele-head-dance 0.7s ease-in-out infinite alternate;
        }
        .skele-arm-l {
          transform-origin: 38px 52px;
          animation: skele-arm-l-dance 0.35s ease-in-out infinite alternate;
        }
        .skele-arm-r {
          transform-origin: 62px 52px;
          animation: skele-arm-r-dance 0.35s ease-in-out infinite alternate;
        }
        .skele-leg-l {
          transform-origin: 44px 94px;
          animation: skele-leg-l-dance 0.7s ease-in-out infinite alternate;
        }
        .skele-leg-r {
          transform-origin: 56px 94px;
          animation: skele-leg-r-dance 0.7s ease-in-out infinite alternate;
        }
        @keyframes skele-head-dance {
          0% { transform: rotate(-10deg) translateY(2px); }
          100% { transform: rotate(10deg) translateY(-2px); }
        }
        @keyframes skele-arm-l-dance {
          0% { transform: rotate(-50deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes skele-arm-r-dance {
          0% { transform: rotate(50deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes skele-leg-l-dance {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(12deg); }
        }
        @keyframes skele-leg-r-dance {
          0% { transform: rotate(15deg); }
          100% { transform: rotate(-12deg); }
        }
        .text-rainbow {
          background-image: linear-gradient(to right, #ec4899, #f43f5e, #eab308, #10b981, #3b82f6, #8b5cf6, #ec4899);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: rainbow-scroll 3s linear infinite;
        }
        @keyframes rainbow-scroll {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* 2. THE SCREAMER PHASE */}
      {phase === "screamer" && (
        <div className="fixed inset-0 w-full h-full screamer-glitch flex flex-col justify-center items-center">
          {/* Shaking Spooky Red Skull Outline */}
          <svg viewBox="0 0 100 100" className="w-64 h-64 text-red-600 fill-none stroke-current" strokeWidth="2.5">
            {/* Skull structure */}
            <path d="M 30,50 A 20,20 0 1,1 70,50 L 65,75 A 15,15 0 0,1 35,75 Z" />
            <path d="M 40,75 L 40,82 M 45,75 L 45,82 M 50,75 L 50,82 M 55,75 L 55,82 M 60,75 L 60,82" />
            {/* Eyes */}
            <circle cx="42" cy="48" r="7" className="fill-red-600" />
            <circle cx="58" cy="48" r="7" className="fill-red-600" />
            {/* Nose */}
            <path d="M 50,56 L 47,63 L 53,63 Z" className="fill-red-600" />
          </svg>
          <div className="text-red-500 font-mono tracking-[0.4em] text-lg uppercase mt-8 animate-ping">
            SYSTEM CORRUPTED
          </div>
        </div>
      )}

      {/* 3. THE CELEBRATION GOTCHA PHASE */}
      {phase === "celebrate" && (
        <div className="flex flex-col justify-between items-center w-full h-full p-6 md:p-12 text-center relative z-20">
          
          {/* Flying Bats & Ghosts */}
          {bats.map((b) => (
            <div
              key={b.id}
              className="bat"
              style={{
                left: `${b.left}vw`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.speed}s`,
                transform: `scale(${b.scale})`,
              }}
            >
              {b.type === "bat" ? (
                /* Cute Bat SVG */
                <svg viewBox="0 0 50 30" className="w-14 h-8 fill-gray-500/80">
                  <path d="M 25,12 C 20,8 14,8 5,14 C 7,16 11,18 15,18 C 19,18 21,15 25,18 C 29,15 31,18 35,18 C 39,18 43,16 45,14 C 36,8 30,8 25,12 Z" />
                  <circle cx="23" cy="15" r="1.5" fill="red" />
                  <circle cx="27" cy="15" r="1.5" fill="red" />
                </svg>
              ) : (
                /* Smiling Ghost SVG */
                <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white/60">
                  <path d="M 20,4 C 11,4 8,12 8,20 C 8,28 10,36 12,36 C 14,36 16,33 20,36 C 24,33 26,36 28,36 C 30,36 32,28 32,20 C 32,12 29,4 20,4 Z" />
                  <circle cx="16" cy="18" r="2.5" fill="black" />
                  <circle cx="24" cy="18" r="2.5" fill="black" />
                  <path d="M 17,24 Q 20,28 23,24" stroke="black" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </div>
          ))}

          {/* Top Title */}
          <div className="mt-6 md:mt-10 select-none">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide mb-3 text-rainbow">
              😂 GOTCHA! You just got haunted!
            </h1>
            <p className="text-gray-400 font-light text-sm tracking-widest max-w-md mx-auto">
              Relax, it's just a friendly ghost prank! Hope you had a good laugh. Share this with your friends and scare them too!
            </p>
          </div>

          {/* Center: Funny Skeleton Dance and wave */}
          <div className="flex flex-col items-center justify-center my-6 relative select-none">
            {/* Friendly dancing skeleton */}
            <svg viewBox="0 0 100 150" className="w-48 h-72 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              {/* Head */}
              <g className="skele-head">
                <rect x="38" y="16" width="24" height="24" rx="8" fill="#ffffff" />
                <circle cx="45" cy="25" r="3.5" fill="#000000" />
                <circle cx="55" cy="25" r="3.5" fill="#000000" />
                <path d="M 46,33 Q 50,37 54,33" stroke="#000000" strokeWidth="2" fill="none" />
                <path d="M 47,29 L 49,31 L 51,29" stroke="#000000" strokeWidth="1.5" />
              </g>

              {/* Spine */}
              <line x1="50" y1="40" x2="50" y2="86" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
              
              {/* Ribcage */}
              <line x1="36" y1="50" x2="64" y2="50" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="36" y1="62" x2="64" y2="62" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="40" y1="74" x2="60" y2="74" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Pelvis */}
              <rect x="38" y="82" width="24" height="9" rx="3" fill="#ffffff" />

              {/* Left Arm */}
              <g className="skele-arm-l">
                <line x1="36" y1="50" x2="20" y2="68" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <line x1="20" y1="68" x2="10" y2="52" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* Right Arm */}
              <g className="skele-arm-r">
                <line x1="64" y1="50" x2="80" y2="68" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <line x1="80" y1="68" x2="90" y2="52" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* Left Leg */}
              <g className="skele-leg-l">
                <line x1="44" y1="91" x2="40" y2="118" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="40" y1="118" x2="34" y2="142" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              </g>

              {/* Right Leg */}
              <g className="skele-leg-r">
                <line x1="56" y1="91" x2="60" y2="118" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="60" y1="118" x2="66" y2="142" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
              </g>
            </svg>
            
            {/* Party Mode indicator */}
            {partyMode && (
              <span className="mt-2 text-xs font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full animate-bounce">
                🎉 GHOST PARTY MODE ACTIVE! 🎉
              </span>
            )}
          </div>

          {/* Action Buttons Panel */}
          <div className="flex flex-wrap gap-4 justify-center max-w-md w-full mb-8 z-30">
            {/* Haunt Again */}
            <button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-xs tracking-wider rounded uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-serif"
            >
              <RotateCcw className="w-4 h-4" />
              👻 Haunt Again
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-black font-semibold text-xs tracking-wider rounded uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-serif shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Copied Link!" : "😂 Share Prank"}
            </button>

            {/* Party Mode Toggle */}
            <button
              onClick={onToggleParty}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 border font-semibold text-xs tracking-wider rounded uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer font-serif ${
                partyMode
                  ? "bg-yellow-500 text-black border-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-yellow-500 hover:border-yellow-500/30"
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              Toggle Party Mode
            </button>
          </div>

          {/* Credits footer with Easter Egg hover effect */}
          <div className="group relative z-30 mb-2">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase cursor-help hover:text-white transition-colors">
              Designed by the AURA Development Team (Hover for credits)
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 glass-panel p-4 rounded text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 shadow-2xl">
              <h4 className="text-xs font-serif text-primary uppercase tracking-wider mb-2 border-b border-white/10 pb-1">
                Spectral Team
              </h4>
              <ul className="text-[10px] font-mono text-gray-400 space-y-1">
                <li>👻 Count Devula — Web Audio Synthesizer</li>
                <li>☠ CSS Spectre — Motion & Grain Animations</li>
                <li>👾 Web Wraith — GLSL Shaders & 3D Render</li>
                <li>🎃 Poltergeist UI — Visual Layout & Glitches</li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
