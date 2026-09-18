import React from 'react';
import { SignType } from '../types';

interface TrafficSignIconProps {
  type: SignType;
  value?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isFlashing?: boolean;
}

export const TrafficSignIcon: React.FC<TrafficSignIconProps> = ({
  type,
  value,
  size = 'md',
  className = '',
  isFlashing = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  }[size];

  const flashClass = isFlashing ? 'animate-pulse-fast ring-4 ring-rose-500 shadow-lg shadow-rose-500/50' : '';

  switch (type) {
    case 'SPEED_LIMIT':
      return (
        <div
          className={`relative inline-flex flex-col items-center justify-center bg-white border-4 border-black rounded-lg shadow-md font-bold tracking-tight text-black transition-transform ${sizeClasses} ${flashClass} ${className}`}
          style={{ aspectRatio: '3/4' }}
        >
          <span className="text-[30%] uppercase tracking-widest font-black leading-none mt-1">SPEED</span>
          <span className="text-[26%] uppercase tracking-widest font-black leading-none">LIMIT</span>
          <span className="font-extrabold leading-tight text-[55%] -mt-0.5 tracking-tighter">
            {value || 35}
          </span>
        </div>
      );

    case 'STOP':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-red-600 text-white font-black border-2 border-white shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          }}
        >
          <span className="text-[34%] tracking-wider font-extrabold">STOP</span>
        </div>
      );

    case 'YIELD':
      return (
        <div
          className={`relative inline-flex items-center justify-center transition-transform ${sizeClasses} ${flashClass} ${className}`}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,95 5,10 95,10" fill="#dc2626" />
            <polygon points="50,78 18,22 82,22" fill="#ffffff" />
            <text x="50" y="45" textAnchor="middle" fill="#dc2626" fontSize="14" fontWeight="900" fontFamily="sans-serif">
              YIELD
            </text>
          </svg>
        </div>
      );

    case 'PEDESTRIAN_CROSSING':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-amber-400 border-2 border-black rotate-45 shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center text-black">
            <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 fill-black">
              <circle cx="12" cy="4" r="2.2" />
              <path d="M13.5 8.5c-.4-.4-1-.5-1.5-.5H9.5C9 8 8.5 8.5 8.5 9v4h1.5v-3.5h1.5V20h2v-6.5h1.5v3h2v-4.5c0-.6-.3-1.2-.8-1.5l-2.7-2z" />
            </svg>
          </div>
        </div>
      );

    case 'SCHOOL_ZONE':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-lime-400 text-black border-2 border-black shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
          style={{
            clipPath: 'polygon(50% 0%, 100% 38%, 100% 100%, 0% 100%, 0% 38%)',
          }}
        >
          <div className="flex flex-col items-center justify-center mt-2">
            <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 fill-black">
              <circle cx="9" cy="5" r="1.8" />
              <path d="M10 8H8c-.6 0-1 .4-1 1v4h1.5v-3h1v8h1.5v-6h1v6h1.5V11c0-.6-.4-1-1-1h-.5V9c0-.6-.4-1-1-1z" />
              <circle cx="16" cy="7" r="1.5" />
              <path d="M17 10h-1.5c-.4 0-.8.3-.8.8v3h1.2v-2h.8v5h1.2v-4.5h.8v4.5h1.2V11.5c0-.8-.7-1.5-1.5-1.5z" />
            </svg>
            <span className="text-[20%] font-black uppercase tracking-tight -mt-0.5">SCHOOL</span>
          </div>
        </div>
      );

    case 'CONSTRUCTION':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-orange-500 border-2 border-black rotate-45 shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center text-black font-extrabold text-[24%] text-center leading-none">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black mb-0.5">
              <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14zM11 10h2v5h-2zm0 6h2v2h-2z" />
            </svg>
            <span>ROAD WORK</span>
          </div>
        </div>
      );

    case 'SLIPPERY_ROAD':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-amber-400 border-2 border-black rotate-45 shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center text-black">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
              <circle cx="7.5" cy="14.5" r="1.5" />
              <circle cx="16.5" cy="14.5" r="1.5" />
            </svg>
            <div className="w-6 h-1 border-b-2 border-black border-dashed mt-0.5"></div>
          </div>
        </div>
      );

    case 'SHARP_CURVE':
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-amber-400 border-2 border-black rotate-45 shadow-md transition-transform ${sizeClasses} ${flashClass} ${className}`}
        >
          <div className="-rotate-45 flex items-center justify-center text-black">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round">
              <path d="M6 19v-4a6 6 0 0 1 6-6h6" />
              <polyline points="15 6 18 9 15 12" />
            </svg>
          </div>
        </div>
      );

    default:
      return (
        <div
          className={`relative inline-flex items-center justify-center bg-amber-400 border-2 border-black rotate-45 shadow-md ${sizeClasses} ${flashClass} ${className}`}
        >
          <div className="-rotate-45 font-black text-black text-xs">!</div>
        </div>
      );
  }
};
