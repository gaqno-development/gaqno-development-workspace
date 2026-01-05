import React from 'react';
import { ImageRenderer } from './ImageRenderer';

interface FramedImageRendererProps {
  image: any;
  className?: string;
}

export const FramedImageRenderer: React.FC<FramedImageRendererProps> = ({ image, className = '' }) => {
  if (!image) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full h-full">
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(60, 40, 20, 0.95) 0%, 
                rgba(40, 25, 15, 1) 25%,
                rgba(30, 20, 10, 1) 50%,
                rgba(40, 25, 15, 1) 75%,
                rgba(60, 40, 20, 0.95) 100%
              ),
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                rgba(101, 67, 33, 0.2) 8px,
                rgba(101, 67, 33, 0.2) 16px
              )
            `,
            border: '10px solid',
            borderImage: `
              linear-gradient(135deg, 
                #8B5A3C 0%, 
                #6B4423 20%,
                #4A2C1A 40%,
                #6B4423 60%,
                #8B5A3C 80%,
                #6B4423 100%
              ) 1
            `,
            borderRadius: '12px',
            boxShadow: `
              inset 0 0 30px rgba(0, 0, 0, 0.7),
              0 0 40px rgba(139, 90, 43, 0.5),
              0 15px 50px rgba(0, 0, 0, 0.8),
              inset 0 0 80px rgba(101, 67, 33, 0.4)
            `,
            padding: '16px',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at top left, rgba(139, 90, 43, 0.3) 0%, transparent 40%),
                radial-gradient(ellipse at top right, rgba(101, 67, 33, 0.25) 0%, transparent 40%),
                radial-gradient(ellipse at bottom left, rgba(139, 90, 43, 0.2) 0%, transparent 40%),
                radial-gradient(ellipse at bottom right, rgba(101, 67, 33, 0.3) 0%, transparent 40%),
                linear-gradient(135deg, rgba(60, 40, 20, 0.3) 0%, rgba(40, 25, 15, 0.5) 100%)
              `,
              borderRadius: '8px',
            }}
          />
          
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(139, 90, 43, 0.8) 0%, rgba(101, 67, 33, 0.4) 50%, transparent 100%)',
              borderRadius: '50%',
              filter: 'blur(6px)',
              boxShadow: '0 0 20px rgba(139, 90, 43, 0.6)',
            }}
          />
          
          <div
            className="absolute top-3 left-3 w-4 h-4 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.6) 40%, rgba(59, 130, 246, 0.3) 70%, transparent 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(59, 130, 246, 0.8)',
              animation: 'runeGlow 3s ease-in-out infinite',
            }}
          />
          
          <div
            className="absolute top-3 right-3 w-4 h-4 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.6) 40%, rgba(59, 130, 246, 0.3) 70%, transparent 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(59, 130, 246, 0.8)',
              animation: 'runeGlow 3s ease-in-out infinite 1.5s',
            }}
          />
          
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none opacity-80"
            style={{
              background: 'radial-gradient(ellipse, rgba(139, 90, 43, 0.6) 0%, rgba(101, 67, 33, 0.3) 50%, transparent 100%)',
              borderRadius: '50%',
              filter: 'blur(8px)',
              boxShadow: '0 0 30px rgba(139, 90, 43, 0.5)',
            }}
          />
          
          <div
            className="absolute top-1 left-1/4 w-1 h-8 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 100%)',
              borderRadius: '2px',
              transform: 'rotate(-15deg)',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
            }}
          />
          
          <div
            className="absolute top-2 right-1/4 w-1 h-6 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 100%)',
              borderRadius: '2px',
              transform: 'rotate(20deg)',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
            }}
          />
          
          <div
            className="absolute bottom-1 left-1/3 w-1 h-5 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(0deg, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 100%)',
              borderRadius: '2px',
              transform: 'rotate(10deg)',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
            }}
          />
          
          <div
            className="absolute bottom-2 right-1/3 w-1 h-7 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(0deg, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 100%)',
              borderRadius: '2px',
              transform: 'rotate(-25deg)',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
            }}
          />
          
          <div
            className="absolute bottom-2 left-2 w-4 h-4 pointer-events-none opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(139, 90, 43, 0.6) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(3px)',
            }}
          />
          
          <div
            className="absolute bottom-2 right-2 w-5 h-5 pointer-events-none opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(101, 67, 33, 0.5) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(4px)',
            }}
          />
        </div>
        
        <div className="relative z-10 w-full h-full p-4">
          <div
            className="w-full h-full rounded-md overflow-hidden bg-black/20"
            style={{
              boxShadow: `
                inset 0 0 20px rgba(0, 0, 0, 0.8),
                0 0 15px rgba(139, 90, 43, 0.4),
                inset 0 0 40px rgba(0, 0, 0, 0.5)
              `,
              border: '2px solid rgba(139, 90, 43, 0.3)',
            }}
          >
            <ImageRenderer image={image} className="w-full h-full object-cover" />
          </div>
        </div>
        
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(139, 90, 43, 0.15) 25%,
                transparent 50%,
                rgba(101, 67, 33, 0.15) 75%,
                transparent 100%
              ),
              linear-gradient(0deg, 
                transparent 0%, 
                rgba(139, 90, 43, 0.1) 25%,
                transparent 50%,
                rgba(101, 67, 33, 0.1) 75%,
                transparent 100%
              )
            `,
            borderRadius: '12px',
          }}
        />
        
        <style>{`
          @keyframes runeGlow {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
              filter: brightness(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.15);
              filter: brightness(1.3);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

