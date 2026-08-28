import { acceptLicenseFromUrl, CHECKOUT_URL, getOptimisticLicenseState, storeLicense, verifyLicense } from '../src/license';

const checkout = document.querySelector<HTMLAnchorElement>('[data-checkout]');
if (checkout) checkout.href = CHECKOUT_URL;

const banner = document.querySelector<HTMLElement>('#offline-banner');
function updateConnection(): void {
  if (banner) banner.hidden = navigator.onLine;
}
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

const restoreToggle = document.querySelector<HTMLButtonElement>('#restore-toggle');
const restorePanel = document.querySelector<HTMLElement>('#restore-panel');
restoreToggle?.addEventListener('click', () => {
  const opening = restorePanel?.hidden ?? false;
  if (restorePanel) restorePanel.hidden = !opening;
  restoreToggle.setAttribute('aria-expanded', String(opening));
  if (opening) document.querySelector<HTMLInputElement>('#license')?.focus();
});

function setLicenseStatus(message: string, tone: 'plain' | 'good' | 'bad' = 'plain'): void {
  const status = document.querySelector<HTMLElement>('#license-status');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function showLicenseTransfer(show: boolean): void {
  const copy = document.querySelector<HTMLButtonElement>('#copy-license');
  const note = document.querySelector<HTMLElement>('#transfer-note');
  if (copy) copy.hidden = !show;
  if (note) note.hidden = !show;
}

async function reconcileLicense(force = false): Promise<void> {
  const optimistic = getOptimisticLicenseState();
  if (!optimistic.token) return;
  setLicenseStatus(optimistic.unlocked ? 'Plus is unlocked from your last verified purchase.' : 'Checking this license…');
  const result = await verifyLicense(force);
  if (result.unlocked) {
    setLicenseStatus(result.reason === 'offline-cached' ? 'Plus is unlocked from the cached verdict while offline.' : 'License verified. Plus is ready to activate in the extension.', 'good');
    showLicenseTransfer(true);
  } else if (result.reason === 'offline-unverified') {
    setLicenseStatus('Connect once to verify this license.', 'bad');
  } else {
    setLicenseStatus('This license is no longer active. Check the token or purchase Plus.', 'bad');
  }
}

document.querySelector<HTMLFormElement>('#restore-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget as HTMLFormElement);
  try {
    storeLicense(String(data.get('license') ?? ''));
    await reconcileLicense(true);
  } catch (error) {
    setLicenseStatus(error instanceof Error ? error.message : 'The license could not be saved.', 'bad');
  }
});

document.querySelector<HTMLButtonElement>('#copy-license')?.addEventListener('click', async () => {
  const token = getOptimisticLicenseState().token;
  if (!token) return;
  try {
    await navigator.clipboard.writeText(token);
    setLicenseStatus('License copied. Open the extension, choose “License,” and paste it.', 'good');
  } catch {
    const input = document.querySelector<HTMLInputElement>('#license');
    if (input) { input.value = token; input.select(); }
    setLicenseStatus('Copy was blocked. The token is selected above—copy it, then paste it into the extension.', 'bad');
  }
});

if (acceptLicenseFromUrl()) {
  setLicenseStatus('Payment return received. Checking your license…');
  if (restorePanel) restorePanel.hidden = false;
  restoreToggle?.setAttribute('aria-expanded', 'true');
}
void reconcileLicense();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}
