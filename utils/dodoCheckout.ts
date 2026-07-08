import { DodoPayments } from 'dodopayments-checkout';
import { getDashboardUrl } from './dashboardUrl';

// Dodo Payments Configuration
const DODO_CONFIG = {
    apiKey: import.meta.env.VITE_DODO_API_KEY || '',
    mode: (import.meta.env.VITE_DODO_MODE || 'live') as 'test' | 'live',
    get baseUrl() {
        return this.mode === 'live'
            ? 'https://live.dodopayments.com'
            : 'https://test.dodopayments.com';
    }
};

// Product IDs for Dodo Payments
export const DODO_PRODUCTS = {
    growth: 'pdt_0NWDjeAeatQKryEvRe4eb',
    scale: 'pdt_0NWDjzl0TS6LNFrVdFZYQ',
    growthYearly: 'pdt_0NWDjeAeatQKryEvRe4eb', // temporarily fallback to monthly until updated
    scaleYearly: 'pdt_0NWDjzl0TS6LNFrVdFZYQ', // temporarily fallback to monthly until updated
} as const;

let isInitialized = false;

const productDataCache: Record<string, { value: number; currency: string; content_name: string; content_ids: string[]; content_type: string; num_items: number }> = {};
let currentCheckoutEventId: string | null = null;

// Tracks the most recent user we initiated checkout against, so post-checkout
// redirect URLs get a ref_id bound to the live user — never to a hardcoded env value.
let currentCheckoutUserId: string | null = null;

const dashboardWithRefId = (): string => {
    const base = getDashboardUrl();
    if (!base) return '';
    if (!currentCheckoutUserId) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}ref_id=${encodeURIComponent(currentCheckoutUserId)}`;
};

/**
 * Internal event handler logic shared across initializations
 */
function handleDodoEvent(event: any, onTrialClick?: () => void) {
    console.log('Dodo Checkout event:', event.event_type, event);

    if (event.event_type === 'checkout.opened') {
        window.dispatchEvent(new CustomEvent('rockyt:checkoutOpened', { detail: event }));
    }

    if (event.event_type === 'checkout.closed') {
        window.dispatchEvent(new CustomEvent('rockyt:checkoutClosed'));
    }

    if (event.event_type === 'checkout.status') {
        const status = (event.data as any)?.message?.status;
        if (status === 'succeeded') {
            const payload = currentCheckoutEventId && productDataCache[currentCheckoutEventId]
                ? productDataCache[currentCheckoutEventId]
                : { value: 0.00, currency: 'USD' };

            if (typeof (window as any).fbq === 'function') {
                (window as any).fbq('track', 'Purchase', payload, { eventID: currentCheckoutEventId });
                (window as any).fbq('track', 'StartTrial', {
                    value: payload.value,
                    currency: 'USD',
                    predicted_ltv: (payload as any).value * 6
                }, { eventID: currentCheckoutEventId });
            }
            if (typeof (window as any).cbq === 'function') {
                (window as any).cbq('track', 'Purchase', payload, { eventID: currentCheckoutEventId });
                (window as any).cbq('track', 'StartTrial', {
                    value: payload.value,
                    currency: 'USD',
                    predicted_ltv: (payload as any).value * 6
                }, { eventID: currentCheckoutEventId });
            }
            onTrialClick?.();

            setTimeout(() => {
                try {
                    if ((window as any).DodoPayments && (window as any).DodoPayments.Checkout) {
                        (window as any).DodoPayments.Checkout.close();
                    }
                } catch {
                    // SDK close can fail if already closed; redirect still proceeds.
                }
                const redirectTo = dashboardWithRefId();
                if (!redirectTo) return;
                if (window.top) {
                    window.top.location.href = redirectTo;
                } else {
                    window.location.href = redirectTo;
                }
            }, 1500);
        }
    }

    if (event.event_type === 'checkout.customer_details_submitted') {
        const payload = currentCheckoutEventId && productDataCache[currentCheckoutEventId]
            ? productDataCache[currentCheckoutEventId]
            : { value: 0.00, currency: 'USD' };

        if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'AddPaymentInfo', payload, { eventID: currentCheckoutEventId });
        }
        if (typeof (window as any).cbq === 'function') {
            (window as any).cbq('track', 'AddPaymentInfo', payload, { eventID: currentCheckoutEventId });
        }
    }

    if (event.event_type === 'checkout.error') {
        console.error('Dodo Checkout error:', (event.data as any)?.message);
    }
}

/**
 * Initialize the Dodo Payments SDK with specific display type
 */
function internalInit(displayType: 'overlay' | 'inline' = 'overlay') {
    // Re-initialize if the displayType changes
    DodoPayments.Initialize({
        mode: DODO_CONFIG.mode,
        displayType,
        onEvent: handleDodoEvent
    });
}

export function initDodoPayments() {
    if (isInitialized) return;
    internalInit('overlay');
    isInitialized = true;
}

/**
 * Create a checkout session via Dodo Payments API.
 * Returns the checkout URL.
 */
async function createCheckoutSession(productId: string, userId: string): Promise<string> {
    currentCheckoutUserId = userId || null;
    const response = await fetch(`${DODO_CONFIG.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DODO_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
            customer: {
                metadata: {
                    user_id: userId
                }
            },
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 14,
                on_demand: {
                    mandate_only: false
                }
            },
            return_url: dashboardWithRefId(),
            customization: {
                theme: 'dark',
                show_order_details: true,
                // Removed theme_config font_size: 'xs' as it might hide details in inline mode
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Dodo checkout session error:', response.status, errorText);
        throw new Error(`Failed to create checkout session: ${response.status}`);
    }

    const data = await response.json();

    if (!data.checkout_url) {
        throw new Error('No checkout_url returned from Dodo Payments');
    }

    return data.checkout_url;
}

