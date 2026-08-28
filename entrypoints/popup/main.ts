import { browser } from 'wxt/browser';
import './style.css';

document.querySelector('#open')?.addEventListener('click', async () => {
  const runtime = browser.runtime as unknown as typeof chrome.runtime;
  await browser.tabs.create({ url: runtime.getURL('/app.html') });
  window.close();
});
