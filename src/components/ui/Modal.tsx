'use client';

import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className="relative max-w-md w-full mx-4 p-7"
        style={{ background: '#F5F0E8', border: '0.5px solid #E5DDD0', borderRadius: 12 }}
      >
        {title && (
          <h2 className="font-display italic font-medium mb-5" style={{ fontSize: 20, color: '#0D0D0D' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