/**
 * Generate full product data based on Dodo ID
 */
type ProductPayload = {
    value: number;
    currency: string;
    content_name: string;
    content_ids: string[];
    content_type: string;
    num_items: number;
};

/**
 * Generate full product data based on Dodo ID and billing cadence.
 * The current yearly product IDs are aliased to monthly in the DODO_PRODUCTS
 * map, so the analytics layer can't see yearly from the ID alone — the caller
 * MUST pass isYearly when starting a yearly checkout.
 */
function getProductPayload(productId: string, isYearly = false): ProductPayload {
    if (productId === DODO_PRODUCTS.growth || productId === DODO_PRODUCTS.growthYearly) {
        return {
            value: isYearly ? 25.00 : 49.00,
            currency: 'USD',
            content_name: isYearly ? 'Growth (Yearly)' : 'Growth',
            content_ids: [productId],
            content_type: 'product',
            num_items: 1,
        };
    }
    if (productId === DODO_PRODUCTS.scale || productId === DODO_PRODUCTS.scaleYearly) {
        return {
            value: isYearly ? 50.00 : 99.00,
            currency: 'USD',
            content_name: isYearly ? 'Scale (Yearly)' : 'Scale',
            content_ids: [productId],
            content_type: 'product',
            num_items: 1,
        };
    }
    return { value: 0.00, currency: 'USD', content_name: 'Custom', content_ids: [productId], content_type: 'product', num_items: 1 };
}

/**
 * Get a checkout URL for a given product. The `isYearly` flag is used by the
 * analytics layer to report the right revenue value for yearly purchases.
 */
export async function openCheckout(
    productId: string,
    userId: string,
    isYearly = false,
): Promise<string> {
    try {
        console.log(`Rockyt: Generating checkout URL for product: ${productId} (yearly=${isYearly})`);

        // Generate a deduplication ID for this entire flow (Initiate -> Purchase)
        currentCheckoutEventId = 'chk_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

        const payload = getProductPayload(productId, isYearly);
        productDataCache[currentCheckoutEventId] = payload;

        const checkoutUrl = await createCheckoutSession(productId, userId);
        console.log('Rockyt: Created checkout session:', checkoutUrl);

        return checkoutUrl;
    } catch (error) {
        console.error('Rockyt critical error generating Dodo checkout:', error);
        throw error;
    }
}
