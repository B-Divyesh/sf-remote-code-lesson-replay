#!/usr/bin/env node

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
  console.log(`Billing release check passed for ${product.slug}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
