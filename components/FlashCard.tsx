import React from 'react';

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashCard: React.FC<FlashCardProps> = ({ front, back, isFlipped, onFlip }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className="relative w-full max-w-sm sm:max-w-xl md:max-w-2xl aspect-[9/14] sm:aspect-[3/2] cursor-pointer group mx-auto"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'הפוך לצד הקדמי' : 'הפוך לצד האחורי'}
    >
      {/* Glow effect behind card */}
      <div className={`
        absolute inset-0 rounded-3xl blur-xl opacity-40 transition-all duration-700
        ${isFlipped
          ? 'bg-gradient-to-br from-cyan-400 to-teal-500'
          : 'bg-gradient-to-br from-violet-500 to-purple-600'}
        group-hover:opacity-60 group-hover:scale-105
      `} />

      <div
        className="relative w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* צד קדמי - Dark Glassmorphism */}
        <div
          className="absolute inset-0 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center
                     bg-black/60 backdrop-blur-xl border border-white/10
                     shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-white/95 text-xl sm:text-2xl md:text-3xl font-medium text-center leading-relaxed select-none">
            {front}
          </p>
          <span className="mt-6 text-white/40 text-sm sm:text-base tracking-widest">
            לחץ להפיכה
          </span>
        </div>

        {/* צד אחורי - Light Glassmorphism */}
        <div
          className="absolute inset-0 rounded-3xl p-6 sm:p-10 flex items-center justify-center
                     bg-white/10 backdrop-blur-xl border border-white/20
                     shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <p className="text-white text-lg sm:text-xl md:text-2xl text-center leading-relaxed select-none overflow-y-auto max-h-full custom-scrollbar">
            {back}
          </p>
        </div>
      </div>
    </div>
  );
};
