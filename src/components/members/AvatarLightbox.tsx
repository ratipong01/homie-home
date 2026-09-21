import React from 'react';

interface AvatarLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  name: string;
  themeColor?: string;
}

export const AvatarLightbox: React.FC<AvatarLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  name,
  themeColor = '#F97316',
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col items-center max-w-xs w-full bg-surface p-6 rounded-3xl shadow-2xl border border-surface-muted"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-subtle text-text-muted hover:text-text-main flex items-center justify-center text-sm font-bold"
        >
          ✕
        </button>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-56 h-56 rounded-full aspect-square object-cover shadow-inner mb-4 border-4 border-white"
          />
        ) : (
          <div
            style={{ backgroundColor: themeColor }}
            className="w-56 h-56 rounded-full aspect-square flex items-center justify-center text-white text-6xl font-black shadow-inner mb-4 border-4 border-white"
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <h3 className="text-base font-bold text-text-main text-center">{name}</h3>
        <span className="text-xs text-text-muted mt-1">แตะที่ว่างเพื่อปิด</span>
      </div>
    </div>
  );
};
