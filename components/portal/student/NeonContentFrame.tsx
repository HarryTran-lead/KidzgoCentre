'use client';

import { ReactNode } from "react";

type NeonContentFrameProps = {
  children: ReactNode;
  className?: string;
};

export default function NeonContentFrame({ children, className = "" }: NeonContentFrameProps) {
  return (
    <div className={`relative h-full ${className}`}>
      {/* Border với gradient hiện đại */}
      <div 
        className="absolute inset-0 rounded-[2rem] pointer-events-none z-20"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec489a, #a855f7, #6366f1)',
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Glass morphism background */}
      <div className="relative h-full rounded-[2rem] overflow-hidden z-0 bg-black/20 backdrop-blur-sm">
        {/* Inner content */}
        {children}
      </div>
    </div>
  );
}