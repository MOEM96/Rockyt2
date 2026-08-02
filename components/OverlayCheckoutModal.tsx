import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

interface OverlayCheckoutModalProps {
  checkoutUrl: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OverlayCheckoutModal: React.FC<OverlayCheckoutModalProps> = ({
  checkoutUrl,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!checkoutUrl) return;

    setIsLoading(true);
    setIsSuccess(false);

    // Try native DodoPayments SDK overlay if loaded
    if (typeof (window as any).DodoPayments?.checkout === 'function') {
      try {
        (window as any).DodoPayments.checkout({
          url: checkoutUrl,
          onSuccess: () => {
            setIsSuccess(true);
            if (onSuccess) onSuccess();
          },
          onClose: () => {
            onClose();
          }
        });
      } catch (e) {
        console.warn('[Dodo Overlay SDK] Falling back to embedded iframe overlay:', e);
      }
    }

    // Handle postMessage events from Dodo Payments checkout iframe
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (
          data?.type === 'checkout.success' ||
          data?.type === 'payment.succeeded' ||
          data?.event === 'checkout.success' ||
          data?.status === 'succeeded'
        ) {
          setIsSuccess(true);
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 1500);
        }
      } catch (e) {
        // Ignore non-json message events
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [checkoutUrl, onClose, onSuccess]);

  if (!checkoutUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-zinc-950 border-2 border-white/20 w-full max-w-2xl h-[90vh] max-h-[780px] flex flex-col shadow-2xl relative overflow-hidden font-mono text-white rounded-lg">
        
        {/* Header Bar */}
        <div className="bg-zinc-900 border-b border-white/15 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white text-ink px-2 py-0.5 font-display font-bold text-sm tracking-tighter">
              ROCKYT
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              <ShieldCheck size={14} />
              <span>256-BIT SSL CHECKOUT</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-brand text-xs flex items-center gap-1 transition-colors px-2 py-1"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Popout</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition-all"
              aria-label="Close Checkout Overlay"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 relative bg-black">
          {/* Success Banner */}
          {isSuccess && (
            <div className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-white mb-2">
                PAYMENT SUCCESSFUL!
              </h3>
              <p className="text-xs text-white/70 max-w-sm leading-relaxed mb-4">
                Your checkout session has been completed. Your subscription and wallet balance are updated.
              </p>
              <div className="text-brand font-bold text-xs animate-pulse">
                Refreshing your dashboard...
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !isSuccess && (
            <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-brand animate-spin" />
              <span className="text-xs text-white/70 uppercase font-bold tracking-wider">
                Loading Secure Checkout...
              </span>
            </div>
          )}

          {/* Embedded Checkout Iframe */}
          <iframe
            src={checkoutUrl}
            title="Dodo Payments Overlay Checkout"
            className="w-full h-full border-0"
            allow="payment *; camera *; microphone *"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Footer info strip */}
        <div className="bg-zinc-900/90 border-t border-white/10 px-4 py-2 flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>Powered by Dodo Payments &amp; Rockyt</span>
          <span>Stay on this page while completing checkout</span>
        </div>
      </div>
    </div>
  );
};

export default OverlayCheckoutModal;
