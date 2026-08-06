import React from "react";

interface EBLogoProps {
  className?: string;
  size?: number | string;
}

export const EBLogo: React.FC<EBLogoProps> = ({ className = "w-9 h-9", size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(212,175,55,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBF0B9" />
            <stop offset="25%" stopColor="#DFAC42" />
            <stop offset="50%" stopColor="#C8902A" />
            <stop offset="75%" stopColor="#E9C268" />
            <stop offset="100%" stopColor="#9A6918" />
          </linearGradient>

          <linearGradient id="goldInner" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7E5312" />
            <stop offset="30%" stopColor="#D4A038" />
            <stop offset="70%" stopColor="#F3E196" />
            <stop offset="100%" stopColor="#8C5C16" />
          </linearGradient>

          <linearGradient id="goldLetter" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFF2BD" />
            <stop offset="30%" stopColor="#E5B54A" />
            <stop offset="65%" stopColor="#B68023" />
            <stop offset="100%" stopColor="#FBE79E" />
          </linearGradient>

          <radialGradient id="darkBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2A1E0A" />
            <stop offset="80%" stopColor="#140E04" />
            <stop offset="100%" stopColor="#0B0802" />
          </radialGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring / Rim */}
        <circle cx="50" cy="50" r="48" fill="url(#goldRim)" stroke="#52360B" strokeWidth="1" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#2B1A05" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="43" fill="url(#darkBg)" stroke="url(#goldRim)" strokeWidth="1" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#goldInner)" strokeWidth="0.75" strokeDasharray="3 1.5" />

        {/* Outer Laurel Leaf Accents */}
        <path
          d="M 18,50 C 18,30 30,18 50,18 C 38,24 24,36 24,50 C 24,64 38,76 50,82 C 30,82 18,70 18,50 Z"
          fill="url(#goldRim)"
          opacity="0.35"
        />
        <path
          d="M 82,50 C 82,30 70,18 50,18 C 62,24 76,36 76,50 C 76,64 62,76 50,82 C 70,82 82,70 82,50 Z"
          fill="url(#goldRim)"
          opacity="0.35"
        />

        {/* Monogram "E B" Centerpiece */}
        <g filter="url(#goldGlow)">
          {/* Shadow behind letters */}
          <path
            d="M 28 28 L 52 28 C 55 28 57 29 57 32 C 57 35 55 36 52 36 L 36 36 L 36 46 L 50 46 C 53 46 55 47 55 50 C 55 53 53 54 50 54 L 36 54 L 36 64 L 54 64 C 57 64 59 65 59 68 C 59 71 57 72 54 72 L 28 72 Z"
            fill="#0F0902"
            transform="translate(1.5, 1.5)"
          />

          {/* Letter "E" */}
          <path
            d="M 27 26 L 52 26 C 56 26 58 28 58 31 C 58 34 56 36 52 36 L 36 36 L 36 46 L 49 46 C 53 46 55 48 55 50 C 55 52 53 54 49 54 L 36 54 L 36 64 L 53 64 C 57 64 59 66 59 69 C 59 72 57 74 53 74 L 27 74 C 25 74 24 72 24 70 L 24 30 C 24 28 25 26 27 26 Z"
            fill="url(#goldLetter)"
            stroke="#67440E"
            strokeWidth="0.75"
          />

          {/* Letter "B" Intertwined */}
          <path
            d="M 48 26 L 65 26 C 72 26 77 29 77 35 C 77 39 74 42 70 44 C 76 46 80 50 80 57 C 80 65 74 74 64 74 L 48 74 C 46 74 45 72 45 70 L 45 68 C 45 66 46 65 48 65 L 63 65 C 69 65 72 61 72 56 C 72 51 68 48 62 48 L 54 48 C 52 48 51 47 51 45 L 51 44 C 51 42 52 41 54 41 L 63 41 C 68 41 70 38 70 35 C 70 31 66 29 61 29 L 48 29 C 46 29 45 28 45 26.5 C 45 25 46 26 48 26 Z"
            fill="url(#goldRim)"
            stroke="#4A3008"
            strokeWidth="0.75"
          />

          {/* Inner flourish decorative accents */}
          <circle cx="50" cy="50" r="2.5" fill="url(#goldLetter)" />
          <path
            d="M 33 31 L 33 69"
            stroke="url(#goldInner)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 68 33 C 71 36 71 40 67 42"
            fill="none"
            stroke="url(#goldLetter)"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
};
