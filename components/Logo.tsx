
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="snakeBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
          <filter id="gloss" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dx="2" dy="2" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1  0 0 0 0.4 0" />
            <feBlend mode="screen" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Rounded Container Background */}
        <rect x="0" y="0" width="512" height="512" rx="128" fill="url(#logoBg)" />

        {/* Stars */}
        <circle cx="100" cy="100" r="2" fill="white" opacity="0.6" />
        <circle cx="400" cy="80" r="3" fill="white" opacity="0.8" />
        <circle cx="450" cy="150" r="2" fill="white" opacity="0.5" />
        <circle cx="380" cy="400" r="2" fill="white" opacity="0.7" />

        {/* Snake Paths */}
        <g strokeLinecap="round" strokeLinejoin="round" filter="url(#gloss)">
          {/* Bottom Coils */}
          <path 
            d="M 100 400 L 260 400 L 260 340 L 400 340 L 400 450 L 100 450" 
            fill="none" 
            stroke="url(#snakeBody)" 
            strokeWidth="50" 
          />
          
          {/* Main Coiling Path */}
          <path 
            d="M 100 280 L 100 150 L 400 150 L 400 200 L 260 200 L 260 340" 
            fill="none" 
            stroke="url(#snakeBody)" 
            strokeWidth="50" 
          />
          
          {/* Top Arrow Path */}
          <path 
            d="M 180 280 L 400 280" 
            fill="none" 
            stroke="url(#snakeBody)" 
            strokeWidth="50" 
          />
          
          {/* Arrow Head */}
          <path 
            d="M 400 250 L 460 280 L 400 310 Z" 
            fill="url(#snakeBody)" 
          />
        </g>

        {/* Snake Head */}
        <g transform="translate(280, 150)">
          {/* Head Shape */}
          <ellipse cx="0" cy="0" rx="65" ry="55" fill="url(#snakeBody)" stroke="#1a2e05" strokeWidth="4" />
          
          {/* Glossy Eyes */}
          <circle cx="-25" cy="-10" r="22" fill="black" />
          <circle cx="25" cy="-10" r="22" fill="black" />
          
          {/* Eye Reflections */}
          <circle cx="-30" cy="-18" r="8" fill="white" />
          <circle cx="20" cy="-18" r="8" fill="white" />
          <circle cx="-20" cy="-2" r="4" fill="white" opacity="0.4" />
          <circle cx="30" cy="-2" r="4" fill="white" opacity="0.4" />

          {/* Tongue */}
          <path 
            d="M 60 10 L 90 0 L 100 -15 M 90 0 L 100 15" 
            fill="none" 
            stroke="#f43f5e" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />

          {/* Nose/Mouth detail */}
          <path d="M 15 25 Q 25 35 40 25" fill="none" stroke="#1a2e05" strokeWidth="3" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
