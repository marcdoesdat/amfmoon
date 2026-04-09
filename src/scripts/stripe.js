// Stripe Payment Links — configure these in your Stripe Dashboard
// https://dashboard.stripe.com/payment-links
//
// Each link is a pre-built Stripe Checkout page.
// Pass ?client_reference_id={userId} to track which user paid.
//
// After payment, Stripe redirects to the success URL you configured
// in the payment link settings. Set it to:
//   https://marcdoesdat.github.io/amfmoon/quiz?paid=1
//
// Use Stripe webhooks (optional) to store purchases server-side.
// For a static site, we store the purchase flag in localStorage
// after the Stripe redirect and verify the user is logged in.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// TODO: Replace with your real Stripe Payment Link URLs
export const PAYMENT_LINKS = {
  'F-135': 'https://buy.stripe.com/YOUR_LINK_F135',
  'F-411': 'https://buy.stripe.com/YOUR_LINK_F411',
  'F-412': 'https://buy.stripe.com/YOUR_LINK_F412',
  'F-511': 'https://buy.stripe.com/YOUR_LINK_F511',
  'F-220': 'https://buy.stripe.com/YOUR_LINK_F220',
  'Cautionnement': 'https://buy.stripe.com/YOUR_LINK_CAUTIONNEMENT',
};

// Build a payment URL with the user's Firebase UID as reference
export function getPaymentUrl(moduleCode, userId) {
  const base = PAYMENT_LINKS[moduleCode];
  if (!base) return null;
  return `${base}?client_reference_id=${encodeURIComponent(userId)}`;
}

// After Stripe redirects back, mark the module as purchased
export function markPurchased(moduleCode) {
  const purchased = getPurchasedModules();
  if (!purchased.includes(moduleCode)) {
    purchased.push(moduleCode);
    localStorage.setItem('qz_purchased', JSON.stringify(purchased));
  }
}

export function getPurchasedModules() {
  try {
    return JSON.parse(localStorage.getItem('qz_purchased') || '[]');
  } catch {
    return [];
  }
}

export function hasPurchased(moduleCode) {
  return getPurchasedModules().includes(moduleCode);
}

// Check URL for ?paid=1 and mark module as purchased
export function handlePaymentReturn(moduleCode) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paid') === '1') {
    markPurchased(moduleCode);
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('paid');
    window.history.replaceState({}, '', url.toString());
    return true;
  }
  return false;
}
