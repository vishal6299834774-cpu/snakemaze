
import React, { useId, useMemo } from 'react';
import { SnakeData, Point, Direction } from '../types';
import { SNAKE_STROKE_WIDTH } from '../constants';

interface SnakeProps {
  data: SnakeData;
  onClick: (id: string) => void;
  isMoving: boolean;
  isExiting: boolean;
  isHinted?: boolean;
}

const Snake: React.FC<SnakeProps> = ({ data, onClick, isMoving, isExiting, isHinted }) => {
  const { points: rawPoints, headDirection, color } = data;
  const uniqueId = useId().replace(/:/g, '');

  const points = useMemo(() => {
    let pts = [...rawPoints];
    if (isHinted && pts.length >= 2) {
      const tail = pts[0];
      const next = pts[1];
      const factor = 0.2; 
      pts[0] = {
        x: tail.x + (next.x - tail.x) * factor,
        y: tail.y + (next.y - tail.y) * factor
      };
    }
    return pts;
  }, [rawPoints, isHinted]);
  
  const d = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  const head = points[points.length - 1];
  const tail = points[0];
  
  const rotation = {
    'UP': -90,
    'DOWN': 90,
    'LEFT': 180,
    'RIGHT': 0
  }[headDirection];

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMoving && !isExiting) {
      onClick(data.id);
    }
  };

  // Dynamic styling based on the assigned snake color
  const bodyBaseColor = color;
  const darkBorder = 'rgba(0, 0, 0, 0.4)';
  const stripeColor = 'rgba(0, 0, 0, 0.2)';
  const highlightColor = 'rgba(255, 255, 255, 0.3)';

  const getStepDirection = (p1: Point, p2: Point): Direction => {
    if (Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y)) {
      return p1.x < p2.x ? 'RIGHT' : 'LEFT';
    }
    return p1.y < p2.y ? 'DOWN' : 'UP';
  };

  const renderSegments = () => {
    const segments: React.ReactNode[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dir = getStepDirection(p1, p2);
      const rot = { 'UP': -90, 'DOWN': 90, 'LEFT': 180, 'RIGHT': 0 }[dir];
      
      const step = 14; 
      for (let dDist = step; dDist < dist; dDist += step) {
        const t = dDist / dist;
        const x = p1.x + dx * t;
        const y = p1.y + dy * t;
        segments.push(
          <line 
            key={`${uniqueId}-seg-${i}-${dDist}`}
            x1={0} y1={-SNAKE_STROKE_WIDTH/2 + 2} 
            x2={0} y2={SNAKE_STROKE_WIDTH/2 - 2}
            stroke={stripeColor}
            strokeWidth="3.5"
            transform={`translate(${x}, ${y}) rotate(${rot})`}
            opacity="0.9"
          />
        );
      }
    }
    return segments;
  };

  return (
    <g 
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      className={`select-none transition-opacity duration-300 ${isMoving || isExiting ? 'pointer-events-none' : 'cursor-pointer group'}`}
    >
      <defs>
        <filter id={`dropShadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="2" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`shine-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Broad Touch Target Area */}
      <path 
        d={d} 
        stroke="transparent" 
        strokeWidth={SNAKE_STROKE_WIDTH * 2.5} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Outer Glow/Border */}
      <path 
        d={d} 
        stroke={darkBorder} 
        strokeWidth={SNAKE_STROKE_WIDTH + 5} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter={`url(#dropShadow-${uniqueId})`}
      />

      {/* Main Body */}
      <path 
        d={d} 
        stroke={bodyBaseColor} 
        strokeWidth={SNAKE_STROKE_WIDTH} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      <g opacity={0.9}>
        {renderSegments()}
      </g>

      {/* Surface Shine/Depth */}
      <path 
        d={d} 
        stroke={`url(#shine-${uniqueId})`} 
        strokeWidth={SNAKE_STROKE_WIDTH - 8} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="pointer-events-none"
      />

      {/* Internal "Directional Flow" Arrows */}
      {!isMoving && !isExiting && points.map((p, i) => {
        if (i === points.length - 1) return null;
        const nextP = points[i + 1];
        const dir = getStepDirection(p, nextP);
        const rot = { 'UP': -90, 'DOWN': 90, 'LEFT': 180, 'RIGHT': 0 }[dir];
        const midX = (p.x + nextP.x) / 2;
        const midY = (p.y + nextP.y) / 2;
        return (
          <g key={`${uniqueId}-arrow-${i}`} transform={`translate(${midX}, ${midY}) rotate(${rot})`} opacity="0.3">
            <path d="M -5 -6 L 4 0 L -5 6" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      <circle cx={tail.x} cy={tail.y} r={SNAKE_STROKE_WIDTH/2} fill={bodyBaseColor} />

      {/* Detailed Animated Head */}
      <g transform={`translate(${head.x}, ${head.y}) rotate(${rotation})`}>
        <g className="animate-pulse">
           <path d="M 10 0 L 22 0 M 22 0 L 26 -5 M 22 0 L 26 5" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        
        <path 
          d="M 14 0 C 14 -14 -12 -18 -18 -16 C -24 -14 -24 14 -18 16 C -12 18 14 14 14 0 Z" 
          fill={bodyBaseColor} 
          stroke={darkBorder} 
          strokeWidth="4" 
        />
        
        <circle cx="-7" cy="-8" r="5.5" fill="black" />
        <circle cx="-7" cy="8" r="5.5" fill="black" />
        <circle cx="-9" cy="-10" r="2" fill="white" />
        <circle cx="-9" cy="10" r="2" fill="white" />

        <path 
          d="M 8 -5 C 8 -12 -5 -14 -10 -12" 
          fill="none" 
          stroke={highlightColor} 
          strokeWidth="5" 
          strokeLinecap="round" 
          opacity="0.5"
        />
      </g>

      {isHinted && (
        <path 
          d={d} 
          stroke="#fef08a" 
          strokeWidth={SNAKE_STROKE_WIDTH + 20} 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="animate-pulse opacity-40 pointer-events-none"
        />
      )}
    </g>
  );
};

export default Snake;
