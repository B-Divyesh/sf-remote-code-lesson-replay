import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: '.output',
  manifest: {
    name: 'Code Lesson Replay',
    short_name: 'Lesson Replay',
    description: 'Capture a private, text-first trail of coding decisions for a tutor to replay.',
    version: '1.0.0',
    permissions: ['storage'],
    host_permissions: [
      'https://pilot-api.sociobot.in/*',
      'https://api.sociobot.in/*'
    ],
    action: {
      default_title: 'Open Code Lesson Replay',
      default_popup: 'popup.html'
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  }
});
