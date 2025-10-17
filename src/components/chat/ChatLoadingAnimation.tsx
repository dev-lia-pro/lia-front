import React from 'react';

export const ChatLoadingAnimation: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg p-3 bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2">
          {/* Thinking dots animation */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="text-sm text-foreground/70">L'assistant réfléchit...</span>
        </div>

        {/* Pulsing wave effect */}
        <div className="mt-2 relative h-8 overflow-hidden rounded-md bg-muted/30">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            style={{
              animation: 'wave 2s ease-in-out infinite',
            }}
          />
        </div>

        <style>{`
          @keyframes wave {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </div>
  );
};
