import React from 'react';

interface FloatingHighlightButtonProps {
  position: { x: number; y: number };
  onHighlight: () => void;
  onClose: () => void;
}

export const FloatingHighlightButton: React.FC<FloatingHighlightButtonProps> = ({
  position,
  onHighlight,
  onClose
}) => {
  return (
    <>
      {/* Backdrop to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Floating button */}
      <div
        className="fixed z-50 transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHighlight();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span>סמן כחשוב למבחן</span>
        </button>

        {/* Arrow pointing down */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-500" />
      </div>
    </>
  );
};
