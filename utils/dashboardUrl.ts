// Dashboard URL resolver.
//
// Single source of truth for the dashboard origin. The base URL is read from
// `VITE_DASH_A` (or base64-encoded, accepted by the decoder for Vercel env
// ergonomics). Returning the URL requires an authenticated Supabase session —
// callers MUST NOT switch to any other variant based on a static env var.
//
// Two distinct URLs are recognized:
//
//   - getDashboardUrl():           The recurring dashboard URL — the raw
//                                  subdomain the user lands on every time
//                                  they sign in AFTER their account has
//                                  been provisioned. Default value. Read
//                                  from VITE_DASH_A.
//
//   - getWorkspaceCreationUrl():   The ONE-TIME workspace-creation URL —
//                                  used ONLY for the user's very first
//                                  iframe render after OAuth signup.
//                                  Read from VITE_DASH_SIGNUP, with a safe
//                                  fallback to the regular dashboard URL
//                                  so missing env doesn't break the app.
//
// First-login identity binding is the responsibility of the dashboard's
// authentication handshake, not the URL string we hand back here. The
// ref_id query param (bound to the live Supabase session) is what
// actually ties a brand-new account to its freshly-created workspace.
//
// Base64 is encoding-friendly, not a security control.

const tryDecode = (raw: string): string => {
  if (!raw) return '';
  // Plain URL form for Vercel env vars set as raw URLs.
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // Otherwise accept base64-encoded form.
  try {
    const decoded = atob(raw);
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
  } catch {
    // Not valid base64 — fall through.
  }
  return '';
};

const readUrl = (key: string): string => {
  const raw = import.meta.env[key] || '';
  return tryDecode(raw);
};

export const getDashboardUrl = (): string =>
  readUrl('VITE_DASH_A') || 'https://dashboard.rockyt.io/';

export const getWorkspaceCreationUrl = (): string => {
  const signup = readUrl('VITE_DASH_SIGNUP');
  // Fall back to the explicit signup URL provided by the user so missing env
  // doesn't leave the user with a blank iframe or wrong URL.
  return signup || 'https://dashboard.rockyt.io/?ref_id=yUDsOeqoc0UvJNPjSTSEaLnF9kB3';
};
