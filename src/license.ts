export const PRODUCT_SLUG = 'remote-code-lesson-replay';
export const PRICE_LABEL = '$19 one-time';
export const BILLING_BASE = 'https://api.sociobot.in';
export const CHECKOUT_URL = `${BILLING_BASE}/api/v1/products/${PRODUCT_SLUG}/checkout`;

const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const ONE_DAY = 86_400_000;

export interface LicenseState {
  unlocked: boolean;
  checking: boolean;
  reason: string;
  token: string;
}

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
  reason: string;
}

export function storeLicense(token: string): void {
  const clean = token.trim();
  if (!clean) throw new Error('Paste the license token from your receipt.');
  localStorage.setItem(LICENSE_KEY, clean);
  localStorage.removeItem(VERDICT_KEY);
}

export function acceptLicenseFromUrl(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  storeLicense(token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

function cachedVerdict(): CachedVerdict | null {
  try {
    return JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as CachedVerdict | null;
  } catch {
    return null;
  }
}

export function getOptimisticLicenseState(): LicenseState {
  const token = localStorage.getItem(LICENSE_KEY) ?? '';
  const cached = cachedVerdict();
  return {
    unlocked: Boolean(token && cached?.valid),
    checking: Boolean(token),
    reason: token ? (cached?.reason ?? 'pending') : 'missing',
    token
  };
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = localStorage.getItem(LICENSE_KEY) ?? '';
  if (!token) return { unlocked: false, checking: false, reason: 'missing', token: '' };
  const cached = cachedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < ONE_DAY) {
    return { unlocked: cached.valid, checking: false, reason: cached.reason, token };
  }
  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verification unavailable');
    const verdict = await response.json() as { valid: boolean; reason?: string };
    const next: CachedVerdict = { valid: verdict.valid, reason: verdict.reason ?? 'invalid', checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(next));
    return { unlocked: next.valid, checking: false, reason: next.reason, token };
  } catch {
    return {
      unlocked: Boolean(cached?.valid),
      checking: false,
      reason: cached?.valid ? 'offline-cached' : 'offline-unverified',
      token
    };
  }
}
