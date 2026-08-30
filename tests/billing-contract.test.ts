import { describe, expect, it } from 'vitest';
import { assertCatalogProduct, assertCheckoutRedirect, assertVerifyRateLimit, product, rateLimitProbeCount } from '../scripts/verify-billing.mjs';

describe('production billing release contract', () => {
  it('rejects a catalog that does not register this exact paid product', () => {
    expect(() => assertCatalogProduct(undefined)).toThrow(/does not contain remote-code-lesson-replay/);
    expect(() => assertCatalogProduct({
      slug: product.slug,
      price_minor: 1200,
      currency: product.currency,
      product_url: product.productUrl,
      checkout_url: product.checkoutUrl
    })).toThrow(/unexpected price metadata/);
  });

  it('requires the registered production checkout to redirect securely', () => {
    const missingCheckout = new Response(JSON.stringify({ error: 'enabled factory product', status: 404 }), { status: 404 });
    expect(() => assertCheckoutRedirect(missingCheckout)).toThrow(/HTTP 404/);
    expect(() => assertCheckoutRedirect(new Response(null, { status: 302 }))).toThrow(/Location header/);
    expect(() => assertCheckoutRedirect(new Response(null, {
      status: 303,
      headers: { location: 'https://checkout.example.test/session' }
    }))).not.toThrow();
  });

  it('rejects the verifier\'s 80-request no-rate-limit failure and requires Retry-After on 429', () => {
    const allAccepted = Array.from({ length: rateLimitProbeCount }, () => new Response('{}', { status: 200 }));
    expect(() => assertVerifyRateLimit(allAccepted)).toThrow(/accepted all 80 rapid invalid-license requests/);

    expect(() => assertVerifyRateLimit([
      new Response('{}', { status: 200 }),
      new Response('{}', { status: 429 })
    ])).toThrow(/without a positive Retry-After/);

    expect(() => assertVerifyRateLimit([
      new Response('{}', { status: 200 }),
      new Response('{}', { status: 429, headers: { 'Retry-After': '3' } })
    ])).not.toThrow();
  });
});
