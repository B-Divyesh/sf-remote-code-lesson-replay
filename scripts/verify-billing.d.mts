export interface BillingProduct {
  slug: string;
  price_minor: number;
  currency: string;
  product_url: string;
  checkout_url: string;
}

export const product: {
  slug: string;
  priceMinor: number;
  currency: string;
  productUrl: string;
  checkoutUrl: string;
};

export const rateLimitProbeCount: number;
export function assertCatalogProduct(candidate: BillingProduct | undefined): void;
export function assertCheckoutRedirect(response: Response): void;
export function assertVerifyRateLimit(responses: Response[]): void;
export function probeVerifyRateLimit(fetchImpl?: typeof fetch, base?: string): Promise<Response[]>;
export function main(): Promise<void>;
