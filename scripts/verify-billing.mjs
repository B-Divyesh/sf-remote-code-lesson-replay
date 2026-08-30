#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const product = {
  slug: 'remote-code-lesson-replay',
  priceMinor: 1900,
  currency: 'USD',
  productUrl: 'https://remote-code-lesson-replay.sociobot.in/',
  checkoutUrl: 'https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout'
};

const billingBase = process.env.BILLING_BASE ?? 'https://api.sociobot.in';
const timeout = AbortSignal.timeout(15_000);
export const rateLimitProbeCount = 80;

function fail(message) {
  throw new Error(`Billing release check failed: ${message}`);
}

export function assertCatalogProduct(candidate) {
  if (!candidate) fail(`production catalog does not contain ${product.slug}`);
  if (candidate.price_minor !== product.priceMinor || candidate.currency !== product.currency) {
    fail(`${product.slug} has unexpected price metadata`);
  }
  if (candidate.product_url !== product.productUrl) {
    fail(`${product.slug} has an unexpected product URL: ${candidate.product_url}`);
  }
  if (candidate.checkout_url !== product.checkoutUrl) {
    fail(`${product.slug} has an unexpected checkout URL: ${candidate.checkout_url}`);
  }
}

export function assertCheckoutRedirect(response) {
  if (![301, 302, 303, 307, 308].includes(response.status)) {
    fail(`checkout returned HTTP ${response.status}, expected a hosted-checkout redirect`);
  }
  const location = response.headers.get('location');
  if (!location || !location.startsWith('https://')) {
    fail('checkout redirect has no secure hosted-checkout Location header');
  }
}

export function assertVerifyRateLimit(responses) {
  const limited = responses.filter((response) => response.status === 429);
  if (!limited.length) {
    fail(`verify accepted all ${responses.length} rapid invalid-license requests; expected HTTP 429`);
  }
  for (const response of limited) {
    const retryAfter = response.headers.get('retry-after');
    if (!retryAfter || !/^\d+$/.test(retryAfter) || Number(retryAfter) < 1) {
      fail('verify returned HTTP 429 without a positive Retry-After header');
    }
  }
}

export async function probeVerifyRateLimit(fetchImpl = fetch, base = billingBase) {
  const license = `release-rate-probe-${randomUUID()}`;
  const endpoint = `${base}/api/v1/products/${product.slug}/verify?license=${encodeURIComponent(license)}`;
  return Promise.all(Array.from({ length: rateLimitProbeCount }, () => fetchImpl(endpoint, { signal: timeout })));
}

export async function main() {
  const catalogResponse = await fetch(`${billingBase}/api/v1/products`, { signal: timeout });
  if (!catalogResponse.ok) fail(`catalog returned HTTP ${catalogResponse.status}`);
  const catalog = await catalogResponse.json();
  if (!Array.isArray(catalog.data)) fail('catalog response has no data array');
  assertCatalogProduct(catalog.data.find((candidate) => candidate.slug === product.slug));

  const checkoutResponse = await fetch(`${billingBase}/api/v1/products/${product.slug}/checkout`, {
    redirect: 'manual',
    signal: timeout
  });
  assertCheckoutRedirect(checkoutResponse);

  const verifyResponses = await probeVerifyRateLimit();
  assertVerifyRateLimit(verifyResponses);
  const limited = verifyResponses.filter((response) => response.status === 429).length;
  console.log(`Billing release check passed for ${product.slug}: checkout redirected and ${limited}/${rateLimitProbeCount} invalid-license probes returned 429 with Retry-After.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
