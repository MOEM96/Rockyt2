import React, { useRef } from 'react';
import { useScrollLock, useFocusTrap, useKeyPress } from '../hooks/index';
import { cn } from '../utils/helpers';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);
  useFocusTrap(modalRef, isOpen);
  useKeyPress('Escape', () => {
    if (closeOnEsc && isOpen) onClose();
  });

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className={cn(
          'relative bg-[#161616] w-full rounded-[32px] border border-white/10 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar',
          sizeClasses[size],
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-8 h-8 bg-white/5 rounded-full text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            aria-label="Close modal"
          >
            <iconify-icon icon="solar:close-circle-bold" width="20" aria-hidden={true} />
          </button>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;