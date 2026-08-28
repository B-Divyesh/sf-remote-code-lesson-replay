import { describe, expect, it } from 'vitest';
import { assertCatalogProduct, assertCheckoutRedirect, product } from '../scripts/verify-billing.mjs';

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
});
