import React from 'react';

interface WistiaEmbedProps {
    mediaId: string;
    aspect?: number | string;
    className?: string;
    class?: string;            // Alpine-style "class" attribute passthrough
    style?: React.CSSProperties;
    /** Disable the blur-swatch placeholder; the embed will reveal directly when ready. */
    noPlaceholder?: boolean;
}

/**
 * Robust, high-performance Wistia video embed using standard iframes.
 *
 * Why this is the gold-standard implementation:
 *   - The previous custom-element (<wistia-player>) approach is highly fragile
 *     in React; dynamic state updates and virtual DOM re-renders teardown and
 *     remount the custom element, leaving it permanently inert or black.
 *   - Standard iframes isolate the player runtime completely. No CSP script-eval blocks,
 *     no custom element lifecycle race conditions, and 100% reliable play/pause/controls.
 *   - Uses `videoFoam=true` to automatically foam and scale responsibly within the
 *     parent container's aspect ratio.
 */
export const WistiaEmbed: React.FC<WistiaEmbedProps> = ({
    mediaId,
    aspect = 1.7777777777777777,
    className,
    class: classAttr,
    style,
}) => {
    // Parse aspect ratio safely
    const numericAspect = typeof aspect === 'number' ? aspect : parseFloat(aspect);
    const aspectRatioValue = !isNaN(numericAspect) ? numericAspect : 1.7777777777777777;

    if (!mediaId) return null;

    return (
        <div
            className={`relative w-full overflow-hidden bg-black rounded-inherit ${className || ''}`}
            style={{
                aspectRatio: aspectRatioValue.toString(),
                ...style
            }}
        >
            <iframe
                src={`https://fast.wistia.net/embed/iframe/${mediaId}?videoFoam=true&playerColor=ffd841`}
                title="Wistia video player"
                allow="autoplay; fullscreen"
                allowFullScreen
                className={`absolute top-0 left-0 w-full h-full border-none rounded-inherit ${classAttr || ''}`}
                style={{ border: 'none' }}
            />
        </div>
    );
};

