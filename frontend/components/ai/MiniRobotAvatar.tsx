"use client";

import React from "react";

interface MiniRobotAvatarProps {
  className?: string;
  size?: number;
  isFloating?: boolean;
  showShadow?: boolean;
}

export function MiniRobotAvatar({
  className = "",
  size = 96,
  isFloating = true,
  showShadow = true,
}: MiniRobotAvatarProps) {
  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size * 1.15 }}
    >
      {/* Floating Robot Body Container */}
      <div
        className={`relative z-10 transition-transform duration-300 ease-out ${
          isFloating ? "animate-robot-float" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-[0_8px_16px_rgba(37,99,235,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cloud Head Silhouette (Outer Dark Outline) */}
          {/* Main cloud lobes */}
          {/* Back shading layer */}
          <path
            d="M38 42 C30 42 22 50 22 62 C22 74 30 82 40 84 C43 85 47 85 50 84 C54 90 62 93 70 93 C78 93 85 89 89 84 C92 85 96 85 100 83 C109 81 116 73 116 62 C116 50 108 42 98 42 C96 42 93 42 91 43 C87 35 79 30 70 30 C60 30 52 35 48 43 C45 42 41 42 38 42 Z"
            fill="#233261"
          />

          {/* Cloud Main Body Fill */}
          <path
            d="M39 44 C32 44 25 51 25 62 C25 72 32 80 41 81 C44 82 48 82 51 81 C55 87 62 90 70 90 C77 90 84 86 88 81 C91 82 95 82 98 81 C106 79 113 72 113 62 C113 51 106 44 97 44 C95 44 92 44 90 45 C86 38 78 33 70 33 C61 33 54 38 49 45 C46 44 42 44 39 44 Z"
            fill="#557df8"
          />

          {/* Cloud Top Highlights */}
          <path
            d="M50 44 C53 38 61 34 70 34 C78 34 85 38 89 44 C86 42 81 40 76 40 C67 40 59 42 50 44 Z"
            fill="#7b9efb"
            opacity="0.85"
          />
          <path
            d="M39 46 C34 46 29 51 28 58 C30 52 35 48 41 48 C43 48 46 48 48 49 C46 47 42 46 39 46 Z"
            fill="#7b9efb"
            opacity="0.7"
          />
          <path
            d="M98 46 C103 46 108 51 109 58 C107 52 102 48 96 48 C94 48 91 48 89 49 C91 47 95 46 98 46 Z"
            fill="#7b9efb"
            opacity="0.7"
          />

          {/* Robot Torso Base */}
          <rect
            x="48"
            y="76"
            width="44"
            height="30"
            rx="12"
            fill="#233261"
          />
          <rect
            x="50"
            y="77"
            width="40"
            height="27"
            rx="10"
            fill="#4b70e8"
          />

          {/* Torso Shading / Highlights */}
          <path
            d="M54 78 C52 82 52 94 54 98"
            stroke="#759bf9"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Little Arms */}
          {/* Left Arm */}
          <path
            d="M48 81 C44 83 39 88 40 94 C41 99 45 101 49 98 C50 96 50 88 48 81 Z"
            fill="#233261"
          />
          <path
            d="M47 83 C45 85 41 89 42 93 C43 97 46 98 48 96 C49 94 49 89 47 83 Z"
            fill="#456adb"
          />
          {/* Right Arm */}
          <path
            d="M92 81 C96 83 101 88 100 94 C99 99 95 101 91 98 C90 96 90 88 92 81 Z"
            fill="#233261"
          />
          <path
            d="M93 83 C95 85 99 89 98 93 C97 97 94 98 92 96 C91 94 91 89 93 83 Z"
            fill="#456adb"
          />

          {/* Little Legs */}
          {/* Left Leg */}
          <rect x="56" y="98" width="10" height="11" rx="4" fill="#233261" />
          <rect x="57" y="99" width="8" height="9" rx="3" fill="#3c60d4" />
          {/* Right Leg */}
          <rect x="74" y="98" width="10" height="11" rx="4" fill="#233261" />
          <rect x="75" y="99" width="8" height="9" rx="3" fill="#3c60d4" />

          {/* Dark Screen Outline & Glass Face */}
          <rect
            x="39"
            y="49"
            width="62"
            height="42"
            rx="12"
            fill="#151b32"
            stroke="#283664"
            strokeWidth="2.5"
          />
          {/* Screen Inner Glare / Depth */}
          <rect
            x="41"
            y="51"
            width="58"
            height="38"
            rx="10"
            fill="#101528"
          />
          <path
            d="M44 54 C44 53 50 53 58 53"
            stroke="#2c3a6b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Serene Glowing Cyan Eyes (Arching Peaceful Sleeping/Happy Expression) */}
          <g className="animate-robot-blink">
            {/* Left Eye */}
            <path
              d="M49 69 C49 64 57 64 57 69"
              stroke="#38f2fa"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_#38f2fa]"
            />
            {/* Right Eye */}
            <path
              d="M69 69 C69 64 77 64 77 69"
              stroke="#38f2fa"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_#38f2fa]"
            />
          </g>

          {/* White Terminal Prompt Symbol on Chest: > - */}
          <g>
            {/* Prompt bracket > */}
            <path
              d="M62 86 L66 89.5 L62 93"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
            />
            {/* Terminal cursor dash - with subtle blink */}
            <line
              x1="70"
              y1="90"
              x2="77"
              y2="90"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="animate-pulse drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
            />
          </g>
        </svg>
      </div>

      {/* Floating Shadow Below */}
      {showShadow && (
        <div
          className={`w-12 h-2.5 rounded-[100%] bg-black/45 blur-[2px] mt-1 transition-all ${
            isFloating ? "animate-robot-shadow" : ""
          }`}
        />
      )}
    </div>
  );
}
